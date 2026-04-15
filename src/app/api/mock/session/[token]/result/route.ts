import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: {
                profession: true,
                applicant: {
                    select: { fullName: true }
                },
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

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        if (session.status !== "SUBMITTED" && session.status !== "EXPIRED" && session.status !== "TIMEOUT") {
            return NextResponse.json({ error: "Result is not available yet" }, { status: 400 });
        }

        // Format result data
        const result = {
            id: session.id,
            token: session.token,
            score: Number(session.score || 0),
            passingScore: session.passingScore,
            isPassed: session.isPassed,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            visitorName: session.applicant?.fullName || session.visitorName || "زائر",
            professionName: session.profession.name,
            questions: session.questions.map(sq => ({
                id: sq.id,
                questionId: sq.questionId,
                text: sq.question.text,
                explanation: sq.question.explanation,
                selectedOptionId: sq.selectedOptionId,
                isCorrect: sq.isCorrect,
                options: sq.question.options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    isCorrect: opt.isCorrect
                }))
            }))
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error("Fetch Result Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
