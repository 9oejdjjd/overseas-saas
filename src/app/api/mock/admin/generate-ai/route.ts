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
            await triggerAIGenerationBg(job.id, profession.name, profession.description || "", profession.id);
        });

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error) {
        console.error("AI Gen Trigger Error:", error);
        return NextResponse.json({ error: "Failed to trigger AI generation" }, { status: 500 });
    }
}

// Background Processor — Saudi Professional Exam (SBA) Style
async function triggerAIGenerationBg(jobId: string, professionName: string, professionDescription: string, professionId: string) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");
        const promptTemplate = `
أنت خبير فني رفيع المستوى وممتحن معتمد في "الفحص المهني السعودي" (pacc.sa).
مهمتك هي إعداد اختبار دقيق، وعميق، ومختص جداً لمهنة: "${professionName}". مطلوب 30 سؤال (Single Best Answer - SBA).

═══════════════════════════════════════════════════════
⚙️ الخطوة الأولى: التشعب والتخصص العميق (Deep Domain Analysis)
═══════════════════════════════════════════════════════
قبل صياغة الأسئلة، قم بتحليل هذه المهنة إلى 5 نطاقات/تخصصات فرعية معقدة تواجه العامل.
${professionDescription ? 
  `>> تنبيه هام (توجيهات مدير النظام): لقد قام مدير النظام بتحديد المجالات أو الوصف التالي للمهنة: "${professionDescription}". يجب أن تلتزم التزاماً كاملاً بهذا الوصف وأن تستخرج النطاقات بناءً عليه حصراً.` 
  : 
  `>> نظرًا لعدم وجود وصف مخصص، استنتج المجالات الـ 5 المعتمدة دولياً لهذه المهنة المعينة حصراً. يمنع منعاً باتاً استنتاج أو إضافة أي مجالات أو بيئات عمل لا تخص هذه المهنة في الواقع (مثلاً لا تضف أسئلة عن المواشي إلا إذا كانت المهنة تتعلق بها نصاً ورسمياً).`
}
>> يجب أن تتوزع الأسئلة الـ 30 بشكل متساوٍ على هذه النطاقات الفرعية الـ 5، بحيث يغطي الاختبار كافة تعقيدات المهنة لتكون شاملة 100%.

═══════════════════════════════════════════════════════
⚠️ قواعد صياغة الأسئلة الحاسمة — خالفها يعتبر فشلاً ذريعاً:
═══════════════════════════════════════════════════════

🔴 القاعدة 1: حظر البديهيات والإجابة النموذجية الكاذبة
   - ⛔ ممنوع صياغة إجابات تبدو "مثالية أو لبقة" (مثل: إبلاغ المشرف فوراً، التأكد من السلامة، اتباع الدليل، الاتصال بالشرطة). هذه إجابات يسهل على الجاهل تخمينها وتعتبر الأسئلة التي تحتويها فاشلة.
   - الإجابات يجب أن تكون سيناريوهات مهنية وعملية دقيقة تتضمن: أسماء أدوات محددة، خطوات عمل قياسية (SOPs)، علامات الخطر، تفاصيل المواد المستعملة، أو ضوابط فنية مخصصة للمهنة. 
   - ⛔ يمنع منعاً باتاً وضع معادلات فيزيائية معقدة أو قوانين نيوتن أو حسابات رياضية عميقة ما لم تكن المهنة هندسية بحتة. ركز على "الأداء المهني" والمواقف اليومية.

🔴 القاعدة 2: واقعية الخيارات الخاطئة (المشتتات - Distractors)
   - جميع الخيارات الـ 4 يجب أن تبدو صحيحة لمن ليس خبيراً متمرساً بتفاصيل المهنة.
   - المشتتات هي: "ممارسة وحيلة شائعة في السوق لكنها خاطئة"، "قاعدة قديمة انتهت"، أو "إجراء ينبني على فهم خاطئ لعمل الأداة".
   - ⛔ ممنوع صياغة خيار يبدو غبياً أو واضح الخطأ.

🔴 القاعدة 3: توحيد طول الإجابات
   - يجب أن تكون الخيارات الأربعة (الصحيح والخاطئة) بنفس الطول تماماً وبنفس الصياغة اللغوية.
   - لا تجعل الخيار الصحيح أطول أو يحتوي على استثناءات لأن ذلك يكشفه.

🔴 القاعدة 4: سيناريوهات عملية ومواقف يومية
   - 28 سؤال (من أصل 30) يجب أن تبدأ بسيناريو عملي حرج أو تحدي فني من صميم بيئة العمل.
   - مثال للسيناريوهات المطلوبة: "أثناء قيامك بلحام أنابيب التبريد النحاسية، لاحظت أن طبقة اللحام لا تنتشر بشكل متساو. ماذا يجب أن تفعل لتصحيح هذه المشكلة المهنية؟" أو "كعامل تغليف، واجهت صندوقاً كرتونياً يحتوي على زجاج لكن وزنه غير متوازن بقوة، ما هي الطريقة المثلى لتدعيم قاعدته حسب المواصفات؟"

🔴 القاعدة 5: المستوى المعرفي والصعوبة
   - مستوى الصعوبة يجب أن يكون قوياً وموجهاً للممارس الفعلي الماهر (اكتشاف الأخطاء، حل المشاكل، الإجراءات الفنية السليمة):
     - 25 سؤال HARD (تتطلب خبرة فعلية وتمييز المشاكل الدقيقة وصيانة العطال).
     - 5 أسئلة MEDIUM.

🔴 القاعدة 6: توزيع المحاور (10 لكل محور)
   - "HEALTH_SAFETY" (10): علامات الخطر، إجراءات الوقاية من المواد، والبيئة الصناعية والأمن الصناعي.
   - "PROFESSION_KNOWLEDGE" (10): خطوات العمل وصيانة الآلات واختيار المواد والأدوات الصحيحة.
   - "GENERAL_SKILLS" (10): جودة العمل، الترتيب، الفحص النظري والعملي قبل البدء.

═══════════════════════════════════════════════════════
📋 تنسيق الإخراج النهائي (JSON ONLY):
═══════════════════════════════════════════════════════

أخرج البيانات كمصفوفة JSON صالحة فقط، بدون أي تنسيق markdown (لا تضف \`\`\`json).

[{
  "text": "وضع سيناريو عملي عميق يحتوي على أرقام ومعطيات، وينتهي بالسؤال المباشر:",
  "explanation": "شرح هندسي للمحترف يوضح التبرير العلمي للإجابة الصحيحة وكيف أن المشتتات الثلاثة هي مجرد ممارسات خاطئة شائعة في السوق.",
  "difficulty": "HARD",
  "axis": "PROFESSION_KNOWLEDGE",
  "cognitiveLevel": "K2",
  "options": [
    { "text": "خيار تقني برقم أو قياس أو أداة (بنفس الطول)", "isCorrect": true },
    { "text": "خيار تقني برقم أو قياس مشابه (شائع كخطأ)", "isCorrect": false },
    { "text": "خيار تقني برقم أو أداة مختلفة (ممارسة قديمة)", "isCorrect": false },
    { "text": "خيار تقني ناقص التحديد", "isCorrect": false }
  ]
}]

تأكد من: 4 خيارات فقط، واحد فقط صحيح، وبطول متقارب جداً. مخصصة بصعوبة بالغة لمهنة "${professionName}".
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
