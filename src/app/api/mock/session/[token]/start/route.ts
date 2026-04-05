import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sessionStartSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

        let body: any = {};
        try { 
            const rawBody = await request.json(); 
            const parsed = sessionStartSchema.safeParse(rawBody);
            if (!parsed.success) {
                return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.format() }, { status: 400 });
            }
            body = parsed.data;
        } catch (e) { }

        // Retrieve session with profession details
        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { profession: true, questions: true, applicant: true }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        if (session.status === "SUBMITTED" || session.status === "EXPIRED") {
            return NextResponse.json({ error: "Session is already completed or expired" }, { status: 400 });
        }

        // If it's a NEW session, we must select random questions and link them
        if (session.status === "NEW") {
            const questionBank = await prisma.question.findMany({
                where: { professionId: session.professionId, isActive: true },
                include: { options: true }
            });

            // Saudi Professional Exam style: 7 HARD + 2 MEDIUM + 1 EASY per axis = 10
            const axes = ["HEALTH_SAFETY", "PROFESSION_KNOWLEDGE", "GENERAL_SKILLS"] as const;
            let selectedQuestions: any[] = [];

            for (const axis of axes) {
                const axisQs = questionBank.filter(q => q.axis === axis);
                const hardQs = axisQs.filter(q => q.difficulty === "HARD").sort(() => 0.5 - Math.random());
                const mediumQs = axisQs.filter(q => q.difficulty === "MEDIUM").sort(() => 0.5 - Math.random());
                const easyQs = axisQs.filter(q => q.difficulty === "EASY").sort(() => 0.5 - Math.random());

                // Target: 7 hard, 2 medium, 1 easy per axis
                const pickedHard = hardQs.slice(0, 7);
                const pickedMedium = mediumQs.slice(0, 2);
                const pickedEasy = easyQs.slice(0, 1);

                const totalPicked = [...pickedHard, ...pickedMedium, ...pickedEasy];

                // Fallback: if we don't have enough of each difficulty, fill from remaining
                if (totalPicked.length < 10) {
                    const pickedIds = new Set(totalPicked.map(q => q.id));
                    const remaining = axisQs.filter(q => !pickedIds.has(q.id)).sort(() => 0.5 - Math.random());
                    totalPicked.push(...remaining.slice(0, 10 - totalPicked.length));
                }

                selectedQuestions.push(...totalPicked);
            }

            // Fallback to random if we didn't get exactly 30 (for legacy data)
            if (selectedQuestions.length < 30) {
                const remainingBank = questionBank.filter(q => !selectedQuestions.find(sq => sq.id === q.id)).sort(() => 0.5 - Math.random());
                selectedQuestions.push(...remainingBank.slice(0, 30 - selectedQuestions.length));
            }

            // Final shuffle so the axes are mixed up in the actual exam
            selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());

            if (selectedQuestions.length === 0) {
                return NextResponse.json({ error: "Not enough questions in bank to generate exam" }, { status: 500 });
            }

            const updates: any[] = [
                prisma.examSession.update({
                    where: { id: session.id },
                    data: { status: "STARTED", startedAt: new Date() }
                }),
                prisma.examSessionQuestion.createMany({
                    data: selectedQuestions.map(q => ({
                        sessionId: session.id,
                        questionId: q.id
                    }))
                })
            ];

            // Update applicant phone if provided in Private session
            if (session.type === "PRIVATE" && session.applicantId && body.phone) {
                updates.push(prisma.applicant.update({
                    where: { id: session.applicantId },
                    data: { whatsappNumber: body.phone }
                }));
            }

            // Save relationship
            await prisma.$transaction(updates);

            // Construct payload returning questions to UI without 'isCorrect' flag
            const safeQuestions = selectedQuestions.map(q => ({
                questionId: q.id,
                question: {
                    text: q.text,
                    options: q.options.map((opt: any) => ({
                        id: opt.id,
                        text: opt.text
                    }))
                }
            }));

            return NextResponse.json({
                session: {
                    id: session.id,
                    status: "STARTED",
                    professionName: session.profession.name,
                    visitorName: session.visitorName,
                    duration: session.profession.examDuration,
                    startedAt: new Date(),
                },
                questions: safeQuestions
            });
        }

        // If ALREADY STARTED, return the questions we saved for this session
        const savedSessionQuestions = await prisma.examSessionQuestion.findMany({
            where: { sessionId: session.id },
            include: {
                question: {
                    include: { options: true }
                }
            }
        });

        const safeQuestions = savedSessionQuestions.map(sq => ({
            questionId: sq.question.id,
            question: {
                text: sq.question.text,
                options: sq.question.options.map(opt => ({
                    id: opt.id,
                    text: opt.text
                }))
            }
        }));

        return NextResponse.json({
            session: {
                id: session.id,
                status: session.status,
                professionName: session.profession.name,
                visitorName: session.visitorName,
                duration: session.profession.examDuration,
                startedAt: session.startedAt,
            },
            questions: safeQuestions
        });

    } catch (error) {
        console.error("Session Start Error:", error);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }
}
