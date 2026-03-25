import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { differenceInDays } from "date-fns";

// Define expected triggers for each applicant status
const TRIGGER_STATUS_MAP: Record<string, string[]> = {
    "ACCOUNT_CREATED": ["ON_DASHBOARD_ACCESS"],
    "EXAM_SCHEDULED": ["ON_DASHBOARD_ACCESS", "ON_EXAM_SCHEDULE"],
    "AWAITING_EXAM": ["ON_DASHBOARD_ACCESS", "ON_EXAM_SCHEDULE"],
    "PASSED": ["ON_DASHBOARD_ACCESS", "ON_EXAM_SCHEDULE", "ON_PASS"],
    "FAILED": ["ON_DASHBOARD_ACCESS", "ON_EXAM_SCHEDULE", "ON_FAIL"],
};

// GET - Get pending messages for all applicants
export async function GET() {
    try {
        // Get all applicants with their sent messages
        const applicants = await prisma.applicant.findMany({
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
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        // The exact date/time threshold logic to ignore old notifications:
        // We only consider applying notifications if the relevant date is recent or in the future
        const now = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 2);

        const pendingMessages: any[] = [];

        for (const applicant of applicants) {
            const sentTriggers = applicant.messageLogs
                .filter(m => m.status === "SENT")
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

            // Check account created message (New account within last 2 days)
            if (applicant.platformEmail && applicant.platformPassword && !sentTriggers.includes("ON_DASHBOARD_ACCESS")) {
                const isRecentRegistration = new Date(applicant.createdAt) > twoDaysAgo;
                if (isRecentRegistration) {
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
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Map DB messages to the same structure
        const dbPendingFormatted = dbPendingMessages.map(msg => ({
            messageLogId: msg.id, // Important: Include ID for retry/delete
            applicantId: msg.applicantId,
            applicant: msg.applicant,
            trigger: msg.trigger,
            triggerLabel: "إعادة إرسال: " + (msg.trigger.includes("MOCK") ? "اختبار تجريبي" : msg.trigger),
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
