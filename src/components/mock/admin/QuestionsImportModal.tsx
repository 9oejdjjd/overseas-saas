"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, UploadCloud, AlertCircle, FileJson, CheckCircle2, Copy, Search, Sparkles, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Props {
    professions: any[];
    questions: any[];
    onSuccess: () => void;
}

// Removed hardcoded AXIS_OPTIONS, will be computed dynamically

export function QuestionsImportModal({ professions, questions, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"input" | "preview" | "report">("input");

    // Unified Form State
    const [professionId, setProfessionId] = useState("");
    const [searchProfession, setSearchProfession] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const [axis, setAxis] = useState("");
    const [questionType, setQuestionType] = useState("MCQ");
    const [difficulty, setDifficulty] = useState("HARD");
    const [focusTopic, setFocusTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    
    // Import Mode
    const [mode, setMode] = useState("skip_duplicates");
    const [jsonText, setJsonText] = useState("");
    const [parsedData, setParsedData] = useState<any[]>([]);

    // Action State
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    // Prompt Engineering UI
    const [promptCopied, setPromptCopied] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [axisStats, setAxisStats] = useState<Record<string, Record<string, number>>>({});

    // Fetch stats when profession changes
    useEffect(() => {
        if (!professionId) return;
        fetch(`/api/mock/admin/professions/${professionId}/axis-stats`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setAxisStats(data.stats || {});
            })
            .catch(e => console.error(e));
    }, [professionId, report]);

    // Handle File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) setJsonText(event.target.result as string);
        };
        reader.readAsText(file);
    };

    const selectedProfessionData = professions.find(p => p.id === professionId);

    const dynamicAxes = useMemo(() => {
        if (!selectedProfessionData) return [];
        const config = selectedProfessionData.algorithmConfig as any;
        if (config && config.axes && config.axes.length > 0) {
            return config.axes.map((a: any) => ({ value: a.name, label: a.name }));
        }
        // Fallback to old hardcoded axes if config doesn't exist
        return [
            { value: "HEALTH_SAFETY", label: "الصحة والسلامة في بيئة العمل" },
            { value: "PROFESSION_KNOWLEDGE", label: "المعرفة المهنية التخصصية" },
            { value: "GENERAL_SKILLS", label: "المهارات العامة وجودة التنفيذ" },
            { value: "OCCUPATIONAL_SAFETY", label: "السلامة المهنية والمخاطر المباشرة" },
            { value: "CORRECT_METHODS", label: "الأساليب الصحيحة والقياسية للمهنة" },
            { value: "PROFESSIONAL_BEHAVIOR", label: "السلوك الوظيفي والانضباط المهني" },
            { value: "TOOLS_AND_EQUIPMENT", label: "استخدام الأدوات والمعدات وتشخيصها" },
            { value: "EMERGENCIES_FIRST_AID", label: "الطوارئ والإسعافات الأولية" }
        ];
    }, [selectedProfessionData]);

    // Prompt Builder Logic
    const buildPrompt = () => {
        const axisLabel = dynamicAxes.find((a: any) => a.value === axis)?.label || axis || "[اسم المحور]";
        const profName = selectedProfessionData?.name || "[اسم المهنة]";

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

        const focusString = focusTopic.trim() ? `\n🎯 ركز بشكل صارم على الموضوع التالي فقط:\n"${focusTopic.trim()}"` : "";

        if (difficulty === "K1") {
            const arabicQuestionType = questionType === "TRUE_FALSE" 
                ? "صح وخطأ" 
                : questionType === "FILL_BLANK" 
                    ? "إكمال الفراغات" 
                    : "اختيار من متعدد";

            const optionsCountInstruction = questionType === "TRUE_FALSE" 
                ? "خيارين فقط" 
                : "4 خيارات فقط";

            const difficultyValue = questionType === "MCQ" ? "VERY_HARD" : "HARD";

            return `أنت خبير فني رفيع المستوى وممتحن معتمد في برنامج الاعتماد المهني السعودي (pacc.sa).
تمتلك خبرة تتجاوز 20 عاماً في مهنة "${profName}".

مهمتك إنشاء ${questionCount} أسئلة احترافية عالية الصعوبة من نوع:
${arabicQuestionType} 
ويجب أن تكون الأسئلة:
- مباشرة على المهنة
- عملية جداً
- تعتمد على المعرفة المهنية الدقيقة
- بدون سيناريوهات طويلة أو قصص
- تقيس الفهم الفني العميق والخبرة الواقعية

محصورة فقط في المحور:
[${axisLabel}]
${focusString}

❌ ممنوع الخروج إلى مواضيع أخرى داخل المحور
❌ ممنوع التكرار
❌ ممنوع الأسئلة العامة أو النظرية السطحية

═══════════════════════════════════════════
📊 مستوى الصعوبة المطلوب:
🔴 VERY HARD — مستوى خبير

■ تعريف المستوى المطلوب:
- الأسئلة تستهدف مهني محترف يمتلك خبرة فعلية طويلة
- تعتمد على معرفة تقنية دقيقة جداً داخل المهنة
- الخيارات متقاربة وصعبة التمييز
- الأخطاء الشائعة الواقعية يجب أن تظهر داخل الخيارات
- لا يمكن حل السؤال بالفطرة أو التخمين
- يتطلب فهم إجراءات العمل الفعلية والمخاطر المهنية الحقيقية

🎯 المستوى المعرفي المطلوب:
K1 — Recall (استدعاء معرفي مباشر)

لكن بصعوبة عالية جداً عبر:
- التفاصيل المهنية الدقيقة
- المصطلحات الفنية
- القيم التشغيلية
- الإجراءات الصحيحة المحددة
- ترتيب الخطوات
- أدوات ومعدات المهنة
- اشتراطات السلامة الدقيقة
- الحدود التشغيلية والمخاطر الواقعية

═══════════════════════════════════════════
⚠️ القواعد الحديدية — أي مخالفة تعتبر فشل:
═══════════════════════════════════════════

🔴 القاعدة 1: ممنوع السيناريوهات الطويلة
- السؤال يجب أن يكون مباشر ومهني
- لا تستخدم قصة أو حوار أو وصف مطول
- يسمح فقط بسياق مهني قصير جداً عند الحاجة

🔴 القاعدة 2: حظر الأسئلة السهلة
- ممنوع أي سؤال يعرفه الشخص العادي
- ممنوع الأسئلة التعليمية المبتدئة
- كل سؤال يجب أن يحتوي نقطة تقنية دقيقة

🔴 القاعدة 3: الخيارات الاحترافية
- جميع الخيارات يجب أن تبدو صحيحة لغير الخبير
- الفرق بين الخيارات يكون بتفصيلة مهنية دقيقة
- ممنوع وجود خيار واضح جداً أو مضحك

🔴 القاعدة 4: التركيز على المهنة نفسها
- الأسئلة يجب أن تكون مرتبطة مباشرة بممارسات مهنة "${profName}"
- تجنب المعلومات العامة غير المرتبطة بالعمل الميداني الحقيقي

🔴 القاعدة 5: الشرح المهني الإجباري
لكل سؤال:
- شرح لماذا الإجابة الصحيحة صحيحة
- شرح لماذا كل خيار خاطئ غير صحيح
- التوضيح يجب أن يكون عملي وتقني

🔴 نوع السؤال:
- ${arabicQuestionType}
- ${optionsCountInstruction}
- خيار واحد صحيح
- جميع الخيارات متقاربة بالطول

═══════════════════════════════════════════
📋 تنسيق الإخراج:
JSON فقط بدون أي نص إضافي

[{
  "text": "السؤال المهني المباشر",
  "explanation": "الشرح الفني التفصيلي الكامل",
  "difficulty": "${difficultyValue}",
  "axis": "${axis}",
  "cognitiveLevel": "K1",
  "options": [${optionsTemplate}
  ]
}]`;
        }

        return `أنت خبير فني رفيع المستوى وممتحن معتمد في برنامج الاعتماد المهني السعودي (pacc.sa).
خبرتك تزيد عن 20 عاماً في مهنة "${profName}".
مهمتك صياغة ${questionCount} أسئلة دقيقة (Single Best Answer) 
محصورة في المحور: [ ${axisLabel} ]

🎯 ركز جداً في الأسئلة على الموضوع الدقيق التالي حصراً:
"${focusTopic.trim()}"
تجنب المواضيع المتكررة الأخرى في هذا المحور.

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
  "options": [${optionsTemplate}
  ]
}]`;
    };

    const copyPrompt = () => {
        if (!professionId || !axis) {
            setError("يجب اختيار المهنة والمحور أولاً لبناء البرومبت");
            return;
        }
        navigator.clipboard.writeText(buildPrompt());
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 3000);
    };

    const generatePartialAI = async () => {
        if (!professionId || !axis) {
            setError("يجب اختيار المهنة والمحور أولاً للتوليد");
            return;
        }
        setAiLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/mock/admin/generate-ai-partial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    professionId, 
                    axis, 
                    count: questionCount,
                    difficulty: difficulty === "K1" ? "HARD" : difficulty,
                    cognitiveLevel: difficulty === "K1" ? "K1" : (difficulty === "EXPERT" ? "K3" : "K2"),
                    questionType,
                    focusTopic
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                onSuccess(); // refresh parent
                
                // Refresh local stats
                fetch(`/api/mock/admin/professions/${professionId}/axis-stats`)
                    .then(r => r.json())
                    .then(d => d.success && setAxisStats(d.stats || {}))
                    .catch(() => {});
            } else {
                setError(`خطأ التوليد: ${data.error}`);
            }
        } catch (e: any) {
            setError(`فشل الاتصال: ${e.message}`);
        } finally {
            setAiLoading(false);
        }
    };

    // Validation Logic
    const validateAndPreview = () => {
        setError(null);
        if (!professionId) return setError("يجب اختيار المهنة أولاً");
        if (!axis) return setError("يجب اختيار المحور أولاً");
        if (!jsonText.trim()) return setError("يجب إدخال نص الـ JSON في الحقل المخصص");

        try {
            // Smart JSON parsing (extracts array if it's within markdown block)
            let cleanedText = jsonText;
            const startIdx = cleanedText.indexOf('[');
            const endIdx = cleanedText.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
                cleanedText = cleanedText.substring(startIdx, endIdx + 1);
            }

            const parsed = JSON.parse(cleanedText);
            if (!Array.isArray(parsed)) return setError("يجب أن يكون الـ JSON عبارة عن مصفوفة Array [...]");
            if (parsed.length === 0) return setError("المصفوفة فارغة. لا يوجد أسئلة.");

            // Client-side generic shape check
            for (let i = 0; i < parsed.length; i++) {
                const q = parsed[i];
                if (!q.text) return setError(`السؤال رقم ${i + 1} يفتقد لنص السؤال 'text'`);
                
                const expectedOptions = questionType === "TRUE_FALSE" ? 2 : 4;
                if (!q.options || !Array.isArray(q.options) || q.options.length !== expectedOptions) {
                    return setError(`السؤال رقم ${i + 1} يجب أن يحتوي على ${expectedOptions} خيارات بالضبط لنوع الأسئلة المحدد`);
                }
                const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                if (correctCount !== 1) {
                    return setError(`السؤال رقم ${i + 1} يجب أن يحتوي على خيار واحد صحيح فقط`);
                }
            }

            setParsedData(parsed);
            setStep("preview");
        } catch (err: any) {
            setError("خطأ في قراءة نص الـ JSON: الرجاء التأكد من صحة الصيغة. " + err.message);
        }
    };

    // Import Logic
    const handleImport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/mock/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professionId,
                    axis,
                    mode,
                    questionType,
                    questions: parsedData
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "حدث خطأ غير متوقع أثناء الاستيراد");
                setStep("input");
            } else {
                setReport(data);
                setStep("report");
                onSuccess(); // Refresh question list in background
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال بالخادم");
            setStep("input");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep("input");
        setJsonText("");
        setParsedData([]);
        setReport(null);
        setError(null);
    };

    // Calculate stats for preview
    const previewStats = useMemo(() => {
        if (!parsedData.length) return null;
        let hard = 0, expert = 0, k1 = 0, k2 = 0, k3 = 0;
        parsedData.forEach(q => {
            if (q.difficulty === "EXPERT") expert++;
            else hard++;

            if (q.cognitiveLevel === "K1") k1++;
            else if (q.cognitiveLevel === "K3") k3++;
            else k2++;
        });
        return { total: parsedData.length, hard, expert, k1, k2, k3 };
    }, [parsedData]);


    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setTimeout(resetForm, 300);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md">
                    <Sparkles className="h-4 w-4" />
                    استيراد وتوليد الأسئلة بـ الذكاء الاصطناعي
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 rounded-xl" dir="rtl">
                <div className="bg-white rounded-xl">
                    <DialogHeader className="p-6 border-b bg-gray-50/50">
                        <DialogTitle className="flex flex-col gap-1">
                            <span className="text-2xl flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-purple-600" />
                                استيراد وتوليد بنك الأسئلة المتقدم
                            </span>
                            <span className="text-sm font-normal text-gray-500">
                                استخدم محرك Gemini الاحترافي لتوليد أسئلة عالية الجودة، أو استوردها يدوياً باستخدام الـ JSON.
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {step === "input" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse">
                            {/* RIGHT PANEL: Prompt Engineering */}
                            <div className="p-6 space-y-6 bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">1</span>
                                        هندسة الذكاء الاصطناعي (Prompt Engineering)
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {/* Row 1 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 relative">
                                                <Label className="font-semibold text-gray-700">المهنة المستهدفة <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        className="pr-9 focus:bg-white transition-colors bg-white shadow-sm"
                                                        placeholder="ابحث واختر المهنة..."
                                                        value={searchProfession}
                                                        onChange={(e) => {
                                                            setSearchProfession(e.target.value);
                                                            setDropdownOpen(true);
                                                        }}
                                                        onFocus={() => setDropdownOpen(true)}
                                                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                                    />
                                                </div>
                                                {dropdownOpen && (
                                                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                        {professions.filter(p => p.name.includes(searchProfession)).map(p => (
                                                            <div
                                                                key={p.id}
                                                                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b last:border-0 border-gray-50"
                                                                onClick={() => {
                                                                    setProfessionId(p.id);
                                                                    setSearchProfession(p.name);
                                                                    setDropdownOpen(false);
                                                                }}
                                                            >
                                                                {p.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700">المحور المهني <span className="text-red-500">*</span></Label>
                                                <Select value={axis} onValueChange={setAxis}>
                                                    <SelectTrigger className="bg-white shadow-sm">
                                                        <SelectValue placeholder="اختر المحور" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dynamicAxes.map((opt: any) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                <div className="flex flex-col gap-1 py-1">
                                                                    <span>{opt.label}</span>
                                                                    {professionId && axisStats[opt.value] && (
                                                                        <div className="flex gap-2 text-[10px] text-gray-500 font-medium" dir="rtl">
                                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">متعدد: {axisStats[opt.value].MCQ || 0}</span>
                                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">صح/خطأ: {axisStats[opt.value].TRUE_FALSE || 0}</span>
                                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">فراغات: {axisStats[opt.value].FILL_BLANK || 0}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700">نوع الأسئلة <span className="text-red-500">*</span></Label>
                                                <Select value={questionType} onValueChange={setQuestionType}>
                                                    <SelectTrigger className="bg-white shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MCQ">اختيار من متعدد (MCQ)</SelectItem>
                                                        <SelectItem value="TRUE_FALSE">صح أو خطأ (True/False)</SelectItem>
                                                        <SelectItem value="FILL_BLANK">إكمال الفراغات (Fill in the Blank)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700">مستوى الصعوبة <span className="text-red-500">*</span></Label>
                                                <Select value={difficulty} onValueChange={setDifficulty}>
                                                    <SelectTrigger className="bg-white shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HARD">🔴 HARD — صعب وواقعي (K2)</SelectItem>
                                                        <SelectItem value="EXPERT">💀 EXPERT — معقد للخبراء (K3)</SelectItem>
                                                        <SelectItem value="K1">📘 K1 — معرفة مباشرة (K1)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Row 3 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700">الموضوع الفرعي <span className="text-gray-400 font-normal text-xs">(اختياري للتركيز)</span></Label>
                                                <Input 
                                                    placeholder="مثال: التعامل مع المواد الكيميائية..." 
                                                    value={focusTopic} 
                                                    onChange={e => setFocusTopic(e.target.value)}
                                                    className="bg-white shadow-sm"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700">عدد الأسئلة المطلوب <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="number" 
                                                    min={1} 
                                                    max={30} 
                                                    value={questionCount} 
                                                    onChange={e => setQuestionCount(Number(e.target.value))}
                                                    className="bg-white shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 flex flex-col gap-3">
                                            <Button 
                                                onClick={copyPrompt} 
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold py-6 text-lg shadow-md"
                                            >
                                                {promptCopied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                                                {promptCopied ? "تم نسخ البرومبت بنجاح! الصقه في Gemini" : "📋 نسخ البرومبت الاحترافي لـ Gemini"}
                                            </Button>

                                            <Button 
                                                onClick={generatePartialAI} 
                                                disabled={aiLoading}
                                                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 gap-2 font-bold py-6 text-lg"
                                            >
                                                {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                                {aiLoading ? "جاري التوليد وحفظ الأسئلة مباشرة..." : "⚡ توليد تلقائي (مباشر عبر API)"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LEFT PANEL: Import & Validation */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">2</span>
                                        إدخال المخرجات والاستيراد (JSON)
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-semibold text-gray-700">ألصق الكود (JSON) الذي ولّده Gemini هنا <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                placeholder='[{ "text": "...", "options": [...] }]'
                                                className="font-mono text-left w-full h-[250px] resize-none bg-slate-50 border-slate-200 focus:bg-white shadow-inner"
                                                dir="ltr"
                                                value={jsonText}
                                                onChange={(e) => setJsonText(e.target.value)}
                                            />
                                            
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="relative overflow-hidden">
                                                    <input 
                                                        type="file" 
                                                        accept=".json" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={handleFileUpload}
                                                    />
                                                    <Button type="button" variant="outline" size="sm" className="gap-2 text-gray-600 bg-white shadow-sm pointer-events-none">
                                                        <UploadCloud className="h-4 w-4" />
                                                        أو رفع ملف .json
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                            <Label className="font-semibold text-orange-800 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                آلية التعامل مع التكرار (عند الاستيراد)
                                            </Label>
                                            <Select value={mode} onValueChange={setMode}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="skip_duplicates">تخطي الأسئلة المكررة فقط (آمن)</SelectItem>
                                                    <SelectItem value="append">إضافة قسرية بدون فحص التكرار</SelectItem>
                                                    <SelectItem value="replace_axis_questions">مسح جميع أسئلة المحور للمهنة، ثم إضافة الجديدة (خطر)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 text-sm font-medium">
                                                <AlertCircle className="h-5 w-5 shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}

                                        <Button 
                                            onClick={validateAndPreview} 
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg shadow-md gap-2"
                                        >
                                            <FileJson className="h-5 w-5" />
                                            معاينة الأسئلة وتدقيق الجودة
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === "preview" && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        تم التدقيق بنجاح: {parsedData.length} أسئلة جاهزة للاستيراد
                                    </h3>
                                    <p className="text-gray-500 mt-1">تأكد من جودة وتوزيع الأسئلة قبل الاعتماد النهائي في النظام.</p>
                                </div>
                                <Button variant="outline" onClick={() => setStep("input")}>العودة والتعديل</Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border text-center">
                                    <p className="text-sm text-gray-500 mb-1">الأسئلة الصعبة (HARD)</p>
                                    <p className="text-2xl font-black text-slate-700">{previewStats?.hard}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-center">
                                    <p className="text-sm text-purple-600 mb-1">الخبراء (EXPERT)</p>
                                    <p className="text-2xl font-black text-purple-700">{previewStats?.expert}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                                    <p className="text-sm text-amber-600 mb-1">تذكر (K1)</p>
                                    <p className="text-2xl font-black text-amber-700">{previewStats?.k1}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                    <p className="text-sm text-blue-600 mb-1">تطبيقي (K2)</p>
                                    <p className="text-2xl font-black text-blue-700">{previewStats?.k2}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                                    <p className="text-sm text-indigo-600 mb-1">تقييمي (K3)</p>
                                    <p className="text-2xl font-black text-indigo-700">{previewStats?.k3}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 border rounded-xl p-4 max-h-[40vh] overflow-y-auto space-y-4">
                                {parsedData.slice(0, 5).map((q, idx) => (
                                    <div key={idx} className="bg-white border p-4 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-gray-800 text-sm">{idx + 1}. {q.text}</p>
                                            <div className="flex gap-2">
                                                {q.difficulty === "EXPERT" ? <Badge className="bg-purple-500">EXPERT 💀</Badge> : <Badge variant="secondary">HARD</Badge>}
                                                <Badge variant="outline">{q.cognitiveLevel}</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                            {q.options.map((opt: any, oIdx: number) => (
                                                <div key={oIdx} className={`p-2 text-xs rounded-md border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                                    {opt.text} {opt.isCorrect && '✓'}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-md border border-blue-100 text-xs text-blue-800">
                                            <span className="font-bold text-blue-600">الشرح: </span>
                                            {q.explanation || "لا يوجد شرح"}
                                        </div>
                                    </div>
                                ))}
                                {parsedData.length > 5 && (
                                    <div className="text-center p-4 text-gray-500 text-sm bg-white border border-dashed rounded-lg">
                                        و {parsedData.length - 5} أسئلة أخرى ...
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 text-sm font-medium">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <Button 
                                onClick={handleImport} 
                                disabled={isLoading} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-md gap-2"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                                {isLoading ? "جاري الاستيراد والحفظ..." : "اعتماد واستيراد الأسئلة للنظام بشكل نهائي"}
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: REPORT */}
                    {step === "report" && report && (
                        <div className="p-8 text-center space-y-6 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900">تمت العملية بنجاح!</h3>
                            
                            <div className="bg-gray-50 border rounded-2xl p-6 w-full max-w-lg space-y-4">
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-gray-600 font-medium">إجمالي الأسئلة المستوردة</span>
                                    <span className="text-xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">{report.imported} سؤال</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-gray-600 font-medium">الأسئلة المكررة (تم تخطيها)</span>
                                    <span className="text-xl font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{report.skippedDuplicates} سؤال</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">حالة العملية</span>
                                    <Badge variant="default" className="bg-blue-600">مكتملة</Badge>
                                </div>
                            </div>

                            <Button onClick={() => setIsOpen(false)} className="px-8 mt-4">إغلاق النافذة</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
