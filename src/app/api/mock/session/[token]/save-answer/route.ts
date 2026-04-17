import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { questionId, selectedOptionId } = body;

        if (!questionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { questions: true }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        if (session.status !== "STARTED" && session.status !== "RESUMED") {
            return NextResponse.json({ error: "Session must be active" }, { status: 400 });
        }

        const sessionQuestion = session.questions.find(q => q.questionId === questionId);
        
        if (!sessionQuestion) {
            return NextResponse.json({ error: "Question not found in session" }, { status: 404 });
        }

        await prisma.examSessionQuestion.update({
            where: { id: sessionQuestion.id },
            data: { selectedOptionId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Answer Error:", error);
        // Dont fail strictly, just log so UI doesn't crash
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
