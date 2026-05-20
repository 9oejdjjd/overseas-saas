import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppFile } from "@/lib/evolution";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { applicantId, phone: reqPhone, templateId, trigger, message, attachments, customAttachmentBase64, customAttachmentName } = body;

        if ((!applicantId && !reqPhone) || !trigger || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Applicant details or use provided phone
        let phoneToSend = reqPhone;
        let finalApplicantId = applicantId || null;

        if (applicantId) {
            const applicant = await prisma.applicant.findUnique({
                where: { id: applicantId },
                select: { phone: true, whatsappNumber: true, id: true }
            });

            if (!applicant) {
                return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
            }
            phoneToSend = applicant.whatsappNumber || applicant.phone;
        }

        if (!phoneToSend) {
            return NextResponse.json({ error: "No phone number available" }, { status: 400 });
        }

        // 2. Send via Evolution API Service
        let sendResult;

        if (customAttachmentBase64) {
            // Send file with message as caption
            sendResult = await sendWhatsAppFile(phoneToSend, customAttachmentBase64, customAttachmentName || "attachment", message);
        } else {
            // Send text only
            sendResult = await sendWhatsAppMessage(phoneToSend, message);
        }

        const status = sendResult.success ? "SENT" : "PENDING"; // Save failed as PENDING for retry

        // 3. Log the message status in database (Only for registered applicants)
        let messageLog = null;
        if (finalApplicantId) {
            messageLog = await prisma.messageLog.create({
                data: {
                    applicantId: finalApplicantId,
                    templateId,
                    trigger,
                    channel: "WHATSAPP",
                    message,
                    attachments: attachments ? JSON.stringify(attachments) : null,
                    status: status,
                    sentAt: sendResult.success ? new Date() : undefined,
                }
            });
        }

        if (!sendResult.success) {
            // Include messageLog so UI can refresh, but returning 500 error status
            return NextResponse.json({
                error: sendResult.error || "Failed to send message via Evolution API",
                messageLog
            }, { status: 500 });
        }

        // Optional: Save to activity logs for global history
        if (finalApplicantId) {
            await prisma.activityLog.create({
                data: {
                    action: "MESSAGE_SENT",
                    details: `تم الإرسال عبر Evolution API: ${trigger}`,
                    applicantId: finalApplicantId
                }
            });
        }

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
