import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppFile } from "@/lib/wppconnect";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { applicantId, templateId, trigger, message, attachments, customAttachmentBase64, customAttachmentName } = body;

        if (!applicantId || !trigger || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Applicant details
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            select: { phone: true, whatsappNumber: true, id: true }
        });

        if (!applicant) {
            return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
        }

        const phone = applicant.whatsappNumber || applicant.phone;

        if (!phone) {
            return NextResponse.json({ error: "Applicant has no phone number" }, { status: 400 });
        }

        // 2. Send via WPPConnect Backup Service
        let sendResult;

        if (customAttachmentBase64) {
            // Send file with message as caption
            sendResult = await sendWhatsAppFile(phone, customAttachmentBase64, customAttachmentName || "attachment", message);
        } else {
            // Send text only
            sendResult = await sendWhatsAppMessage(phone, message);
        }

        const status = sendResult.success ? "SENT" : "FAILED";

        // 3. Log the message status in database
        const messageLog = await prisma.messageLog.create({
            data: {
                applicantId,
                templateId,
                trigger,
                channel: "WHATSAPP",
                message,
                attachments: attachments ? JSON.stringify(attachments) : null,
                status: status,
                sentAt: sendResult.success ? new Date() : undefined,
            }
        });

        if (!sendResult.success) {
            // Include messageLog so UI can refresh, but returning 500 error status
            return NextResponse.json({
                error: sendResult.error || "Failed to send message via WPPConnect",
                messageLog
            }, { status: 500 });
        }

        // Optional: Save to activity logs for global history
        await prisma.activityLog.create({
            data: {
                action: "MESSAGE_SENT",
                details: `تم الإرسال عبر WPPConnect: ${trigger}`,
                applicantId: applicantId
            }
        });

        return NextResponse.json({
            success: true,
            messageId: sendResult.messageId,
            messageLog
        });

    } catch (error) {
        console.error("Error in send message API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
