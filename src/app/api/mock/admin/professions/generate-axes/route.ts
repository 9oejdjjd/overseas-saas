import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { callGeminiWithRetry } from "@/lib/ai-rate-limiter";
import { buildAxesGenerationPrompt } from "@/lib/mock-exams/promptBuilder";

export const maxDuration = 45;

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { profName, questionCount = 30, description = "" } = body;

        if (!profName || typeof profName !== "string" || !profName.trim()) {
            return NextResponse.json({ error: "اسم المهنة مطلوب لتوليد المحاور" }, { status: 400 });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const targetCount = Number(questionCount) || 30;
        const prompt = buildAxesGenerationPrompt(profName.trim(), targetCount, description);

        console.log(`[AI Axes Gen] 🔄 Generating axes for profession: "${profName}" (Target total: ${targetCount} questions)`);

        const result = await callGeminiWithRetry({
            apiKey: geminiKey,
            model: "gemini-2.5-flash",
            prompt,
            maxRetries: 3,
            baseDelayMs: 3000,
            timeoutMs: 35000,
            temperature: 0.5
        });

        if (!result.success) {
            console.error(`[AI Axes Gen] ❌ Failed after ${result.attempts} attempts: ${result.lastError}`);
            return NextResponse.json({ error: `فشل توليد المحاور بالذكاء الاصطناعي: ${result.lastError}` }, { status: 502 });
        }

        let jsonText = result.content;
        const jsonStart = jsonText.indexOf('{');
        const jsonEnd = jsonText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        }

        let parsed: any;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            console.error("[AI Axes Gen] ❌ Failed to parse JSON from AI response");
            return NextResponse.json({ error: "استرجع الذكاء الاصطناعي صيغة JSON غير صالحة" }, { status: 502 });
        }

        const rawAxes = Array.isArray(parsed.axes) ? parsed.axes : (Array.isArray(parsed) ? parsed : []);

        if (rawAxes.length === 0) {
            return NextResponse.json({ error: "لم يرجع الذكاء الاصطناعي أي محاور صالحة" }, { status: 502 });
        }

        // Clean and build axis array
        let processedAxes = rawAxes.map((a: any) => ({
            id: crypto.randomUUID(),
            name: String(a.name || a.title || "محور تخصصي").trim(),
            quota: Math.max(1, Math.round(Number(a.quota) || 1))
        }));

        // Equalize sum of quotas to match targetCount exactly
        let currentSum = processedAxes.reduce((sum: number, a: any) => sum + a.quota, 0);
        if (currentSum !== targetCount && processedAxes.length > 0) {
            const delta = targetCount - currentSum;
            // Add delta to the axis with highest quota
            let maxIdx = 0;
            for (let i = 1; i < processedAxes.length; i++) {
                if (processedAxes[i].quota > processedAxes[maxIdx].quota) {
                    maxIdx = i;
                }
            }
            processedAxes[maxIdx].quota = Math.max(1, processedAxes[maxIdx].quota + delta);
        }

        return NextResponse.json({
            success: true,
            message: `تم توليد ${processedAxes.length} محاور بنجاح لمهنة "${profName}"`,
            axes: processedAxes
        });

    } catch (error: any) {
        console.error("AI Axes Gen Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate axes" }, { status: 500 });
    }
}
