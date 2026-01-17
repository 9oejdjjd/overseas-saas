import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Define expected triggers for each applicant status
const TRIGGER_STATUS_MAP: Record<string, string[]> = {
    "ACCOUNT_CREATED": ["ON_ACCOUNT_CREATED"],
    "EXAM_SCHEDULED": ["ON_ACCOUNT_CREATED", "ON_EXAM_SCHEDULED"],
    "AWAITING_EXAM": ["ON_ACCOUNT_CREATED", "ON_EXAM_SCHEDULED"],
    "PASSED": ["ON_ACCOUNT_CREATED", "ON_EXAM_SCHEDULED", "ON_PASS"],
    "FAILED": ["ON_ACCOUNT_CREATED", "ON_EXAM_SCHEDULED", "ON_FAIL"],
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
                ticket: {
                    select: { id: true, ticketNumber: true }
                },
                messageLogs: {
                    select: { trigger: true, status: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        const pendingMessages: any[] = [];

        for (const applicant of applicants) {
            const sentTriggers = applicant.messageLogs
                .filter(m => m.status === "SENT")
                .map(m => m.trigger);

            // Check account created message
            if (applicant.platformEmail && applicant.platformPassword && !sentTriggers.includes("ON_ACCOUNT_CREATED")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_ACCOUNT_CREATED",
                    triggerLabel: "رسالة الترحيب",
                    priority: 1,
                });
            }

            // Check exam scheduled message
            if (applicant.examDate && !sentTriggers.includes("ON_EXAM_SCHEDULED")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_EXAM_SCHEDULED",
                    triggerLabel: "تأكيد موعد الاختبار",
                    priority: 2,
                });
            }

            // Check ticket issued message
            if (applicant.ticket && !sentTriggers.includes("ON_TICKET_ISSUED")) {
                pendingMessages.push({
                    applicantId: applicant.id,
                    applicant: {
                        fullName: applicant.fullName,
                        phone: applicant.phone,
                        whatsappNumber: applicant.whatsappNumber,
                        applicantCode: applicant.applicantCode,
                    },
                    trigger: "ON_TICKET_ISSUED",
                    triggerLabel: "تفاصيل التذكرة",
                    priority: 3,
                });
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
        }

        // Sort by priority
        pendingMessages.sort((a, b) => a.priority - b.priority);

        return NextResponse.json({
            pending: pendingMessages,
            count: pendingMessages.length,
        });
    } catch (error) {
        console.error("Error fetching pending messages:", error);
        return NextResponse.json({ error: "Failed to fetch pending messages" }, { status: 500 });
    }
}
