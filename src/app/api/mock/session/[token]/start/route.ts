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

        // --- ENHANCED VALIDATION ---
        const isValidArabicName = (name: string) => {
            if (!name) return false;
            const arabicRegex = /^[\u0600-\u06FF\s]+$/;
            if (!arabicRegex.test(name)) return false;
            if (/(.)\1\1/.test(name)) return false; 
            const words = name.trim().split(/\s+/);
            return words.length >= 2 && words.length <= 4;
        };

        const isFakePhone = (phone: string) => {
            const digits = phone.replace(/\D/g, '').slice(-8); // Check last 8 digits
            if (/^(\d)\1+$/.test(digits)) return true;
            if ("1234567890".includes(digits) || "0987654321".includes(digits)) return true;
            return false;
        };

        // Fetch session FIRST before any validation
        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { 
                profession: true, 
                applicant: true,
                questions: {
                    include: {
                        question: {
                            include: { options: true }
                        }
                    }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        if (session.status === "SUBMITTED" || session.status === "EXPIRED" || session.status === "TIMEOUT") {
            return NextResponse.json({ error: "Session is already completed or expired" }, { status: 400 });
        }

        // If session is already STARTED or RESUMED, skip all validation (already done on first start)
        if (session.status === "STARTED" || session.status === "RESUMED") {
            // Update status to RESUMED to log that they came back
            await prisma.examSession.update({
                where: { id: session.id },
                data: { status: "RESUMED" }
            });
            
            // Format existing questions to match frontend expectation
            const existingQuestions = session.questions.map((sq: any) => ({
                questionId: sq.question.id,
                question: {
                    text: sq.question.text,
                    options: sq.question.options.map((opt: any) => ({ id: opt.id, text: opt.text }))
                },
                selectedOptionId: sq.selectedOptionId
            }));

            // Return existing questions without regenerating
            return NextResponse.json({
                session: {
                    id: session.id,
                    status: "RESUMED",
                    professionName: session.profession.name,
                    visitorName: session.visitorName || session.applicant?.fullName,
                    duration: session.profession.examDuration,
                    startedAt: session.startedAt,
                    serverNow: new Date().toISOString()
                },
                questions: existingQuestions
            });
        }
        // --- VALIDATION: Only for NEW sessions (resumed ones already passed this) ---
        if (session.type !== "PRIVATE") {
            if (body.name && !isValidArabicName(body.name)) {
                return NextResponse.json({ error: "الاسم غير مقبول. يرجى إدخال اسم عربي ثنائي إلى رباعي صحيح." }, { status: 400 });
            }

            if (body.phone) {
                if (isFakePhone(body.phone)) {
                    return NextResponse.json({ error: "رقم الهاتف غير صحيح أو وهمي." }, { status: 400 });
                }
                
                try {
                    const { onWhatsApp } = await import("@/lib/evolution");
                    const exists = await onWhatsApp(body.phone);
                    if (!exists) {
                        return NextResponse.json({ error: "هذا الرقم غير مسجل في واتساب. يرجى استخدام رقم فعال لاستلام النتيجة." }, { status: 400 });
                    }
                } catch (waError) {
                    console.warn("[WhatsApp Check] Evolution API unreachable, skipping check:", waError);
                    // Don't block the exam if WhatsApp check fails
                }
            }
        }
        // ---------------------------

        // If it's a NEW session, we must select random questions and link them
        if (session.status === "NEW") {
            const questionBank = await prisma.question.findMany({
                where: { professionId: session.professionId, isActive: true },
                include: { options: true }
            });

            // Saudi Professional Exam style: 30 Questions total (27 HARD, 3 MEDIUM), fairly distributed across all 8 axes
            let selectedQuestions: any[] = [];
            
            const hardQs = questionBank.filter(q => q.difficulty === "HARD").sort(() => 0.5 - Math.random());
            const mediumQs = questionBank.filter(q => q.difficulty === "MEDIUM").sort(() => 0.5 - Math.random());

            // Helper to pick target amount fairly across different axes
            const pickFairly = (sourceQs: any[], targetAmount: number) => {
                const axesGroups: { [key: string]: any[] } = {};
                sourceQs.forEach(q => {
                    if (!axesGroups[q.axis]) axesGroups[q.axis] = [];
                    axesGroups[q.axis].push(q);
                });
                
                const picked: any[] = [];
                let axisKeys = Object.keys(axesGroups);
                
                while (picked.length < targetAmount && axisKeys.length > 0) {
                    for (let i = axisKeys.length - 1; i >= 0; i--) {
                        if (picked.length >= targetAmount) break;
                        const key = axisKeys[i];
                        if (axesGroups[key].length > 0) {
                            picked.push(axesGroups[key].pop());
                        } else {
                            axisKeys.splice(i, 1);
                        }
                    }
                }
                return picked;
            };

            const pickedHard = pickFairly(hardQs, 27);
            const pickedMedium = pickFairly(mediumQs, 3);
            
            selectedQuestions = [...pickedHard, ...pickedMedium];

            // Fallback: If not enough HARD/MEDIUM, fill with whatever is left (legacy compatibility)
            if (selectedQuestions.length < 30) {
                const pickedIds = new Set(selectedQuestions.map(q => q.id));
                const remainingBank = questionBank.filter(q => !pickedIds.has(q.id)).sort(() => 0.5 - Math.random());
                selectedQuestions.push(...remainingBank.slice(0, 30 - selectedQuestions.length));
            }

            // Final shuffle so the axes and difficulties are mixed up in the actual exam
            selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());

            if (selectedQuestions.length === 0) {
                return NextResponse.json({ error: "Not enough questions in bank to generate exam" }, { status: 500 });
            }

            const updates: any[] = [
                prisma.examSession.update({
                    where: { id: session.id },
                    data: { 
                        status: "STARTED", 
                        startedAt: new Date(),
                        visitorName: body.name || session.visitorName
                    }
                }),
                prisma.examSessionQuestion.createMany({
                    data: selectedQuestions.map(q => ({
                        sessionId: session.id,
                        questionId: q.id
                    }))
                })
            ];



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
                    serverNow: new Date().toISOString()
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
                serverNow: new Date().toISOString()
            },
            questions: safeQuestions
        });

    } catch (error) {
        console.error("Session Start Error:", error);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }
}
