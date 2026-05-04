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

            // 2. Fetch the question bank METADATA (Optimized Memory Usage)
            const questionBankMeta = await prisma.question.findMany({
                where: { 
                    professionId: session.professionId, 
                    isActive: true,
                    difficulty: "HARD" // Strictly HARD difficulty as requested
                },
                select: { id: true, type: true, axis: true, imageUrl: true }
            });

            const totalRequired = 30; // Hardcoded to 30 as requested

            // Read enabled question types from the profession itself
            const enabledTypes = ((session.profession as any).enabledQuestionTypes || "MCQ").split(",");
            const enableNewQuestions = enabledTypes.length > 1;

            const shuffleArray = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            // 3. Setup Dynamic Quotas
            let typeQuota: Record<string, number> = { MCQ: totalRequired, TRUE_FALSE: 0, IMAGE: 0, FILL_BLANK: 0 };
            if (enableNewQuestions) {
                const allowImg = enabledTypes.includes("IMAGE");
                const allowTf = enabledTypes.includes("TRUE_FALSE");
                const allowFb = enabledTypes.includes("FILL_BLANK");
                
                typeQuota.IMAGE = allowImg ? 3 : 0;
                typeQuota.TRUE_FALSE = allowTf ? 5 : 0;
                typeQuota.FILL_BLANK = allowFb ? 5 : 0;
                typeQuota.MCQ = totalRequired - typeQuota.IMAGE - typeQuota.TRUE_FALSE - typeQuota.FILL_BLANK;
            }

            // Define Axis Quotas
            const axisQuota: Record<string, number> = {
                HEALTH_SAFETY: 2,
                OCCUPATIONAL_SAFETY: 2,
                EMERGENCIES_FIRST_AID: 1,
                CORE: 25
            };
            
            const CORE_AXES = ["PROFESSION_KNOWLEDGE", "GENERAL_SKILLS", "CORRECT_METHODS", "PROFESSIONAL_BEHAVIOR", "TOOLS_AND_EQUIPMENT"];

            // Helper to determine the effective bucket of a question
            const getEffectiveType = (q: any) => {
                if (q.imageUrl && enableNewQuestions && enabledTypes.includes("IMAGE")) return "IMAGE";
                return q.type;
            };

            const getEffectiveAxis = (q: any) => {
                if (CORE_AXES.includes(q.axis)) return "CORE";
                if (["HEALTH_SAFETY", "OCCUPATIONAL_SAFETY", "EMERGENCIES_FIRST_AID"].includes(q.axis)) return q.axis;
                return "CORE"; // fallback any unrecognized to CORE
            };

            // 4. Separate and Filter Valid Questions
            let validQuestions = questionBankMeta.filter(q => {
                const eType = getEffectiveType(q);
                if (eType !== "MCQ" && eType !== "IMAGE" && !enabledTypes.includes(eType)) return false;
                if (eType === "IMAGE" && !enabledTypes.includes("IMAGE")) return false;
                return true;
            });

            // Separate unseen and seen
            let unseenBank = shuffleArray(validQuestions.filter(q => !seenQuestionIds.has(q.id)));
            let seenBank = shuffleArray(validQuestions.filter(q => seenQuestionIds.has(q.id)));

            const selectedIds = new Set<string>();

            // Picker Helper
            const pickQuestions = (pool: any[], enforceType: boolean, enforceAxis: boolean) => {
                for (const q of pool) {
                    if (selectedIds.has(q.id) || selectedIds.size >= totalRequired) continue;

                    const eType = getEffectiveType(q);
                    const eAxis = getEffectiveAxis(q);

                    const typeNeeded = typeQuota[eType] > 0;
                    const axisNeeded = axisQuota[eAxis] > 0;

                    const passType = enforceType ? typeNeeded : true;
                    const passAxis = enforceAxis ? axisNeeded : true;

                    if (passType && passAxis) {
                        selectedIds.add(q.id);
                        if (typeNeeded) typeQuota[eType]--;
                        if (axisNeeded) axisQuota[eAxis]--;
                    }
                }
            };

            // The selection phases as planned:
            
            // Phase 1: Unseen, strict (Type + Axis)
            pickQuestions(unseenBank, true, true);

            // Phase 2: Unseen, fallback missing special types to MCQ quota, enforce Axis
            if (selectedIds.size < totalRequired) {
                // convert missing types to MCQ
                const missingSpecials = typeQuota.IMAGE + typeQuota.TRUE_FALSE + typeQuota.FILL_BLANK;
                typeQuota.MCQ += missingSpecials;
                typeQuota.IMAGE = 0; typeQuota.TRUE_FALSE = 0; typeQuota.FILL_BLANK = 0;
                pickQuestions(unseenBank, true, true); 
            }

            // Phase 3: Unseen, relax Axis, enforce Type only
            if (selectedIds.size < totalRequired) {
                pickQuestions(unseenBank, true, false);
            }

            // Phase 4: Seen (Fallback), strict (Type + Axis)
            if (selectedIds.size < totalRequired) {
                pickQuestions(seenBank, true, true);
            }

            // Phase 5: Seen, relax Axis, enforce Type only
            if (selectedIds.size < totalRequired) {
                pickQuestions(seenBank, true, false);
            }

            // Phase 6: Emergency grab any unseen then seen
            if (selectedIds.size < totalRequired) {
                pickQuestions(unseenBank, false, false);
                pickQuestions(seenBank, false, false);
            }

            if (selectedIds.size === 0) {
                return NextResponse.json({ error: "Not enough questions in bank to generate exam" }, { status: 500 });
            }

            // 5. Fetch full data for the selected 30 IDs
            const selectedFullQuestions = await prisma.question.findMany({
                where: { id: { in: Array.from(selectedIds) } },
                include: { options: true }
            });

            let finalQuestions = shuffleArray(selectedFullQuestions);

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
                    data: finalQuestions.map(q => ({
                        sessionId: session.id,
                        questionId: q.id
                    }))
                })
            ];

            // Save relationship
            await prisma.$transaction(updates);

            const safeQuestions = finalQuestions.map(q => ({
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
