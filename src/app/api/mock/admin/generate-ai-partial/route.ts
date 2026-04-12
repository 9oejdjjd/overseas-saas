import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callOpenAIWithRetry } from "@/lib/ai-rate-limiter";

export const maxDuration = 60; // Max API duration for Vercel

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId, axis, count } = body;

        if (!professionId || !axis || !count || count < 1 || count > 20) {
            return NextResponse.json({ error: "Invalid parameters. Required: professionId, axis, count (1-20)" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({ where: { id: professionId } });
        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) {
            return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
        }

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
            default: return NextResponse.json({ error: "Invalid axis" }, { status: 400 });
        }

        const promptTemplate = `
أنت خبير فني رفيع المستوى وممتحن معتمد في "الفحص المهني السعودي" (pacc.sa).
مهمتك الآن هي صياغة ${count} أسئلة دقيقة (Single Best Answer) لمهنة: "${profession.name}" والمحصورة حصراً في هذا المحور التقني: [ ${axisLabelArabic} ].

${profession.description ? `تنويــه: مقتطف عن المهنة من الإدارة: "${profession.description}"` : ""}

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
   - صغ الأسئلة بصعوبة HARD (تحدي تقني صعب للممارس البارع).
   - يجب أن يبدأ السيناريو بمشكلة أو حالة دقيقة محصورة بـ [ ${axisLabelArabic} ].

📋 تنسيق الإخراج النهائي (JSON ONLY):
أخرج البيانات كمصفوفة JSON صالحة مكونة من ${count} عناصر فقط.
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

        console.log(`[AI Gen Partial] 🔄 Generating ${count} questions for axis [${axis}] - profession: "${profession.name}"`);

        const result = await callOpenAIWithRetry({
            apiKey: openAiKey,
            model: "gpt-4o-mini",
            prompt: "You are a specialized JSON data generator for Saudi professional certification exams. Output ONLY a valid JSON array.\n\n" + promptTemplate,
            maxRetries: 3,         // Faster failure, lighter limit
            baseDelayMs: 3000,     // Only 3 seconds base wait for retries
            timeoutMs: 45000,
        });

        if (!result.success) {
            console.error(`[AI Gen Partial] ❌ Failed after ${result.attempts} attempts: ${result.lastError}`);
            return NextResponse.json({ error: `AI Generation failed: ${result.lastError}` }, { status: 502 });
        }

        console.log(`[AI Gen Partial] ✅ Succeeded in ${result.attempts} attempts`);

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
            console.error(`[AI Gen Partial] ❌ JSON parse failed`);
            return NextResponse.json({ error: "AI returned invalid JSON format" }, { status: 502 });
        }

        // Save questions sequentially
        let savedCount = 0;
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
                        savedCount++;
                    } catch (dbError: any) {
                        console.error(`[AI Gen Partial] ⚠️ DB error saving question:`, dbError.message);
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `تم توليد و حفظ ${savedCount} سؤال بنجاح لمحور ${axisLabelArabic}`,
            savedCount 
        });

    } catch (error: any) {
        console.error("AI Partial Gen Error:", error);
        return NextResponse.json({ error: error.message || "Failed to trigger AI generation" }, { status: 500 });
    }
}
