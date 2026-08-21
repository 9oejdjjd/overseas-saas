/**
 * @file validators.ts
 * @description مكتبة التحقق والتدقيق البرمجي (Validators) لملفات الأسئلة وجلسات الاختبارات التجريبية.
 * توفر هذه المكتبة دوالاً آمنة لتنظيف نصوص الـ JSON والتحقق من التناسق الداخلي للخيارات وصحة الإجابة المحددة قبل إرسالها إلى الخادم.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

export interface ValidationResult {
    success: boolean;
    error: string | null;
    parsedData: any[];
    warnings?: string[];
}

/**
 * دالة لحساب نسبة تداخل الكلمات بين نصين للتحقق من التشابه المفرط
 */
function calculateWordOverlap(text1: string, text2: string): number {
    const normalize = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 2); // الكلمات التي طولها أكثر من حرفين
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
    return intersection / union;
}

/**
 * يقوم بتنظيف كود الـ JSON (تجريد علامات الاقتباس وعلامات لغة مارك داون ```json إن وجدت)
 * ثم التحقق من البنية الهيكلية الكاملة لمصفوفة الأسئلة ومطابقتها للمتطلبات.
 * 
 * @param jsonText النص المدخل من قبل المستخدم أو المستلم من الذكاء الاصطناعي
 * @param questionType نوع السؤال المتوقع (MCQ | TRUE_FALSE | FILL_BLANK)
 * @returns {ValidationResult} نتيجة التحقق والبيانات التي تم تحليلها بنجاح
 */
export function validateQuestionsJson(jsonText: string, questionType: string): ValidationResult {
    if (!jsonText || !jsonText.trim()) {
        return {
            success: false,
            error: "يجب إدخال نص الـ JSON في الحقل المخصص",
            parsedData: []
        };
    }

    const warnings: string[] = [];

    try {
        // تنظيف ذكي للـ JSON: استخراج المصفوفة في حال وضعها داخل كتلة كود مارك داون (```json ... ```)
        let cleanedText = jsonText.trim();
        const startIdx = cleanedText.indexOf('[');
        const endIdx = cleanedText.lastIndexOf(']');
        
        if (startIdx !== -1 && endIdx !== -1) {
            cleanedText = cleanedText.substring(startIdx, endIdx + 1);
        } else {
            return {
                success: false,
                error: "لم يتم العثور على مصفوفة JSON صالحة تبدأ بـ [ وتنتهي بـ ]",
                parsedData: []
            };
        }

        const parsed = JSON.parse(cleanedText);
        
        if (!Array.isArray(parsed)) {
            return {
                success: false,
                error: "يجب أن يكون الـ JSON عبارة عن مصفوفة أسئلة Array [...]",
                parsedData: []
            };
        }

        if (parsed.length === 0) {
            return {
                success: false,
                error: "مصفوفة الأسئلة فارغة. يرجى إدخال سؤال واحد على الأقل.",
                parsedData: []
            };
        }

        // التدقيق التفصيلي لكل سؤال
        for (let i = 0; i < parsed.length; i++) {
            const q = parsed[i];
            const qNumber = i + 1;

            if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
                return {
                    success: false,
                    error: `السؤال رقم ${qNumber} يفتقد لنص السؤال الرئيسي أو فارغ 'text'`,
                    parsedData: []
                };
            }

            // تحديد نوع السؤال الفعلي (من الكائن نفسه أو القيمة الافتراضية الممررة)
            const currentQType = q.type || questionType || "MCQ";
            // تحديد عدد الخيارات المطلوب بناءً على نوع السؤال
            const expectedOptions = currentQType === "TRUE_FALSE" ? 2 : 4;
            
            if (!q.options || !Array.isArray(q.options) || q.options.length !== expectedOptions) {
                return {
                    success: false,
                    error: `السؤال رقم ${qNumber} يجب أن يحتوي على ${expectedOptions} خيارات بالضبط لنوع الأسئلة المحدد (${currentQType})`,
                    parsedData: []
                };
            }

            // التحقق من صحة الخيارات الفردية
            for (let j = 0; j < q.options.length; j++) {
                const opt = q.options[j];
                if (!opt.text || typeof opt.text !== "string" || !opt.text.trim()) {
                    return {
                        success: false,
                        error: `السؤال رقم ${qNumber} يحتوي على خيار فارغ أو غير صالح في الترتيب رقم ${j + 1}`,
                        parsedData: []
                    };
                }
            }

            // التحقق من وجود إجابة صحيحة واحدة فقط
            const correctCount = q.options.filter((o: any) => o.isCorrect === true || o.isCorrect === "true").length;
            
            if (correctCount !== 1) {
                return {
                    success: false,
                    error: `السؤال رقم ${qNumber} يجب أن يحتوي على إجابة صحيحة واحدة فقط (تم العثور على: ${correctCount})`,
                    parsedData: []
                };
            }

            // التحقق من أسئلة الصور والتحذيرات
            if (q.requireImage === true || q.requireImage === "true") {
                if (!q.imageDescription || typeof q.imageDescription !== "string" || !q.imageDescription.trim()) {
                    return {
                        success: false,
                        error: `السؤال رقم ${qNumber} يتطلب صورة ولكن حقل 'imageDescription' فارغ أو مفقود`,
                        parsedData: []
                    };
                }

                if (q.imageDescription.trim().length < 8) {
                    warnings.push(`السؤال رقم ${qNumber}: وصف الصورة قصير جداً، قد لا يصف شيئاً حقيقياً بشكل كافٍ.`);
                }

                if (q.imageDescription.trim().length > 200) {
                    warnings.push(`السؤال رقم ${qNumber}: وصف الصورة طويل جداً (${q.imageDescription.trim().length} حرف). يُفضل أن يكون سطر واحد يصف شيئاً واقعياً بشكل مباشر.`);
                }

                // التحقق من التداخل/التشابه
                const similarity = calculateWordOverlap(q.text, q.imageDescription);
                if (similarity > 0.35) {
                    warnings.push(`السؤال رقم ${qNumber}: هناك تداخل كبير في الكلمات بين نص السؤال ووصف الصورة (${Math.round(similarity * 100)}% تشابه). يجب تجنب وصف تفاصيل الصورة داخل السؤال نفسه لكي تظل الصورة ضرورية لحله.`);
                }

                // التحقق من العبارات الوصفية التي تكرر محتوى الصورة داخل السؤال
                const descriptivePhrases = [
                    "تظهر في الصورة",
                    "الصورة تظهر",
                    "كما هو موضح في الصورة",
                    "التي تظهر في الصورة",
                    "بالنظر إلى الصورة المرفقة التي",
                    "بالنظر إلى الصورة التي تظهر"
                ];
                for (const phrase of descriptivePhrases) {
                    if (q.text.includes(phrase)) {
                        warnings.push(`السؤال رقم ${qNumber}: نص السؤال يحتوي على العبارة الوصفية "${phrase}". يرجى صياغة السؤال بحيث يسأل عن الصورة (مثال: "ما دلالة الإشارة الموضحة بالصورة؟") بدلاً من وصف مكوناتها.`);
                        break;
                    }
                }
            }
        }

        return {
            success: true,
            error: null,
            parsedData: parsed,
            warnings
        };

    } catch (err: any) {
        return {
            success: false,
            error: `خطأ في قراءة وتحليل نص الـ JSON: الرجاء التأكد من صحة الصياغة وعلامات الترقيم. (${err.message})`,
            parsedData: []
        };
    }
}
