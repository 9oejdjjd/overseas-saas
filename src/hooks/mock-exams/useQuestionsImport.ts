/**
 * @file useQuestionsImport.ts
 * @description خطاف مخصص (Custom Hook) للتحكم بعملية استيراد وتوليد الأسئلة بالذكاء الاصطناعي مع معالج رفع صور متسلسل ودعم الأنماط المخصصة per profession وحفظها.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { useState, useEffect, useMemo } from "react";
import { buildPrompt as libBuildPrompt } from "@/lib/mock-exams/promptBuilder";
import { validateQuestionsJson } from "@/lib/mock-exams/validators";

export type ImportStep = "input" | "preview" | "report" | "wizard";

export function useQuestionsImport(professions: any[], onSuccess: () => void, forceImages: boolean = false) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>("input");

    // نموذج المدخلات الموحد
    const [professionId, setProfessionId] = useState("");
    const [searchProfession, setSearchProfession] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const [axis, setAxis] = useState("");
    const [questionTypes, setQuestionTypes] = useState<string[]>(["MCQ"]);
    const [difficulties, setDifficulties] = useState<string[]>(["HARD"]);
    const [focusTopic, setFocusTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [questionStyle, setQuestionStyle] = useState("MIXED");
    const [customStyleText, setCustomStyleText] = useState(""); // Custom style input text
    
    // وضع الاستيراد وملفات JSON
    const [mode, setMode] = useState("skip_duplicates");
    const [jsonText, setJsonText] = useState("");
    const [parsedData, setParsedData] = useState<any[]>([]);

    // حالات معالج رفع الصور المتسلسل (Image Wizard)
    const [wizardQuestions, setWizardQuestions] = useState<any[]>([]);
    const [currentWizardIndex, setCurrentWizardIndex] = useState(0);
    const [wizardImageUrl, setWizardImageUrl] = useState("");
    const [isUploadingWizardImage, setIsUploadingWizardImage] = useState(false);

    // الحالات التشغيلية والتقارير
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
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

    // صياغة واستخراج المحاور المهنية للمهنة المحددة ديناميكياً
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

    const toggleQuestionType = (type: string) => {
        setQuestionTypes(prev => {
            if (prev.includes(type)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(t => t !== type);
            }
            return [...prev, type];
        });
    };

    const toggleDifficulty = (diff: string) => {
        setDifficulties(prev => {
            if (prev.includes(diff)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(d => d !== diff);
            }
            return [...prev, diff];
        });
    };

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
     * حفظ النمط المخصص ديناميكياً بداخل قاعدة البيانات للمهنة المحددة
     */
    const saveCustomStyleToProfession = async (newStyle: string) => {
        if (!selectedProfessionData || !professionId) return;

        const currentConfig = (selectedProfessionData.algorithmConfig as any) || {};
        const currentCustomStyles = currentConfig.customStyles || [];
        
        if (currentCustomStyles.includes(newStyle)) return;

        const updatedConfig = {
            ...currentConfig,
            customStyles: [...currentCustomStyles, newStyle]
        };

        try {
            const res = await fetch(`/api/mock/admin/professions/${professionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ algorithmConfig: updatedConfig })
            });
            if (res.ok) {
                // تحديث الحالة محلياً للملف المعروض بالواجهة
                selectedProfessionData.algorithmConfig = updatedConfig;
            }
        } catch (e) {
            console.error("[useQuestionsImport] Failed to save custom style:", e);
        }
    };

    const buildPrompt = () => {
        const axisLabel = dynamicAxes.find((a: any) => a.value === axis)?.label || axis || "[اسم المحور]";
        const profName = selectedProfessionData?.name || "[اسم المهنة]";

        const finalStyle = questionStyle === "CUSTOM" ? customStyleText : questionStyle;

        return libBuildPrompt({
            profName,
            axisLabel,
            axis,
            focusTopic,
            questionType: questionTypes,
            difficulty: difficulties,
            questionCount,
            questionStyle: finalStyle,
            forceImages
        });
    };

    const copyPrompt = () => {
        if (!professionId || !axis) {
            setError("يجب اختيار المهنة والمحور أولاً لبناء البرومبت");
            return;
        }
        if (questionStyle === "CUSTOM" && !customStyleText.trim()) {
            setError("يرجى كتابة نص التوجيه للنمط المخصص أولاً");
            return;
        }
        
        // حفظ النمط المخصص بالخلفية إذا كان المستخدم قد كتب نمطاً مخصصاً
        if (questionStyle === "CUSTOM" && customStyleText.trim()) {
            saveCustomStyleToProfession(customStyleText.trim());
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
        if (questionStyle === "CUSTOM" && !customStyleText.trim()) {
            setError("يرجى كتابة نص التوجيه للنمط المخصص أولاً");
            return;
        }

        // حفظ النمط المخصص بالخلفية
        if (questionStyle === "CUSTOM" && customStyleText.trim()) {
            saveCustomStyleToProfession(customStyleText.trim());
        }

        setAiLoading(true);
        setError(null);

        const finalStyle = questionStyle === "CUSTOM" ? customStyleText : questionStyle;

        try {
            const res = await fetch("/api/mock/admin/generate-ai-partial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    professionId, 
                    axis, 
                    count: questionCount,
                    difficulties,
                    questionTypes,
                    focusTopic,
                    questionStyle: finalStyle,
                    forceImages
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                onSuccess();
                
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

    const validateAndPreview = () => {
        setError(null);
        setWarnings([]);
        if (!professionId) return setError("يجب اختيار المهنة أولاً");
        if (!axis) return setError("يجب اختيار المحور أولاً");

        const result = validateQuestionsJson(jsonText, questionTypes[0] || "MCQ");
        
        if (!result.success) {
            setError(result.error);
        } else {
            setParsedData(result.parsedData);
            setWarnings(result.warnings || []);
            setStep("preview");
        }
    };

    /**
     * استيراد عادي ومباشر لجميع الأسئلة دفعة واحدة بنقرة زر واحدة (بدون صور)
     */
    const handleImportDirect = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/mock/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professionId,
                    axis,
                    mode,
                    questionType: questionTypes[0] || "MCQ",
                    questions: parsedData
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "حدث خطأ أثناء الاستيراد");
            } else {
                setReport(data);
                setStep("report");
                onSuccess();
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال بالخادم أثناء استيراد الأسئلة");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * تشغيل معالج الصور (Wizard) للأسئلة المحددة
     */
    const handleImportWithImages = async () => {
        setError(null);
        // تصفية الأسئلة التي تحتاج إلى صور
        const questionsNeedingImages = parsedData.filter(q => q.requireImage === true || q.requireImage === "true");
        const normalQuestions = parsedData.filter(q => !q.requireImage || q.requireImage === "false");

        if (questionsNeedingImages.length > 0) {
            setWizardQuestions(questionsNeedingImages);
            setCurrentWizardIndex(0);
            setWizardImageUrl("");
            setStep("wizard");
            
            // حفظ الأسئلة العادية في الخلفية إن وجدت
            if (normalQuestions.length > 0) {
                try {
                    await fetch("/api/mock/admin/questions/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            professionId,
                            axis,
                            mode,
                            questionType: questionTypes[0] || "MCQ",
                            questions: normalQuestions
                        })
                    });
                } catch (e) {
                    console.error("[useQuestionsImport] Background normal questions import failed:", e);
                }
            }
        } else {
            setError("ملف الـ JSON لا يحتوي على أي سؤال يطلب صورة (requireImage: true). يرجى استخدام شاشة الاستيراد العادي.");
        }
    };

    const uploadWizardImageFile = async (file: File) => {
        setIsUploadingWizardImage(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/mock/admin/upload-image", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.url) {
                setWizardImageUrl(data.url);
            } else {
                setError(data.error || "فشل رفع الصورة");
            }
        } catch (err) {
            setError("حدث خطأ أثناء رفع الصورة");
        } finally {
            setIsUploadingWizardImage(false);
        }
    };

    const handleWizardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadWizardImageFile(file);
    };

    const saveWizardQuestion = async (skip = false) => {
        setError(null);
        const currentQuestion = wizardQuestions[currentWizardIndex];

        if (!skip && !wizardImageUrl) {
            setError("يرجى رفع الصورة المطلوبة أو الضغط على زر تخطي السؤال");
            return;
        }

        setIsLoading(true);

        const payload = {
            ...currentQuestion,
            imageUrl: skip ? null : wizardImageUrl
        };

        try {
            const res = await fetch("/api/mock/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professionId,
                    axis,
                    mode: "append",
                    questionType: currentQuestion.type || questionTypes[0] || "MCQ",
                    questions: [payload]
                })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "فشل حفظ السؤال الحالي");
                setIsLoading(false);
                return;
            }

            const nextIndex = currentWizardIndex + 1;
            if (nextIndex < wizardQuestions.length) {
                setCurrentWizardIndex(nextIndex);
                setWizardImageUrl("");
            } else {
                setReport({
                    imported: wizardQuestions.length,
                    failed: 0,
                    skippedDuplicates: 0,
                    errors: []
                });
                setStep("report");
                onSuccess();
            }
        } catch (e) {
            setError("حدث خطأ أثناء الاتصال بالخادم لحفظ السؤال");
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
        setWarnings([]);
        setWizardQuestions([]);
        setCurrentWizardIndex(0);
        setWizardImageUrl("");
    };

    const previewStats = useMemo(() => {
        if (!parsedData.length) return null;
        let hard = 0, expert = 0, k1 = 0, k2 = 0, k3 = 0, k4 = 0, k5 = 0, imageQuestionsCount = 0;
        parsedData.forEach(q => {
            if (q.difficulty === "EXPERT") expert++;
            else hard++;

            if (q.cognitiveLevel === "K1") k1++;
            else if (q.cognitiveLevel === "K3") k3++;
            else if (q.cognitiveLevel === "K4") k4++;
            else if (q.cognitiveLevel === "K5") k5++;
            else k2++;

            if (q.requireImage === true || q.requireImage === "true") imageQuestionsCount++;
        });
        return { total: parsedData.length, hard, expert, k1, k2, k3, k4, k5, imageQuestionsCount };
    }, [parsedData]);

    return {
        isOpen,
        setIsOpen,
        step,
        setStep,
        
        professionId,
        setProfessionId,
        searchProfession,
        setSearchProfession,
        dropdownOpen,
        setDropdownOpen,
        axis,
        setAxis,
        questionTypes,
        setQuestionTypes,
        toggleQuestionType,
        difficulties,
        setDifficulties,
        toggleDifficulty,
        focusTopic,
        setFocusTopic,
        questionCount,
        setQuestionCount,
        questionStyle,
        setQuestionStyle,
        customStyleText,
        setCustomStyleText,
        
        mode,
        setMode,
        jsonText,
        setJsonText,
        parsedData,

        wizardQuestions,
        currentWizardIndex,
        wizardImageUrl,
        setWizardImageUrl,
        isUploadingWizardImage,
        handleWizardImageUpload,
        uploadWizardImageFile,
        saveWizardQuestion,
        
        error,
        setError,
        warnings,
        isLoading,
        report,
        promptCopied,
        aiLoading,
        axisStats,
        
        dynamicAxes,
        selectedProfessionData,
        previewStats,
        
        handleFileUpload,
        buildPrompt,
        copyPrompt,
        generatePartialAI,
        validateAndPreview,
        handleImportDirect,
        handleImportWithImages,
        resetForm
    };
}
