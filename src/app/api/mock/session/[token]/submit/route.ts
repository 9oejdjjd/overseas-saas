import { NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await request.json();

        // Expected format: { answers: [{ questionId: string, selectedOptionId: string }] }
        const { answers } = body;

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { profession: true, questions: { include: { question: { include: { options: true } } } } }
        });

        if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 404 });

        if (session.status !== "STARTED" && session.status !== "RESUMED") {
            return NextResponse.json({ error: "Session must be started to submit answers" }, { status: 400 });
        }

        // === ANTI-CHEAT: Server-side timeout enforcement ===
        // Prevents submitting answers after the allowed exam time even if the client timer was manipulated
        if (session.startedAt) {
            const examDurationMs = (session.profession?.examDuration || 60) * 60 * 1000;
            const gracePeriodMs = 60 * 1000; // 1 minute grace for slow networks
            const deadline = new Date(session.startedAt).getTime() + examDurationMs + gracePeriodMs;
            const now = Date.now();

            if (now > deadline) {
                // Auto-fail: mark session as TIMEOUT
                await prisma.examSession.update({
                    where: { id: session.id },
                    data: { status: "TIMEOUT", completedAt: new Date(), score: 0, isPassed: false }
                });
                return NextResponse.json({ 
                    error: "انتهى الوقت المسموح للاختبار. تم تسجيل النتيجة كـ (راسب) تلقائياً." 
                }, { status: 400 });
            }
        }

        if (!Array.isArray(answers)) {
            return NextResponse.json({ error: "Invalid array of answers" }, { status: 400 });
        }

        let correctAnswers = 0;
        const totalQuestions = session.questions.length;

        // Pre-calculate correct answers and prepare updates synchronously
        const updates = session.questions.map((sessionQuestion) => {
            const userAnswer = answers.find(a => a.questionId === sessionQuestion.questionId);
            let isCorrect = false;
            let selectedOptionId = null;

            if (userAnswer && userAnswer.selectedOptionId) {
                selectedOptionId = userAnswer.selectedOptionId;
                const correctOption = sessionQuestion.question.options.find(opt => opt.isCorrect);
                if (correctOption && correctOption.id === selectedOptionId) {
                    isCorrect = true;
                    correctAnswers++;
                }
            }

            return { id: sessionQuestion.id, selectedOptionId, isCorrect };
        });

        // Calculate final score
        let scorePercentage = 0;
        if (totalQuestions > 0) {
            scorePercentage = (correctAnswers / totalQuestions) * 100;
        }
        
        // Round to 2 decimal places to prevent Prisma Decimal overflow crash
        const roundedScore = Math.round(scorePercentage * 100) / 100;
        const passed = roundedScore >= session.passingScore;

        // Execute ALL updates atomically in a single transaction
        const transactionOps = [
            // Update all question answers
            ...updates.map(update => 
                prisma.examSessionQuestion.update({
                    where: { id: update.id },
                    data: { selectedOptionId: update.selectedOptionId, isCorrect: update.isCorrect }
                })
            ),
            // Finalize session
            prisma.examSession.update({
                where: { id: session.id },
                data: {
                    status: "SUBMITTED",
                    completedAt: new Date(),
                    score: roundedScore,
                    isPassed: passed
                }
            })
        ];

        await prisma.$transaction(transactionOps);

        // If this session is linked to an agent order, update the order with results
        if (session.agentOrderId) {
            await prisma.agentExamOrder.update({
                where: { id: session.agentOrderId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    score: roundedScore,
                    isPassed: passed,
                }
            });
        }

        // Send result via WhatsApp in the background using Next.js after() to prevent UI hanging AND avoid serverless freeze
        after(async () => {
            try {
                await sendMockResultNotification(session, session.profession, passed);
            } catch (e) {
                console.error("Mock result background notification error:", e);
            }
        });

        return NextResponse.json({
            success: true,
            result: {
                score: scorePercentage,
                correctAnswers,
                totalQuestions,
                passed
            }
        });

    } catch (error) {
        console.error("Session Submit Error:", error);
        return NextResponse.json({ error: "Failed to submit session" }, { status: 500 });
    }
}

// Fire-and-forget: send mock exam result via WhatsApp and Email
async function sendMockResultNotification(session: any, profession: any, passed: boolean) {
    try {
        const { autoSendMessage, autoSendDirectMessage } = await import("@/lib/autoSendMessage");
        const { sendMockResultByEmail } = await import("@/lib/sendEmail");

        // Reload session to get the latest fields (score, isPassed, visitorEmail, applicant details)
        const updatedSession = await prisma.examSession.findUnique({
            where: { id: session.id },
            include: { applicant: true }
        });

        if (!updatedSession) return;

        const baseUrl = getBaseUrl();
        const resultPageUrl = `${baseUrl}/session/${updatedSession.token}/result`;

        // Determine destination email and recipient name
        let emailTo: string | null = null;
        let recipientName = updatedSession.visitorName || "عزيزي المستخدم";

        if (updatedSession.applicantId && updatedSession.applicant) {
            emailTo = updatedSession.applicant.notificationEmail || updatedSession.applicant.platformEmail;
            recipientName = updatedSession.applicant.fullName;
        } else if (updatedSession.visitorEmail) {
            emailTo = updatedSession.visitorEmail;
        }

        // 1. Send Email Notification if email is available
        if (emailTo) {
            console.log(`[Notification] Sending exam result email to ${emailTo}...`);
            await sendMockResultByEmail(
                emailTo,
                recipientName,
                profession.name,
                passed,
                resultPageUrl,
                updatedSession.score ? Number(updatedSession.score) : undefined,
                updatedSession.passingScore
            );
        }

        // 2. Existing WhatsApp Notification flow (remains untouched)
        if (updatedSession.applicantId) {
            // Registered applicant → ON_MOCK_PASS or ON_MOCK_FAIL
            const trigger = passed ? "ON_MOCK_PASS" : "ON_MOCK_FAIL";
            await autoSendMessage(updatedSession.applicantId, trigger, {
                customVars: { 
                    profession: profession.name,
                    resultPageUrl: resultPageUrl
                }
            });
        } else if (updatedSession.visitorPhone) {
            // Public visitor (not registered) → ON_MOCK_PASS_VISITOR or ON_MOCK_FAIL_VISITOR
            const trigger = passed ? "ON_MOCK_PASS_VISITOR" : "ON_MOCK_FAIL_VISITOR";
            await autoSendDirectMessage(updatedSession.visitorPhone, trigger, {
                name: updatedSession.visitorName || "عزيزي/عزيزتي",
                profession: profession.name,
                resultPageUrl: resultPageUrl
            });
        }
    } catch (e) {
        console.error("[AutoSend] Mock result notification error:", e);
    }
}
