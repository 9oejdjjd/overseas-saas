/**
 * @file QuestionsImportModal.tsx
 * @description مكون استيراد وتوليد الأسئلة المطور (QuestionsImportModal) بعد إعادة هيكلته.
 * يستعمل هذا المكون الخطاف المخصص (useQuestionsImport) لعزل التوجيهات الطويلة والمدققات وحالات المعاينة.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, AlertCircle, FileJson, CheckCircle2, Copy, Search, Sparkles, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuestionsImport } from "@/hooks/mock-exams/useQuestionsImport";

interface Props {
    professions: any[];
    questions: any[]; // Left for compatibility
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
        questionType,
        setQuestionType,
        difficulty,
        setDifficulty,
        focusTopic,
        setFocusTopic,
        questionCount,
        setQuestionCount,
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
        previewStats,
        handleFileUpload,
        copyPrompt,
        generatePartialAI,
        validateAndPreview,
        handleImport,
        resetForm
    } = importHook;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setTimeout(resetForm, 300);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold text-xs h-9">
                    <Sparkles className="h-4 w-4" />
                    استيراد وتوليد الأسئلة بـ الذكاء الاصطناعي
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 rounded-2xl shadow-2xl border border-gray-100" dir="rtl">
                <div className="bg-white rounded-2xl">
                    <DialogHeader className="p-6 border-b bg-slate-50/50">
                        <DialogTitle className="flex flex-col gap-1 text-right">
                            <span className="text-xl font-black flex items-center gap-2 text-gray-900">
                                <Sparkles className="h-5.5 w-5.5 text-purple-600 animate-pulse" />
                                استيراد وتوليد بنك الأسئلة المتقدم
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                                استعن بـ Gemini AI لتوليد أسئلة عالية الدقة والواقعية، أو استورد الأسئلة المصاغة مسبقاً بصيغة JSON.
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {step === "input" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse">
                            {/* لوحة توليد الذكاء الاصطناعي وهندسة البرومبت */}
                            <div className="p-6 space-y-6 bg-slate-50/40">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                                        <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-xs font-black">1</span>
                                        هندسة الذكاء الاصطناعي (Prompt Engineering)
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {/* اختيار التخصص */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 relative">
                                                <Label className="font-bold text-gray-700 text-xs">المهنة المستهدفة <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        className="pr-9 focus:bg-white transition-colors bg-white shadow-sm h-9 text-xs placeholder-gray-400 font-semibold border-gray-200"
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
                                                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                                        {professions.filter(p => p.name.includes(searchProfession)).map(p => (
                                                            <div
                                                                key={p.id}
                                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-xs font-bold border-b last:border-0 border-gray-50 text-gray-700"
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

                                            {/* اختيار المحور */}
                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">المحور المهني <span className="text-red-500">*</span></Label>
                                                <Select value={axis} onValueChange={setAxis}>
                                                    <SelectTrigger className="bg-white shadow-sm h-9 text-xs font-bold border-gray-200">
                                                        <SelectValue placeholder="اختر المحور المهني" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dynamicAxes.map((opt: any) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                <div className="flex flex-col gap-1 py-1 text-right">
                                                                    <span className="text-xs font-bold">{opt.label}</span>
                                                                    {professionId && axisStats[opt.value] && (
                                                                        <div className="flex gap-2 text-[9px] text-gray-400 font-bold" dir="rtl">
                                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">متعدد: {axisStats[opt.value].MCQ || 0}</span>
                                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">صح/خطأ: {axisStats[opt.value].TRUE_FALSE || 0}</span>
                                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">فراغات: {axisStats[opt.value].FILL_BLANK || 0}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* نوع الأسئلة ومستوى الصعوبة */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">نوع الأسئلة <span className="text-red-500">*</span></Label>
                                                <Select value={questionType} onValueChange={setQuestionType}>
                                                    <SelectTrigger className="bg-white shadow-sm h-9 text-xs font-bold border-gray-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="text-right">
                                                        <SelectItem value="MCQ" className="text-xs">اختيار من متعدد (MCQ)</SelectItem>
                                                        <SelectItem value="TRUE_FALSE" className="text-xs">صح أو خطأ (True/False)</SelectItem>
                                                        <SelectItem value="FILL_BLANK" className="text-xs">إكمال الفراغات (Fill Blank)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">مستوى الصعوبة <span className="text-red-500">*</span></Label>
                                                <Select value={difficulty} onValueChange={setDifficulty}>
                                                    <SelectTrigger className="bg-white shadow-sm h-9 text-xs font-bold border-gray-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="text-right">
                                                        <SelectItem value="HARD" className="text-xs"> HARD — صعب وواقعي (K2)</SelectItem>
                                                        <SelectItem value="EXPERT" className="text-xs"> EXPERT — معقد للخبراء (K3)</SelectItem>
                                                        <SelectItem value="K1" className="text-xs"> K1 — معرفة تشغيلية مباشرة (K1)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* موضوع التركيز وعدد الأسئلة */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">موضوع التركيز الدقيق <span className="text-gray-400 font-normal text-[10px]">(اختياري لتوجيه الـ AI)</span></Label>
                                                <Input 
                                                    placeholder="مثال: الوقاية من الحرائق والماس الكهربائي..." 
                                                    value={focusTopic} 
                                                    onChange={e => setFocusTopic(e.target.value)}
                                                    className="bg-white shadow-sm h-9 text-xs placeholder-gray-400 border-gray-200"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">عدد الأسئلة المطلوب توليدها <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="number" 
                                                    min={1} 
                                                    max={30} 
                                                    value={questionCount} 
                                                    onChange={e => setQuestionCount(Number(e.target.value))}
                                                    className="bg-white shadow-sm h-9 text-xs border-gray-200 font-bold"
                                                />
                                            </div>
                                        </div>

                                        {/* أزرار نسخ البرومبت والتوليد */}
                                        <div className="pt-6 flex flex-col gap-3">
                                            <Button 
                                                onClick={copyPrompt} 
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-black py-5 text-sm shadow-md rounded-xl"
                                            >
                                                {promptCopied ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
                                                {promptCopied ? "تم نسخ البرومبت! الصقه الآن في متصفح Gemini" : "📋 نسخ برومبت التوجيه لنسخه في Gemini"}
                                            </Button>

                                            <Button 
                                                onClick={generatePartialAI} 
                                                disabled={aiLoading}
                                                className="w-full bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 gap-2 font-black py-5 text-sm rounded-xl"
                                            >
                                                {aiLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                                                {aiLoading ? "جاري استدعاء السيرفر وتخزين الأسئلة..." : "⚡ توليد وحفظ تلقائي فوري (عبر API)"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* لوحة استيراد وفحص وتأكيد ملفات JSON */}
                            <div className="p-6 space-y-6 bg-white">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                                        <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-xs font-black">2</span>
                                        استيراد الأسئلة وتدقيق الجودة (JSON)
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-700 text-xs">ألصق مخرجات الـ JSON التي ولدها Gemini هنا <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                placeholder='[{ "text": "...", "explanation": "...", "options": [...] }]'
                                                className="font-mono text-left w-full h-[220px] resize-none bg-slate-50 border-gray-200 focus:bg-white shadow-inner rounded-xl p-3 text-xs"
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
                                                    <Button type="button" variant="outline" size="sm" className="gap-2 text-gray-600 bg-white border-gray-250 shadow-sm pointer-events-none rounded-lg text-xs h-8">
                                                        <UploadCloud className="h-3.5 w-3.5 text-gray-500" />
                                                        أو قم برفع ملف JSON المولد
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* خيار التعامل مع التكرار */}
                                        <div className="space-y-2 p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl">
                                            <Label className="font-black text-orange-850 flex items-center gap-1.5 text-xs">
                                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                                آلية التحكم في تكرار الأسئلة
                                            </Label>
                                            <Select value={mode} onValueChange={setMode}>
                                                <SelectTrigger className="bg-white h-8 text-xs font-bold border-orange-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="text-right">
                                                    <SelectItem value="skip_duplicates" className="text-xs">تخطي الأسئلة الفنية المتطابقة مسبقاً (آمن)</SelectItem>
                                                    <SelectItem value="append" className="text-xs">إدراج الأسئلة مباشرةً بدون مطابقة التكرار</SelectItem>
                                                    <SelectItem value="replace_axis_questions" className="text-xs">مسح جميع الأسئلة السابقة لهذا المحور بالكامل ثم الاستيراد (خطر)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* التنبيهات في حال الأخطاء */}
                                        {error && (
                                            <div className="p-3.5 bg-red-50 text-red-700 border border-red-150 rounded-xl flex gap-2 text-xs font-bold shadow-sm">
                                                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                                                <p>{error}</p>
                                            </div>
                                        )}

                                        <Button 
                                            onClick={validateAndPreview} 
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 text-sm shadow-md gap-2 rounded-xl"
                                        >
                                            <FileJson className="h-4.5 w-4.5" />
                                            معاينة الأسئلة ومطابقة الجودة
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* خطوة المعاينة قبل الاستيراد الفعلي */}
                    {step === "preview" && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="text-right">
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="h-5.5 w-5.5 text-green-500" />
                                        تم التدقيق بنجاح: تم التحقق من {parsedData.length} أسئلة
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1 font-bold">يرجى تأكيد توزيع وصعوبة الأسئلة قبل حفظها في الخادم.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setStep("input")} className="h-8 text-xs font-bold rounded-lg">العودة للتعديل</Button>
                            </div>

                            {/* الإحصائيات الخاصة بالأسئلة المعاينة */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                                <div className="p-3.5 rounded-xl bg-slate-50 border text-center">
                                    <p className="text-[10px] text-gray-400 mb-0.5 font-bold">الأسئلة الصعبة (HARD)</p>
                                    <p className="text-xl font-black text-slate-700">{previewStats?.hard}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                                    <p className="text-[10px] text-purple-600 mb-0.5 font-bold">الخبراء (EXPERT)</p>
                                    <p className="text-xl font-black text-purple-700">{previewStats?.expert}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                                    <p className="text-[10px] text-amber-600 mb-0.5 font-bold">تذكر (K1)</p>
                                    <p className="text-xl font-black text-amber-700">{previewStats?.k1}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                                    <p className="text-[10px] text-blue-600 mb-0.5 font-bold">تطبيق (K2)</p>
                                    <p className="text-xl font-black text-blue-700">{previewStats?.k2}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
                                    <p className="text-[10px] text-indigo-600 mb-0.5 font-bold">تحليل (K3)</p>
                                    <p className="text-xl font-black text-indigo-700">{previewStats?.k3}</p>
                                </div>
                            </div>

                            {/* قائمة معاينة للأسئلة الخمسة الأولى */}
                            <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 max-h-[350px] overflow-y-auto space-y-4">
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
                                                    className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                                                        opt.isCorrect 
                                                            ? "bg-green-50/50 border-green-200 text-green-800 font-bold" 
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
                                <div className="p-3.5 bg-red-50 text-red-700 border border-red-150 rounded-xl flex gap-2 text-xs font-bold text-right shadow-sm">
                                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* زر تأكيد الحفظ */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" size="sm" onClick={() => setStep("input")} className="h-9 font-bold text-xs">تراجع وتعديل</Button>
                                <Button 
                                    onClick={handleImport} 
                                    disabled={isLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 h-9 rounded-xl shadow-sm text-xs"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `حفظ وتنزيل الأسئلة (${parsedData.length})`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* خطوة التقرير النهائي للرفع */}
                    {step === "report" && report && (
                        <div className="p-8 text-center space-y-6" dir="rtl">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-black text-gray-900">اكتمل استيراد الأسئلة بنجاح!</h3>
                                <p className="text-xs text-gray-400 font-bold">تم إدخال وتغذية بنك الأسئلة للمهنة المحددة بالخيارات والشروحات بالكامل.</p>
                            </div>

                            <div className="bg-slate-50 border border-gray-150 p-5 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-4 text-right shadow-sm">
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-bold mb-0.5">الأسئلة المدخلة حديثاً</span>
                                    <span className="text-2xl font-black text-green-600">{report.imported || report.count || parsedData.length}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-bold mb-0.5">الأسئلة المتخطاة (المكررة)</span>
                                    <span className="text-2xl font-black text-orange-500">{report.skipped || 0}</span>
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
