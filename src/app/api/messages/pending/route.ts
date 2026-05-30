import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { differenceInDays } from "date-fns";

const TRIGGER_LABELS: Record<string, string> = {
    "ON_REGISTRATION": "تأكيد التسجيل",
    "ON_DASHBOARD_ACCESS": "بيانات الدخول للمنصة",
    "ON_EXAM_SCHEDULE": "تأكيد موعد الاختبار",
    "ON_EXAM_RESCHEDULE": "تعديل موعد الاختبار",
    "ON_EXAM_CANCEL": "إلغاء حجز الاختبار",
    "ON_EXAM_ABSENT": "تغيب عن الاختبار",
    "ON_EXAM_VOUCHER": "قسيمة اختبار",
    "ON_TICKET_ISSUE": "تفاصيل التذكرة",
    "ON_TICKET_UPDATE": "تعديل التذكرة",
    "ON_TICKET_CANCEL": "إلغاء التذكرة",
    "ON_TICKET_NO_SHOW": "تغيب عن الرحلة",
    "ON_TICKET_VOUCHER": "قسيمة تذكرة سفر",
    "ON_TICKET_ATTENDED": "حضور الرحلة",
    "REMINDER_EXAM_2DAYS": "تذكير اختبار (48 ساعة)",
    "REMINDER_TRAVEL_2DAYS": "تذكير سفر (48 ساعة)",
    "ON_MOCK_EXAM_LINK": "رابط الاختبار التجريبي",
    "ON_MOCK_PASS": "نجاح اختبار تجريبي (مسجل)",
    "ON_MOCK_FAIL": "رسوب اختبار تجريبي (مسجل)",
    "ON_MOCK_PASS_VISITOR": "نجاح اختبار تجريبي (زائر)",
    "ON_MOCK_FAIL_VISITOR": "رسوب اختبار تجريبي (زائر)",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_CERTIFICATE": "إرسال الشهادة",
    "ON_FAIL": "إشعار نتيجة (راسب)",
    "ON_RETAKE_VOUCHER": "قسيمة تعويضية",
    "ON_FEEDBACK": "طلب تقييم الخدمة",
    "ON_REFERRAL_VOUCHER": "قسيمة تسويقية",
    "MANUAL_QUICK_MSG": "رسالة سريعة يدوية",
};

