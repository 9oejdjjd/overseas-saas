import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Loader2, Plus, Trash2, Save, AlertCircle, Sparkles, 
    Copy, Check, Code2, Scale, Wand2
} from "lucide-react";
import { buildAxesGenerationPrompt } from "@/lib/mock-exams/promptBuilder";
import { equalizeAxesQuotas, parseAxesJson } from "@/lib/mock-exams/axesHelper";

export interface AxisConfig {
    id: string;
    name: string;
    quota: number;
}

export interface TypeQuota {
    MCQ: number;
    TRUE_FALSE: number;
    FILL_BLANK: number;
    IMAGE: number;
}

export interface CognitiveQuota {
    K1: number;
    K2: number;
    K3: number;
    K4: number;
    K5: number;
}

export interface AlgorithmConfig {
    axes: AxisConfig[];
    typeQuota: TypeQuota;
    cognitiveQuota?: CognitiveQuota;
}

export function ProfessionAlgorithmModal({ profession, isOpen, onClose, onSaved }: { profession: any, isOpen: boolean, onClose: () => void, onSaved: () => void }) {
    const [loading, setLoading] = useState(false);
    const [aiGenLoading, setAiGenLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showJsonInput, setShowJsonInput] = useState(false);
    const [pastedJson, setPastedJson] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);

    const [axes, setAxes] = useState<AxisConfig[]>([]);
    const [typeQuota, setTypeQuota] = useState<TypeQuota>({ MCQ: 0, TRUE_FALSE: 0, FILL_BLANK: 0, IMAGE: 0 });
    const [cognitiveQuota, setCognitiveQuota] = useState<CognitiveQuota>({ K1: 0, K2: 0, K3: 0, K4: 0, K5: 0 });

    const totalQuestions = profession?.questionCount || 30;
    
    const enabledTypes = (profession?.enabledQuestionTypes || "MCQ").split(",");
    const allowImg = enabledTypes.includes("IMAGE");
    const allowTf = enabledTypes.includes("TRUE_FALSE");
    const allowFb = enabledTypes.includes("FILL_BLANK");

    useEffect(() => {
        if (profession && isOpen) {
            if (profession.algorithmConfig) {
                const config = profession.algorithmConfig as AlgorithmConfig;
                setAxes(config.axes || []);
                setTypeQuota(config.typeQuota || { MCQ: totalQuestions, TRUE_FALSE: 0, FILL_BLANK: 0, IMAGE: 0 });
                if (config.cognitiveQuota) {
                    setCognitiveQuota({
                        K1: config.cognitiveQuota.K1 || 0,
                        K2: config.cognitiveQuota.K2 || 0,
                        K3: config.cognitiveQuota.K3 || 0,
                        K4: config.cognitiveQuota.K4 || 0,
                        K5: config.cognitiveQuota.K5 || 0,
                    });
                } else {
                    const k3Default = Math.ceil(totalQuestions * 0.5);
                    setCognitiveQuota({
                        K1: 0,
                        K2: totalQuestions - k3Default,
                        K3: k3Default,
                        K4: 0,
                        K5: 0
                    });
                }
            } else {
                // Initialize defaults
                const qHealth = Math.round(totalQuestions * (2 / 30));
                const qSafety = Math.round(totalQuestions * (2 / 30));
                const qEmergency = Math.round(totalQuestions * (1 / 30));
                const qSkills = Math.round(totalQuestions * (1 / 30));
                const qMethods = Math.round(totalQuestions * (1 / 30));
                const qBehavior = Math.round(totalQuestions * (1 / 30));
                const qTools = Math.round(totalQuestions * (1 / 30));
                const qCore = totalQuestions - (qHealth + qSafety + qEmergency + qSkills + qMethods + qBehavior + qTools);
                
                setAxes([
                    { id: crypto.randomUUID(), name: "المعرفة المهنية التخصصية (Core Professional Knowledge)", quota: qCore },
                    { id: crypto.randomUUID(), name: "الصحة والسلامة في بيئة العمل (Occupational Health & Safety)", quota: qHealth },
                    { id: crypto.randomUUID(), name: "السلامة المهنية والمخاطر المباشرة (Direct Occupational Hazards)", quota: qSafety },
                    { id: crypto.randomUUID(), name: "الطوارئ والإسعافات الأولية (Emergencies & First Aid)", quota: qEmergency },
                    { id: crypto.randomUUID(), name: "المهارات العامة وجودة التنفيذ (General Skills & Quality)", quota: qSkills },
                    { id: crypto.randomUUID(), name: "الأساليب الصحيحة والقياسية في المهنة (Standard Professional Methods)", quota: qMethods },
                    { id: crypto.randomUUID(), name: "السلوك الوظيفي والانضباط المهني (Professional Ethics & Conduct)", quota: qBehavior },
                    { id: crypto.randomUUID(), name: "استخدام الأدوات والمعدات وتشخيصها (Tools & Equipment Diagnostics)", quota: qTools }
                ].filter(a => a.quota > 0));

                const imgQuota = allowImg ? 3 : 0;
                const tfQuota = allowTf ? 5 : 0;
                const fbQuota = allowFb ? 5 : 0;
                const mcqQuota = totalQuestions - imgQuota - tfQuota - fbQuota;

                setTypeQuota({ MCQ: mcqQuota, TRUE_FALSE: tfQuota, FILL_BLANK: fbQuota, IMAGE: imgQuota });

                const k3Default = Math.ceil(totalQuestions * 0.5);
                setCognitiveQuota({
                    K1: 0,
                    K2: totalQuestions - k3Default,
                    K3: k3Default,
                    K4: 0,
                    K5: 0
                });
            }
        }
    }, [profession, isOpen, totalQuestions, allowImg, allowTf, allowFb]);

    // نسخ البرومبت المخصص
    const handleCopyPrompt = async () => {
        if (!profession?.name) return;
        const prompt = buildAxesGenerationPrompt(profession.name, totalQuestions, profession.description || "");
        try {
            await navigator.clipboard.writeText(prompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
        } catch (e) {
            alert("فشل النسخ إلى الحافظة تلقائياً.");
        }
    };

    // التوليد المباشر عبر الذكاء الاصطناعي
    const handleDirectAiGenerate = async () => {
        if (!profession?.name) return;
        setAiGenLoading(true);
        try {
            const res = await fetch("/api/mock/admin/professions/generate-axes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profName: profession.name,
                    questionCount: totalQuestions,
                    description: profession.description || ""
                })
            });
            const data = await res.json();
            if (res.ok && data.axes) {
                setAxes(data.axes);
                alert(`✅ تم توليد وتطبيق ${data.axes.length} محاور ثنائية اللغة بنجاح!`);
            } else {
                alert(data.error || "حدث خطأ أثناء توليد المحاور بالذكاء الاصطناعي");
            }
        } catch (e) {
            alert("فشل الاتصال بخادم التوليد بالذكاء الاصطناعي");
        } finally {
            setAiGenLoading(false);
        }
    };

    // استيراد المحاور من JSON
    const handleImportJson = () => {
        const res = parseAxesJson(pastedJson, totalQuestions);
        if (res.success && res.axes.length > 0) {
            setAxes(res.axes);
            setJsonError(null);
            setShowJsonInput(false);
            setPastedJson("");
            alert(`✅ تم استيراد واعتماد ${res.axes.length} محاور بنجاح!`);
        } else {
            setJsonError(res.error || "صيغة JSON غير صالحة");
        }
    };

    // موازن الحصص التلقائي
    const handleEqualize = () => {
        if (axes.length === 0) return;
        const balanced = equalizeAxesQuotas(axes, totalQuestions);
        setAxes(balanced);
        alert(`✅ تم إعادة توازن حصص المحاور ليصبح المجموع المطابق ${totalQuestions} سؤالاً!`);
    };

    const handleAddAxis = () => {
        setAxes([...axes, { id: crypto.randomUUID(), name: "محور جديد", quota: 0 }]);
    };

    const handleRemoveAxis = (id: string) => {
        setAxes(axes.filter(a => a.id !== id));
    };

    const handleUpdateAxis = (id: string, field: 'name' | 'quota', value: any) => {
        setAxes(axes.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleSave = async () => {
        const axesSum = axes.reduce((sum, a) => sum + (Number(a.quota) || 0), 0);
        const typesSum = (Number(typeQuota.MCQ) || 0) + (Number(typeQuota.TRUE_FALSE) || 0) + (Number(typeQuota.FILL_BLANK) || 0) + (Number(typeQuota.IMAGE) || 0);
        const cognitiveSum = (Number(cognitiveQuota.K1) || 0) + (Number(cognitiveQuota.K2) || 0) + (Number(cognitiveQuota.K3) || 0) + (Number(cognitiveQuota.K4) || 0) + (Number(cognitiveQuota.K5) || 0);

        if (axesSum !== totalQuestions) {
            alert(`إجمالي حصص المحاور (${axesSum}) لا يساوي عدد أسئلة الاختبار (${totalQuestions})! اضغط على زر 'توازن تلقائي' للتصحيح الفوري.`);
            return;
        }

        if (typesSum !== totalQuestions) {
            alert(`إجمالي حصص الأنواع (${typesSum}) لا يساوي عدد أسئلة الاختبار (${totalQuestions})!`);
            return;
        }

        if (cognitiveSum !== totalQuestions) {
            alert(`إجمالي حصص مستويات المعرفة (${cognitiveSum}) لا يساوي عدد أسئلة الاختبار (${totalQuestions})!`);
            return;
        }

        if (axes.some(a => !a.name.trim())) {
            alert("لا يمكن ترك اسم محور فارغاً!");
            return;
        }

        setLoading(true);
        try {
            const config: AlgorithmConfig = { axes, typeQuota, cognitiveQuota };
            const res = await fetch(`/api/mock/admin/professions`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: profession.id, algorithmConfig: config })
            });

            if (!res.ok) throw new Error("Failed to save");
            alert("تم حفظ إعدادات الخوارزمية بنجاح!");
            onSaved();
            onClose();
        } catch (e: any) {
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setLoading(false);
        }
    };

    const currentAxesSum = axes.reduce((sum, a) => sum + (Number(a.quota) || 0), 0);
    const currentTypesSum = (Number(typeQuota.MCQ) || 0) + (Number(typeQuota.TRUE_FALSE) || 0) + (Number(typeQuota.FILL_BLANK) || 0) + (Number(typeQuota.IMAGE) || 0);
    const currentCognitiveSum = (Number(cognitiveQuota.K1) || 0) + (Number(cognitiveQuota.K2) || 0) + (Number(cognitiveQuota.K3) || 0) + (Number(cognitiveQuota.K4) || 0) + (Number(cognitiveQuota.K5) || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-right rounded-2xl" dir="rtl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-black text-indigo-900 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        تخصيص الخوارزمية والمحاور الذكية
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 pt-1">
                        تحديد وتوزيع حصص الأسئلة والمحاور للمهنة: <strong className="text-black">{profession?.name}</strong> 
                        <br />
                        <span className="text-amber-700 text-xs font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> إجمالي الحصص المطلوب: ({totalQuestions}) سؤالاً لكل نموذج اختباري.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-2 space-y-6">
                    {/* 🤖 شريط التوليد السريع بالذكاء الاصطناعي */}
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                                <h3 className="font-bold text-xs">أدوات الذكاء الاصطناعي لتوليد المحاور والحصص (8-13 محور ثنائي اللغة)</h3>
                            </div>
                            <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded text-indigo-100">AI Powered</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Button
                                type="button"
                                onClick={handleDirectAiGenerate}
                                disabled={aiGenLoading}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 gap-1.5 rounded-xl shadow-sm"
                            >
                                {aiGenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                توليد المحاور آلياً بالـ AI
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyPrompt}
                                className="border-white/30 text-white hover:bg-white/10 font-bold text-xs h-9 gap-1.5 rounded-xl bg-transparent"
                            >
                                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copySuccess ? "تم نسخ البرومبت!" : "نسخ البرومبت لـ ChatGPT"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowJsonInput(!showJsonInput)}
                                className="border-white/30 text-white hover:bg-white/10 font-bold text-xs h-9 gap-1.5 rounded-xl bg-transparent"
                            >
                                <Code2 className="w-3.5 h-3.5" />
                                {showJsonInput ? "إخفاء خانة JSON" : "لصق كود JSON المحاور"}
                            </Button>
                        </div>

                        {showJsonInput && (
                            <div className="space-y-2 pt-2 border-t border-white/20">
                                <textarea
                                    value={pastedJson}
                                    onChange={e => setPastedJson(e.target.value)}
                                    placeholder='الطق كود JSON المولد هنا...'
                                    className="w-full h-24 p-2.5 text-xs font-mono rounded-xl bg-slate-950/80 border border-indigo-400/40 text-indigo-100 placeholder-indigo-300/40 focus:outline-none"
                                />
                                {jsonError && <p className="text-xs font-bold text-red-300">{jsonError}</p>}
                                <Button
                                    type="button"
                                    onClick={handleImportJson}
                                    className="bg-white text-slate-900 hover:bg-indigo-50 font-bold text-xs h-8 w-full rounded-xl"
                                >
                                    تطبيق واستيراد المحاور
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Types Quota */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xs text-gray-800">توزيع أنواع الأسئلة</h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentTypesSum === totalQuestions ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                المجموع: {currentTypesSum} / {totalQuestions}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">اختيار من متعدد (MCQ)</label>
                                <Input type="number" min="0" value={typeQuota.MCQ} onChange={e => setTypeQuota({...typeQuota, MCQ: parseInt(e.target.value) || 0})} className="text-center bg-white font-bold" />
                            </div>
                            <div>
                                <label className={`text-[11px] font-bold mb-1 block ${allowTf ? 'text-gray-600' : 'text-gray-300'}`}>صح/خطأ (T/F)</label>
                                <Input type="number" min="0" value={typeQuota.TRUE_FALSE} onChange={e => setTypeQuota({...typeQuota, TRUE_FALSE: parseInt(e.target.value) || 0})} className="text-center bg-white font-bold" disabled={!allowTf} />
                            </div>
                            <div>
                                <label className={`text-[11px] font-bold mb-1 block ${allowFb ? 'text-gray-500' : 'text-gray-300'}`}>إكمال فراغات</label>
                                <Input type="number" min="0" value={typeQuota.FILL_BLANK} onChange={e => setTypeQuota({...typeQuota, FILL_BLANK: parseInt(e.target.value) || 0})} className="text-center bg-white font-bold" disabled={!allowFb} />
                            </div>
                            <div>
                                <label className={`text-[11px] font-bold mb-1 block ${allowImg ? 'text-gray-500' : 'text-gray-300'}`}>أسئلة صور</label>
                                <Input type="number" min="0" value={typeQuota.IMAGE} onChange={e => setTypeQuota({...typeQuota, IMAGE: parseInt(e.target.value) || 0})} className="text-center bg-white font-bold" disabled={!allowImg} />
                            </div>
                        </div>
                    </div>

                    {/* Cognitive Quota */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xs text-gray-800">توزيع مستويات المعرفة (Cognitive Levels)</h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentCognitiveSum === totalQuestions ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                المجموع: {currentCognitiveSum} / {totalQuestions}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">K1 (استدعاء ومعرفة)</label>
                                <Input type="number" min="0" value={cognitiveQuota.K1} onChange={e => setCognitiveQuota({...cognitiveQuota, K1: parseInt(e.target.value) || 0})} className="text-center bg-white h-8 text-xs px-2 font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">K2 (تطبيق وتنقيد)</label>
                                <Input type="number" min="0" value={cognitiveQuota.K2} onChange={e => setCognitiveQuota({...cognitiveQuota, K2: parseInt(e.target.value) || 0})} className="text-center bg-white h-8 text-xs px-2 font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">K3 (تحليل ومقارنة)</label>
                                <Input type="number" min="0" value={cognitiveQuota.K3} onChange={e => setCognitiveQuota({...cognitiveQuota, K3: parseInt(e.target.value) || 0})} className="text-center bg-white h-8 text-xs px-2 font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">K4 (تشخيص أعطال)</label>
                                <Input type="number" min="0" value={cognitiveQuota.K4 || 0} onChange={e => setCognitiveQuota({...cognitiveQuota, K4: parseInt(e.target.value) || 0})} className="text-center bg-white h-8 text-xs px-2 font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">K5 (تقييم واتخاذ قرار)</label>
                                <Input type="number" min="0" value={cognitiveQuota.K5 || 0} onChange={e => setCognitiveQuota({...cognitiveQuota, K5: parseInt(e.target.value) || 0})} className="text-center bg-white h-8 text-xs px-2 font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* Axes Quota */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-xs text-gray-900">المحاور المخصصة للمهنة ({axes.length})</h3>
                                {currentAxesSum !== totalQuestions && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleEqualize}
                                        className="h-7 text-[10px] font-bold text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 gap-1 rounded-lg"
                                    >
                                        <Scale className="w-3 h-3" />
                                        إعادة التوازن التلقائي ({currentAxesSum} ➔ {totalQuestions})
                                    </Button>
                                )}
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${currentAxesSum === totalQuestions ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                المجموع: {currentAxesSum} / {totalQuestions}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {axes.map((axis, index) => (
                                <div key={axis.id} className="flex gap-2.5 items-center bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100/70 flex items-center justify-center text-xs font-black text-indigo-700 shrink-0">{index + 1}</div>
                                    <div className="flex-1">
                                        <Input 
                                            value={axis.name} 
                                            onChange={e => handleUpdateAxis(axis.id, 'name', e.target.value)}
                                            placeholder="اسم المحور بالعربي (English Axis Name)"
                                            className="bg-white text-xs font-semibold h-9"
                                        />
                                    </div>
                                    <div className="w-24 shrink-0">
                                        <Input 
                                            type="number" 
                                            min="0"
                                            value={axis.quota} 
                                            onChange={e => handleUpdateAxis(axis.id, 'quota', parseInt(e.target.value) || 0)}
                                            className="bg-white text-center font-black h-9 text-xs"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAxis(axis.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 shrink-0">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={handleAddAxis} className="w-full border-dashed gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-xs h-9 rounded-xl">
                            <Plus className="w-4 h-4" />
                            إضافة محور يدوي جديد
                        </Button>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 flex gap-2 sm:justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold text-xs">إلغاء</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 rounded-xl h-9 px-5">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ وتخصيص الخوارزمية
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
