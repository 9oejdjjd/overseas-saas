import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        if (session.status !== "STARTED") {
            return NextResponse.json({ error: "Session must be started to submit answers" }, { status: 400 });
        }

        if (!Array.isArray(answers)) {
            return NextResponse.json({ error: "Invalid array of answers" }, { status: 400 });
        }

        let correctAnswers = 0;
        const totalQuestions = session.questions.length;

        // Process each answer
        const updatePromises = session.questions.map(async (sessionQuestion) => {
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

            return prisma.examSessionQuestion.update({
                where: { id: sessionQuestion.id },
                data: { selectedOptionId, isCorrect }
            });
        });

        await Promise.all(updatePromises);

        // Calculate final score
        const scorePercentage = (correctAnswers / totalQuestions) * 100;
        const passed = scorePercentage >= session.passingScore;

        const updatedSession = await prisma.examSession.update({
            where: { id: session.id },
            data: {
                status: "SUBMITTED",
                completedAt: new Date(),
                score: scorePercentage
            }
        });

        // Fire-and-forget: send result via WhatsApp
        sendMockResultNotification(session, session.profession, passed)
            .catch(e => console.error("[CRON] Mock result notification error:", e));

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

// Fire-and-forget: send mock exam result via WhatsApp
async function sendMockResultNotification(session: any, profession: any, passed: boolean) {
    try {
        const { autoSendMessage, autoSendDirectMessage } = await import("@/lib/autoSendMessage");

        if (session.applicantId) {
            // Registered applicant → ON_MOCK_PASS or ON_MOCK_FAIL
            const trigger = passed ? "ON_MOCK_PASS" : "ON_MOCK_FAIL";
            await autoSendMessage(session.applicantId, trigger, {
                customVars: { profession: profession.name }
            });
        } else if (session.visitorPhone) {
            // Public visitor (not registered) → ON_MOCK_PASS_VISITOR or ON_MOCK_FAIL_VISITOR
            const trigger = passed ? "ON_MOCK_PASS_VISITOR" : "ON_MOCK_FAIL_VISITOR";
            await autoSendDirectMessage(session.visitorPhone, trigger, {
                name: session.visitorName || "عزيزي/عزيزتي",
                profession: profession.name,
            });
        }
    } catch (e) {
        console.error("[AutoSend] Mock result notification error:", e);
    }
}
