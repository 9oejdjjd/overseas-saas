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
            
            const existingQuestions = session.questions.map((sq: any) => ({
                questionId: sq.question.id,
                question: {
                    type: sq.question.type,
                    imageUrl: sq.question.imageUrl,
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
            // 1. Fetch user identification to get Seen Questions
            const userPhone = body.phone || session.visitorPhone;
            const userIdentifier = session.applicantId || userPhone || session.deviceFingerprint;
            let seenQuestionIds = new Set<string>();

            if (userIdentifier) {
                const orConditions = [];
                if (session.applicantId) orConditions.push({ applicantId: session.applicantId });
                if (userPhone) orConditions.push({ visitorPhone: userPhone });
                if (session.deviceFingerprint) orConditions.push({ deviceFingerprint: session.deviceFingerprint });

                // Find all past sessions for this user for THIS profession
                const pastSessions = await prisma.examSession.findMany({
                    where: {
                        professionId: session.professionId,
                        OR: orConditions,
                        id: { not: session.id }
                    },
                    select: { id: true }
                });

                if (pastSessions.length > 0) {
                    const pastSessionIds = pastSessions.map(s => s.id);
                    const seenQuestions = await prisma.examSessionQuestion.findMany({
                        where: { sessionId: { in: pastSessionIds } },
                        select: { questionId: true }
                    });
                    seenQuestions.forEach(sq => seenQuestionIds.add(sq.questionId));
                }
            }

            // 2. Fetch the question bank (Only HARD and ACTIVE)
            const questionBank = await prisma.question.findMany({
                where: { 
                    professionId: session.professionId, 
                    isActive: true,
                    difficulty: "HARD" // Strictly HARD difficulty as requested
                },
                include: { options: true }
            });

            const totalRequired = session.profession.questionCount || 30;

            // Fetch ServiceConfig to check if new question types are enabled
            const serviceConfig = await prisma.serviceConfig.findUnique({ where: { id: "global" } });
            const enableNewQuestions = serviceConfig?.enableMockExamNewQuestions ?? false;

            const shuffleArray = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            // 3. Separate into Unseen and Seen, and Shuffle
            let unseenBank = shuffleArray(questionBank.filter(q => !seenQuestionIds.has(q.id)));
            let seenBank = shuffleArray(questionBank.filter(q => seenQuestionIds.has(q.id)));

            // If new questions are disabled, exclude them from both pools
            if (!enableNewQuestions) {
                unseenBank = unseenBank.filter(q => q.type === "MCQ" && !q.imageUrl);
                seenBank = seenBank.filter(q => q.type === "MCQ" && !q.imageUrl);
            }

            // 4. Setup Quotas
            const typeQuota = enableNewQuestions 
                ? { MCQ: 15, TRUE_FALSE: 7, IMAGE: 3, FILL_BLANK: 5 }
                : { MCQ: totalRequired, TRUE_FALSE: 0, IMAGE: 0, FILL_BLANK: 0 };

            const axisQuota: Record<string, number> = {
                EMERGENCIES_FIRST_AID: 1,
                HEALTH_SAFETY: 3,
                OCCUPATIONAL_SAFETY: 3,
                OTHER: 23 // Distributed among the rest
            };
            
            const OTHER_AXES = ["PROFESSION_KNOWLEDGE", "GENERAL_SKILLS", "CORRECT_METHODS", "PROFESSIONAL_BEHAVIOR", "TOOLS_AND_EQUIPMENT"];

            let selectedQuestions: any[] = [];
            const pickedIds = new Set<string>();

            const addQuestion = (q: any, isOtherAxis: boolean) => {
                selectedQuestions.push(q);
                pickedIds.add(q.id);
                
                // Decrement type quota
                if (q.imageUrl && enableNewQuestions) {
                    typeQuota.IMAGE--;
                } else {
                    typeQuota[q.type as keyof typeof typeQuota]--;
                }

                // Decrement axis quota
                if (isOtherAxis) {
                    axisQuota.OTHER--;
                } else {
                    axisQuota[q.axis]--;
                }
            };

            // Helper to pick questions based on quotas
            const pickQuestionsFromPool = (pool: any[], enforceAxis: boolean) => {
                for (const q of pool) {
                    if (pickedIds.has(q.id) || selectedQuestions.length >= totalRequired) continue;

                    let qType = q.type;
                    if (q.imageUrl && enableNewQuestions) qType = "IMAGE";

                    const typeNeeded = typeQuota[qType as keyof typeof typeQuota] > 0;
                    
                    const isOtherAxis = OTHER_AXES.includes(q.axis) || (!axisQuota[q.axis] && axisQuota[q.axis] !== 0); // fallback if axis not recognized
                    const axisNeeded = isOtherAxis ? axisQuota.OTHER > 0 : axisQuota[q.axis] > 0;

                    if (typeNeeded) {
                        if (!enforceAxis || axisNeeded) {
                            addQuestion(q, isOtherAxis);
                        }
                    }
                }
            };

            // Phase 1: Unseen, enforce both Type and Axis
            pickQuestionsFromPool(unseenBank, true);

            // Phase 2: Unseen, relax Axis, enforce Type only
            if (selectedQuestions.length < totalRequired) {
                pickQuestionsFromPool(unseenBank, false);
            }

            // Phase 3: Seen (Fallback), enforce both Type and Axis
            if (selectedQuestions.length < totalRequired) {
                pickQuestionsFromPool(seenBank, true);
            }

            // Phase 4: Seen, relax Axis, enforce Type only
            if (selectedQuestions.length < totalRequired) {
                pickQuestionsFromPool(seenBank, false);
            }

            // Phase 5: Absolute Emergency, fill with whatever is left (Ignore quotas)
            if (selectedQuestions.length < totalRequired) {
                const remainingUnseen = unseenBank.filter(q => !pickedIds.has(q.id));
                const remainingSeen = seenBank.filter(q => !pickedIds.has(q.id));
                const emergencyPool = [...remainingUnseen, ...remainingSeen];
                
                for (const q of emergencyPool) {
                    if (selectedQuestions.length >= totalRequired) break;
                    selectedQuestions.push(q);
                    pickedIds.add(q.id);
                }
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

            const safeQuestions = selectedQuestions.map(q => ({
                questionId: q.id,
                question: {
                    type: q.type,
                    imageUrl: q.imageUrl,
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
                type: sq.question.type,
                imageUrl: sq.question.imageUrl,
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
