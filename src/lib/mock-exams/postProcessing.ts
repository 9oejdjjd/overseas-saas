/**
 * @file postProcessing.ts
 * @description محرك الفحص والتدقيق البرمجي التلقائي (Post-Processing Engine) للأسئلة المولدة بالذكاء الاصطناعي.
 * يفحص انحياز الأطوال، تسريب الصور، منطقية المشتتات، ويقوم بالإصلاحات التلقائية السريعة.
 * 
 * @author Senior AI Architect & Cognitive Systems Engineer
 */

export interface OptionPayload {
    text: string;
    isCorrect: boolean;
}

export interface GeneratedQuestionPayload {
    text: string;
    explanation?: string;
    difficulty?: "HARD" | "EXPERT" | string;
    axis?: string;
    cognitiveLevel?: "K1" | "K2" | "K3" | "K4" | "K5" | string;
    type?: "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | string;
    questionStyle?: string;
    requireImage?: boolean;
    imageDescription?: string | null;
    imageUrl?: string | null;
    options: OptionPayload[];
}

export interface PostProcessResult {
    isValid: boolean;
    failedRules: string[];
    reasons: string[];
    canAutoFix: boolean;
    needsAIRefinement: boolean;
    cleanedQuestion: GeneratedQuestionPayload;
}

/**
 * حساب تشابه الكلمات والتقاطع بين نصين
 */
export function calculateWordOverlap(text1: string, text2: string): number {
    const normalize = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟"'/\\\[\]]/g, "")
            .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
            .replace(/[أإآٱ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .split(/\s+/)
            .filter(w => w.length > 2);
    };

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    for (const word of words1) {
        if (words2.has(word)) {
            intersection++;
        }
    }

    const union = new Set([...words1, ...words2]).size;
    return union === 0 ? 0 : intersection / union;
}

/**
 * خوارزمية Fisher-Yates لخلط الخيارات عشوائياً حتى لا تكون الإجابة الصحيحة في موقع ثابت
 */
export function shuffleOptions(options: OptionPayload[]): OptionPayload[] {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[j], arr[i]] = [arr[i], arr[j]];
    }
    return arr;
}

/**
 * الكلمات والعبارات التي تدل على تسريب الصورة داخل نص السؤال
 */
const IMAGE_LEAK_PHRASES = [
    "تظهر في الصورة",
    "الصورة تظهر",
    "كما هو موضح في الصورة",
    "التي تظهر في الصورة",
    "بالنظر الى الصورة المرفقة التي",
    "بالنظر الى الصورة التي تظهر",
    "توضح الصورة المرفقة",
    "تشاهد في الصورة",
    "يظهر في الرسم",
    "المخطط المرفق يوضح",
    "اللوحة الظاهرة في الصورة تمثل"
];

/**
 * الفحص البرمجي الشامل لسؤال واحد
 */
