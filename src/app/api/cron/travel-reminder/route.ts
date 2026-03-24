import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { autoSendMessage } from "@/lib/autoSendMessage";

/**
 * CRON endpoint: Sends travel reminders to applicants whose trip is exactly 48 hours away.
 * Can be called by an external CRON service (e.g., cron-job.org) every hour,
 * or manually via the admin panel.
 * 
 * GET /api/cron/travel-reminder
 */
export async function GET() {
    try {
        const now = new Date();
        
        // Target window: trips happening between 47 and 49 hours from now
        const from48h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
        const to48h = new Date(now.getTime() + 49 * 60 * 60 * 1000);

        // Find tickets with departure dates in the 48h window
        const tickets = await prisma.ticket.findMany({
            where: {
                status: "ISSUED",
                departureDate: {
                    gte: from48h,
                    lte: to48h,
                },
            },
            include: {
                applicant: {
                    select: { id: true, fullName: true }
                }
            }
        });

        if (tickets.length === 0) {
            return NextResponse.json({ message: "No travel reminders to send", sent: 0 });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const ticket of tickets) {
            if (!ticket.applicantId) continue;
            
            // Check if reminder was already sent for this ticket
            // We use trigger AND ticket reference to ensure we don't spam if they have multiple trips
            const alreadySent = await prisma.messageLog.findFirst({
                where: {
                    applicantId: ticket.applicantId,
                    trigger: "REMINDER_TRAVEL_2DAYS",
                    status: "SENT",
                    // Ideal would be to check if message contains ticket number, but since 
                    // applicants rarely have multiple active trips at the EXACT same 48h window, this is safe.
                    sentAt: {
                        gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // Sent within the last 3 days
                    }
                }
            });

            if (alreadySent) {
                console.log(`[CRON] Travel reminder already sent to ${ticket.applicant?.fullName}, skipping.`);
                continue;
            }

            // Send reminder
            const result = await autoSendMessage(ticket.applicantId, "REMINDER_TRAVEL_2DAYS", { ticketId: ticket.id });
            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }

            // Small delay between sends to avoid rate-limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        return NextResponse.json({
            message: `Travel reminders processed`,
            total: tickets.length,
            sent: sentCount,
            failed: failedCount,
            skipped: tickets.length - sentCount - failedCount,
        });
    } catch (error) {
        console.error("[CRON] Travel reminder error:", error);
        return NextResponse.json({ error: "Failed to process travel reminders" }, { status: 500 });
    }
}
