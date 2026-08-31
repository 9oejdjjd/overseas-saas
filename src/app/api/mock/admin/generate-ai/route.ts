import { NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry, sleep } from "@/lib/ai-rate-limiter";
import { buildTextQuestionPrompt, buildRefinerPrompt } from "@/lib/mock-exams/promptBuilder";
import { batchProcessQuestions, evaluateQuestionPostProcessing, GeneratedQuestionPayload } from "@/lib/mock-exams/postProcessing";

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId } = body;

        if (!professionId) {
            return NextResponse.json({ error: "professionId is required" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({ where: { id: professionId } });
        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        const job = await prisma.aIGenerationJob.create({
            data: {
                professionId,
                questionsRequested: 32,
                status: "PROCESSING",
                prompt: `Generate 32 high-standard professional questions for ${profession.name} evenly across 8 axes (4 per axis).`,
            }
        });

        // Trigger asynchronous generation so we don't block the request timeout
        after(async () => {
            await triggerAIGenerationBg(job.id, profession.name, profession.description || "", profession.id);
        });

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error) {
        console.error("AI Gen Trigger Error:", error);
        return NextResponse.json({ error: "Failed to trigger AI generation" }, { status: 500 });
    }
}

// Background Processor — Saudi Professional Exam (pacc.sa) Style - Batch Generation
async function triggerAIGenerationBg(jobId: string, professionName: string, professionDescription: string, professionId: string) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

        const axes = [
            "HEALTH_SAFETY", "PROFESSION_KNOWLEDGE", "GENERAL_SKILLS",
            "OCCUPATIONAL_SAFETY", "CORRECT_METHODS", "PROFESSIONAL_BEHAVIOR",
            "TOOLS_AND_EQUIPMENT", "EMERGENCIES_FIRST_AID"
        ];
        
        let totalValidGenerated = 0;
        const failedAxes: string[] = [];
        const axisResults: string[] = [];

        for (const axis of axes) {
            try {
                let axisLabelArabic = "";
                switch(axis) {
                    case "HEALTH_SAFETY": axisLabelArabic = "الصحة والسلامة في بيئة العمل"; break;
                    case "PROFESSION_KNOWLEDGE": axisLabelArabic = "المعرفة المهنية التخصصية"; break;
                    case "GENERAL_SKILLS": axisLabelArabic = "المهارات العامة وجودة التنفيذ"; break;
                    case "OCCUPATIONAL_SAFETY": axisLabelArabic = "السلامة المهنية والمخاطر المباشرة"; break;
                    case "CORRECT_METHODS": axisLabelArabic = "الأساليب الصحيحة والقياسية للمهنة"; break;
                    case "PROFESSIONAL_BEHAVIOR": axisLabelArabic = "السلوك الوظيفي والانضباط المهني"; break;
                    case "TOOLS_AND_EQUIPMENT": axisLabelArabic = "استخدام الأدوات والمعدات وتشخيصها"; break;
                    case "EMERGENCIES_FIRST_AID": axisLabelArabic = "الطوارئ والإسعافات الأولية"; break;
                }

                const promptTemplate = buildTextQuestionPrompt({
                    profName: professionName,
                    axisLabel: axisLabelArabic,
                    axis: axis,
                    questionType: ["MCQ"],
                    difficulty: ["HARD", "EXPERT"],
                    focusTopic: professionDescription ? `معلومات إضافية عن المهنة: ${professionDescription}` : "",
                    questionCount: 4,
                    questionStyle: "MIXED",
                    forceImages: false
                });

                console.log(`[AI Gen Batch] 🔄 Starting axis [${axis}] for profession "${professionName}"...`);

                const result = await callGeminiWithRetry({
                    apiKey: geminiKey,
                    model: "gemini-2.5-flash",
                    prompt: promptTemplate,
                    maxRetries: 4,
                    baseDelayMs: 6000,
                    timeoutMs: 60000,
                    temperature: 0.7
                });

                if (!result.success) {
                    console.error(`[AI Gen Batch] ❌ Axis [${axis}] failed after ${result.attempts} attempts: ${result.lastError}`);
                    failedAxes.push(`${axis} (AI: ${result.lastError})`);
                    axisResults.push(`${axis}: FAILED (AI)`);
                    continue;
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
                    console.error(`[AI Gen Batch] ❌ JSON parse failed for axis [${axis}]`);
                    failedAxes.push(`${axis} (JSON parse error)`);
                    axisResults.push(`${axis}: FAILED (JSON)`);
                    continue;
                }

                // Post-Processing & Refinement
                const batchReport = batchProcessQuestions(generatedQuestions, "MCQ");
                const approvedQuestions: GeneratedQuestionPayload[] = [...batchReport.validQuestions];

                if (batchReport.questionsNeedingRefinement.length > 0) {
                    console.log(`[AI Gen Batch] 🛠️ Refining ${batchReport.questionsNeedingRefinement.length} questions for axis [${axis}]...`);
                    const refinerPrompt = buildRefinerPrompt({
                        profName: professionName,
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
                        temperature: 0.2
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
                                const check = evaluateQuestionPostProcessing(rq, "MCQ");
                                if (check.isValid || check.canAutoFix) {
                                    approvedQuestions.push(check.cleanedQuestion);
                                }
                            }
                        } catch (e) {}
                    }
                }

                // Save approved questions sequentially
                let axisQuestionCount = 0;
                for (const q of approvedQuestions) {
                    if (q.text && q.options && q.options.length === 4) {
                        const correctCount = q.options.filter(o => o.isCorrect).length;
                        if (correctCount === 1) {
                            try {
                                const returnedCog = q.cognitiveLevel || "K2";
                                const finalDifficulty = (returnedCog === "K3" || q.difficulty === "EXPERT") ? "EXPERT" : "HARD";
                                const finalCognitiveLevel = ["K1", "K2", "K3", "K4", "K5"].includes(returnedCog) ? returnedCog : "K2";

                                await prisma.question.create({
                                    data: {
                                        professionId,
                                        text: q.text,
                                        explanation: q.explanation || null,
                                        difficulty: finalDifficulty as any,
                                        cognitiveLevel: finalCognitiveLevel,
                                        axis: axis as any,
                                        type: "MCQ",
                                        questionStyle: q.questionStyle || "SCENARIO_SHORT",
                                        options: {
                                            create: q.options.map(opt => ({
                                                text: opt.text,
                                                isCorrect: opt.isCorrect
                                            }))
                                        }
                                    }
                                });
                                totalValidGenerated++;
                                axisQuestionCount++;
                            } catch (dbError: any) {
                                console.error(`[AI Gen Batch] ⚠️ DB error saving question for axis [${axis}]:`, dbError.message);
                            }
                        }
                    }
                }

                axisResults.push(`${axis}: OK (${axisQuestionCount} questions)`);

                // Update Job Progress in Database
                try {
                    await prisma.aIGenerationJob.update({
                        where: { id: jobId },
                        data: { questionsGenerated: totalValidGenerated }
                    });
                } catch (dbError: any) {
                    console.error(`[AI Gen Batch] ⚠️ Failed to update job progress:`, dbError.message);
                }
                
                // Rate limiting pause
                await sleep(5000, 2000);

            } catch (axisError: any) {
                console.error(`[AI Gen Batch] ❌ Unexpected error on axis [${axis}]:`, axisError.message);
                failedAxes.push(`${axis} (Unexpected: ${axisError.message})`);
                axisResults.push(`${axis}: FAILED (Error)`);
                continue;
            }
        }

        // Summary log
        const summaryLog = failedAxes.length > 0
            ? `Completed with ${failedAxes.length} failed axis(es): ${failedAxes.join(", ")}. Results: ${axisResults.join(" | ")}`
            : null;

        console.log(`[AI Gen Batch] 🏁 Batch complete: ${totalValidGenerated}/32 questions. Failed axes: ${failedAxes.length}`);
        if (summaryLog) console.warn(`[AI Gen Batch] ⚠️ ${summaryLog}`);

        await prisma.aIGenerationJob.update({
            where: { id: jobId },
            data: {
                status: "COMPLETED",
                questionsGenerated: totalValidGenerated,
                questionsRequested: 32,
                errorLog: summaryLog,
            }
        });

    } catch (error: any) {
        console.error("AI BG Task Failed:", error);
        try {
            await prisma.aIGenerationJob.update({
                where: { id: jobId },
                data: { status: "FAILED", errorLog: error.message }
            });
        } catch (dbError: any) {
            console.error("[AI Gen Batch] ❌ Could not update job status to FAILED:", dbError.message);
        }
    }
}
