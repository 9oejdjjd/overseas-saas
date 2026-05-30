/**
 * @file ProfessionFormSheet.tsx
 * @description مكون نموذج إضافة وتعديل خصائص المهن (ProfessionFormSheet).
 * ينعزل بمتغيراته وتحكماته لتقليص الأكواد المزدحمة في قسم المهن والتخصصات.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, CheckSquare, Target, Image as ImageIcon, ToggleLeft, ToggleRight, Loader2, Plus, Edit2 } from "lucide-react";
import { ProfessionFormData } from "@/hooks/mock-exams/useProfessionsManager";

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
    
    // منطق تبديل الحالات المخصصة لأنواع الأسئلة الاختيارية المفعّلة
    const toggleQuestionType = (typeId: string) => {
        const currentTypes = formData.enabledQuestionTypes.split(",").filter(t => t);
        const newTypes = currentTypes.includes(typeId) 
            ? currentTypes.filter(t => t !== typeId) 
            : [...currentTypes, typeId];
            
        // التأكيد على بقاء اختيار متعدد (MCQ) مفعلاً دائماً كنوع أساسي
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

    return (
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
            <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto rounded-l-2xl shadow-2xl p-6" dir="rtl">
                <SheetHeader className="pb-6 border-b text-right">
                    <SheetTitle className="text-xl font-black flex items-center gap-2 text-gray-900">
                        {editingId ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                        {editingId ? "تعديل خصائص المهنة" : "إضافة مهنة جديدة"}
                    </SheetTitle>
                </SheetHeader>
                
                <div className="py-6 space-y-5">
                    {/* اسم المهنة باللغة العربية */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold block text-gray-700">اسم المهنة (عربي) <span className="text-red-500">*</span></label>
                        <Input 
                            value={formData.name} 
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                            placeholder="مثال: لحام، كهربائي مباني..." 
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
                        <p className="text-[10px] text-gray-400 leading-snug">يمكنك تعديل الرابط أو تركه كما هو لإمكانية الاستدعاء المباشر.</p>
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
                        className="bg-slate-900 hover:bg-slate-800 w-32 shadow-sm font-bold text-xs h-9"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التغييرات"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
