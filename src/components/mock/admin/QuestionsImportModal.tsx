/**
 * @file QuestionsImportModal.tsx
 * @description المكون الإداري الخاص بتوليد واستيراد الأسئلة (بدون صور) دفعة واحدة وبضغطة زر واحدة.
 * يدعم إضافة الأنماط المخصصة وعرضها لكل مهنة على حدة. خالي تماماً من الرموز التعبيرية.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
    UploadCloud, 
    AlertCircle, 
    FileJson, 
    CheckCircle2, 
    Copy, 
    Search, 
    Sparkles, 
    Loader2, 
    Check 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuestionsImport } from "@/hooks/mock-exams/useQuestionsImport";
import { QUESTION_STYLES } from "@/lib/mock-exams/promptBuilder";

interface Props {
    professions: any[];
    questions?: any[];
    onSuccess: () => void;
}

export function QuestionsImportModal({ professions, onSuccess }: Props) {
    const importHook = useQuestionsImport(professions, onSuccess);
    const {
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
        toggleQuestionType,
        difficulties,
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
        error,
        isLoading,
        report,
        promptCopied,
        aiLoading,
        axisStats,
        dynamicAxes,
        selectedProfessionData,
        previewStats,
        handleFileUpload,
        copyPrompt,
        generatePartialAI,
        validateAndPreview,
        handleImportDirect,
        resetForm
    } = importHook;

    // استخراج أنماط الصياغة المخصصة للمهنة الحالية
    const currentProfessionCustomStyles = React.useMemo(() => {
        if (!selectedProfessionData) return [];
        const config = selectedProfessionData.algorithmConfig as any;
        return config?.customStyles || [];
    }, [selectedProfessionData]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl font-bold h-9 text-xs">
                    <FileJson className="h-4 w-4" />
                    توليد واستيراد أسئلة (بدون صور)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="border-b pb-3 mb-2">
                    <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        توليد وتغذية الأسئلة بدون صور
                    </DialogTitle>
                </DialogHeader>

                <div className="w-full">
                    {/* خطوة إدخال المعطيات وتوليد البرومبت */}
                    {step === "input" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                            {/* الجانب الأيمن: تحديد المعطيات والإعدادات */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* اختيار المهنة */}
                                    <div className="space-y-2 relative">
                                        <Label className="font-bold text-gray-700 text-xs">المهنة المستهدفة</Label>
                                        <div className="relative">
                                            <Button 
                                                variant="outline" 
                                                role="combobox" 
                                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                                className="w-full justify-between h-9 text-xs font-bold border-gray-200 rounded-xl shadow-sm text-right bg-white"
                                            >
                                                {selectedProfessionData ? selectedProfessionData.name : "ابحث عن المهنة..."}
                                            </Button>
                                            
                                            {dropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-2 space-y-1">
                                                    <div className="flex items-center gap-1.5 px-2 border-b pb-1.5 mb-1 bg-slate-50 rounded-lg">
                                                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <input 
                                                            type="text"
                                                            placeholder="ابحث هنا..."
                                                            value={searchProfession}
                                                            onChange={e => setSearchProfession(e.target.value)}
                                                            className="w-full text-xs bg-transparent border-0 outline-none p-1 focus:ring-0 font-bold"
                                                        />
                                                    </div>
                                                    {professions
                                                        .filter(p => p.name.toLowerCase().includes(searchProfession.toLowerCase()))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setProfessionId(p.id);
                                                                    setDropdownOpen(false);
                                                                    setSearchProfession("");
                                                                    setAxis("");
                                                                }}
                                                                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-50/50 flex justify-between items-center ${p.id === professionId ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}`}
                                                            >
                                                                <span>{p.name}</span>
                                                                {p.id === professionId && <Check className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* اختيار المحور ديناميكياً */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700 text-xs">المحور الفني للاختبار</Label>
                                        <Select value={axis} onValueChange={setAxis} disabled={!professionId}>
                                            <SelectTrigger className="bg-white shadow-sm h-9 text-xs font-bold border-gray-200 rounded-xl">
                                                <SelectValue placeholder={professionId ? "اختر المحور..." : "يجب اختيار المهنة أولاً"} />
                                            </SelectTrigger>
                                            <SelectContent className="text-right">
                                                {dynamicAxes.map((ax: any) => {
                                                    const statsObj = axisStats[ax.value];
                                                    const mcqCount = statsObj?.MCQ || 0;
                                                    const tfCount = statsObj?.TRUE_FALSE || 0;
                                                    const fbCount = statsObj?.FILL_BLANK || 0;
                                                    const imgCount = statsObj?.IMAGE || 0;
                                                    const totalCount = mcqCount + tfCount + fbCount + imgCount;

                                                    const parts = [];
                                                    if (mcqCount > 0) parts.push(`${mcqCount} اختيار`);
                                                    if (tfCount > 0) parts.push(`${tfCount} صح/خطأ`);
                                                    if (fbCount > 0) parts.push(`${fbCount} فراغات`);
                                                    if (imgCount > 0) parts.push(`${imgCount} صور`);
                                                    const breakdown = parts.length > 0 ? ` : ${parts.join(" | ")}` : "";

                                                    return (
                                                        <SelectItem key={ax.value} value={ax.value} className="text-xs">
                                                            <span>{ax.label}</span>
                                                            {totalCount > 0 && (
                                                                <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mr-2 inline-block">
                                                                    ({totalCount} سؤال{breakdown})
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* اختيار الصعوبات والأنواع بالتوازي */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* نوع الأسئلة المتعددة */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700 text-xs">النوع المطلوب (اختيار متعدد)</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {["MCQ", "TRUE_FALSE", "FILL_BLANK"].map(type => {
                                                const isSelected = questionTypes.includes(type);
                                                const label: Record<string, string> = { MCQ: "اختيار من متعدد", TRUE_FALSE: "صح وخطأ", FILL_BLANK: "إكمال فراغ" };
                                                return (
                                                    <Button
                                                        key={type}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={() => toggleQuestionType(type)}
                                                        className={`h-8 text-[11px] font-black rounded-lg transition-all ${
                                                            isSelected 
                                                                ? "bg-indigo-650 hover:bg-indigo-755 text-white shadow-sm" 
                                                                : "bg-white border-gray-250 text-slate-655 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {label[type]}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* مستوى الصعوبة المتعددة */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700 text-xs">الصعوبة المطلوبة (اختيار متعدد)</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {["K1", "HARD", "EXPERT", "K4", "K5"].map(diff => {
                                                const isSelected = difficulties.includes(diff);
                                                const label: Record<string, string> = { 
                                                    K1: "تذكر K1", 
                                                    HARD: "تطبيق K2", 
                                                    EXPERT: "تحليل K3",
                                                    K4: "K4 سهل/متوسط",
                                                    K5: "K5 متوسط/صعب"
                                                };
                                                return (
                                                    <Button
                                                        key={diff}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={() => toggleDifficulty(diff)}
                                                        className={`h-8 text-[11px] font-black rounded-lg transition-all ${
                                                            isSelected 
                                                                ? "bg-indigo-650 hover:bg-indigo-755 text-white shadow-sm" 
                                                                : "bg-white border-gray-250 text-slate-655 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {label[diff]}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* عدد الأسئلة */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700 text-xs">عدد الأسئلة المطلوب</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            max={30} 
                                            value={questionCount} 
                                            onChange={e => setQuestionCount(parseInt(e.target.value) || 1)}
                                            className="bg-white shadow-sm h-9 text-xs font-bold border-gray-250 rounded-xl"
                                        />
                                    </div>

                                    {/* حقل نمط الصياغة */}
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="font-bold text-gray-700 text-xs">نمط الصياغة (التنويع)</Label>
                                        <Select value={questionStyle} onValueChange={setQuestionStyle}>
                                            <SelectTrigger className="bg-white shadow-sm h-9 text-xs font-bold border-gray-250 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="text-right">
                                                {QUESTION_STYLES.map(style => (
                                                    <SelectItem key={style.value} value={style.value} className="text-xs">
                                                        {style.label}
                                                    </SelectItem>
                                                ))}
                                                {/* عرض الأنماط المحفوظة للمهنة ديناميكياً */}
                                                {currentProfessionCustomStyles.map((style: string, idx: number) => (
                                                    <SelectItem key={`saved-${idx}`} value={style} className="text-xs text-indigo-700 font-bold">
                                                        {style} (نمط محفوظ)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        
                                        {/* حقل نصي مخصص ديناميكي */}
                                        {questionStyle === "CUSTOM" && (
                                            <div className="space-y-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Label className="font-bold text-indigo-700 text-[10px]">اكتب نمط الصياغة المخصص:</Label>
                                                <Input 
                                                    placeholder="مثال: إشارات المرور للتقاطعات..." 
                                                    value={customStyleText} 
                                                    onChange={e => setCustomStyleText(e.target.value)}
                                                    className="h-8 text-xs bg-indigo-50/20 border-indigo-200 focus-visible:ring-indigo-500 font-bold rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* موضوع التركيز الدقيق */}
                                <div className="space-y-2">
                                    <Label className="font-bold text-gray-700 text-xs flex justify-between items-center">
                                        <span>موضوع التركيز الدقيق (اختياري)</span>
                                        <span className="text-[10px] text-gray-400 font-medium">سيركز النظام الأسئلة بالكامل على هذا الموضوع</span>
                                    </Label>
                                    <Input 
                                        placeholder="مثال: لحام القوس الكهربائي، صيانة المكابح..." 
                                        value={focusTopic} 
                                        onChange={e => setFocusTopic(e.target.value)}
                                        className="bg-white shadow-sm h-9 text-xs font-bold border-gray-250 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* الجانب الأيسر: منشئ البرومبت ورفع ملف الـ JSON المولد */}
                            <div className="lg:col-span-5 space-y-4">
                                {/* كادر البرومبت المولد */}
                                <div className="bg-indigo-50/50 p-4 border border-indigo-150 rounded-2xl flex flex-col justify-between h-[180px]">
                                    <div className="space-y-1">
                                        <span className="font-black text-indigo-700 text-xs flex items-center gap-1.5">
                                            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                                            برومبت التوليد المهني المطور:
                                        </span>
                                        <p className="text-[11px] text-indigo-900 leading-normal font-bold">
                                            يقوم النظام بصياغة التوجيه لجميع الأنواع والصعوبات والأنماط بالتساوي ليقوم الذكاء الاصطناعي ببناء JSON احترافي كامل.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={copyPrompt} 
                                        disabled={!professionId || !axis}
                                        className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black py-4 text-xs shadow-md gap-2 rounded-xl"
                                    >
                                        {promptCopied ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                تم نسخ البرومبت للحافظة!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                نسخ البرومبت وإرساله للـ AI
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* مساحة رفع ولصق ملف الـ JSON المولد */}
                                <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                                            <FileJson className="h-4 w-4 text-emerald-600" />
                                            تغذية ملف JSON المولد:
                                        </Label>
                                        <label className="text-[10px] text-indigo-650 hover:underline cursor-pointer font-black">
                                            تصفح الملف...
                                            <input 
                                                type="file" 
                                                accept=".json" 
                                                onChange={handleFileUpload} 
                                                className="hidden" 
                                            />
                                        </label>
                                    </div>

                                    <Textarea 
                                        placeholder="ألصق كود الـ JSON المولد هنا..." 
                                        className="h-28 text-left text-xs font-mono bg-white border-slate-200 focus-visible:ring-emerald-555 rounded-xl"
                                        value={jsonText}
                                        onChange={e => setJsonText(e.target.value)}
                                    />

                                    <div className="space-y-1">
                                        <Label className="font-black text-slate-650 text-[10px]">آلية التحكم في تكرار الأسئلة:</Label>
                                        <Select value={mode} onValueChange={setMode}>
                                            <SelectTrigger className="bg-white h-8 text-[10px] font-bold border-gray-200 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="text-right">
                                                <SelectItem value="skip_duplicates" className="text-xs">تخطي الأسئلة الفنية المتطابقة مسبقاً (آمن)</SelectItem>
                                                <SelectItem value="append" className="text-xs">إدراج الأسئلة مباشرةً بدون مطابقة التكرار</SelectItem>
                                                <SelectItem value="replace_axis_questions" className="text-xs">مسح جميع الأسئلة السابقة لهذا المحور بالكامل ثم الاستيراد (خطر)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {error && (
                                        <div className="p-2.5 bg-red-50 text-red-700 border border-red-150 rounded-xl flex gap-1.5 text-[10px] font-bold shadow-sm">
                                            <AlertCircle className="h-4 w-4 shrink-0 text-red-555" />
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <Button 
                                        onClick={validateAndPreview} 
                                        disabled={!jsonText.trim()}
                                        className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-black py-4.5 text-xs shadow-sm gap-1.5 rounded-xl"
                                    >
                                        <FileJson className="h-4 w-4" />
                                        معاينة الأسئلة ومطابقة الجودة
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* خطوة المعاينة قبل الاستيراد الفعلي */}
                    {step === "preview" && (
                        <div className="p-4 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="text-right">
                                    <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        تم التدقيق بنجاح: تم التحقق من {parsedData.length} أسئلة
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1 font-bold">يرجى تأكيد توزيع وصعوبة الأسئلة قبل حفظها في الخادم.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setStep("input")} className="h-8 text-xs font-bold rounded-lg">العودة للتعديل</Button>
                            </div>

                            {/* الإحصائيات الخاصة بالأسئلة المعاينة */}
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                                <div className="p-2 rounded-xl bg-slate-50 border text-center">
                                    <p className="text-[9px] text-gray-400 mb-0.5 font-bold">الأسئلة الصعبة</p>
                                    <p className="text-lg font-black text-slate-700">{previewStats?.hard}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                                    <p className="text-[9px] text-purple-650 mb-0.5 font-bold">الخبراء</p>
                                    <p className="text-lg font-black text-purple-700">{previewStats?.expert}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                                    <p className="text-[9px] text-amber-650 mb-0.5 font-bold">تذكر K1</p>
                                    <p className="text-lg font-black text-amber-700">{previewStats?.k1}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                                    <p className="text-[9px] text-blue-650 mb-0.5 font-bold">تطبيق K2</p>
                                    <p className="text-lg font-black text-blue-700">{previewStats?.k2}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
                                    <p className="text-[9px] text-indigo-650 mb-0.5 font-bold">تحليل K3</p>
                                    <p className="text-lg font-black text-indigo-700">{previewStats?.k3}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                                    <p className="text-[9px] text-emerald-650 mb-0.5 font-bold">سهل/متوسط K4</p>
                                    <p className="text-lg font-black text-emerald-700">{previewStats?.k4 || 0}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 text-center">
                                    <p className="text-[9px] text-rose-650 mb-0.5 font-bold">متوسط/صعب K5</p>
                                    <p className="text-lg font-black text-rose-700">{previewStats?.k5 || 0}</p>
                                </div>
                            </div>

                            {/* قائمة معاينة للأسئلة الخمسة الأولى */}
                            <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-4">
                                {parsedData.slice(0, 5).map((q, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-right">
                                        <div className="flex justify-between items-start mb-2.5">
                                            <p className="font-bold text-gray-800 text-xs leading-relaxed">{idx + 1}. {q.text}</p>
                                            <div className="flex gap-1.5">
                                                {q.difficulty === "EXPERT" ? (
                                                    <Badge className="bg-purple-600 text-[9px] font-bold">EXPERT</Badge>
                                                ) : (
                                                    <Badge className="bg-red-500 text-[9px] font-bold">HARD</Badge>
                                                )}
                                                <Badge variant="outline" className="text-[9px] font-bold">{q.cognitiveLevel || "K2"}</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3.5 pr-2">
                                            {q.options?.map((opt: any, oidx: number) => (
                                                <div 
                                                    key={oidx} 
                                                    className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                                                        opt.isCorrect 
                                                            ? "bg-green-50 border-green-200 text-green-800 font-bold" 
                                                            : "bg-gray-50 border-gray-100 text-gray-500"
                                                    }`}
                                                >
                                                    {opt.isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                                    {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {parsedData.length > 5 && (
                                    <p className="text-[10px] text-gray-400 font-bold text-center">...تم عرض 5 أسئلة للمعاينة من إجمالي {parsedData.length} سؤال جاهز للحفظ...</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3.5 bg-red-50 text-red-700 border border-red-155 rounded-xl flex gap-2 text-xs font-bold text-right shadow-sm">
                                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* زر تأكيد الحفظ */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" size="sm" onClick={() => setStep("input")} className="h-9 font-bold text-xs">تراجع وتعديل</Button>
                                <Button 
                                    onClick={handleImportDirect} 
                                    disabled={isLoading}
                                    className="bg-emerald-650 hover:bg-emerald-700 text-white font-black px-6 h-9 rounded-xl shadow-sm text-xs"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `حفظ وتنزيل الأسئلة (${parsedData.length})`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* خطوة التقرير النهائي للرفع */}
                    {step === "report" && report && (
                        <div className="p-8 text-center space-y-6" dir="rtl">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-150">
                                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-black text-gray-900">اكتمل استيراد الأسئلة بنجاح!</h3>
                                <p className="text-xs text-gray-400 font-bold">تم إدخال وتغذية بنك الأسئلة للمهنة المحددة بالخيارات والشروحات بالكامل.</p>
                            </div>

                            <div className="bg-slate-50 border border-gray-150 p-5 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-4 text-right shadow-sm">
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-bold mb-0.5">الأسئلة التي تم حفظها</span>
                                    <span className="text-2xl font-black text-green-650">{report.imported || parsedData.length}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-bold mb-0.5">الأسئلة المتخطاة (المكررة)</span>
                                    <span className="text-2xl font-black text-orange-500">{report.skippedDuplicates || 0}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-center">
                                <Button 
                                    onClick={() => {
                                        setIsOpen(false);
                                        setTimeout(resetForm, 300);
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-5 text-xs shadow-md rounded-xl"
                                >
                                    إغلاق النافذة والرجوع للوحة التحكم
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
