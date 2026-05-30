/**
 * @file useQuestionsImport.ts
 * @description خطاف مخصص (Custom Hook) للتحكم بعملية استيراد وتوليد الأسئلة بالذكاء الاصطناعي.
 * يستعين هذا الخطاف بمكتبة صياغة البرومبتات (promptBuilder) ومكتبة التدقيق (validators) للتحقق وإعداد البيانات.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { useState, useEffect, useMemo } from "react";
import { buildPrompt as libBuildPrompt } from "@/lib/mock-exams/promptBuilder";
import { validateQuestionsJson } from "@/lib/mock-exams/validators";

export type ImportStep = "input" | "preview" | "report";

export function useQuestionsImport(professions: any[], onSuccess: () => void) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>("input");

    // نموذج المدخلات الموحد
    const [professionId, setProfessionId] = useState("");
    const [searchProfession, setSearchProfession] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const [axis, setAxis] = useState("");
    const [questionType, setQuestionType] = useState("MCQ");
    const [difficulty, setDifficulty] = useState("HARD");
    const [focusTopic, setFocusTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    
    // وضع الاستيراد وملفات JSON
    const [mode, setMode] = useState("skip_duplicates");
    const [jsonText, setJsonText] = useState("");
    const [parsedData, setParsedData] = useState<any[]>([]);

    // الحالات التشغيلية والتقارير
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    // حالات التفاعل مع السيرفر والنسخ
    const [promptCopied, setPromptCopied] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [axisStats, setAxisStats] = useState<Record<string, Record<string, number>>>({});

    // جلب الإحصائيات الخاصة بالمحاور عند تعديل التخصص المستهدف
    useEffect(() => {
        if (!professionId) return;
        fetch(`/api/mock/admin/professions/${professionId}/axis-stats`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAxisStats(data.stats || {});
                }
            })
            .catch(e => console.error("[useQuestionsImport] Error fetching axis stats:", e));
    }, [professionId, report]);

    // تحديد بيانات المهنة المحددة حالياً
    const selectedProfessionData = useMemo(() => {
        return professions.find(p => p.id === professionId);
    }, [professions, professionId]);

    // صياغة واستخراج المحاور المهنية للمهنة المحددة
    const dynamicAxes = useMemo(() => {
        if (!selectedProfessionData) return [];
        const config = selectedProfessionData.algorithmConfig as any;
        if (config && config.axes && config.axes.length > 0) {
            return config.axes.map((a: any) => ({ value: a.name, label: a.name }));
        }
        
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

    /**
     * معالجة وتحميل محتوى ملف الـ JSON المرفوع
     */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setJsonText(event.target.result as string);
            }
        };
        reader.readAsText(file);
    };

    /**
     * تجميع البرومبت الاحترافي بالاعتماد على المساعد promptBuilder
     */
    const buildPrompt = () => {
        const axisLabel = dynamicAxes.find((a: any) => a.value === axis)?.label || axis || "[اسم المحور]";
        const profName = selectedProfessionData?.name || "[اسم المهنة]";

        return libBuildPrompt({
            profName,
            axisLabel,
            axis,
            questionType,
            difficulty,
            focusTopic,
            questionCount
        });
    };

    /**
     * نسخ البرومبت المبني إلى الحافظة
     */
    const copyPrompt = () => {
        if (!professionId || !axis) {
            setError("يجب اختيار المهنة والمحور أولاً لبناء البرومبت");
            return;
        }
        
        navigator.clipboard.writeText(buildPrompt());
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 3000);
    };

    /**
     * استدعاء التوليد التلقائي للأسئلة وحفظها مباشرة عبر السيرفر
     */
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
                onSuccess(); // تحديث القوائم في المكون الأب
                
                // تحديث الإحصائيات المحلية
                fetch(`/api/mock/admin/professions/${professionId}/axis-stats`)
                    .then(r => r.json())
                    .then(d => d.success && setAxisStats(d.stats || {}))
                    .catch(() => {});
            } else {
                setError(`خطأ التوليد: ${data.error}`);
            }
        } catch (e: any) {
            setError(`فشل الاتصال بالخادم: ${e.message}`);
        } finally {
            setAiLoading(false);
        }
    };

    /**
     * التحقق من سلامة وصياغة الـ JSON المدخل والانتقال للمعاينة
     */
    const validateAndPreview = () => {
        setError(null);
        if (!professionId) return setError("يجب اختيار المهنة أولاً");
        if (!axis) return setError("يجب اختيار المحور أولاً");

        const result = validateQuestionsJson(jsonText, questionType);
        
        if (!result.success) {
            setError(result.error);
        } else {
            setParsedData(result.parsedData);
            setStep("preview");
        }
    };

    /**
     * استدعاء إرسال واستيراد الأسئلة المعتمدة إلى قاعدة البيانات
     */
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
                onSuccess(); // تحديث بنك الأسئلة بالخلفية
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال بالخادم أثناء استيراد الأسئلة");
            setStep("input");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * إعادة تصفير وتهيئة النموذج
     */
    const resetForm = () => {
        setStep("input");
        setJsonText("");
        setParsedData([]);
        setReport(null);
        setError(null);
    };

    // حساب الإحصائيات للمعاينة في تبويب المعاينة قبل الاستيراد النهائي
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

    return {
        isOpen,
        setIsOpen,
        step,
        setStep,
        
        // نموذج
        professionId,
        setProfessionId,
        searchProfession,
        setSearchProfession,
        dropdownOpen,
        setDropdownOpen,
        axis,
        setAxis,
        questionType,
        setQuestionType,
        difficulty,
        setDifficulty,
        focusTopic,
        setFocusTopic,
        questionCount,
        setQuestionCount,
        
        // استيراد
        mode,
        setMode,
        jsonText,
        setJsonText,
        parsedData,
        
        // عمليات وتشغيل
        error,
        setError,
        isLoading,
        report,
        promptCopied,
        aiLoading,
        axisStats,
        
        // حسابات
        dynamicAxes,
        selectedProfessionData,
        previewStats,
        
        // دوال
        handleFileUpload,
        buildPrompt,
        copyPrompt,
        generatePartialAI,
        validateAndPreview,
        handleImport,
        resetForm
    };
}
