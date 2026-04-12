import { NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callOpenAIWithRetry, sleep } from "@/lib/ai-rate-limiter";

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
                prompt: `Generate 32 structured professional questions for a ${profession.name} evenly across 8 axes (4 per axis).`,
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

// Background Processor — Saudi Professional Exam (SBA) Style - Batch Generation
async function triggerAIGenerationBg(jobId: string, professionName: string, professionDescription: string, professionId: string) {
    try {
        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) throw new Error("Missing OPENAI_API_KEY");

        const axes = [
            "HEALTH_SAFETY", "PROFESSION_KNOWLEDGE", "GENERAL_SKILLS",
            "OCCUPATIONAL_SAFETY", "CORRECT_METHODS", "PROFESSIONAL_BEHAVIOR",
            "TOOLS_AND_EQUIPMENT", "EMERGENCIES_FIRST_AID"
        ];
        
        let totalValidGenerated = 0;
        const failedAxes: string[] = [];
        const axisResults: string[] = [];

        // Simplify and decouple: We will request 4 questions per axis individually (8 requests).
        // This makes the payload extremely small and practically immune to timeouts or API payload limits.
        for (const axis of axes) {
            // Error isolation: each axis is independent
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

                const promptTemplate = `
أنت خبير فني رفيع المستوى وممتحن معتمد في "الفحص المهني السعودي" (pacc.sa).
مهمتك الآن هي صياغة 4 أسئلة دقيقة (Single Best Answer) لمهنة: "${professionName}" والمحصورة حصراً في هذا المحور التقني: [ ${axisLabelArabic} ].

${professionDescription ? `تنويــه: مقتطف عن المهنة من الإدارة: "${professionDescription}"` : ""}

═══════════════════════════════════════════════════════
⚠️ قواعد صياغة الأسئلة — خالفها يعتبر فشلاً ذريعاً:
═══════════════════════════════════════════════════════
🔴 القاعدة 1: حظر البديهيات والإجابة النموذجية الكاذبة
   - الإجابات يجب أن تكون سيناريوهات مهنية وعملية دقيقة تتضمن: أسماء أدوات محددة، خطوات عمل قياسية، علامات الخطر، أو تفاصيل المواد.
   - ممنوع صياغة إجابات تبدو "مثالية" يسهل تخمينها.

🔴 القاعدة 2: الخيارات الخاطئة (Distractors)
   - جميع الخيارات الخاطئة يجب أن تبدو صحيحة لمن ليس خبيراً وتكون ممارسات شائعة خاطئة في سوق العمل الفعلي.
   - 4 خيارات متقاربة بالطول تماماً (واحد فقط صحيح).

🔴 القاعدة 3: السيناريوهات والصعوبة (90% HARD)
   - صغ 3 أسئلة بصعوبة HARD (تحدي تقني صعب للممارس البارع) وسؤال 1 MEDIUM.
   - يجب أن يبدأ السيناريو بمشكلة أو حالة دقيقة محصورة بـ [ ${axisLabelArabic} ].

📋 تنسيق الإخراج النهائي (JSON ONLY):
أخرج البيانات كمصفوفة JSON صالحة مكونة من 4 عناصر فقط.
[{
  "text": "السؤال هنا",
  "explanation": "الشرح المهني هنا",
  "difficulty": "HARD",
  "axis": "${axis}",
  "cognitiveLevel": "K2",
  "options": [
    { "text": "خيار صحيح", "isCorrect": true },
    { "text": "خيار خاطئ", "isCorrect": false },
    { "text": "خيار خاطئ", "isCorrect": false },
    { "text": "خيار خاطئ", "isCorrect": false }
  ]
}]
`;

                console.log(`[AI Gen] 🔄 Starting axis [${axis}] for profession "${professionName}"...`);

                const result = await callOpenAIWithRetry({
                    apiKey: openAiKey,
                    model: "gpt-4o-mini",
                    prompt: "You are a specialized JSON data generator for Saudi professional certification exams. Output ONLY a valid JSON array.\n\n" + promptTemplate,
                    maxRetries: 5,
                    baseDelayMs: 10000,
                    timeoutMs: 60000,
                });

                if (!result.success) {
                    console.error(`[AI Gen] ❌ Axis [${axis}] failed after ${result.attempts} attempts: ${result.lastError}`);
                    failedAxes.push(`${axis} (AI: ${result.lastError})`);
                    axisResults.push(`${axis}: FAILED (AI)`);
                    continue;
                }

                if (result.attempts > 1) {
                    console.log(`[AI Gen] ✅ Axis [${axis}] succeeded after ${result.attempts} attempts`);
                } else {
                    console.log(`[AI Gen] ✅ Axis [${axis}] succeeded on first attempt`);
                }

                // Smart JSON Extraction to bypass any conversational text before or after the JSON array
                let finalContent = result.content;
                const jsonStart = finalContent.indexOf('[');
                const jsonEnd = finalContent.lastIndexOf(']');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    finalContent = finalContent.substring(jsonStart, jsonEnd + 1);
                }

                let generatedQuestions: any[] = [];
                try {
                    generatedQuestions = JSON.parse(finalContent);
                } catch (e) {
                    console.error(`[AI Gen] ❌ JSON parse failed for axis [${axis}]`);
                    console.error("[AI Gen] Raw content:", finalContent.substring(0, 200) + "...");
                    failedAxes.push(`${axis} (JSON parse error)`);
                    axisResults.push(`${axis}: FAILED (JSON)`);
                    continue;
                }

                // Save questions sequentially to avoid overwhelming DB connection pool
                let axisQuestionCount = 0;
                for (const q of generatedQuestions) {
                    if (q.text && q.options && q.options.length === 4) {
                        const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                        if (correctCount === 1) {
                            try {
                                await prisma.question.create({
                                    data: {
                                        professionId,
                                        text: q.text,
                                        explanation: q.explanation,
                                        difficulty: q.difficulty || "HARD",
                                        cognitiveLevel: q.cognitiveLevel || "K2",
                                        axis: axis as any,
                                        options: {
                                            create: q.options.map((opt: any) => ({
                                                text: opt.text,
                                                isCorrect: opt.isCorrect
                                            }))
                                        }
                                    }
                                });
                                totalValidGenerated++;
                                axisQuestionCount++;
                            } catch (dbError: any) {
                                console.error(`[AI Gen] ⚠️ DB error saving question for axis [${axis}]:`, dbError.message);
                            }
                        }
                    }
                }

                axisResults.push(`${axis}: OK (${axisQuestionCount} questions)`);

                // Extremely important: Update Job Progress in Database so frontend can poll it
                try {
                    await prisma.aIGenerationJob.update({
                        where: { id: jobId },
                        data: { questionsGenerated: totalValidGenerated }
                    });
                } catch (dbError: any) {
                    console.error(`[AI Gen] ⚠️ Failed to update job progress:`, dbError.message);
                }
                
                // Wait between axes to prevent 429 rate limiting from Google
                await sleep(8000, 2000);

            } catch (axisError: any) {
                console.error(`[AI Gen] ❌ Unexpected error on axis [${axis}]:`, axisError.message);
                failedAxes.push(`${axis} (Unexpected: ${axisError.message})`);
                axisResults.push(`${axis}: FAILED (Error)`);
                continue;
            }
        }

        // Build summary log
        const summaryLog = failedAxes.length > 0
            ? `Completed with ${failedAxes.length} failed axis(es): ${failedAxes.join(", ")}. Results: ${axisResults.join(" | ")}`
            : null;

        console.log(`[AI Gen] 🏁 Generation complete: ${totalValidGenerated}/32 questions. Failed axes: ${failedAxes.length}`);
        if (summaryLog) console.warn(`[AI Gen] ⚠️ ${summaryLog}`);

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
            console.error("[AI Gen] ❌ Could not update job status to FAILED:", dbError.message);
        }
    }
}
