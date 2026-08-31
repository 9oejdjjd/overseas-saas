import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry } from "@/lib/ai-rate-limiter";
import { buildPrompt, buildRefinerPrompt } from "@/lib/mock-exams/promptBuilder";
import { batchProcessQuestions, evaluateQuestionPostProcessing, GeneratedQuestionPayload } from "@/lib/mock-exams/postProcessing";

export const maxDuration = 60; // Max API duration for Vercel

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { 
            professionId, 
            axis, 
            count, 
            difficulties = ["HARD"], 
            questionTypes = ["MCQ"], 
            focusTopic = "",
            questionStyle = "MIXED",
            forceImages = false
        } = body;

        if (!professionId || !axis || !count || count < 1 || count > 30) {
            return NextResponse.json({ error: "Invalid parameters. Required: professionId, axis, count (1-30)" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({ where: { id: professionId } });
        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const axisLabelArabic = axis;
        const targetType = questionTypes[0] || "MCQ";

        // ══════════════════════════════════════════════════════════
        // المرحلة 1: التوليد الأولي (Stage 1: Primary Generation)
        // ══════════════════════════════════════════════════════════
        const promptTemplate = buildPrompt({
            profName: profession.name,
            axisLabel: axisLabelArabic,
            axis,
            questionType: questionTypes,
            difficulty: difficulties,
            focusTopic,
            questionCount: count,
            questionStyle,
            forceImages
        });

        console.log(`[AI Gen Hybrid] 🔄 Stage 1: Generating ${count} questions for [${axis}] - ${profession.name}`);

        const result = await callGeminiWithRetry({
            apiKey: geminiKey,
            model: "gemini-2.5-flash",
            prompt: promptTemplate,
            maxRetries: 3,
            baseDelayMs: 3000,
            timeoutMs: 45000,
            temperature: 0.7
        });

        if (!result.success) {
            console.error(`[AI Gen Hybrid] ❌ Stage 1 failed after ${result.attempts} attempts: ${result.lastError}`);
            return NextResponse.json({ error: `AI Generation failed: ${result.lastError}` }, { status: 502 });
        }

        let finalContent = result.content;
        const jsonStart = finalContent.indexOf('[');
        const jsonEnd = finalContent.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            finalContent = finalContent.substring(jsonStart, jsonEnd + 1);
        }

        let generatedQuestions: GeneratedQuestionPayload[] = [];
        try {
            generatedQuestions = JSON.parse(finalContent);
        } catch (e) {
            console.error(`[AI Gen Hybrid] ❌ Stage 1 JSON parse failed`);
            return NextResponse.json({ error: "AI returned invalid JSON format" }, { status: 502 });
        }

        // ══════════════════════════════════════════════════════════
        // المرحلة 2: التدقيق البرمجي الأولي (Stage 2: Post-Processing)
        // ══════════════════════════════════════════════════════════
        const batchReport = batchProcessQuestions(generatedQuestions, targetType);
        const approvedQuestions: GeneratedQuestionPayload[] = [...batchReport.validQuestions];

        console.log(`[AI Gen Hybrid] 📊 Post-Processing: ${batchReport.validQuestions.length} passed directly, ${batchReport.questionsNeedingRefinement.length} need AI refinement.`);

        // ══════════════════════════════════════════════════════════
        // المرحلة 3: منقح الذكاء الاصطناعي (Stage 3: AI Refiner for failed items)
        // ══════════════════════════════════════════════════════════
        let refinedCount = 0;
        if (batchReport.questionsNeedingRefinement.length > 0) {
            console.log(`[AI Gen Hybrid] 🛠️ Triggering AI Refiner for ${batchReport.questionsNeedingRefinement.length} questions...`);

            const refinerPrompt = buildRefinerPrompt({
                profName: profession.name,
                axisLabel: axisLabelArabic,
                questionsToRefine: batchReport.questionsNeedingRefinement
            });

            const refinerResult = await callGeminiWithRetry({
                apiKey: geminiKey,
                model: "gemini-2.5-flash",
                prompt: refinerPrompt,
                maxRetries: 2,
                baseDelayMs: 2000,
                timeoutMs: 35000,
                temperature: 0.2 // درجة حرارة منخفضة جداً للالتزام الصارم بالإصلاح
            });

            if (refinerResult.success) {
                let refinerJson = refinerResult.content;
                const refStart = refinerJson.indexOf('[');
                const refEnd = refinerJson.lastIndexOf(']');
                if (refStart !== -1 && refEnd !== -1) {
                    refinerJson = refinerJson.substring(refStart, refEnd + 1);
                }

                try {
                    const refinedBatch: GeneratedQuestionPayload[] = JSON.parse(refinerJson);
                    for (const rq of refinedBatch) {
                        const check = evaluateQuestionPostProcessing(rq, targetType);
                        if (check.isValid) {
                            approvedQuestions.push(check.cleanedQuestion);
                            refinedCount++;
                        } else if (check.canAutoFix) {
                            approvedQuestions.push(check.cleanedQuestion);
                            refinedCount++;
                        } else {
                            console.warn(`[AI Gen Hybrid] ⚠️ Refined question still failed: ${check.reasons.join(", ")}`);
                        }
                    }
                } catch (refParseError) {
                    console.error("[AI Gen Hybrid] ⚠️ Failed to parse AI Refiner output, falling back to cleanable original questions.");
                }
            } else {
                console.warn("[AI Gen Hybrid] ⚠️ AI Refiner call failed, continuing with passing questions.");
            }
        }

        // ══════════════════════════════════════════════════════════
        // المرحلة 4: الحفظ في قاعدة البيانات (Stage 4: Database Persistence)
        // ══════════════════════════════════════════════════════════
        let savedCount = 0;

        for (const q of approvedQuestions) {
            const currentQType = q.type || targetType || "MCQ";
            const expectedOptionsLength = currentQType === "TRUE_FALSE" ? 2 : 4;

            if (q.text && q.options && q.options.length === expectedOptionsLength) {
                const correctCount = q.options.filter(o => o.isCorrect).length;
                if (correctCount === 1) {
                    try {
                        const returnedDiff = q.difficulty || difficulties[0] || "HARD";
                        const returnedCog = q.cognitiveLevel || "K2";
                        
                        // صعوبة قاعدة البيانات: EXPERT لـ K3 أو EXPERT، و HARD للباقي
                        const finalDifficulty = (returnedCog === "K3" || returnedDiff === "EXPERT") ? "EXPERT" : "HARD";
                        
                        // المستوى المعرفي الدقيق: K1, K2, K3, K4, K5
                        const finalCognitiveLevel = ["K1", "K2", "K3", "K4", "K5"].includes(returnedCog)
                            ? returnedCog
                            : "K2";
                        
                        const finalStyle = q.questionStyle || questionStyle || "SCENARIO";

                        await prisma.question.create({
                            data: {
                                professionId,
                                text: q.text,
                                explanation: q.explanation || null,
                                difficulty: finalDifficulty as any,
                                cognitiveLevel: finalCognitiveLevel,
                                axis: axis as any,
                                type: currentQType as any,
                                questionStyle: finalStyle,
                                imageUrl: q.imageUrl || null,
                                options: {
                                    create: q.options.map(opt => ({
                                        text: opt.text,
                                        isCorrect: opt.isCorrect
                                    }))
                                }
                            }
                        });
                        savedCount++;
                    } catch (dbError: any) {
                        console.error(`[AI Gen Hybrid] ⚠️ DB error saving question:`, dbError.message);
                    }
                }
            }
        }

        console.log(`[AI Gen Hybrid] ✅ Completed: ${savedCount} questions saved successfully (Direct: ${batchReport.validQuestions.length}, Refined: ${refinedCount})`);

        return NextResponse.json({ 
            success: true, 
            message: `تم توليد وتدقيق وحفظ ${savedCount} سؤال بنجاح لمحور ${axisLabelArabic}`,
            savedCount,
            stats: {
                totalGenerated: generatedQuestions.length,
                passedDirectly: batchReport.validQuestions.length,
                refinedCount,
                savedCount
            }
        });

    } catch (error: any) {
        console.error("AI Hybrid Gen Error:", error);
        return NextResponse.json({ error: error.message || "Failed to trigger AI generation" }, { status: 500 });
    }
}
