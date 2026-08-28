import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { logId } = body;

        if (!logId) {
            return NextResponse.json({ error: "معرف السجل مطلوب" }, { status: 400 });
        }

        const log = await prisma.emailLog.findUnique({
            where: { id: logId }
        });

        if (!log) {
            return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
        }

        const { sendMailWithFailover } = await import("@/lib/sendEmail");

        try {
            // Re-send the exact email
            await sendMailWithFailover({
                to: log.recipient,
                subject: log.subject,
                text: log.body.replace(/<[^>]*>/g, ""), // Strip HTML for plain text fallback
                html: log.body
            });

            // Update log on success
            const updatedLog = await prisma.emailLog.update({
                where: { id: logId },
                data: {
                    status: "SENT",
                    error: null,
                    sentAt: new Date()
                }
            });

            return NextResponse.json({ success: true, log: updatedLog });

        } catch (sendErr: any) {
            console.error(`Resend failed for log ${logId}:`, sendErr);

            // Update log error details on failure
            await prisma.emailLog.update({
                where: { id: logId },
                data: {
                    status: "FAILED",
                    error: sendErr.message || "فشلت محاولة إعادة الإرسال",
                    sentAt: new Date()
                }
            });

            return NextResponse.json({ 
                success: false, 
                error: sendErr.message || "فشل خادم البريد في إرسال الرسالة" 
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Resend Email API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
