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
                    difficulty: { in: ["HARD", "EXPERT"] }
                },
                select: { id: true, type: true, axis: true, imageUrl: true, cognitiveLevel: true, difficulty: true, createdAt: true }
            });

            const totalRequired = session.profession.questionCount || 30;
            const algorithmConfig = (session.profession as any).algorithmConfig;

            let typeQuota: Record<string, number> = { MCQ: totalRequired, TRUE_FALSE: 0, IMAGE: 0, FILL_BLANK: 0 };
            let axisQuota: Record<string, number> = {};
            let isCustomAlgorithm = false;
            
            const enabledTypes = ((session.profession as any).enabledQuestionTypes || "MCQ").split(",");
            const enableNewQuestions = enabledTypes.length > 1;

            if (algorithmConfig && algorithmConfig.typeQuota && algorithmConfig.axes) {
                isCustomAlgorithm = true;
                typeQuota = { ...algorithmConfig.typeQuota };
                for (const a of algorithmConfig.axes) {
                    axisQuota[a.name] = a.quota;
                }
            } else {
                // Fallback to original hardcoded logic
                if (enableNewQuestions) {
                    const allowImg = enabledTypes.includes("IMAGE");
                    const allowTf = enabledTypes.includes("TRUE_FALSE");
                    const allowFb = enabledTypes.includes("FILL_BLANK");
                    
                    typeQuota.IMAGE = allowImg ? 3 : 0;
                    typeQuota.TRUE_FALSE = allowTf ? 5 : 0;
                    typeQuota.FILL_BLANK = allowFb ? 5 : 0;
                    typeQuota.MCQ = totalRequired - typeQuota.IMAGE - typeQuota.TRUE_FALSE - typeQuota.FILL_BLANK;
                }
                axisQuota = {
                    HEALTH_SAFETY: 2,
                    OCCUPATIONAL_SAFETY: 2,
                    EMERGENCIES_FIRST_AID: 1,
                    CORE: 25
                };
            }

            const CORE_AXES = ["PROFESSION_KNOWLEDGE", "GENERAL_SKILLS", "CORRECT_METHODS", "PROFESSIONAL_BEHAVIOR", "TOOLS_AND_EQUIPMENT"];
            
            const OLD_ENUM_MAP: Record<string, string> = {
                "HEALTH_SAFETY": "الصحة والسلامة",
                "PROFESSION_KNOWLEDGE": "المعرفة المهنية",
                "GENERAL_SKILLS": "المهارات العامة",
                "OCCUPATIONAL_SAFETY": "السلامة المهنية",
                "CORRECT_METHODS": "الأساليب القياسية",
                "PROFESSIONAL_BEHAVIOR": "السلوك الوظيفي",
                "TOOLS_AND_EQUIPMENT": "استخدام الأدوات",
                "EMERGENCIES_FIRST_AID": "الطوارئ والإسعافات"
            };

            const shuffleArray = (array: any[]) => {
                const randomNoiseMax = 1000 * 60 * 60 * 24 * 30; // 30 days in ms
                return [...array]
                    .map(item => {
                        const timeWeight = item.createdAt ? new Date(item.createdAt).getTime() : 0;
                        const randomizedWeight = timeWeight + (Math.random() * randomNoiseMax);
                        return { item, weight: randomizedWeight };
                    })
                    .sort((a, b) => b.weight - a.weight) 
                    .map(a => a.item);
            };

            // Helper to determine the effective bucket of a question
            const getEffectiveType = (q: any) => {
                if (isCustomAlgorithm) {
                     if (q.imageUrl && (typeQuota["IMAGE"] || 0) > 0 && q.type === "MCQ") return "IMAGE";
                     return q.type;
                } else {
                     if (q.imageUrl && enableNewQuestions && enabledTypes.includes("IMAGE")) return "IMAGE";
                     return q.type;
                }
            };

            const getEffectiveAxis = (q: any) => {
                if (isCustomAlgorithm) {
                    let qAxisName = q.axis;
                    if (OLD_ENUM_MAP[q.axis]) {
                        const mapped = OLD_ENUM_MAP[q.axis];
                        const matchedCustom = Object.keys(axisQuota).find(c => c.includes(mapped) || mapped.includes(c));
                        if (matchedCustom) return matchedCustom;
                    }
                    const directMatch = Object.keys(axisQuota).find(c => c.trim() === qAxisName.trim());
                    if (directMatch) return directMatch;
                    
                    return qAxisName;
                } else {
                    if (CORE_AXES.includes(q.axis)) return "CORE";
                    if (["HEALTH_SAFETY", "OCCUPATIONAL_SAFETY", "EMERGENCIES_FIRST_AID"].includes(q.axis)) return q.axis;
                    return "CORE"; 
                }
            };

            const getEffectiveCognitive = (q: any) => {
                return (q.cognitiveLevel === "K3" || q.difficulty === "EXPERT") ? "K3" : "K2";
            };

            // 4. Filter Valid Questions (Remove completely disabled types)
            let validQuestions = questionBankMeta.filter(q => {
                const eType = getEffectiveType(q);
                if (isCustomAlgorithm) {
                    if (eType !== "MCQ" && eType !== "IMAGE" && eType !== "TRUE_FALSE" && eType !== "FILL_BLANK") return false;
                    return true;
                } else {
                    if (eType !== "MCQ" && eType !== "IMAGE" && !enabledTypes.includes(eType)) return false;
                    if (eType === "IMAGE" && !enabledTypes.includes("IMAGE")) return false;
                    return true;
                }
            });

            // Set 50% K3 and 50% K2 Quota
            const targetK3 = Math.ceil(totalRequired * 0.5);
            let kQuota: Record<string, number> = {
                K3: targetK3,
                K2: totalRequired - targetK3
            };

            // 5. The Smart Bucket-Based Iterative Picker
            const shuffledBank = shuffleArray(validQuestions);
            const selectedIds = new Set<string>();

            const pickOne = (allowSeen: boolean, matchAxis: boolean, matchType: boolean, matchK: boolean) => {
                for (const q of shuffledBank) {
                    if (selectedIds.has(q.id)) continue;
                    if (!allowSeen && seenQuestionIds.has(q.id)) continue;

                    const eType = getEffectiveType(q);
                    const eAxis = getEffectiveAxis(q);
                    const eK = getEffectiveCognitive(q);

                    if (matchAxis && (axisQuota[eAxis] || 0) <= 0) continue;
                    if (matchType && (typeQuota[eType] || 0) <= 0) continue;
                    if (matchK && (kQuota[eK] || 0) <= 0) continue;

                    selectedIds.add(q.id);
                    if (axisQuota[eAxis] !== undefined) axisQuota[eAxis]--;
                    if (typeQuota[eType] !== undefined) typeQuota[eType]--;
                    if (kQuota[eK] !== undefined) kQuota[eK]--;
                    return true;
                }
                return false;
            };

            // Iterative greedy resolution to fill totalRequired exactly
            while (selectedIds.size < totalRequired) {
                // Tier 1: Perfect Match (Unseen, Exact Axis, Exact Type, Exact K)
                if (pickOne(false, true, true, true)) continue;
                
                // Tier 2: Sacrifice Cognitive K (Unseen, Exact Axis, Exact Type) -> Absorbs K3 deficit into K2
                if (pickOne(false, true, true, false)) continue;
                
                // Tier 3: Sacrifice Unseen (Allow Seen, Exact Axis, Exact Type, Exact K) -> Repetition is better than wrong Axis
                if (pickOne(true, true, true, true)) continue;
                
                // Tier 4: Sacrifice Unseen + K (Allow Seen, Exact Axis, Exact Type)
                if (pickOne(true, true, true, false)) continue;
                
                // Tier 5: Sacrifice Type (Unseen, Exact Axis, Exact K) -> Wrong Type is better than wrong Axis
                if (pickOne(false, true, false, true)) continue;
                
                // Tier 6: Sacrifice Type + K (Unseen, Exact Axis)
                if (pickOne(false, true, false, false)) continue;
                
                // Tier 7: Sacrifice Type + Unseen (Allow Seen, Exact Axis, Exact K)
                if (pickOne(true, true, false, true)) continue;
                
                // Tier 8: Sacrifice Type + Unseen + K (Allow Seen, Exact Axis)
                if (pickOne(true, true, false, false)) continue;
                
                // Tier 9: Sacrifice Axis (Emergency! Unseen, Any Axis, Exact Type, Exact K)
                if (pickOne(false, false, true, true)) continue;
                
                // Tier 10: Sacrifice Axis + K
                if (pickOne(false, false, true, false)) continue;
                
                // Tier 11: Sacrifice Axis + Unseen
                if (pickOne(true, false, true, true)) continue;
                
                // Tier 12: Sacrifice Axis + Unseen + K
                if (pickOne(true, false, true, false)) continue;
                
                // Tier 13: Desperation (Unseen Anything)
                if (pickOne(false, false, false, false)) continue;
                
                // Tier 14: Total Desperation (Seen Anything)
                if (pickOne(true, false, false, false)) continue;

                // If we reach here, the question bank is literally completely exhausted
                break;
            }

            if (selectedIds.size === 0) {
                return NextResponse.json({ error: "لا يوجد عدد كافي من الأسئلة في بنك الأسئلة لتوليد الاختبار" }, { status: 500 });
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
