import { NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry, sleep } from "@/lib/ai-rate-limiter";

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

                const promptTemplate = `أنت خبير فني رفيع المستوى وممتحن معتمد في برنامج الاعتماد المهني السعودي (pacc.sa).
خبرتك تزيد عن 20 عاماً في مهنة "${professionName}".
مهمتك صياغة 4 أسئلة دقيقة (Single Best Answer) 
محصورة في المحور: [ ${axisLabelArabic} ]

${professionDescription ? `تنويــه: مقتطف عن المهنة من الإدارة: "${professionDescription}"` : ""}

═══════════════════════════════════════════
📊 مستوى الصعوبة المطلوب: 🔴 HARD — صعب

■ تعريف مستوى HARD:
  - سيناريو مهني واقعي يتطلب معرفة تقنية جيدة
  - الخيارات الخاطئة تبدو معقولة لغير المتخصص
  - يحتاج خبرة عملية لا تقل عن 3 سنوات
  - المستوى المعرفي: K2 (تطبيق + تحليل)

═══════════════════════════════════════════
⚠️ القواعد الحديدية — خالفها يعتبر فشلاً:
═══════════════════════════════════════════

🔴 القاعدة 1: حظر البديهيات المطلق
   - ممنوع أي سؤال يمكن لشخص عادي الإجابة عليه بالتخمين
   - ممنوع صياغة إجابة تبدو "مثالية" يسهل تخمينها
   - كل خيار يتضمن تفصيلة تقنية دقيقة

🔴 القاعدة 2: الخيارات الخاطئة (Distractors) الذكية
   - كل خيار خاطئ = ممارسة شائعة خاطئة يقع فيها المهنيون فعلاً
   - 4 خيارات متقاربة بالطول تماماً

🔴 القاعدة 3: السيناريو القصصي
   - كل سؤال يبدأ بسيناريو واقعي من بيئة العمل
   - يتضمن: مكان + مشكلة + ظروف محددة

🔴 القاعدة 4: الشرح التفصيلي الإلزامي
   - لماذا الإجابة الصحيحة صحيحة
   - لماذا كل خيار خاطئ هو خاطئ بالتحديد

📋 تنسيق الإخراج (JSON فقط):
[{
  "text": "السيناريو + السؤال",
  "explanation": "الشرح المهني التفصيلي",
  "difficulty": "HARD",
  "axis": "${axis}",
  "cognitiveLevel": "K2",
  "options": [
    { "text": "خيار 1", "isCorrect": false },
    { "text": "خيار 2", "isCorrect": true },
    { "text": "خيار 3", "isCorrect": false },
    { "text": "خيار 4", "isCorrect": false }
  ]
}]`;

                console.log(`[AI Gen] 🔄 Starting axis [${axis}] for profession "${professionName}"...`);

                const result = await callGeminiWithRetry({
                    apiKey: geminiKey,
                    model: "gemini-2.5-flash",
                    prompt: promptTemplate,
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
