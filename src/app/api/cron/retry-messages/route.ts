import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, wakeUpEvolutionServer } from "@/lib/evolution";

/**
 * GET /api/cron/retry-messages
 * 
 * Auto-retry cron job: Processes pending messages in batches.
 * Also serves to wake up/keep awake the Render WhatsApp server.
 */
export async function GET() {
    try {
        // 1. Fetch PENDING messages
        const pendingMessages = await prisma.messageLog.findMany({
            where: { status: "PENDING" },
            include: { 
                applicant: { 
                    select: { 
                        phone: true, 
                        whatsappNumber: true,
                        fullName: true
                    } 
                } 
            },
            orderBy: { createdAt: "asc" },
            take: 15 // Safe batch size to prevent script timeouts
        });

        if (pendingMessages.length === 0) {
            // Even if no messages are pending, we can ping the Render server occasionally to keep it awake!
            await wakeUpEvolutionServer().catch(() => {});
            return NextResponse.json({ success: true, count: 0, message: "No pending messages to retry. Render server pinged." });
        }

        console.log(`[CRON-Retry] Found ${pendingMessages.length} pending messages to retry.`);

        // 2. Proactively trigger wakeup ping before processing batch
        await wakeUpEvolutionServer().catch(() => {});
        // Give Render 2 seconds head start to initialize container if it was cold sleeping
        await new Promise(resolve => setTimeout(resolve, 2000));

        let successCount = 0;
        let failCount = 0;

        // 3. Process messages sequentially
        for (const msg of pendingMessages) {
            const phone = msg.applicant?.whatsappNumber || msg.applicant?.phone;
            
            if (!phone) {
                // Permanently fail the message if no valid phone number is found
                await prisma.messageLog.update({
                    where: { id: msg.id },
                    data: { status: "FAILED" }
                });
                failCount++;
                continue;
            }

            try {
                const sendResult = await sendWhatsAppMessage(phone, msg.message);
                
                if (sendResult.success) {
                    await prisma.messageLog.update({
                        where: { id: msg.id },
                        data: { 
                            status: "SENT", 
                            sentAt: new Date() 
                        }
                    });
                    
                    // Log activity for audit
                    await prisma.activityLog.create({
                        data: {
                            action: "AUTO_MESSAGE_RETRY_SUCCESS",
                            details: `إعادة إرسال تلقائية ناجحة للرسالة (${msg.trigger})`,
                            applicantId: msg.applicantId,
                        }
                    }).catch(console.error);

                    successCount++;
                } else {
                    console.warn(`[CRON-Retry] Failed to resend message ${msg.id}:`, sendResult.error);
                    failCount++;
                }
            } catch (err) {
                console.error(`[CRON-Retry] Error processing message ${msg.id}:`, err);
                failCount++;
            }

            // Small delay between sends to respect rate-limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        return NextResponse.json({
            success: true,
            totalProcessed: pendingMessages.length,
            successCount,
            failCount,
            message: `Processed ${pendingMessages.length} pending messages. ${successCount} successful, ${failCount} failed.`
        });

    } catch (error) {
        console.error("[CRON-Retry] Fatal cron error:", error);
        return NextResponse.json({ error: "Internal Server Error in retry cron" }, { status: 500 });
    }
}