export function evaluateQuestionPostProcessing(
    rawQuestion: GeneratedQuestionPayload,
    expectedType: string = "MCQ"
): PostProcessResult {
    const reasons: string[] = [];
    const failedRules: string[] = [];
    let needsAIRefine = false;

    // 1. تنظيف النصوص وإزالة الفراغات
    const cleanedText = (rawQuestion.text || "").trim();
    const qType = rawQuestion.type || expectedType || "MCQ";
    const requireImage = !!(rawQuestion.requireImage === true || (rawQuestion.requireImage as any) === "true");
    const imageDesc = rawQuestion.imageDescription ? String(rawQuestion.imageDescription).trim() : null;

    const cleanedOptions: OptionPayload[] = Array.isArray(rawQuestion.options)
        ? rawQuestion.options.map(opt => ({
              text: (opt.text || "").trim(),
              isCorrect: !!opt.isCorrect
          }))
        : [];

    let cleanedQuestion: GeneratedQuestionPayload = {
        ...rawQuestion,
        text: cleanedText,
        type: qType,
        requireImage,
        imageDescription: requireImage ? imageDesc : null,
        explanation: (rawQuestion.explanation || "").trim(),
        options: cleanedOptions
    };

    // 2. التحقق من وجود نص السؤال
    if (!cleanedText || cleanedText.length < 10) {
        failedRules.push("EMPTY_OR_SHORT_TEXT");
        reasons.push("نص السؤال قصير جداً أو فارغ.");
        needsAIRefine = true;
    }

    // 3. التحقق من مطابقة عدد الخيارات للنوع
    const expectedOptionsCount = qType === "TRUE_FALSE" ? 2 : 4;
    if (cleanedOptions.length !== expectedOptionsCount) {
        failedRules.push("INVALID_OPTIONS_COUNT");
        reasons.push(`عدد الخيارات (${cleanedOptions.length}) لا يطابق المطلوب (${expectedOptionsCount}) لنوع ${qType}.`);
        needsAIRefine = true;
    }

    // 4. التحقق من وجود إجابة صحيحة واحدة بالضبط
    const correctOptions = cleanedOptions.filter(o => o.isCorrect);
    if (correctOptions.length !== 1) {
        failedRules.push("INVALID_CORRECT_COUNT");
        reasons.push(`يجب وجود إجابة صحيحة واحدة فقط (تم العثور على ${correctOptions.length}).`);
        needsAIRefine = true;
    }

    // 5. التحقق من خيارات فارغة أو مكررة داخل نفس السؤال
    const optionTexts = cleanedOptions.map(o => o.text.toLowerCase());
    const uniqueOptionTexts = new Set(optionTexts);
    if (uniqueOptionTexts.size !== cleanedOptions.length) {
        failedRules.push("DUPLICATE_OPTIONS");
        reasons.push("يوجد خيارات مكررة داخل نفس السؤال.");
        needsAIRefine = true;
    }

    if (cleanedOptions.some(o => !o.text || o.text.length < 1)) {
        failedRules.push("EMPTY_OPTION");
        reasons.push("يوجد خيار نصي فارغ.");
        needsAIRefine = true;
    }

    // 6. فحص انحياز طول الخيار الصحيح (Equal Length Policy) — مخصص لـ MCQ و FILL_BLANK
    if ((qType === "MCQ" || qType === "FILL_BLANK") && cleanedOptions.length === 4 && correctOptions.length === 1) {
        const correctOpt = correctOptions[0];
        const incorrectOpts = cleanedOptions.filter(o => !o.isCorrect);

        const wordCounts = cleanedOptions.map(o => o.text.split(/\s+/).filter(Boolean).length);
        const maxWords = Math.max(...wordCounts);
        const minWords = Math.min(...wordCounts);
        const wordRangeDelta = maxWords - minWords;

        const correctCharLen = correctOpt.text.length;
        const correctWordCount = correctOpt.text.split(/\s+/).filter(Boolean).length;

        const avgIncorrectCharLen = incorrectOpts.reduce((sum, o) => sum + o.text.length, 0) / incorrectOpts.length;
        const avgIncorrectWordCount = incorrectOpts.reduce((sum, o) => sum + o.text.split(/\s+/).filter(Boolean).length, 0) / incorrectOpts.length;

        const lengthRatio = avgIncorrectCharLen > 0 ? correctCharLen / avgIncorrectCharLen : 1;

        // إذا كان الفارق بين أطول وأقصر خيار يتجاوز 3 كلمات، أو الخيار الصحيح أطول بـ 25% من المتوسط
        if (wordRangeDelta > 3 || lengthRatio > 1.25) {
            failedRules.push("OPTION_LENGTH_BIAS");
            reasons.push(
                `انحياز في أطوال الخيارات (سياسة تكافئ الأطوال): الفارق بين أطول وأقصر خيار هو (${wordRangeDelta}) كلمات. الخيار الصحيح: (${correctWordCount} كلمة / ${correctCharLen} حرف) مقابل متوسط الخاطئ (${Math.round(avgIncorrectWordCount)} كلمة / ${Math.round(avgIncorrectCharLen)} حرف).`
            );
            needsAIRefine = true;
        }
    }

    // 7. فحص أسئلة الصور وتسريب الوصف
    if (requireImage) {
        if (!imageDesc || imageDesc.length < 5) {
            failedRules.push("MISSING_IMAGE_DESCRIPTION");
            reasons.push("السؤال يتطلب صورة ولكن حقل 'imageDescription' فارغ أو قصير جداً.");
            needsAIRefine = true;
        } else {
            // فحص عبارات التسريب المباشرة
            for (const phrase of IMAGE_LEAK_PHRASES) {
                if (cleanedText.includes(phrase)) {
                    failedRules.push("IMAGE_LEAK_PHRASE");
                    reasons.push(`نص السؤال يحتوي على عبارة تكشف تفاصيل الصورة: "${phrase}".`);
                    needsAIRefine = true;
                    break;
                }
            }

            // فحص نسبة تداخل الكلمات بين السؤال ووصف الصورة
            const overlap = calculateWordOverlap(cleanedText, imageDesc);
            if (overlap > 0.40) {
                failedRules.push("IMAGE_DESCRIPTION_OVERLAP");
                reasons.push(`تداخل عالي بين نص السؤال ووصف الصورة (${Math.round(overlap * 100)}%). يجب ألا يشرح السؤال ما هو موجود بالصورة.`);
                needsAIRefine = true;
            }
        }
    }

    // 8. إصلاح تلقائي خفيف إذا كان السؤال سليم تقنياً (خلط الخيارات عشوائياً)
    if (failedRules.length === 0 && cleanedOptions.length > 0) {
        cleanedQuestion.options = shuffleOptions(cleanedOptions);
    }

    const isValid = failedRules.length === 0;

    return {
        isValid,
        failedRules,
        reasons,
        canAutoFix: !needsAIRefine,
        needsAIRefinement: needsAIRefine,
        cleanedQuestion
    };
}

/**
 * معالجة وفحص دفعة من الأسئلة، وفرزها إلى صالحة وأسئلة تحتاج تنقيح
 */
export function batchProcessQuestions(
    questions: GeneratedQuestionPayload[],
    expectedType: string = "MCQ"
): {
    validQuestions: GeneratedQuestionPayload[];
    questionsNeedingRefinement: { question: GeneratedQuestionPayload; reasons: string[]; failedRules: string[] }[];
    rejectedQuestions: { question: GeneratedQuestionPayload; reasons: string[] }[];
} {
    const validQuestions: GeneratedQuestionPayload[] = [];
    const questionsNeedingRefinement: { question: GeneratedQuestionPayload; reasons: string[]; failedRules: string[] }[] = [];
    const rejectedQuestions: { question: GeneratedQuestionPayload; reasons: string[] }[] = [];

    for (const q of questions) {
        const evalResult = evaluateQuestionPostProcessing(q, expectedType);
        if (evalResult.isValid) {
            validQuestions.push(evalResult.cleanedQuestion);
        } else if (evalResult.needsAIRefinement) {
            questionsNeedingRefinement.push({
                question: evalResult.cleanedQuestion,
                reasons: evalResult.reasons,
                failedRules: evalResult.failedRules
            });
        } else {
            rejectedQuestions.push({
                question: evalResult.cleanedQuestion,
                reasons: evalResult.reasons
            });
        }
    }

    return {
        validQuestions,
        questionsNeedingRefinement,
        rejectedQuestions
    };
}
