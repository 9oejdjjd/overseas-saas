import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { autoSendMessage } from "@/lib/autoSendMessage";

/**
 * CRON endpoint: Sends exam reminders to applicants whose exam is exactly 48 hours away.
 * Can be called by an external CRON service (e.g., cron-job.org) every hour,
 * or manually via the admin panel.
 * 
 * GET /api/cron/exam-reminder
 */
export async function GET() {
    try {
        const now = new Date();
        
        // Target window: exams happening between 47 and 49 hours from now
        const from48h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
        const to48h = new Date(now.getTime() + 49 * 60 * 60 * 1000);

        // Find applicants with exams in the 48h window
        const applicants = await prisma.applicant.findMany({
            where: {
                status: "EXAM_SCHEDULED",
                examDate: {
                    gte: from48h,
                    lte: to48h,
                },
            },
            select: { id: true, fullName: true, examDate: true }
        });

        if (applicants.length === 0) {
            return NextResponse.json({ message: "No reminders to send", sent: 0 });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const app of applicants) {
            // Check if reminder was already sent for this applicant
            const alreadySent = await prisma.messageLog.findFirst({
                where: {
                    applicantId: app.id,
                    trigger: "REMINDER_EXAM_2DAYS",
                    status: "SENT",
                }
            });

            if (alreadySent) {
                console.log(`[CRON] Reminder already sent to ${app.fullName}, skipping.`);
                continue;
            }

            // Send reminder
            const result = await autoSendMessage(app.id, "REMINDER_EXAM_2DAYS");
            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }

            // Small delay between sends to avoid rate-limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        return NextResponse.json({
            message: `Exam reminders processed`,
            total: applicants.length,
            sent: sentCount,
            failed: failedCount,
            skipped: applicants.length - sentCount - failedCount,
        });
    } catch (error) {
        console.error("[CRON] Exam reminder error:", error);
        return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
    }
}
