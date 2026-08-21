/**
 * @file promptBuilder.ts
 * @description مكتبة إنشاء وتجميع نصوص التوجيهات (Prompt Engineering) الخاصة بنظام إدارة الاختبارات التجريبية.
 * تدعم الأنماط المخصصة وأسئلة الصور الذكية مع إزالة الرموز التعبيرية (Emojis) من المخرجات والواجهات.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

export const QUESTION_STYLES = [
    { value: "MIXED", label: "مختلط (توزيع تلقائي متنوع)", description: "يولّد أسئلة بأنماط متنوعة تلقائياً" },
    { value: "SCENARIO_SHORT", label: "سيناريو قصير", description: "موقف عملي مختصر 3-4 أسطر مع سؤال" },
    { value: "SCENARIO_COMPLEX", label: "سيناريو مركب", description: "موقف معقد متعدد المراحل 5-7 أسطر" },
    { value: "DEFINITION", label: "تعريف مصطلح فني", description: "ما تعريف/معنى مصطلح مهني محدد؟" },
    { value: "VALUES_NUMBERS", label: "قيم وأرقام تشغيلية", description: "أرقام دقيقة: مقاسات، درجات حرارة، معايير" },
    { value: "STANDARDS", label: "معايير ومواصفات", description: "أسئلة عن كود/معيار محدد سعودي أو دولي" },
    { value: "TOOL_IDENTIFICATION", label: "تحديد الأداة/المعدة", description: "أي أداة تُستخدم لمهمة معينة؟" },
    { value: "SAFETY", label: "السلامة المهنية", description: "إجراءات السلامة والوقاية" },
    { value: "STEP_ORDER", label: "ترتيب الخطوات", description: "ترتيب خطوات عملية أو إجراء مهني" },
    { value: "COMPARISON", label: "مقارنة وتمييز", description: "مقارنة بين مفهومين أو طريقتين متقاربتين" },
    { value: "ERROR_IDENTIFICATION", label: "تحديد الخطأ/المخالفة", description: "أيٌّ مما يلي يعتبر مخالفة أو خطأ؟" },
    { value: "BEST_PRACTICE", label: "أفضل ممارسة", description: "ما أفضل طريقة لتنفيذ مهمة وفق المعايير؟" },
    { value: "CALCULATION", label: "حساب/تحويل فني", description: "حسابات مهنية بسيطة: كميات، تحويلات، نسب" },
    { value: "REGULATION", label: "نظام/تشريع مهني", description: "أسئلة عن الأنظمة واللوائح السعودية" },
    { value: "CAUSE_EFFECT", label: "سبب ونتيجة", description: "ما السبب الأكثر احتمالاً لحدوث ععل/مشكلة؟" },
    { value: "CUSTOM", label: "نمط صياغة مخصص...", description: "كتابة تعليمات صياغة خاصة بالمهنة يدوياً" }
] as const;

export type QuestionStyleValue = typeof QUESTION_STYLES[number]["value"];

export interface BuildPromptParams {
    profName: string;
    axisLabel: string;
    axis: string;
    questionType: string | string[];     // Can be single or array
    difficulty: string | string[];       // Can be single or array
    focusTopic: string;
    questionCount: number;
    questionStyle?: string; // Can be a preset style or user's custom instruction
    forceImages?: boolean;  // Enforce image questions requireImage field
}

// ────────────────────────────────────────────────────────
// توجيهات أنماط الأسئلة الجاهزة (خالية من الرموز التعبيرية)
// ────────────────────────────────────────────────────────

function getStyleInstruction(style: string, profName: string): string {
    const styles: Record<string, string> = {
        DEFINITION: `
نمط السؤال المطلوب: تعريف المصطلح الفني (Definition)
- كل سؤال يسأل عن تعريف أو معنى أو مفهوم مصطلح فني محدد في مهنة "${profName}"
- الصياغة تكون: "ما المقصود بـ...؟" أو "ما تعريف...؟" أو "يُعرف مصطلح... بأنه..."
- المصطلحات يجب أن تكون فنية دقيقة وليست عامة
- الخيارات الخاطئة يجب أن تكون تعريفات لمصطلحات مشابهة أو قريبة.
- ممنوع السيناريوهات أو القصص — السؤال مباشر عن المصطلح.`,

        VALUES_NUMBERS: `
نمط السؤال المطلوب: القيم والأرقام التشغيلية (Operational Values)
- كل سؤال يسأل عن رقم أو قيمة أو نسبة أو مقاس أو حد أقصى/أدنى محدد في المهنة
- الخيارات يجب أن تكون أرقام متقاربة ومعقولة (ليس واحد منها واضح الخطأ)
- يجب أن يرتبط الرقم بمعيار أو كود أو ممارسة مهنية حقيقية
- ممنوع السيناريوهات — السؤال مباشر عن القيمة.`,

        STANDARDS: `
نمط السؤال المطلوب: المعايير والمواصفات (Standards & Codes)
- كل سؤال يرتبط بمعيار أو كود أو مواصفة سعودية أو دولية محددة
- يذكر اسم المعيار أو الكود صراحة في نص السؤال (مثل: SBC, SASO, OSHA, IEC, NFPA)
- ممنوع السيناريوهات الطويلة — يُسمح بسياق قصير جداً.`,

        TOOL_IDENTIFICATION: `
نمط السؤال المطلوب: تحديد الأداة أو المعدة الصحيحة (Tool Identification)
- كل سؤال يسأل عن الأداة أو المعدة أو الجهاز المناسب لمهمة مهنية محددة
- الأدوات المذكورة في الخيارات يجب أن تكون حقيقية ومتقاربة الاستخدام
- ممنوع الأدوات العامة المعروفة — يجب أن تكون أدوات تخصصية.`,

        SAFETY: `
نمط السؤال المطلوب: السلامة المهنية (Occupational Safety)
- كل سؤال يتعلق بإجراءات السلامة والوقاية والحماية في بيئة العمل
- يشمل: معدات الوقاية الشخصية PPE، إجراءات الطوارئ، تصاريح العمل، المخاطر المهنية
- ممنوع السيناريوهات الطويلة — سؤال مباشر عن إجراء السلامة.`,

        STEP_ORDER: `
نمط السؤال المطلوب: ترتيب الخطوات والإجراءات (Step Ordering)
- كل سؤال يسأل عن الترتيب الصحيح لخطوات عملية أو إجراء مهني
- الصياغة تكون: "ما الخطوة الأولى/التالية/الأخيرة في...؟" أو "ما الترتيب الصحيح لـ...؟"
- الخيارات تكون خطوات حقيقية لكن بترتيب مختلف.`,

        COMPARISON: `
نمط السؤال المطلوب: المقارنة والتمييز (Comparison & Distinction)
- كل سؤال يقارن بين مفهومين أو طريقتين أو مادتين أو تقنيتين متقاربتين
- الصياغة تكون: "ما الفرق الجوهري بين... و...؟" أو "متى يُفضل استخدام... بدلاً من...؟"`,

        ERROR_IDENTIFICATION: `
نمط السؤال المطلوب: تحديد الخطأ أو المخالفة (Error Identification)
- كل سؤال يسأل عن تحديد ممارسة خاطئة أو مخالفة مهنية
- الصياغة تكون: "أيٌّ مما يلي يُعد مخالفة/خطأ في...؟" أو "ما الممارسة الخاطئة في...؟"
- الخطأ يجب أن يكون دقيقاً وغير واضح لغير المتخصص.`,

        BEST_PRACTICE: `
نمط السؤال المطلوب: أفضل ممارسة مهنية (Best Practice)
- كل سؤال يسأل عن أفضل طريقة أو ممارسة لتنفيذ مهمة وفق المعايير المهنية
- جميع الخيارات تبدو معقولة لكن واحد فقط هو الأفضل وفق المعيار المهني.`,

        SCENARIO_SHORT: `
نمط السؤال المطلوب: سيناريو قصير (Short Scenario)
- سيناريو واقعي مختصر (3-4 أسطر) يصف موقفاً عملياً ثم يطرح سؤالاً
- يتضمن: مكان العمل + مشكلة/موقف + ظروف محددة.`,

        SCENARIO_COMPLEX: `
نمط السؤال المطلوب: سيناريو مركب (Complex Scenario)
- سيناريو معقد متعدد المراحل (5-7 أسطر) يتضمن ظروفاً استثنائية أو عدة معطيات
- يتطلب تحليل عدة عوامل معاً لاتخاذ القرار الصحيح.`,

        CALCULATION: `
نمط السؤال المطلوب: الحساب والتحويل الفني (Technical Calculation)
- كل سؤال يتطلب حساباً فنياً أو تحويل وحدات أو حساب كميات
- الخيارات تكون نتائج رقمية متقاربة لتجنب التخمين.`,

        REGULATION: `
نمط السؤال المطلوب: الأنظمة والتشريعات المهنية (Regulations & Laws)
- كل سؤال يتعلق بالأنظمة واللوائح والتشريعات السعودية المنظمة للمهنة (جهات الترخيص، غرامات، إجراءات).`,

        CAUSE_EFFECT: `
نمط السؤال المطلوب: السبب والنتيجة (Cause & Effect)
- كل سؤال يسأل عن السبب الأكثر احتمالاً لحدوث عطل أو مشكلة أو ظاهرة مهنية.`,
    };

    return styles[style] || "";
}

function getMixedStyleInstruction(profName: string, questionCount: number): string {
    return `
نمط الأسئلة المطلوب: مختلط ومتنوع (Mixed Styles)
يجب أن تُنوّع أنماط صياغة الأسئلة الـ ${questionCount} بشكل متوازن بين الأنماط التالية:
- تعريف مصطلح فني مباشر
- قيم وأرقام تشغيلية
- معايير ومواصفات
- تحديد الأداة/المعدة الصحيحة
- إجراءات السلامة المهنية
- ترتيب خطوات إجراء مهني
- مقارنة وتمييز بين مفهومين
- تحديد الخطأ أو المخالفة
- أفضل ممارسة مهنية
- سيناريو قصير واقعي
- حساب أو تحويل فني
- السبب والنتيجة
- أنظمة وتشريعات سعودية

يجب أن يتضمن كل سؤال حقل "questionStyle" يحدد نمط الصياغة المستخدم.

لكل سؤال، أضف في حقل "questionStyle" إحدى القيم التالية حسب نمط الصياغة:
DEFINITION, VALUES_NUMBERS, STANDARDS, TOOL_IDENTIFICATION, SAFETY, STEP_ORDER, COMPARISON, ERROR_IDENTIFICATION, BEST_PRACTICE, SCENARIO_SHORT, SCENARIO_COMPLEX, CALCULATION, REGULATION, CAUSE_EFFECT`;
}

// ────────────────────────────────────────────────────────
// بناء البرومبت الرئيسي المطور
// ────────────────────────────────────────────────────────

export function buildPrompt({
    profName,
    axisLabel,
    axis,
    questionType,
    difficulty,
    focusTopic,
    questionCount,
    questionStyle = "MIXED",
    forceImages = false
}: BuildPromptParams): string {
    const types = Array.isArray(questionType) ? questionType : [questionType];
    const diffs = Array.isArray(difficulty) ? difficulty : [difficulty];

    const typeInstructions: string[] = [];

    if (types.includes("MCQ")) {
        typeInstructions.push(`
اختيار من متعدد (MCQ):
- 4 خيارات متقاربة بالطول تماماً (خيار واحد فقط صحيح).
- صياغة الـ JSON الخاصة بالخيارات:
  "options": [
    { "text": "خيار خاطئ 1", "isCorrect": false },
    { "text": "الخيار الصحيح الفعلي", "isCorrect": true },
    { "text": "خيار خاطئ 3", "isCorrect": false },
    { "text": "خيار خاطئ 4", "isCorrect": false }
  ]`);
    }
    if (types.includes("TRUE_FALSE")) {
        typeInstructions.push(`
صح أو خطأ (True/False):
- العبارة يجب أن تكون حقيقة مهنية دقيقة، ويجب أن تكون إما صحيحة تماماً أو خاطئة لسبب فني محدد.
- خيارين فقط: "صح" و "خطأ" (واحد فقط صحيح).
- صياغة الـ JSON الخاصة بالخيارات:
  "options": [
    { "text": "صح", "isCorrect": true },
    { "text": "خطأ", "isCorrect": false }
  ]`);
    }
    if (types.includes("FILL_BLANK")) {
        typeInstructions.push(`
إكمال الفراغ (Fill in the Blank):
- نص السؤال يجب أن يحتوي على فراغ واحد يمثل مصطلحاً فنيًا أو معيارًا أو أداة. استخدم "_____" لتمثيل الفراغ.
- 4 خيارات قصيرة جداً (كلمة واحدة أو مصطلح قصير) متقاربة بالمعنى (واحد فقط صحيح).
- صياغة الـ JSON الخاصة بالخيارات:
  "options": [
    { "text": "المصطلح الخاطئ 1", "isCorrect": false },
    { "text": "المصطلح الصحيح الفعلي", "isCorrect": true },
    { "text": "المصطلح الخاطئ 3", "isCorrect": false },
    { "text": "المصطلح الخاطئ 4", "isCorrect": false }
  ]`);
    }

    const typeInstructionCombined = typeInstructions.join("\n");

    const difficultyInstructions: string[] = [];
    if (diffs.includes("K1")) {
        difficultyInstructions.push(`
مستوى K1 - معرفة تشغيلية مباشرة (K1 / Recall):
- الأسئلة مباشرة على المهنة، عملية، بدون سيناريوهات طويلة، تقيس استدعاء المعلومات والمصطلحات والنسب والخطوات بشكل مباشر ولكن بصعوبة عالية لغير المحترفين.
- الحقل "cognitiveLevel" يجب أن يكون "K1".
- الحقل "difficulty" يجب أن يكون "HARD" في الـ JSON.`);
    }
    if (diffs.includes("HARD")) {
        difficultyInstructions.push(`
مستوى HARD - تطبيق وتحليل (K2 / Application & Analysis):
- سيناريو مهني واقعي يتطلب معرفة تقنية وتطبيقاً، الخيارات الخاطئة تبدو معقولة جداً لغير المتخصصين.
- الحقل "cognitiveLevel" يجب أن يكون "K2".
- الحقل "difficulty" يجب أن يكون "HARD" في الـ JSON.`);
    }
    if (diffs.includes("EXPERT")) {
        difficultyInstructions.push(`
مستوى EXPERT - تقييم واتخاذ قرار معقد (K3 / Evaluation & Decision Making):
- سيناريو معقد متعدد المراحل مع ظروف استثنائية أو قيود، كل الخيارات تبدو صحيحة جزئياً ولكن واحد فقط هو الأنسب والأفضل.
- الحقل "cognitiveLevel" يجب أن يكون "K3".
- الحقل "difficulty" يجب أن يكون "EXPERT" في الـ JSON.`);
    }
    if (diffs.includes("K4")) {
        difficultyInstructions.push(`
مستوى K4 - فهم وتطبيق أساسي (K4 / Basic Understanding & Application - سهل إلى متوسط):
- أسئلة تقيس الفهم الأساسي للمفاهيم والقواعد والأنظمة المباشرة في العمل، التطبيق المباشر للأدوات في الحالات المعتادة والبديهية.
- الصياغة تكون سهلة ومفهومة للمهنيين الجدد (لا تعقيد أو التواء في السؤال).
- الحقل "cognitiveLevel" يجب أن يكون "K4".
- الحقل "difficulty" يجب أن يكون "HARD" في الـ JSON.`);
    }
    if (diffs.includes("K5")) {
        difficultyInstructions.push(`
مستوى K5 - تحليل وحل مشكلات تشغيلية (K5 / Troubleshooting & Problem Solving - متوسط إلى صعب):
- سيناريوهات ميدانية عملية تصف مشكلة تشغيلية أو عطلاً مفاجئاً أو حالة طارئة في مكان العمل.
- يتطلب من المهني تحليل المعطيات لتشخيص سبب المشكلة وتحديد الإجراء الفني السليم لإصلاحها (Troubleshooting).
- الحقل "cognitiveLevel" يجب أن يكون "K5".
- الحقل "difficulty" يجب أن يكون "HARD" في الـ JSON.`);
    }

    const difficultyInstructionCombined = difficultyInstructions.join("\n");

    const focusString = focusTopic.trim() 
        ? `\nركز بشكل صارم على الموضوع التالي فقط:\n"${focusTopic.trim()}"` 
        : "";

    const isPresetStyle = QUESTION_STYLES.some(s => s.value === questionStyle);
    let styleInstruction = "";

    if (questionStyle === "MIXED") {
        styleInstruction = getMixedStyleInstruction(profName, questionCount);
    } else if (isPresetStyle) {
        styleInstruction = getStyleInstruction(questionStyle, profName);
    } else {
        styleInstruction = `
نمط السؤال المطلوب: صياغة مخصصة بناءً على التالي:
- يجب صياغة الأسئلة باتباع هذا التوجيه والنمط بدقة: "${questionStyle}"
- ركز على الجوانب الميدانية والعملية الواقعية المرتبطة بهذا التوجيه لمهنة "${profName}".`;
    }

    const styleJsonField = questionStyle === "MIXED"
        ? `\n  "questionStyle": "DEFINITION", // حدد النمط المستخدم فعلياً للسؤال`
        : `\n  "questionStyle": "${isPresetStyle ? questionStyle : 'CUSTOM'}",`;

    const allowedTypesString = types.join(", ");
    const allowedDiffsString = diffs.join(", ");

    const forceImagesActive = !!forceImages;

    const imageRuleInstruction = forceImagesActive
        ? `قواعد صارمة ومصيرية بخصوص أسئلة الصور والرسومات التوضيحية (إلزامية ومفروضة 100%):
- **الاعتماد الجوهري على الصورة**: يجب أن يكون كل سؤال مستحيل الحل أو الإجابة عليه دون رؤية الصورة المرفقة. إذا كان بالإمكان الإجابة على السؤال دون الحاجة لرؤية الصورة (من خلال قراءة نص السؤال فقط)، فإن السؤال يُعتبر فاشلاً ويجب رفضه.
- **حظر وصف محتوى الصورة في نص السؤال**: يمنع منعاً باتاً وصف الإشارة المرورية، الأداة، المعدة، أو وضعية العمل داخل نص السؤال نفسه.
  * ❌ صياغة خاطئة (مرفوضة): "بالنظر إلى الصورة المرفقة لإشارة مرورية دائرية ذات إطار أحمر وخلفية بيضاء وبها سيارتان متجاورتان..." (لأنك وصفت الإشارة في نص السؤال، وبالتالي لم يعد الطالب بحاجة لمشاهدة الصورة).
  * ✅ صياغة صحيحة (مطلوبة): "ما هي الدلالة النظامية الصحيحة للإشارة المرورية الموضحة في الصورة؟" أو "ما الإجراء الصحيح الذي يجب اتخاذه عند مواجهة الإشارة الظاهرة في الصورة؟" (هنا الطالب مجبر على فتح الصورة لمعرفة أي إشارة يُقصد).
  * ❌ صياغة خاطئة (مرفوضة): "تظهر في الصورة سيارة متوقفة على مسافة 5 أمتار من المنعطف. ما المخالفة المرتكبة؟"
  * ✅ صياغة صحيحة (مطلوبة): "ما هي المخالفة المرورية المرتكبة في وضعية وقوف المركبة الموضحة في الصورة؟"
- **واقعية الصورة وسهولة البحث عنها**: يجب أن يصف حقل "imageDescription" صورة لشيء واقعي وموجود فعلاً في الواقع (إشارات مرورية معيارية دولية أو سعودية، معدات وأدوات مهنية حقيقية، مشاهد عمل ميدانية شائعة). لا تخترع إشارات أو مواقف غير مألوفة أو غريبة.
- **صياغة حقل وصف الصورة (imageDescription)**: يجب أن يصف الحقل الصورة كأنك تبحث عنها في محرك البحث Google، ويجب أن يكون مختصراً ومحدداً (سطر واحد فقط). مثال: "إشارة منع تجاوز الشاحنات الرسمية" أو "مفتاح ربط عزم الدوران التخصصي لقياس إحكام البراغي" أو "علبة توزيع كهربائية ثلاثية الأطوار مكشوفة الأسلاك".
- يجب تعيين الحقل "requireImage" كـ true دائماً لجميع الأسئلة دون أي استثناء.`
        : `قواعد هامة بخصوص الأسئلة بدون صور (إلزامية ومفروضة):
- يجب أن تكون جميع الأسئلة الـ ${questionCount} المخرجة خالية تماماً من أي صور أو رسومات توضيحية.
- يجب تعيين الحقل "requireImage" كـ false دائماً لجميع الأسئلة دون أي استثناء.
- يجب تعيين الحقل "imageDescription" كـ null دائماً لجميع الأسئلة.`;

    const jsonTemplateRequireImage = forceImagesActive ? "true" : "false";
    const jsonTemplateImageDescription = forceImagesActive 
        ? `"وصف دقيق ومحدد لشيء حقيقي وواقعي (مثال: إشارة منع التجاوز الدولية الكود C13a)"` 
        : "null";

    return `أنت خبير فني رفيع المستوى وممتحن معتمد في برنامج الاعتماد المهني السعودي.
خبرتك تزيد عن 20 عاماً في مهنة "${profName}".
مهمتك صياغة ${questionCount} أسئلة احترافية ودقيقة جداً ومحصورة في المحور: [ ${axisLabel} ]

توزيع الأسئلة المطلوبة:
- يجب توزيع الأسئلة بشكل متوازن وتلقائي بين الأنواع المطلوبة: [ ${allowedTypesString} ].
- يجب توزيع الأسئلة بشكل متوازن وتلقائي بين مستويات الصعوبة المطلوبة: [ ${allowedDiffsString} ].
${focusString}

${styleInstruction}

تفاصيل مستويات الصعوبة والمستويات المعرفية المطلوبة:
${difficultyInstructionCombined}

قواعد صياغة أنواع الأسئلة المطلوبة:
${typeInstructionCombined}

${imageRuleInstruction}

القواعد الأساسية للأسئلة:
- ممنوع أي سؤال يمكن لشخص عادي الإجابة عليه بالتخمين أو بالفطرة.
- كل خيار يجب أن يتضمن تفصيلة تقنية دقيقة مرتبطة بـ "${profName}".
- كل خيار خاطئ = ممارسة شائعة خاطئة يقع فيها المهنيون فعلاً في الميدان.
- خيار واحد فقط صحيح وصالح تماماً.
- يجب توضيح لماذا الإجابة الصحيحة هي الصحيحة تقنياً وميدانياً في حقل الشرح.

تنسيق الإخراج (JSON فقط بدون أي مقدمات أو شروحات خارج الكود):
[{
  "text": "نص السؤال (ممنوع وصف الصورة فيه، بل اسأل عنها مباشرة)",
  "explanation": "الشرح المهني التفصيلي الكامل",
  "difficulty": "HARD", // HARD أو EXPERT
  "axis": "${axis}",
  "cognitiveLevel": "K2", // K1 أو K2 أو K3 أو K4 أو K5 حسب مستوى السؤال
  "type": "MCQ", // MCQ أو TRUE_FALSE أو FILL_BLANK حسب نوع السؤال${styleJsonField}
  "requireImage": ${jsonTemplateRequireImage}, // يجب تعيينه بدقة
  "imageDescription": ${jsonTemplateImageDescription}, // يجب تعيينه بدقة
  "options": [
    { "text": "النص", "isCorrect": true }
  ]
}]`;
}
