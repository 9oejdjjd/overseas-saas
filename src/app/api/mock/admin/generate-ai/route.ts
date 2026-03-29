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

// Background Processor (Mockable/Pluggable with real AI)
async function triggerAIGenerationBg(jobId: string, professionName: string, professionId: string) {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

        const promptTemplate = `
You are an expert examiner creating highly professional, difficult, and rigorous certification exams in Arabic for the profession: "${professionName}".
Please generate exactly 30 multiple choice questions.

CRITICAL DIFFICULTY INSTRUCTIONS:
- These questions must be VERY DIFFICULT and meant for advanced practitioners, not beginners.
- Make 50% of questions strictly "HARD", 30% "MEDIUM", and 20% "EASY".
- For "HARD" questions, DO NOT ask definitions. Instead, use Scenario-Based questions (e.g., "أثناء عملك في منشأة، حدث تسريب غاز بضغط 50 bar... ما هو الإجراء المباشر والصحيح وفقاً لكود السلامة؟").
- The incorrect options (distractors) MUST be highly plausible. Use common industry mistakes, outdated standards, or partially correct answers that fail in the specific scenario given. Do NOT make distractors obviously wrong.
- Include deep technical details, precise measurements (voltages, pressures, dimensions), and strict industry standards where applicable to the profession.

The questions MUST be strictly divided into three categories (axes):
1. 10 questions for "HEALTH_SAFETY" (Occupational Health and Safety).
2. 10 questions for "PROFESSION_KNOWLEDGE" (Core Professional Knowledge).
3. 10 questions for "GENERAL_SKILLS" (General Professional Skills).

Output the response EXACTLY as a valid JSON array of objects, with no markdown formatting around it.
Do NOT include backticks (e.g. \`\`\`json) in your response. Just the raw array.

[{
  "text": "نص السؤال الدقيق والمهني هنا الدال على سيناريو محدد؟",
  "explanation": "شرح علمي دقيق يوضح سبب الاستحقاق ولماذا المشتتات خاطئة.",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "axis": "HEALTH_SAFETY" | "PROFESSION_KNOWLEDGE" | "GENERAL_SKILLS",
  "options": [
    { "text": "الخيار الأصح والأدق", "isCorrect": true },
    { "text": "مشتت قوي جداً يبدو صحيحاً", "isCorrect": false },
    { "text": "خطأ مهني شائع", "isCorrect": false },
    { "text": "ممارسة قديمة غير معتمدة", "isCorrect": false }
  ]
}]
Ensure exactly 1 option is correct in each question, and exactly 4 options total per question.
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
                            parts: [{ text: "You are a specialized JSON data generator. Output ONLY a valid JSON array, without any markdown formatting.\n\n" + promptTemplate }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
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
                            difficulty: q.difficulty || "MEDIUM",
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
