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

            const totalRequired = session.profession.questionCount || 30;
            
            // Proper Fisher-Yates shuffle algorithm for true randomness
            const shuffleArray = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            // Filter strictly HARD questions and properly shuffle them
            const hardQs = shuffleArray(questionBank.filter(q => q.difficulty === "HARD"));
            
            let selectedQuestions: any[] = [];
            
            // 1. Separate questions by specific axes
            const axisGroups: { [key: string]: any[] } = {
                HEALTH_SAFETY: [],
                OCCUPATIONAL_SAFETY: [],
                EMERGENCIES_FIRST_AID: [],
                OTHER: []
            };

            hardQs.forEach(q => {
                if (q.axis === "HEALTH_SAFETY" || q.axis === "OCCUPATIONAL_SAFETY" || q.axis === "EMERGENCIES_FIRST_AID") {
                    axisGroups[q.axis].push(q);
                } else {
                    // All other axes go to OTHER group (to be distributed fairly)
                    axisGroups.OTHER.push(q);
                }
            });

            // 2. Pick exact requested constraints (2, 2, 1)
            const hsPicks = axisGroups.HEALTH_SAFETY.splice(0, 2);
            const osPicks = axisGroups.OCCUPATIONAL_SAFETY.splice(0, 2);
            const efaPicks = axisGroups.EMERGENCIES_FIRST_AID.splice(0, 1);
            
            selectedQuestions.push(...hsPicks, ...osPicks, ...efaPicks);

            // 3. The remaining questions (e.g. 25, if total is 30) distributed equally across remaining axes
            const remainingTarget = totalRequired - selectedQuestions.length;
            
            // Helper to pick target amount fairly across different remaining axes
            const pickFairly = (sourceQs: any[], targetAmount: number) => {
                const subGroups: { [key: string]: any[] } = {};
                sourceQs.forEach(q => {
                    if (!subGroups[q.axis]) subGroups[q.axis] = [];
                    subGroups[q.axis].push(q);
                });
                
                const picked: any[] = [];
                let axisKeys = Object.keys(subGroups);
                
                while (picked.length < targetAmount && axisKeys.length > 0) {
                    for (let i = axisKeys.length - 1; i >= 0; i--) {
                        if (picked.length >= targetAmount) break;
                        const key = axisKeys[i];
                        if (subGroups[key].length > 0) {
                            picked.push(subGroups[key].pop());
                        } else {
                            axisKeys.splice(i, 1);
                        }
                    }
                }
                return picked;
            };

            // Pick fairly from the OTHER axes pool
            const pickedFairlyRest = pickFairly(axisGroups.OTHER, remainingTarget);
            selectedQuestions.push(...pickedFairlyRest);

            // 4. Fallback: If the bank didn't have enough HARD questions in those specific axes, fill with any remaining questions
            if (selectedQuestions.length < totalRequired) {
                const pickedIds = new Set(selectedQuestions.map(q => q.id));
                const remainingBank = shuffleArray(questionBank.filter(q => !pickedIds.has(q.id)));
                selectedQuestions.push(...remainingBank.slice(0, totalRequired - selectedQuestions.length));
            }

            // Final shuffle so the axes and difficulties are mixed up in the actual exam
            selectedQuestions = shuffleArray(selectedQuestions);

            if (selectedQuestions.length === 0) {
                return NextResponse.json({ error: "Not enough questions in bank to generate exam" }, { status: 500 });
            }

            const updates: any[] = [
                prisma.examSession.update({
                    where: { id: session.id },
                    data: { 
                        status: "STARTED", 
                        startedAt: new Date(),
                        visitorName: body.name || session.visitorName,
                        visitorPhone: body.phone || session.visitorPhone
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
