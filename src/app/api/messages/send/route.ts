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

        // Send Mock Exam Link by Email in the background if the trigger is ON_MOCK_EXAM_LINK
        if (trigger === "ON_MOCK_EXAM_LINK") {
            (async () => {
                try {
                    let emailTo = null;
                    let recipientName = "عزيزي المستخدم";
                    let resolvedProfession = "";

                    console.log(`[Email] Resolving email for: applicantId=${finalApplicantId}, phone=${phoneToSend}`);

                    if (finalApplicantId) {
                        const applicant = await prisma.applicant.findUnique({
                            where: { id: finalApplicantId },
                            select: { platformEmail: true, notificationEmail: true, fullName: true, profession: true }
                        });
                        console.log(`[Email] Applicant query result:`, applicant ? { name: applicant.fullName, notificationEmail: applicant.notificationEmail, platformEmail: applicant.platformEmail } : 'NOT FOUND');
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
                        console.log(`[Email] Purchase query result:`, purchase ? { name: purchase.buyerName, email: purchase.email } : 'NOT FOUND');
                        if (purchase) {
                            emailTo = purchase.email;
                            recipientName = purchase.buyerName || "عزيزي المستخدم";
                            resolvedProfession = purchase.profession || "";
                        }
                    }
                    // Fallback: if no email found yet, try searching Applicant table by phone
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
                        console.log(`[Email] Fallback applicant-by-phone result:`, applicantByPhone ? { name: applicantByPhone.fullName, notificationEmail: applicantByPhone.notificationEmail, platformEmail: applicantByPhone.platformEmail } : 'NOT FOUND');
                        if (applicantByPhone) {
                            emailTo = applicantByPhone.notificationEmail || applicantByPhone.platformEmail;
                            if (!recipientName || recipientName === "عزيزي المستخدم") {
                                recipientName = applicantByPhone.fullName || recipientName;
                            }
                            if (!resolvedProfession) {
                                resolvedProfession = applicantByPhone.profession || "";
                            }
                        }
                    }

                    console.log(`[Email] Final resolved email: ${emailTo}`);

                    if (emailTo) {
                        // Extract link from message using regex
                        const linkMatch = message.match(/https?:\/\/[^\s]+/);
                        const examLink = linkMatch ? linkMatch[0] : "";

                        if (examLink) {
                            const { sendMockExamLinkByEmail } = await import("@/lib/sendEmail");
                            await sendMockExamLinkByEmail(emailTo, recipientName, resolvedProfession, examLink);
                            console.log(`[Email] Automated exam link sent to ${emailTo}`);
                        } else {
                            console.log("[Email] No exam link found in the generated message template");
                        }
                    } else {
                        console.log("[Email] No email found for this applicant after all fallbacks");
                    }
                } catch (err) {
                    console.error("[Email] Error in background mock exam link dispatch:", err);
                }
            })();
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
