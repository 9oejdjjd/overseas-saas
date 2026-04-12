/**
 * Lightweight AI Rate Limiter for Gemini API calls.
 * Provides exponential backoff with jitter and Retry-After header support.
 */

/** Sleep with optional random jitter */
export function sleep(ms: number, jitterMs: number = 0): Promise<void> {
    const actual = ms + Math.floor(Math.random() * jitterMs);
    return new Promise(resolve => setTimeout(resolve, actual));
}

interface GeminiCallOptions {
    apiKey: string;
    model: string;
    prompt: string;
    maxRetries?: number;
    baseDelayMs?: number;
    timeoutMs?: number;
}

interface GeminiCallResult {
    success: boolean;
    content: string;
    attempts: number;
    lastError?: string;
}

/**
 * Calls Gemini API with exponential backoff, jitter, and Retry-After support.
 */
export async function callGeminiWithRetry(options: GeminiCallOptions): Promise<GeminiCallResult> {
    const {
        apiKey,
        model,
        prompt,
        maxRetries = 5,
        baseDelayMs = 10000,
        timeoutMs = 60000,
    } = options;

    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            responseMimeType: "application/json",
                        },
                    }),
                    signal: AbortSignal.timeout(timeoutMs),
                }
            );

            if (res.ok) {
                const data = await res.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
                return { success: true, content, attempts: attempt };
            }

            if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
                const retryAfter = res.headers.get("Retry-After");
                let delay: number;
                if (retryAfter && !isNaN(Number(retryAfter))) {
                    delay = Number(retryAfter) * 1000;
                } else {
                    delay = baseDelayMs * Math.pow(2, attempt - 1);
                }
                const jitter = Math.floor(Math.random() * 3000);
                console.warn(`[AI Gen] ⏳ ${model} returned ${res.status}, waiting ${Math.round((delay + jitter) / 1000)}s (retry ${attempt + 1}/${maxRetries})`);
                await sleep(delay, jitter);
                continue;
            }

            lastError = `HTTP ${res.status}: ${res.statusText}`;
            console.error(`[AI Gen] ❌ ${model} error: ${lastError}`);
            break;
        } catch (fetchError: any) {
            lastError = fetchError.message || "Network error";
            console.warn(`[AI Gen] ⚠️ ${model} error (attempt ${attempt}/${maxRetries}): ${lastError}`);
            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await sleep(delay, 2000);
                continue;
            }
            break;
        }
    }

    return { success: false, content: "[]", attempts: maxRetries, lastError };
}

export async function callOpenAIWithRetry(options: GeminiCallOptions): Promise<GeminiCallResult> {
    const {
        apiKey,
        model = "gpt-4o-mini", // Use provided or default
        prompt,
        maxRetries = 5,
        baseDelayMs = 5000,
        timeoutMs = 60000,
    } = options;

    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                }),
                signal: AbortSignal.timeout(timeoutMs),
            });

            if (res.ok) {
                const data = await res.json();
                const content = data.choices?.[0]?.message?.content?.trim() || "[]";
                return { success: true, content, attempts: attempt };
            }

            if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
                const retryAfter = res.headers.get("Retry-After");
                let delay: number;
                if (retryAfter && !isNaN(Number(retryAfter))) {
                    delay = Number(retryAfter) * 1000;
                } else {
                    delay = baseDelayMs * Math.pow(2, attempt - 1);
                }
                const jitter = Math.floor(Math.random() * 2000);
                console.warn(`[AI Gen] ⏳ OpenAI ${model} returned ${res.status}, waiting ${Math.round((delay + jitter) / 1000)}s (retry ${attempt + 1}/${maxRetries})`);
                await sleep(delay, jitter);
                continue;
            }

            lastError = `HTTP ${res.status}: ${res.statusText}`;
            try {
               const errorData = await res.json();
               if(errorData?.error?.message) {
                  lastError += ` - ${errorData.error.message}`;
               }
            } catch(e) {}
            console.error(`[AI Gen] ❌ OpenAI ${model} error: ${lastError}`);
            break;
        } catch (fetchError: any) {
            lastError = fetchError.message || "Network error";
            console.warn(`[AI Gen] ⚠️ OpenAI ${model} error (attempt ${attempt}/${maxRetries}): ${lastError}`);
            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await sleep(delay, 2000);
                continue;
            }
            break;
        }
    }

    return { success: false, content: "[]", attempts: maxRetries, lastError };
}