// GET - Get pending messages for all applicants
export async function GET() {
    try {
        // Query only active applicants or applicants registered recently (last 14 days)
        // This avoids hard limit cutoff of 'take: 200' while retaining extremely high performance
        const applicants = await prisma.applicant.findMany({
            where: {
                OR: [
                    // Still in progress
                    { status: { notIn: ["PASSED", "FAILED", "CANCELLED", "ABSENT"] } },
                    // Or recently updated/created (last 14 days) to ensure final messages are calculated
                    { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }
                ]
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                whatsappNumber: true,
                applicantCode: true,
                status: true,
                examDate: true,
                platformEmail: true,
                platformPassword: true,
                createdAt: true,
                ticket: {
                    select: { id: true, ticketNumber: true, departureDate: true }
                },
                messageLogs: {
                    select: { trigger: true, status: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const now = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 2);

        const pendingMessages: any[] = [];

        for (const applicant of applicants) {
            const sentTriggers = applicant.messageLogs
                .filter(m => m.status === "SENT" || m.status === "DISMISSED")
                .map(m => m.trigger);

            // ---------------------------------------------------------
            // 1. Lifecycle Messages
            // ---------------------------------------------------------

            // Check Registration Confirmation (ON_REGISTRATION)
            if (!sentTriggers.includes("ON_REGISTRATION")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_REGISTRATION",
                    triggerLabel: "تأكيد التسجيل الجديد",
                    priority: 1,
                });
            }

            // Check account created message (Credentials created but not sent, for active applicants)
            // Fixed: No longer arbitrarily restricts credentials to the first 48 hours of registration
            if (applicant.platformEmail && applicant.platformPassword && !sentTriggers.includes("ON_DASHBOARD_ACCESS")) {
                const isActive = !["PASSED", "FAILED", "CANCELLED"].includes(applicant.status);
                if (isActive) {
                    pendingMessages.push({
                        applicantId: applicant.id,
                        applicant: {
                            fullName: applicant.fullName,
                            phone: applicant.phone,
                            whatsappNumber: applicant.whatsappNumber,
                            applicantCode: applicant.applicantCode,
                        },
                        trigger: "ON_DASHBOARD_ACCESS",
                        triggerLabel: "بيانات الدخول",
                        priority: 1,
                    });
                }
            }

            // Check exam scheduled message (Exam is not in the past more than 2 days)
            if (applicant.examDate && !sentTriggers.includes("ON_EXAM_SCHEDULE")) {
                const examDateObj = new Date(applicant.examDate);
                if (examDateObj > twoDaysAgo) {
                    pendingMessages.push({
                        applicantId: applicant.id,
                        applicant: {
                            fullName: applicant.fullName,
                            phone: applicant.phone,
                            whatsappNumber: applicant.whatsappNumber,
                            applicantCode: applicant.applicantCode,
                        },
                        trigger: "ON_EXAM_SCHEDULE",
                        triggerLabel: "تأكيد حجز الاختبار",
                        priority: 2,
                    });
                }
            }

            // Check ticket issued message
            if (applicant.ticket && !sentTriggers.includes("ON_TICKET_ISSUE")) {
                const travelDateObj = new Date(applicant.ticket.departureDate);
                if (travelDateObj > twoDaysAgo) {
                    pendingMessages.push({
                        applicantId: applicant.id,
                        applicant: {
                            fullName: applicant.fullName,
                            phone: applicant.phone,
                            whatsappNumber: applicant.whatsappNumber,
                            applicantCode: applicant.applicantCode,
                        },
                        trigger: "ON_TICKET_ISSUE",
                        triggerLabel: "إصدار تذكرة السفر",
                        priority: 3,
                    });
                }
            }

            // Check pass/fail messages
            if (applicant.status === "PASSED" && !sentTriggers.includes("ON_PASS")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_PASS",
                    triggerLabel: "تهنئة بالنجاح",
                    priority: 4,
                });
            }

            if (applicant.status === "FAILED" && !sentTriggers.includes("ON_FAIL")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_FAIL",
                    triggerLabel: "رسالة تشجيع",
                    priority: 4,
                });
            }

            // ---------------------------------------------------------
            // 2. Automated Reminders (Time-based & Prioritized)
            // ---------------------------------------------------------
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (applicant.examDate) {
                const examDate = new Date(applicant.examDate);
                examDate.setHours(0, 0, 0, 0);
                const daysToExam = differenceInDays(examDate, today);

                // Reminder: Exactly 2 Days before (48 hours)
                if (daysToExam === 2 && !sentTriggers.includes("REMINDER_EXAM_2DAYS")) {
                    pendingMessages.push({
                        applicantId: applicant.id,
                        applicant: {
                            fullName: applicant.fullName,
                            phone: applicant.phone,
                            whatsappNumber: applicant.whatsappNumber,
                            applicantCode: applicant.applicantCode,
                        },
                        trigger: "REMINDER_EXAM_2DAYS",
                        triggerLabel: "تذكير اختبار (يومين)",
                        priority: 0,
                    });
                }
            }

            if (applicant.ticket && applicant.ticket.departureDate) {
                const travelDate = new Date(applicant.ticket.departureDate);
                travelDate.setHours(0, 0, 0, 0);
                const daysToTravel = differenceInDays(travelDate, today);

                // Reminder: Exactly 2 Days before travel (48 hours)
                if (daysToTravel === 2 && !sentTriggers.includes("REMINDER_TRAVEL_2DAYS")) {
                    pendingMessages.push({
                        applicantId: applicant.id,
                        applicant: {
                            fullName: applicant.fullName,
                            phone: applicant.phone,
                            whatsappNumber: applicant.whatsappNumber,
                            applicantCode: applicant.applicantCode,
                        },
                        trigger: "REMINDER_TRAVEL_2DAYS",
                        triggerLabel: "تذكير السفر (يومين)",
                        priority: 0,
                    });
                }
            }
        }

        // Sort computed messages by priority
        pendingMessages.sort((a, b) => a.priority - b.priority);

        // Fetch actual PENDING messages from DB (Failed attempts)
        const dbPendingMessages = await prisma.messageLog.findMany({
            where: { status: "PENDING" },
            include: {
                applicant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        whatsappNumber: true,
                        applicantCode: true,
                        // Load all logs for this applicant to filter obsolete failed logs!
                        messageLogs: {
                            select: { trigger: true, status: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Map DB messages and filter out obsolete failed logs (already sent successfully later)
        const dbPendingFormatted = dbPendingMessages
            .filter(msg => {
                if (!msg.applicant) return true;
                
                // If there is already a SENT or DISMISSED message in the applicant's history for this trigger,
                // the old failed PENDING log is now obsolete and should NOT show in the retry queue!
                const isObsolete = msg.applicant.messageLogs.some(
                    m => (m.status === "SENT" || m.status === "DISMISSED") && m.trigger === msg.trigger
                );
                return !isObsolete;
            })
            .map(msg => ({
                messageLogId: msg.id, // Important: Include ID for retry/delete
                applicantId: msg.applicantId,
                applicant: {
                    id: msg.applicant?.id,
                    fullName: msg.applicant?.fullName || "زائر (اختبار تجريبي)",
                    phone: msg.applicant?.phone,
                    whatsappNumber: msg.applicant?.whatsappNumber,
                    applicantCode: msg.applicant?.applicantCode,
                },
                trigger: msg.trigger,
                // Translated Arabic trigger name
                triggerLabel: "إعادة إرسال: " + (TRIGGER_LABELS[msg.trigger] || msg.trigger),
                priority: -1, // Highest priority for failed retries
                isRetry: true,
                createdAt: msg.createdAt,
            }));

        // Combine both lists (DB retries first, then computed)
        const allPending = [...dbPendingFormatted, ...pendingMessages];

        return NextResponse.json({
            pending: allPending,
            count: allPending.length,
        });
    } catch (error) {
        console.error("Error fetching pending messages:", error);
        return NextResponse.json({ error: "Failed to fetch pending messages" }, { status: 500 });
    }
}
