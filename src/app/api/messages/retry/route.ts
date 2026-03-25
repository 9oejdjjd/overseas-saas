import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/wppconnect";

// POST - Retry failed (PENDING) messages
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messageLogId, retryAll } = body;

        if (retryAll) {
            // Batch retry all PENDING messages
            const pendingMessages = await prisma.messageLog.findMany({
                where: { status: "PENDING" },
                include: { applicant: { select: { phone: true, whatsappNumber: true } } }
            });

            if (pendingMessages.length === 0) {
                return NextResponse.json({ success: true, count: 0, message: "No pending messages to retry" });
            }

            let successCount = 0;
            let failCount = 0;

            // Process sequentially to avoid overwhelming WPPConnect
            for (const msg of pendingMessages) {
                const phone = msg.applicant?.whatsappNumber || msg.applicant?.phone;
                if (!phone) {
                    await prisma.messageLog.update({
                        where: { id: msg.id },
                        data: { status: "FAILED" } // Mark as permanently failed if no phone
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
                        successCount++;
                    } else {
                        // Keep as PENDING but could add retryCount logic here in the future
                        failCount++;
                    }
                } catch (err) {
                    console.error(`Error retrying message ${msg.id}:`, err);
                    failCount++;
                }
            }

            return NextResponse.json({ 
                success: true, 
                count: pendingMessages.length,
                successCount,
                failCount,
                message: `Retried ${pendingMessages.length} messages. ${successCount} successful, ${failCount} failed.`
            });
        } 
        
        // Single retry logic
        if (!messageLogId) {
            return NextResponse.json({ error: "messageLogId is required" }, { status: 400 });
        }

        const msgLog = await prisma.messageLog.findUnique({
            where: { id: messageLogId },
            include: { applicant: { select: { phone: true, whatsappNumber: true } } }
        });

        if (!msgLog || msgLog.status !== "PENDING") {
            return NextResponse.json({ error: "Message not found or not in PENDING state" }, { status: 404 });
        }

        const phone = msgLog.applicant?.whatsappNumber || msgLog.applicant?.phone;
        if (!phone) {
            await prisma.messageLog.update({
                where: { id: messageLogId },
                data: { status: "FAILED" }
            });
            return NextResponse.json({ error: "Applicant has no phone number" }, { status: 400 });
        }

        const sendResult = await sendWhatsAppMessage(phone, msgLog.message);
        
        if (sendResult.success) {
            await prisma.messageLog.update({
                where: { id: messageLogId },
                data: { status: "SENT", sentAt: new Date() }
            });
            return NextResponse.json({ success: true, status: "SENT" });
        } else {
            return NextResponse.json({ error: "Failed to send message", status: "PENDING" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in retry message API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE - Remove failed a message from the retry queue
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const messageLogId = url.searchParams.get("id");
        const deleteAll = url.searchParams.get("all") === "true";

        if (deleteAll) {
            // Permanently fail all pending messages
            const result = await prisma.messageLog.updateMany({
                where: { status: "PENDING" },
                data: { status: "FAILED" } // Change back to FAILED so it's removed from pending queue
            });
            
            return NextResponse.json({ 
                success: true, 
                count: result.count,
                message: `Removed ${result.count} messages from pending queue` 
            });
        }

        if (!messageLogId) {
            return NextResponse.json({ error: "messageLogId is required" }, { status: 400 });
        }

        // Permanently fail this specific message
        await prisma.messageLog.update({
            where: { id: messageLogId, status: "PENDING" },
            data: { status: "FAILED" }
        });

        return NextResponse.json({ success: true, message: "Message removed from pending queue" });
    } catch (error) {
        console.error("Error in delete pending message API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
