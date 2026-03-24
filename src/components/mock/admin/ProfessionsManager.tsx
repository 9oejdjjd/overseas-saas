"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Sparkles, Target, AlertCircle, RefreshCw, Search } from "lucide-react";
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
        name: "", slug: "", passingScore: 60, examDuration: 60, questionCount: 20
    });
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const fetchProfessions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mock/admin/professions");
            const data = await res.json();
            if (Array.isArray(data)) setProfessions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessions();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.slug) return alert("الاسم والرابط الإنجليزي مطلوبان");
        setSaving(true);
        try {
            const res = await fetch("/api/mock/admin/professions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowAdd(false);
                setFormData({ name: "", slug: "", passingScore: 60, examDuration: 60, questionCount: 20 });
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

    const triggerAIGeneration = async (professionId: string) => {
        if (!confirm("سيتم توليد 30 سؤال جديد باستخدام الذكاء الاصطناعي.. هل أنت متأكد؟")) return;
        setAiLoading(professionId);
        try {
            const res = await fetch("/api/mock/admin/generate-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ professionId })
            });
            if (res.ok) {
                alert("تم إرسال الطلب بنجاح. قد تستغرق عملية التوليد في الخلفية دقيقة إلى دقيقتين. يرجى التحديث لاحقاً لرؤية الأسئلة.");
            } else {
                alert("حدث خطأ أثناء الطلب.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(null);
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
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" onClick={fetchProfessions}><RefreshCw className="h-4 w-4 ml-1" /> تحديث</Button>
                    <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 ml-1" /> إضافة مهنة
                    </Button>
                </div>
            </div>

            <Sheet open={showAdd} onOpenChange={setShowAdd}>
                <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto" dir="rtl">
                    <SheetHeader className="pb-6 border-b text-right">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" />
                            إضافة مهنة جديدة
                        </SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">اسم المهنة (عربي) <span className="text-red-500">*</span></label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: لحام، كهربائي..." className="bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">الرابط الإنجليزي (Slug) <span className="text-red-500">*</span></label>
                            <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })} placeholder="مثال: plumber" className="dir-ltr text-left font-mono bg-gray-50 focus:bg-white transition-colors" />
                            <p className="text-xs text-gray-400">حروف إنجليزية صغيرة بدون مسافات.</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-sm font-semibold block text-gray-700">درجة النجاح (%)</label>
                            <Input type="number" value={formData.passingScore} onChange={e => setFormData({ ...formData, passingScore: Number(e.target.value) })} className="bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold block text-gray-700">مدة الاختبار (دقيقة)</label>
                            <Input type="number" value={formData.examDuration} onChange={e => setFormData({ ...formData, examDuration: Number(e.target.value) })} className="bg-gray-50 focus:bg-white transition-colors" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professions.filter(p => p.name.includes(searchTerm) || p.slug.includes(searchTerm)).map((prof) => (
                    <div key={prof.id} className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${prof.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{prof.name}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{prof.slug}</p>
                            </div>
                            <Badge variant={prof.isActive ? "default" : "secondary"}>{prof.isActive ? "نشط" : "معطل"}</Badge>
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

                        <Button 
                            onClick={() => triggerAIGeneration(prof.id)} 
                            disabled={aiLoading === prof.id}
                            className={`w-full gap-2 transition-all ${
                                prof._count?.questions > 0 
                                    ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200" 
                                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
                            }`}
                            variant={prof._count?.questions > 0 ? "outline" : "default"}
                        >
                            {aiLoading === prof.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {prof._count?.questions > 0 ? "توليد المزيد بالذكاء الاصطناعي" : "توليد الأسئلة فوراً"}
                        </Button>
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
