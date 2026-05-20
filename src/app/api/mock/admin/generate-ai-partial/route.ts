import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry } from "@/lib/ai-rate-limiter";

export const maxDuration = 60; // Max API duration for Vercel

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId, axis, count, difficulty = "HARD", questionType = "MCQ", focusTopic = "" } = body;

        if (!professionId || !axis || !count || count < 1 || count > 20) {
            return NextResponse.json({ error: "Invalid parameters. Required: professionId, axis, count (1-20)" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({ where: { id: professionId } });
        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        let axisLabelArabic = axis; // Axis is now a dynamic string directly sent from UI

        let optionsTemplate = "";
        let typeInstruction = "";

        if (questionType === "TRUE_FALSE") {
            typeInstruction = `
🔴 نوع السؤال: صح أو خطأ (True/False)
   - العبارة يجب أن تكون حقيقة مهنية دقيقة، ممارسة، أو خطوة فنية، ويجب أن تكون إما صحيحة تماماً أو خاطئة لسبب فني محدد.
   - خيارين فقط: "صح" و "خطأ".`;
            optionsTemplate = `
    { "text": "صح", "isCorrect": true },
    { "text": "خطأ", "isCorrect": false }`;
        } else if (questionType === "FILL_BLANK") {
            typeInstruction = `
🔴 نوع السؤال: إكمال فراغ (Fill in the Blank)
   - السيناريو يجب أن يحتوي على فراغ واحد يعبر عن مصطلح فني، أداة، أو معيار قياسي. استخدم "_____" لتمثيل الفراغ.
   - الخيارات يجب أن تكون كلمات مفردة أو مصطلحات قصيرة جداً متقاربة في الشكل أو المعنى.
   - 4 خيارات (واحد فقط صحيح).`;
            optionsTemplate = `
    { "text": "المصطلح 1", "isCorrect": false },
    { "text": "المصطلح الصحيح", "isCorrect": true },
    { "text": "المصطلح 3", "isCorrect": false },
    { "text": "المصطلح 4", "isCorrect": false }`;
        } else {
            typeInstruction = `
🔴 نوع السؤال: اختيار من متعدد (MCQ)
   - 4 خيارات متقاربة بالطول تماماً (واحد فقط صحيح).`;
            optionsTemplate = `
    { "text": "خيار 1", "isCorrect": false },
    { "text": "خيار 2", "isCorrect": true },
    { "text": "خيار 3", "isCorrect": false },
    { "text": "خيار 4", "isCorrect": false }`;
        }

        const focusString = focusTopic.trim() ? `\n🎯 ركز جداً في الأسئلة على الموضوع الدقيق التالي حصراً:\n"${focusTopic.trim()}"\nتجنب المواضيع المتكررة الأخرى في هذا المحور.` : "";

        const promptTemplate = `أنت خبير فني رفيع المستوى وممتحن معتمد في برنامج الاعتماد المهني السعودي (pacc.sa).
خبرتك تزيد عن 20 عاماً في مهنة "${profession.name}".
مهمتك صياغة ${count} أسئلة دقيقة (Single Best Answer) 
محصورة في المحور: [ ${axisLabelArabic} ]

${profession.description ? `تنويــه: مقتطف عن المهنة من الإدارة: "${profession.description}"` : ""}
${focusString}

═══════════════════════════════════════════
📊 مستوى الصعوبة المطلوب: ${difficulty === "EXPERT" ? "💀 EXPERT — صعب جداً (120%)" : "🔴 HARD — صعب"}

${difficulty === "EXPERT" ? `■ تعريف مستوى EXPERT (120%):
  - سيناريو معقد متعدد المراحل مع ظروف استثنائية
  - جميع الخيارات تبدو صحيحة جزئياً — واحد فقط "الأنسب"
  - يتطلب تشخيص + تحليل + اتخاذ قرار
  - يحتاج خبرة ميدانية عميقة لا تقل عن 7 سنوات
  - يتضمن أرقام دقيقة ومعايير ومواصفات
  - المستوى المعرفي: K3 (تقييم + اتخاذ قرار)` : `■ تعريف مستوى HARD:
  - سيناريو مهني واقعي يتطلب معرفة تقنية جيدة
  - الخيارات الخاطئة تبدو معقولة لغير المتخصص
  - يحتاج خبرة عملية لا تقل عن 3 سنوات
  - المستوى المعرفي: K2 (تطبيق + تحليل)`}

═══════════════════════════════════════════
⚠️ القواعد الحديدية — خالفها يعتبر فشلاً:
═══════════════════════════════════════════

🔴 القاعدة 1: حظر البديهيات المطلق
   - ممنوع أي سؤال يمكن لشخص عادي الإجابة عليه بالتخمين
   - ممنوع صياغة إجابة تبدو "مثالية" يسهل تخمينها
   - كل خيار يتضمن تفصيلة تقنية دقيقة

🔴 القاعدة 2: الخيارات الخاطئة (Distractors) الذكية
   - كل خيار خاطئ = ممارسة شائعة خاطئة يقع فيها المهنيون فعلاً
${typeInstruction}

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
  "difficulty": "${difficulty}",
  "axis": "${axis}",
  "cognitiveLevel": "${difficulty === 'EXPERT' ? 'K3' : 'K2'}",
  "type": "${questionType}",
  "options": [${optionsTemplate}
  ]
}]`;

        console.log(`[AI Gen Partial] 🔄 Generating ${count} questions for axis [${axis}] - profession: "${profession.name}"`);

        const result = await callGeminiWithRetry({
            apiKey: geminiKey,
            model: "gemini-2.5-flash",
            prompt: promptTemplate,
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
