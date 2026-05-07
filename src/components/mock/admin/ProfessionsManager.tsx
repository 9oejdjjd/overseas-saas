"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Sparkles, Target, AlertCircle, RefreshCw, Search, Trash2, Edit2, CheckSquare, Image, ListChecks, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ProfessionsManager() {
    const [professions, setProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "", slug: "", passingScore: 60, examDuration: 60, questionCount: 30, description: "", enabledQuestionTypes: "MCQ"
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [purging, setPurging] = useState(false);
    


    const AXES = [
        { id: "HEALTH_SAFETY", label: "الصحة والسلامة في بيئة العمل" },
        { id: "PROFESSION_KNOWLEDGE", label: "المعرفة المهنية التخصصية" },
        { id: "GENERAL_SKILLS", label: "المهارات العامة وجودة التنفيذ" },
        { id: "OCCUPATIONAL_SAFETY", label: "السلامة المهنية والمخاطر المباشرة" },
        { id: "CORRECT_METHODS", label: "الأساليب الصحيحة والقياسية للمهنة" },
        { id: "PROFESSIONAL_BEHAVIOR", label: "السلوك الوظيفي والانضباط المهني" },
        { id: "TOOLS_AND_EQUIPMENT", label: "استخدام الأدوات والمعدات وتشخيصها" },
        { id: "EMERGENCIES_FIRST_AID", label: "الطوارئ والإسعافات الأولية" }
    ];

    const fetchProfessions = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch("/api/mock/admin/professions");
            const data = await res.json();
            if (Array.isArray(data)) setProfessions(data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessions(false);
        
        // Auto-refresh interval silently if any generation is happening
        const interval = setInterval(() => {
            setProfessions(current => {
                const isGenerating = current.some((p: any) => p.aiJobs?.filter((j:any) => j.status === "PROCESSING").length > 0);
                if (isGenerating || aiLoading) {
                    fetchProfessions(true);
                }
                return current;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [aiLoading]);

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: "", slug: `job-${Math.random().toString(36).substring(2, 8)}`, passingScore: 60, examDuration: 60, questionCount: 30, description: "", enabledQuestionTypes: "MCQ" });
        setShowAdd(true);
    };

    const openEditModal = (prof: any) => {
        setEditingId(prof.id);
        setFormData({
            name: prof.name,
            slug: prof.slug,
            passingScore: prof.passingScore,
            examDuration: prof.examDuration,
            questionCount: prof.questionCount,
            description: prof.description || "",
            enabledQuestionTypes: prof.enabledQuestionTypes || "MCQ"
        });
        setShowAdd(true);
    };

    const handleSave = async () => {
        if (!formData.name) return alert("اسم المهنة مطلوب");
        const finalSlug = formData.slug.trim() || `job-${Math.random().toString(36).substring(2, 8)}`;
        
        setSaving(true);
        try {
            const endpoint = editingId ? `/api/mock/admin/professions/${editingId}` : "/api/mock/admin/professions";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, slug: finalSlug })
            });
            if (res.ok) {
                setShowAdd(false);
                fetchProfessions();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };



    const purgeAllQuestions = async () => {
        if (!confirm("⚠️ تحذير: سيتم حذف جميع الأسئلة والخيارات والجلسات المرتبطة نهائياً.\nهل أنت متأكد تماماً؟")) return;
        if (!confirm("تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه. اضغط OK للمتابعة.")) return;
        setPurging(true);
        try {
            const res = await fetch("/api/mock/admin/questions", { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                alert(`تم الحذف بنجاح:\n- ${data.deleted.questions} سؤال\n- ${data.deleted.options} خيار\n- ${data.deleted.sessionQuestions} ارتباط جلسة\n- ${data.deleted.aiJobs} وظيفة توليد`);
                fetchProfessions();
            } else {
                alert(data.error || "حدث خطأ");
            }
        } catch (e) {
            console.error(e);
            alert("فشل في الاتصال بالخادم");
        } finally {
            setPurging(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">المهن والتخصصات</h2>
                    <p className="text-sm text-gray-500">إدارة قوائم المهن وتوليد أسئلتها</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="بحث عن مهنة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9 bg-white"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 flex-wrap">
                    <Button variant="outline" onClick={() => fetchProfessions()}><RefreshCw className="h-4 w-4 ml-1" /> تحديث</Button>
                    <Button variant="destructive" onClick={purgeAllQuestions} disabled={purging} className="gap-1">
                        {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        حذف جميع الأسئلة
                    </Button>
                    <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 ml-1" /> إضافة مهنة
                    </Button>
                </div>
            </div>

            <Sheet open={showAdd} onOpenChange={setShowAdd}>
                <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto" dir="rtl">
                    <SheetHeader className="pb-6 border-b text-right">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            {editingId ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                            {editingId ? "تعديل المهنة" : "إضافة مهنة جديدة"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">اسم المهنة (عربي) <span className="text-red-500">*</span></label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: لحام، كهربائي..." className="bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">الرابط الإنجليزي (Slug) <span className="text-gray-400 font-normal text-xs">(يتم توليده تلقائياً)</span></label>
                            <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })} placeholder="يتم توليده تلقائياً..." className="dir-ltr text-left font-mono bg-gray-50 focus:bg-white transition-colors" />
                            <p className="text-xs text-gray-400">يمكنك تغييره إذا أردت، أو تركه كما هو.</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-sm font-semibold block text-gray-700">درجة النجاح (%)</label>
                            <Input type="number" value={formData.passingScore} onChange={e => setFormData({ ...formData, passingScore: Number(e.target.value) })} className="bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">مدة الاختبار (دقيقة)</label>
                            <Input type="number" value={formData.examDuration} onChange={e => setFormData({ ...formData, examDuration: Number(e.target.value) })} className="bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">عدد الأسئلة في كل جلسة اختبار</label>
                            <Input type="number" min="1" value={formData.questionCount} onChange={e => setFormData({ ...formData, questionCount: Number(e.target.value) })} className="bg-gray-50 focus:bg-white transition-colors" />
                            <p className="text-xs text-gray-500">عدد الأسئلة التي ستظهر للممتحن في كل جلسة اختبار (الافتراضي: 30).</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t">
                            <label className="text-sm font-semibold block text-gray-700">أنواع الأسئلة المفعلة في الاختبار</label>
                            <p className="text-xs text-gray-500 -mt-1">حدد أنواع الأسئلة التي ستظهر للممتحن. النوع الأساسي (اختيار من متعدد) مفعل دائماً.</p>
                            <div className="space-y-2">
                                {/* MCQ - Always enabled */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><ListChecks className="h-4 w-4 text-blue-600" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-800">اختيار من متعدد (MCQ)</p>
                                            <p className="text-[11px] text-blue-500">النوع الأساسي — مفعل دائماً</p>
                                        </div>
                                    </div>
                                    <div className="text-blue-400 text-xs font-bold bg-blue-100 px-2 py-1 rounded-md">مفعل ✓</div>
                                </div>
                                {/* TRUE_FALSE */}
                                {(() => {
                                    const types = formData.enabledQuestionTypes.split(",");
                                    const toggleType = (type: string) => {
                                        const current = formData.enabledQuestionTypes.split(",").filter(t => t);
                                        const newTypes = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
                                        if (!newTypes.includes("MCQ")) newTypes.unshift("MCQ");
                                        setFormData({ ...formData, enabledQuestionTypes: newTypes.join(",") });
                                    };
                                    const OPTIONAL_TYPES = [
                                        { id: "TRUE_FALSE", label: "صح أو خطأ", desc: "أسئلة بخيارين فقط (صح / خطأ)", icon: <CheckSquare className="h-4 w-4" />, color: "emerald" },
                                        { id: "FILL_BLANK", label: "إكمال الفراغات", desc: "أكمل الجملة من 4 خيارات", icon: <Target className="h-4 w-4" />, color: "purple" },
                                        { id: "IMAGE", label: "أسئلة الصور", desc: "أسئلة مرفق بها صورة توضيحية", icon: <Image className="h-4 w-4" />, color: "amber" },
                                    ];
                                    return OPTIONAL_TYPES.map(t => {
                                        const isEnabled = types.includes(t.id);
                                        const colorMap: any = {
                                            emerald: { bg: isEnabled ? "bg-emerald-50" : "bg-gray-50", border: isEnabled ? "border-emerald-200" : "border-gray-200", iconBg: isEnabled ? "bg-emerald-100" : "bg-gray-100", iconText: isEnabled ? "text-emerald-600" : "text-gray-400", title: isEnabled ? "text-emerald-800" : "text-gray-600", desc: isEnabled ? "text-emerald-500" : "text-gray-400" },
                                            purple: { bg: isEnabled ? "bg-purple-50" : "bg-gray-50", border: isEnabled ? "border-purple-200" : "border-gray-200", iconBg: isEnabled ? "bg-purple-100" : "bg-gray-100", iconText: isEnabled ? "text-purple-600" : "text-gray-400", title: isEnabled ? "text-purple-800" : "text-gray-600", desc: isEnabled ? "text-purple-500" : "text-gray-400" },
                                            amber: { bg: isEnabled ? "bg-amber-50" : "bg-gray-50", border: isEnabled ? "border-amber-200" : "border-gray-200", iconBg: isEnabled ? "bg-amber-100" : "bg-gray-100", iconText: isEnabled ? "text-amber-600" : "text-gray-400", title: isEnabled ? "text-amber-800" : "text-gray-600", desc: isEnabled ? "text-amber-500" : "text-gray-400" },
                                        };
                                        const c = colorMap[t.color];
                                        return (
                                            <button key={t.id} type="button" onClick={() => toggleType(t.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${c.bg} ${c.border} hover:shadow-sm`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center ${c.iconText}`}>{t.icon}</div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-bold ${c.title}`}>{t.label}</p>
                                                        <p className={`text-[11px] ${c.desc}`}>{t.desc}</p>
                                                    </div>
                                                </div>
                                                {isEnabled ? <ToggleRight className="h-7 w-7 text-emerald-500" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-sm font-semibold block text-gray-700">التوجيهات والوصف (للذكاء الاصطناعي)</label>
                            <textarea 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                placeholder="مثال: ركز على أسئلة حول المواد الكيميائية الخطرة، ممنوع أسئلة الزراعة..." 
                                className="w-full min-h-[100px] p-3 text-sm rounded-md border bg-gray-50 focus:bg-white resize-y" 
                            />
                            <p className="text-xs text-gray-500">سوف يقرأها الذكاء الاصطناعي ويجبر نفسه على توليد أسئلة تخص هذا الوصف فقط.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                        <Button variant="outline" onClick={() => setShowAdd(false)} className="w-24">إلغاء</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 w-32 shadow-sm font-semibold">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ المهنة'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Generator Modal Removed */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professions.filter(p => p.name.includes(searchTerm) || p.slug.includes(searchTerm)).map((prof) => (
                    <div key={prof.id} className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${prof.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{prof.name}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{prof.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(prof)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Badge variant={prof.isActive ? "default" : "secondary"}>{prof.isActive ? "نشط" : "معطل"}</Badge>
                            </div>
                        </div>
                        {/* Question Type Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {(() => {
                                const types = (prof.enabledQuestionTypes || "MCQ").split(",");
                                const typeLabels: any = { MCQ: { label: "متعدد", style: "bg-blue-50 text-blue-700 border-blue-200" }, TRUE_FALSE: { label: "صح/خطأ", style: "bg-emerald-50 text-emerald-700 border-emerald-200" }, FILL_BLANK: { label: "إكمال", style: "bg-purple-50 text-purple-700 border-purple-200" }, IMAGE: { label: "صور", style: "bg-amber-50 text-amber-700 border-amber-200" } };
                                return types.map((t: string) => typeLabels[t] ? <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeLabels[t].style}`}>{typeLabels[t].label}</span> : null);
                            })()}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-5 border-t border-gray-100 pt-4">
                            <div className="text-center bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs text-gray-500">الأسئلة المتوفرة</p>
                                <p className="font-bold text-lg text-indigo-700">{prof._count?.questions || 0}</p>
                            </div>
                            <div className="text-center bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs text-gray-500">الامتحانات المُجراة</p>
                                <p className="font-bold text-lg text-blue-700">{prof._count?.examSessions || 0}</p>
                            </div>
                            <div className="text-center bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs text-gray-500">درجة النجاح</p>
                                <p className="font-bold text-gray-700">{prof.passingScore}%</p>
                            </div>
                            <div className="text-center bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs text-gray-500">المدة (دقيقة)</p>
                                <p className="font-bold text-gray-700">{prof.examDuration}</p>
                            </div>
                        </div>

                        {/* Progress Bar / Indicator */}
                        {(() => {
                            const isThisLoading = aiLoading === prof.id;
                            const activeJob = prof.aiJobs?.find((j: any) => j.status === "PROCESSING");
                            const isProcessing = isThisLoading || !!activeJob;
                            const generated = activeJob?.questionsGenerated || 0;
                            const requested = activeJob?.questionsRequested || 32;
                            const progressPercent = Math.min(100, Math.max(5, (generated / requested) * 100));

                            return (
                                <>
                                    {isProcessing && (
                                        <div className="mb-4 bg-purple-50/50 rounded-lg p-3 border border-purple-100 relative overflow-hidden">
                                            <div 
                                                className="absolute bottom-0 right-0 h-1 bg-purple-500 transition-all duration-1000 ease-in-out" 
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-2 text-purple-700">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span className="text-sm font-bold">جاري توليد الأسئلة...</span>
                                                </div>
                                                <span className="text-sm font-mono font-bold text-purple-600">
                                                    {generated} / {requested}
                                                </span>
                                            </div>
                                        </div>
                                    )}


                                </>
                            );
                        })()}
                    </div>
                ))}
                {professions.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        لا توجد مهن مضافة حتى الآن.
                    </div>
                )}
            </div>
        </div>
    );
}
