import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry } from "@/lib/ai-rate-limiter";
import { buildPrompt } from "@/lib/mock-exams/promptBuilder";

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

        const axisLabelArabic = axis; // Axis is now a dynamic string directly sent from UI

        // Build prompt using centralized builder (passes array directly now)
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

        console.log(`[AI Gen Partial] 🔄 Generating ${count} questions (multiple selection) for axis [${axis}] - profession: "${profession.name}"`);

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
            // Determine expected options length dynamically based on type
            const qType = q.type || questionTypes[0] || "MCQ";
            const expectedOptionsLength = qType === "TRUE_FALSE" ? 2 : 4;

            if (q.text && q.options && q.options.length === expectedOptionsLength) {
                const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                if (correctCount === 1) {
                    try {
                        const returnedDiff = q.difficulty || difficulties[0] || "HARD";
                        const returnedCog = q.cognitiveLevel || "K2";
                        
                        // Map to EXPERT only if returned cognitiveLevel is K3 or difficulty is EXPERT, otherwise HARD for DB schema enum safety
                        const finalDifficulty = (returnedCog === "K3" || returnedDiff === "EXPERT") ? "EXPERT" : "HARD";
                        
                        // Map and validate cognitiveLevel (supporting K1, K2, K3, K4, K5)
                        const finalCognitiveLevel = (returnedDiff === "VERY_HARD" || returnedDiff === "K1" || returnedCog === "K1") 
                            ? "K1" 
                            : ["K1", "K2", "K3", "K4", "K5"].includes(returnedCog)
                                ? returnedCog
                                : "K2";
                        
                        // Detect and save style
                        const finalStyle = q.questionStyle || questionStyle || "SCENARIO";

                        await prisma.question.create({
                            data: {
                                professionId,
                                text: q.text,
                                explanation: q.explanation,
                                difficulty: finalDifficulty as any,
                                cognitiveLevel: finalCognitiveLevel,
                                axis: axis as any,
                                type: qType as any,
                                questionStyle: finalStyle,
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
            message: `تم توليد وحفظ ${savedCount} سؤال بنجاح لمحور ${axisLabelArabic}`,
            savedCount 
        });

    } catch (error: any) {
        console.error("AI Partial Gen Error:", error);
        return NextResponse.json({ error: error.message || "Failed to trigger AI generation" }, { status: 500 });
    }
}
