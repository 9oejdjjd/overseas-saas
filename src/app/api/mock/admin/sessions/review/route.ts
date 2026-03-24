import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(request.url);
        const sessionId = url.searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
        }

        const examSession = await prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                profession: { select: { name: true } },
                applicant: { select: { fullName: true } },
                questions: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        },
                        selectedOption: true
                    }
                }
            }
        });

        if (!examSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Build review data
        const reviewQuestions = examSession.questions.map((sq, index) => {
            const correctOption = sq.question.options.find(o => o.isCorrect);
            return {
                number: index + 1,
                text: sq.question.text,
                axis: sq.question.axis,
                difficulty: sq.question.difficulty,
                options: sq.question.options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    isSelected: opt.id === sq.selectedOptionId
                })),
                selectedOptionId: sq.selectedOptionId,
                correctOptionId: correctOption?.id || null,
                isCorrect: sq.isCorrect,
                isAnswered: !!sq.selectedOptionId
            };
        });

        return NextResponse.json({
            session: {
                id: examSession.id,
                professionName: examSession.profession.name,
                visitorName: examSession.visitorName || examSession.applicant?.fullName || "غير معروف",
                score: examSession.score,
                isPassed: examSession.isPassed,
                completedAt: examSession.completedAt,
                attemptNumber: examSession.attemptNumber
            },
            questions: reviewQuestions,
            summary: {
                total: reviewQuestions.length,
                correct: reviewQuestions.filter(q => q.isCorrect).length,
                wrong: reviewQuestions.filter(q => q.isAnswered && !q.isCorrect).length,
                unanswered: reviewQuestions.filter(q => !q.isAnswered).length
            }
        });
    } catch (error) {
        console.error("Review Session Error:", error);
        return NextResponse.json({ error: "Failed to fetch session review" }, { status: 500 });
    }
}
