"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Sparkles, Target, AlertCircle, RefreshCw, Search, Trash2, Edit2 } from "lucide-react";
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
        name: "", slug: "", passingScore: 60, examDuration: 60, questionCount: 20, description: ""
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [purging, setPurging] = useState(false);
    
    // New Partial AI Generation States
    const [generatorModal, setGeneratorModal] = useState<{isOpen: boolean, professionId: string, name: string} | null>(null);
    const [axisStats, setAxisStats] = useState<Record<string, number>>({});
    const [partialFormData, setPartialFormData] = useState({ axis: "HEALTH_SAFETY", count: 4 });

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
        setFormData({ name: "", slug: `job-${Math.random().toString(36).substring(2, 8)}`, passingScore: 60, examDuration: 60, questionCount: 20, description: "" });
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
            description: prof.description || ""
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

    const openGeneratorModal = async (prof: any) => {
        setGeneratorModal({ isOpen: true, professionId: prof.id, name: prof.name });
        setAxisStats({});
        try {
            const res = await fetch(`/api/mock/admin/professions/${prof.id}/axis-stats`);
            const data = await res.json();
            if (data.success) {
                setAxisStats(data.stats || {});
            }
        } catch (e) {
            console.error(e);
        }
    };

    const generatePartialAI = async () => {
        if (!generatorModal) return;
        setAiLoading(generatorModal.professionId);
        try {
            const res = await fetch("/api/mock/admin/generate-ai-partial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    professionId: generatorModal.professionId, 
                    axis: partialFormData.axis, 
                    count: partialFormData.count 
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                fetchProfessions();
                setAxisStats(prev => ({
                    ...prev,
                    [partialFormData.axis]: (prev[partialFormData.axis] || 0) + (data.savedCount || 0)
                }));
            } else {
                alert(`خطأ: ${data.error}`);
            }
        } catch (e: any) {
            alert(`خطأ في الاتصال: ${e.message}`);
        } finally {
            setAiLoading(null);
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

            {/* Generator Modal */}
            {generatorModal && generatorModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
                    <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-5 border-b pb-3">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                التوليد حسب المحور
                            </h2>
                            <button onClick={() => setGeneratorModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">المهنة:</p>
                            <p className="font-bold text-gray-800">{generatorModal.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold block text-gray-700">اختر المحور <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full border rounded-md p-2.5 bg-gray-50 focus:bg-white transition-colors text-sm"
                                    value={partialFormData.axis}
                                    onChange={(e) => setPartialFormData(prev => ({ ...prev, axis: e.target.value }))}
                                >
                                    {AXES.map(axis => (
                                        <option key={axis.id} value={axis.id}>
                                            {axis.label} (متوفر: {axisStats[axis.id] || 0} أسئلة)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold block text-gray-700">عدد الأسئلة المطلوب توليدها <span className="text-red-500">*</span></label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    max="20"
                                    value={partialFormData.count} 
                                    onChange={(e) => setPartialFormData(prev => ({ ...prev, count: Number(e.target.value) }))} 
                                    className="bg-gray-50 focus:bg-white transition-colors" 
                                />
                                <p className="text-xs text-gray-500">يفضل ألا يزيد عن 10 في المرة الواحدة لضمان الاستقرار.</p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setGeneratorModal(null)}>إلغاء</Button>
                            <Button 
                                onClick={generatePartialAI} 
                                disabled={aiLoading === generatorModal.professionId}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg gap-2"
                            >
                                {aiLoading === generatorModal.professionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {aiLoading === generatorModal.professionId ? "جاري التوليد..." : "توليد الآن"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

                                    <Button 
                                        onClick={() => openGeneratorModal(prof)} 
                                        disabled={isProcessing}
                                        className={`w-full gap-2 transition-all ${
                                            prof._count?.questions > 0 
                                                ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 disabled:opacity-50" 
                                                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-50"
                                        }`}
                                        variant={prof._count?.questions > 0 ? "outline" : "default"}
                                    >
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                        {isProcessing ? "عملية توليد قيد التنفيذ..." : "توليد أسئلة حسب المحور"}
                                    </Button>
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
