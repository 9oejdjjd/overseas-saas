import { NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

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
                questionsRequested: 30,
                status: "PROCESSING",
                prompt: `Generate exactly 30 structured professional questions for a ${profession.name}.`,
            }
        });

        // Trigger asynchronous generation so we don't block the request timeout
        // Wrapped in after() to ensure Vercel does not terminate the background process
        after(async () => {
            await triggerAIGenerationBg(job.id, profession.name, profession.id);
        });

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error) {
        console.error("AI Gen Trigger Error:", error);
        return NextResponse.json({ error: "Failed to trigger AI generation" }, { status: 500 });
    }
}

// Background Processor — Saudi Professional Exam (SBA) Style
async function triggerAIGenerationBg(jobId: string, professionName: string, professionId: string) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

        const promptTemplate = `
أنت خبير في تصميم اختبارات الفحص المهني السعودي (pacc.sa) — اختبارات الاعتماد المهني للعمالة الوافدة.
مطلوب منك توليد 30 سؤال اختيار من متعدد بتنسيق "أفضل إجابة واحدة" (Single Best Answer - SBA) لمهنة: "${professionName}".

═══════════════════════════════════════════════════════
⚠️  قواعد حاسمة — يجب اتباعها حرفياً:
═══════════════════════════════════════════════════════

🔴 القاعدة #1: أسلوب SBA (أفضل إجابة واحدة)
   - جميع الخيارات الأربعة يجب أن تبدو صحيحة ومنطقية لشخص يعمل في المهنة.
   - الفرق بين الإجابة الصحيحة والخاطئة هو أن الصحيحة هي "الأفضل والأدق" وفقاً للمعايير الدولية والسعودية.
   - المشتتات (الخيارات الخاطئة) = ممارسات مقبولة جزئياً لكنها ليست الأفضل، أو أخطاء شائعة يقع فيها العمال يومياً، أو ممارسات قديمة كانت معتمدة سابقاً.
   - ⛔ ممنوع أن يكون أي خيار واضح الخطأ أو سخيف.

🔴 القاعدة #2: السيناريوهات العملية (95% من الأسئلة)
   - 28 سؤال من 30 يجب أن يبدأ بسيناريو عملي واقعي من بيئة العمل الفعلية.
   - مثال سيناريو: "أثناء عملك في ورشة لحام، لاحظت أن لون اللهب تحول إلى الأصفر المتقطع مع صوت فرقعة عند ضغط أسيتيلين 0.5 bar وأوكسجين 2.5 bar. ما هو الإجراء الأصح؟"
   - يجب أن تتضمن السيناريوهات أرقاماً دقيقة (درجات حرارة، ضغط، فولت، أمبير، أبعاد، مسافات) حسب طبيعة المهنة.
   - سؤالان فقط (2) يمكن أن يكونا أسئلة معلومات مباشرة (K1 - تذكر).

🔴 القاعدة #3: المستوى المعرفي (Cognitive Level)
   - K1 (تذكر واسترجاع): 2 سؤال فقط — معلومة مباشرة يحفظها المهني.
   - K2 (تطبيق وتحليل): 28 سؤال — تتطلب تحليل موقف واتخاذ قرار.

🔴 القاعدة #4: توزيع الصعوبة
   - HARD: 21 سؤال (70%) — سيناريو معقد مع متغيرات متعددة ومشتتات قوية جداً.
   - MEDIUM: 8 أسئلة (27%) — سيناريو متوسط يتطلب تحليل ومعرفة تقنية.
   - EASY: 1 سؤال (3%) — معلومة أساسية حرجة للسلامة.

🔴 القاعدة #5: المحاور (يجب توزيع 10 أسئلة لكل محور بالتساوي)
   1. "HEALTH_SAFETY" — 10 أسئلة: الصحة والسلامة المهنية (معدات الوقاية PPE، إجراءات الطوارئ، المواد الخطرة، إسعافات أولية، لوائح OSHA).
   2. "PROFESSION_KNOWLEDGE" — 10 أسئلة: المعرفة المهنية الأساسية (تقنيات العمل، المعايير الفنية، أدوات ومعدات، مواصفات المواد، حسابات فنية).
   3. "GENERAL_SKILLS" — 10 أسئلة: المهارات العامة (قراءة المخططات، إدارة الوقت، التواصل المهني، الجودة، التعامل مع العميل، مبادئ البيئة).

🔴 القاعدة #6: الشرح المفصّل (explanation)
   - لكل سؤال، اكتب شرحاً يوضح:
     (أ) لماذا الإجابة الصحيحة هي الأفضل.
     (ب) لماذا كل خيار من الثلاثة الخاطئة ليس الأفضل (اذكر السبب التقني لكل واحد).
   - مثال: "الإجابة (أ) صحيحة لأن... أما (ب) فخاطئة لأنها تتجاهل... و(ج) كانت ممارسة قديمة قبل تحديث المعيار... و(د) صحيحة جزئياً لكنها لا تراعي..."

═══════════════════════════════════════════════════════
📋 تنسيق الإخراج:
═══════════════════════════════════════════════════════

أخرج البيانات كمصفوفة JSON صالحة فقط، بدون أي تنسيق markdown أو backticks.

[{
  "text": "سيناريو عملي مفصّل ينتهي بسؤال: ما هو الإجراء الأصح / الأفضل / الأنسب؟",
  "explanation": "شرح مفصّل يتضمن: لماذا (أ) صحيحة ولماذا (ب)(ج)(د) خاطئة مع السبب التقني لكل منها.",
  "difficulty": "HARD",
  "axis": "HEALTH_SAFETY",
  "cognitiveLevel": "K2",
  "options": [
    { "text": "إجراء دقيق وفقاً للمعيار الحالي (هذا هو الأصح)", "isCorrect": true },
    { "text": "إجراء شائع الاستخدام لكنه ليس الأمثل في هذا السيناريو تحديداً", "isCorrect": false },
    { "text": "إجراء كان معتمداً في نسخة قديمة من المعيار ولم يعد صالحاً", "isCorrect": false },
    { "text": "إجراء صحيح جزئياً لكنه يغفل عامل حرج في السيناريو المذكور", "isCorrect": false }
  ]
}]

تأكد أن:
- كل سؤال يحتوي 4 خيارات بالضبط.
- خيار واحد فقط isCorrect: true.
- جميع الأسئلة باللغة العربية.
- الأسئلة مخصصة تحديداً لمهنة "${professionName}" وليست عامة.
`;

        // Auto-retry with exponential backoff for temporary Gemini errors (503, 429)
        const MAX_RETRIES = 3;
        const BASE_DELAY_MS = 3000; // 3 seconds
        let res: Response | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: "You are a specialized JSON data generator for Saudi professional certification exams. Output ONLY a valid JSON array, without any markdown formatting.\n\n" + promptTemplate }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (res.ok) {
                if (attempt > 1) console.log(`[AI Gen] Gemini succeeded on attempt ${attempt}/${MAX_RETRIES}`);
                break;
            }

            // Retry only on 503 (overloaded) or 429 (rate limit)
            if ((res.status === 503 || res.status === 429) && attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s, 12s
                console.warn(`[AI Gen] Gemini returned ${res.status}, retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Non-retryable error or max retries exhausted
            const errBody = await res.text();
            console.error("Gemini Raw Error:", errBody);
            throw new Error(`Gemini API error: ${res.statusText} - ${errBody}`);
        }

        const data = await res!.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

        // Safety cleanup if model still returns markdown fences
        if (content.startsWith("```json")) {
            content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (content.startsWith("```")) {
            content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const generatedQuestions = JSON.parse(content);

        let validCount = 0;
        const createPromises = generatedQuestions.map(async (q: any) => {
            if (q.text && q.options && q.options.length === 4) {
                const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                if (correctCount === 1) {
                    validCount++;
                    return prisma.question.create({
                        data: {
                            professionId,
                            text: q.text,
                            explanation: q.explanation,
                            difficulty: q.difficulty || "HARD",
                            cognitiveLevel: q.cognitiveLevel || "K2",
                            axis: q.axis || "PROFESSION_KNOWLEDGE",
                            options: {
                                create: q.options.map((opt: any) => ({
                                    text: opt.text,
                                    isCorrect: opt.isCorrect
                                }))
                            }
                        }
                    });
                }
            }
        });

        await Promise.all(createPromises.filter((p: any) => p !== undefined));

        await prisma.aIGenerationJob.update({
            where: { id: jobId },
            data: { status: "COMPLETED", questionsGenerated: validCount }
        });

    } catch (error: any) {
        console.error("AI BG Task Failed:", error);
        await prisma.aIGenerationJob.update({
            where: { id: jobId },
            data: { status: "FAILED", errorLog: error.message }
        });
    }
}
