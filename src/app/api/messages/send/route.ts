import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppFile } from "@/lib/openwa";

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

        // 2. Send via WhatsApp (Evolution API Service)
        let whatsappResult: { success: boolean; error?: string; messageId?: string } = { success: false };

        try {
            if (customAttachmentBase64) {
                whatsappResult = await sendWhatsAppFile(phoneToSend, customAttachmentBase64, customAttachmentName || "attachment", message);
            } else {
                whatsappResult = await sendWhatsAppMessage(phoneToSend, message);
            }
        } catch (waErr: any) {
            console.error("[WhatsApp] Error sending:", waErr);
            whatsappResult = { success: false, error: waErr?.message || "تعذر الإرسال عبر الواتساب" };
        }

        const status = whatsappResult.success ? "SENT" : "PENDING"; // Save failed as PENDING for retry

        // 3. Log the WhatsApp message status in database (Only for registered applicants)
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
                    sentAt: whatsappResult.success ? new Date() : undefined,
                }
            });
        }

        // 4. Send Mock Exam Link by Email if trigger is ON_MOCK_EXAM_LINK
        let emailStatus = {
            attempted: false,
            success: false,
            recipient: null as string | null,
            error: null as string | null
        };

        if (trigger === "ON_MOCK_EXAM_LINK") {
            emailStatus.attempted = true;
            try {
                let emailTo: string | null = null;
                let recipientName = "عزيزي المستخدم";
                let resolvedProfession = "";

                if (finalApplicantId) {
                    const applicant = await prisma.applicant.findUnique({
                        where: { id: finalApplicantId },
                        select: { platformEmail: true, notificationEmail: true, fullName: true, profession: true }
                    });
                    if (applicant) {
                        emailTo = applicant.notificationEmail || applicant.platformEmail;
                        recipientName = applicant.fullName;
                        resolvedProfession = applicant.profession || "";
                    }
                } else if (phoneToSend) {
                    const cleanedPhone = phoneToSend.replace(/\D/g, "");
                    const purchase = await prisma.mockExamPurchase.findFirst({
                        where: {
                            OR: [
                                { phone: phoneToSend },
                                { phone: cleanedPhone },
                                { phone: { endsWith: cleanedPhone } }
                            ]
                        },
                        orderBy: { createdAt: "desc" }
                    });
                    if (purchase) {
                        emailTo = purchase.email;
                        recipientName = purchase.buyerName || "عزيزي المستخدم";
                        resolvedProfession = purchase.profession || "";
                    }
                }

                // Fallback by phone lookup in applicant table
                if (!emailTo && phoneToSend) {
                    const cleanedPhone = phoneToSend.replace(/\D/g, "");
                    const applicantByPhone = await prisma.applicant.findFirst({
                        where: {
                            OR: [
                                { phone: phoneToSend },
                                { phone: cleanedPhone },
                                { phone: { endsWith: cleanedPhone.slice(-9) } }
                            ]
                        },
                        select: { notificationEmail: true, platformEmail: true, fullName: true, profession: true }
                    });
                    if (applicantByPhone) {
                        emailTo = applicantByPhone.notificationEmail || applicantByPhone.platformEmail;
                        recipientName = applicantByPhone.fullName || recipientName;
                        resolvedProfession = applicantByPhone.profession || resolvedProfession;
                    }
                }

                if (emailTo) {
                    emailStatus.recipient = emailTo;
                    const linkMatch = message.match(/https?:\/\/[^\s]+/);
                    const examLink = linkMatch ? linkMatch[0] : "";

                    if (examLink) {
                        const { sendMockExamLinkByEmail } = await import("@/lib/sendEmail");
                        await sendMockExamLinkByEmail(emailTo, recipientName, resolvedProfession, examLink);
                        emailStatus.success = true;
                    } else {
                        emailStatus.error = "لم يتم العثور على رابط الاختبار في القالب";
                    }
                } else {
                    emailStatus.error = "لم يتم العثور على بريد إلكتروني مسجل للعميل";
                }
            } catch (err: any) {
                console.error("[Email] Error dispatching mock exam link email:", err);
                emailStatus.error = err?.message || "فشل إرسال البريد الإلكتروني";
            }
        }

        // Save activity log if applicant exists
        if (finalApplicantId && (whatsappResult.success || emailStatus.success)) {
            await prisma.activityLog.create({
                data: {
                    action: "MESSAGE_SENT",
                    details: `إرسال رسالة (${trigger}) - واتساب: ${whatsappResult.success ? 'نجح' : 'فشل'} | إيميل: ${emailStatus.success ? 'نجح' : 'غير مرسل/فشل'}`,
                    applicantId: finalApplicantId
                }
            });
        }

        // Return unified status response
        const overallSuccess = whatsappResult.success || emailStatus.success;

        return NextResponse.json({
            success: overallSuccess,
            whatsapp: {
                attempted: true,
                success: whatsappResult.success,
                error: whatsappResult.error || null,
                messageId: whatsappResult.messageId || null
            },
            email: emailStatus,
            messageLog
        }, { status: overallSuccess ? 200 : 500 });

    } catch (error) {
        console.error("Error in send message API:", error);
        return NextResponse.json({ error: "خطأ داخلي في خادم الرسائل" }, { status: 500 });
    }
}
