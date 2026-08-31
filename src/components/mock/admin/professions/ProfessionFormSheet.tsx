/**
 * @file ProfessionFormSheet.tsx
 * @description مكون نموذج إضافة وتعديل خصائص المهن (ProfessionFormSheet).
 * يدعم توليد ونسخ برومبت محاور المهن بالذكاء الاصطناعي (8-13 محور ثنائي اللغة مع توزيع الحصص)، والتوليد المباشر والاستيراد من JSON.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    ListChecks, CheckSquare, Target, Image as ImageIcon, 
    ToggleLeft, ToggleRight, Loader2, Plus, Edit2, Copy, 
    Check, Sparkles, Code2, Layers, CheckCircle2
} from "lucide-react";
import { ProfessionFormData } from "@/hooks/mock-exams/useProfessionsManager";
import { buildAxesGenerationPrompt } from "@/lib/mock-exams/promptBuilder";
import { parseAxesJson } from "@/lib/mock-exams/axesHelper";

interface ProfessionFormSheetProps {
    showAdd: boolean;
    setShowAdd: (open: boolean) => void;
    editingId: string | null;
    formData: ProfessionFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProfessionFormData>>;
    saving: boolean;
    handleSave: () => void;
}

export function ProfessionFormSheet({
    showAdd,
    setShowAdd,
    editingId,
    formData,
    setFormData,
    saving,
    handleSave
}: ProfessionFormSheetProps) {
    const [copySuccess, setCopySuccess] = useState(false);
    const [aiGenLoading, setAiGenLoading] = useState(false);
    const [showJsonInput, setShowJsonInput] = useState(false);
    const [pastedJson, setPastedJson] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // نسخ برومبت توليد المحاور المخصص بالذكاء الاصطناعي
    const handleCopyPrompt = async () => {
        if (!formData.name.trim()) {
            alert("الرجاء كتابة اسم المهنة أولاً لإنشاء برومبت المحاور المخصص لها.");
            return;
        }
        const prompt = buildAxesGenerationPrompt(
            formData.name.trim(), 
            formData.questionCount || 30, 
            formData.description
        );
        try {
            await navigator.clipboard.writeText(prompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
        } catch (e) {
            alert("فشل النسخ إلى الحافظة تلقائياً.");
        }
    };

    // التوليد المباشر عبر السيرفر بنقرة واحدة
    const handleDirectAiGenerate = async () => {
        if (!formData.name.trim()) {
            alert("الرجاء كتابة اسم المهنة أولاً لتوليد المحاور بالذكاء الاصطناعي.");
            return;
        }
        setAiGenLoading(true);
        try {
            const res = await fetch("/api/mock/admin/professions/generate-axes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profName: formData.name.trim(),
                    questionCount: formData.questionCount || 30,
                    description: formData.description
                })
            });
            const data = await res.json();
            if (res.ok && data.axes) {
                const currentConfig = formData.algorithmConfig || {};
                setFormData(prev => ({
                    ...prev,
                    algorithmConfig: {
                        ...currentConfig,
                        axes: data.axes
                    }
                }));
                alert(`✅ تم توليد وتخصيص ${data.axes.length} محاور ثنائية اللغة لمهنة "${formData.name}" بنجاح!`);
            } else {
                alert(data.error || "حدث خطأ أثناء توليد المحاور بالذكاء الاصطناعي");
            }
        } catch (e) {
            alert("فشل الاتصال بخادم التوليد بالذكاء الاصطناعي");
        } finally {
            setAiGenLoading(false);
        }
    };

    // استيراد ولصق المحاور من كود JSON
    const handleImportJson = () => {
        const res = parseAxesJson(pastedJson, formData.questionCount || 30);
        if (res.success && res.axes.length > 0) {
            const currentConfig = formData.algorithmConfig || {};
            setFormData(prev => ({
                ...prev,
                algorithmConfig: {
                    ...currentConfig,
                    axes: res.axes
                }
            }));
            setJsonError(null);
            setShowJsonInput(false);
            setPastedJson("");
            alert(`✅ تم استيراد واعتماد ${res.axes.length} محاور بنجاح!`);
        } else {
            setJsonError(res.error || "صيغة JSON غير صالحة");
        }
    };
    
    // منطق تبديل الحالات المخصصة لأنواع الأسئلة الاختيارية المفعّلة
    const toggleQuestionType = (typeId: string) => {
        const currentTypes = formData.enabledQuestionTypes.split(",").filter(t => t);
        const newTypes = currentTypes.includes(typeId) 
            ? currentTypes.filter(t => t !== typeId) 
            : [...currentTypes, typeId];
            
        if (!newTypes.includes("MCQ")) {
            newTypes.unshift("MCQ");
        }
        
        setFormData(prev => ({
            ...prev,
            enabledQuestionTypes: newTypes.join(",")
        }));
    };

    const isTypeEnabled = (typeId: string) => {
        return formData.enabledQuestionTypes.split(",").includes(typeId);
    };

    const optionalTypes = [
        { 
            id: "TRUE_FALSE", 
            label: "صح أو خطأ", 
            desc: "أسئلة بخيارين فقط (صح / خطأ)", 
            icon: <CheckSquare className="h-4 w-4" />, 
            color: {
                bg: "bg-emerald-50/50",
                border: "border-emerald-200",
                iconBg: "bg-emerald-100/70",
                iconText: "text-emerald-600",
                title: "text-emerald-800",
                desc: "text-emerald-500",
                icon: "text-emerald-500"
            }
        },
        { 
            id: "FILL_BLANK", 
            label: "إكمال الفراغات", 
            desc: "أكمل الجملة من 4 خيارات مختلفة", 
            icon: <Target className="h-4 w-4" />, 
            color: {
                bg: "bg-purple-50/50",
                border: "border-purple-200",
                iconBg: "bg-purple-100/70",
                iconText: "text-purple-600",
                title: "text-purple-800",
                desc: "text-purple-500",
                icon: "text-purple-500"
            }
        },
        { 
            id: "IMAGE", 
            label: "أسئلة الصور التوضيحية", 
            desc: "أسئلة فنية مرفق بها صورة مساندة", 
            icon: <ImageIcon className="h-4 w-4" />, 
            color: {
                bg: "bg-amber-50/50",
                border: "border-amber-200",
                iconBg: "bg-amber-100/70",
                iconText: "text-amber-600",
                title: "text-amber-800",
                desc: "text-amber-500",
                icon: "text-amber-500"
            }
        }
    ];

    const currentAxes: any[] = formData.algorithmConfig?.axes || [];
    const axesTotalQuota = currentAxes.reduce((sum, a) => sum + (Number(a.quota) || 0), 0);

    return (
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto rounded-l-2xl shadow-2xl p-6" dir="rtl">
                <SheetHeader className="pb-6 border-b text-right">
                    <SheetTitle className="text-xl font-black flex items-center gap-2 text-gray-900">
                        {editingId ? <Edit2 className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
                        {editingId ? "تعديل خصائص المهنة والمحاور" : "إضافة مهنة جديدة ومحاورها"}
                    </SheetTitle>
                </SheetHeader>
                
                <div className="py-6 space-y-5">
                    {/* اسم المهنة باللغة العربية */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold block text-gray-700">اسم المهنة (عربي) <span className="text-red-500">*</span></label>
                        <Input 
                            value={formData.name} 
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                            placeholder="مثال: لحام، كهربائي مباني، طبيب أسنان..." 
                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors h-10 placeholder-gray-400 font-medium" 
                        />
                    </div>
                    
                    {/* الرابط الإنجليزي للمهنة */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold block text-gray-700">الرابط الإنجليزي (Slug) <span className="text-gray-400 font-normal text-[10px]">(يتم توليده تلقائياً)</span></label>
                        <Input 
                            value={formData.slug} 
                            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))} 
                            placeholder="يتم توليده تلقائياً..." 
                            className="dir-ltr text-left font-mono bg-gray-50/50 border-gray-200 focus:bg-white transition-colors h-10" 
                        />
                    </div>
                    
                    {/* حالة المهنة تفعيل/تعطيل */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-150 bg-gray-50/50">
                        <div>
                            <label className="text-xs font-bold block text-gray-800">حالة المهنة</label>
                            <p className="text-[10px] text-gray-400 font-medium">إتاحة أو حظر المهنة في التقديم للممتحنين</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? "-translate-x-6" : "translate-x-1"}`} />
                        </button>
                    </div>

                    {/* 🤖 قسم الذكاء الاصطناعي وتوليد المحاور الذكية */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100/80 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                                <h4 className="text-xs font-black text-indigo-950">محاور المهنة التخصصية بالذكاء الاصطناعي</h4>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">8 - 13 محور</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            يمكنك نسخ البرومبت الاحترافي لاستخدامه خارجياً، أو توليد المحاور ثنائية اللغة وتحديد حصص الأسئلة تلقائياً بنقرة واحدة.
                        </p>

                        {/* الأزرار الثلاثة للتحكم بالمحاور */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {/* زر التوليد التلقائي المباشر */}
                            <Button
                                type="button"
                                onClick={handleDirectAiGenerate}
                                disabled={aiGenLoading || !formData.name.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm rounded-xl"
                            >
                                {aiGenLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                توليد المحاور آلياً عبر AI
                            </Button>

                            {/* زر نسخ برومبت طلب المحاور */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyPrompt}
                                disabled={!formData.name.trim()}
                                className="border-indigo-200 text-indigo-800 hover:bg-indigo-100/50 font-bold text-xs h-9 gap-1.5 rounded-xl bg-white"
                            >
                                {copySuccess ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-indigo-600" />}
                                {copySuccess ? "تم نسخ البرومبت!" : "نسخ برومبت المحاور"}
                            </Button>
                        </div>

                        {/* زر فتح خانة استيراد JSON */}
                        <button
                            type="button"
                            onClick={() => setShowJsonInput(!showJsonInput)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 pt-1"
                        >
                            <Code2 className="h-3.5 w-3.5" />
                            {showJsonInput ? "إخفاء مربع استيراد JSON" : "أو استيراد محاور من كود JSON مجهز..."}
                        </button>

                        {/* مربع لصق الـ JSON */}
                        {showJsonInput && (
                            <div className="space-y-2 pt-2 border-t border-indigo-100">
                                <textarea
                                    value={pastedJson}
                                    onChange={e => setPastedJson(e.target.value)}
                                    placeholder='الطق كود JSON المولد هنا (مثال: { "axes": [ { "name": "...", "quota": 4 } ] })'
                                    className="w-full h-24 p-2.5 text-xs font-mono rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                                {jsonError && <p className="text-[11px] font-bold text-red-500">{jsonError}</p>}
                                <Button
                                    type="button"
                                    onClick={handleImportJson}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 w-full rounded-xl"
                                >
                                    اعتِماد واستيراد المحاور
                                </Button>
                            </div>
                        )}

                        {/* معاينة المحاور المعتمدة المضافة حالياً */}
                        {currentAxes.length > 0 && (
                            <div className="pt-2.5 border-t border-indigo-100 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                        المحاور المعتمدة للمهنة ({currentAxes.length})
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${axesTotalQuota === (formData.questionCount || 30) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                                        مجموع الأسئلة: {axesTotalQuota} / {formData.questionCount || 30}
                                    </span>
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                    {currentAxes.map((a, idx) => (
                                        <div key={a.id || idx} className="flex justify-between items-center text-[11px] p-2 bg-white/90 rounded-lg border border-indigo-100 shadow-2xs">
                                            <span className="font-semibold text-slate-800 truncate pl-2">{idx + 1}. {a.name}</span>
                                            <span className="font-black text-indigo-700 shrink-0 bg-indigo-50 px-2 py-0.5 rounded">{a.quota} سؤال</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* درجة النجاح ومدة الاختبار */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                            <label className="text-xs font-bold block text-gray-700">درجة النجاح (%)</label>
                            <Input 
                                type="number" 
                                value={formData.passingScore} 
                                onChange={e => setFormData(prev => ({ ...prev, passingScore: Number(e.target.value) }))} 
                                className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors h-10 font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold block text-gray-700">مدة الاختبار (دقيقة)</label>
                            <Input 
                                type="number" 
                                value={formData.examDuration} 
                                onChange={e => setFormData(prev => ({ ...prev, examDuration: Number(e.target.value) }))} 
                                className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors h-10 font-bold" 
                            />
                        </div>
                    </div>
                    
                    {/* عدد الأسئلة في الجلسة */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold block text-gray-700">عدد الأسئلة في كل اختبار</label>
                        <Input 
                            type="number" 
                            min="1" 
                            value={formData.questionCount} 
                            onChange={e => setFormData(prev => ({ ...prev, questionCount: Number(e.target.value) }))} 
                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors h-10 font-bold" 
                        />
                        <p className="text-[10px] text-gray-400 leading-snug">عدد الأسئلة التي ستظهر للممتحن في كل جلسة اختبار فرعية (الافتراضي: 30 سؤال).</p>
                    </div>
                    
                    {/* تفعيل أنواع الأسئلة المفعلة */}
                    <div className="space-y-3 pt-4 border-t">
                        <label className="text-xs font-bold block text-gray-700">أنواع الأسئلة المفعّلة</label>
                        <p className="text-[10px] text-gray-400 leading-snug -mt-1.5">حدد أنواع الأسئلة المتاحة للمتقدم. النوع الرئيسي (اختيار من متعدد) مفعل دائماً.</p>
                        
                        <div className="space-y-2.5">
                            {/* اختيار من متعدد - مفعل إجبارياً */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/40 border border-blue-200/80 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-600">
                                        <ListChecks className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-blue-800">اختيار من متعدد (MCQ)</p>
                                        <p className="text-[10px] text-blue-500 font-semibold">النوع الأساسي — مفعل دائماً</p>
                                    </div>
                                </div>
                                <div className="text-blue-600 text-[10px] font-black bg-blue-100/60 px-2 py-0.5 rounded border border-blue-200/30">مفعل ✓</div>
                            </div>
                            
                            {/* الخيارات الثلاثة الاختيارية */}
                            {optionalTypes.map(type => {
                                const isEnabled = isTypeEnabled(type.id);
                                const currentColors = type.color;
                                
                                return (
                                    <button 
                                        key={type.id} 
                                        type="button" 
                                        onClick={() => toggleQuestionType(type.id)} 
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isEnabled 
                                                ? `${currentColors.bg} ${currentColors.border} shadow-sm` 
                                                : "bg-gray-50/30 border-gray-200 hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${
                                                isEnabled ? currentColors.iconBg : "bg-gray-100"
                                            } flex items-center justify-center ${
                                                isEnabled ? currentColors.iconText : "text-gray-400"
                                            }`}>
                                                {type.icon}
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-black ${
                                                    isEnabled ? currentColors.title : "text-gray-600"
                                                }`}>{type.label}</p>
                                                <p className={`text-[9px] font-semibold ${
                                                    isEnabled ? currentColors.desc : "text-gray-400"
                                                }`}>{type.desc}</p>
                                            </div>
                                        </div>
                                        {isEnabled 
                                            ? <ToggleRight className={`h-7 w-7 ${currentColors.icon}`} /> 
                                            : <ToggleLeft className="h-7 w-7 text-gray-300" />
                                        }
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* التوجيهات المخصصة للذكاء الاصطناعي */}
                    <div className="space-y-2 pt-4 border-t">
                        <label className="text-xs font-bold block text-gray-700">التوجيهات والوصف الخاص بـ الذكاء الاصطناعي</label>
                        <textarea 
                            value={formData.description} 
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                            placeholder="مثال: ركز على أسئلة حول المواد الكيميائية الفعالة، والكهرباء الحية وممنوع أسئلة الزراعة..." 
                            className="w-full min-h-[90px] p-3 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white resize-y outline-none focus:border-slate-400 transition-all font-medium placeholder-gray-400" 
                        />
                        <p className="text-[10px] text-gray-400 leading-snug">سوف يقرأها الذكاء الاصطناعي ويلتزم بتوليد أسئلة مطابقة لهذا النطاق والوصف الفني فقط.</p>
                    </div>
                </div>
                
                {/* أزرار الحفظ والإغلاق */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                    <Button variant="outline" onClick={() => setShowAdd(false)} className="w-24 text-xs font-bold h-9">إلغاء</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-36 shadow-sm font-bold text-xs h-9 rounded-xl"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التغييرات"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
