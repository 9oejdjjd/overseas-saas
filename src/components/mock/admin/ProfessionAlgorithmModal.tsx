import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Save, AlertCircle } from "lucide-react";

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

export interface AlgorithmConfig {
    axes: AxisConfig[];
    typeQuota: TypeQuota;
}

export function ProfessionAlgorithmModal({ profession, isOpen, onClose, onSaved }: { profession: any, isOpen: boolean, onClose: () => void, onSaved: () => void }) {
    const [loading, setLoading] = useState(false);
    
    const [axes, setAxes] = useState<AxisConfig[]>([]);
    const [typeQuota, setTypeQuota] = useState<TypeQuota>({ MCQ: 0, TRUE_FALSE: 0, FILL_BLANK: 0, IMAGE: 0 });

    const totalQuestions = profession?.questionCount || 0;
    
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
            } else {
                // Initialize with defaults if no config, matching original algorithm distributed across 8 axes
                const qHealth = Math.round(totalQuestions * (2 / 30));
                const qSafety = Math.round(totalQuestions * (2 / 30));
                const qEmergency = Math.round(totalQuestions * (1 / 30));
                const qSkills = Math.round(totalQuestions * (1 / 30));
                const qMethods = Math.round(totalQuestions * (1 / 30));
                const qBehavior = Math.round(totalQuestions * (1 / 30));
                const qTools = Math.round(totalQuestions * (1 / 30));
                const qCore = totalQuestions - (qHealth + qSafety + qEmergency + qSkills + qMethods + qBehavior + qTools);
                
                setAxes([
                    { id: crypto.randomUUID(), name: "المعرفة المهنية التخصصية", quota: qCore },
                    { id: crypto.randomUUID(), name: "الصحه والسلامه في بيئه العمل", quota: qHealth },
                    { id: crypto.randomUUID(), name: "السلامه المهنيه والمخاطر المباشره", quota: qSafety },
                    { id: crypto.randomUUID(), name: "الطوارئ والاسعافات الاوليه", quota: qEmergency },
                    { id: crypto.randomUUID(), name: "المهارات العامه وجوده تنفيذ المهام", quota: qSkills },
                    { id: crypto.randomUUID(), name: "الاساليب الصحيحه والقياسيه في المهنه", quota: qMethods },
                    { id: crypto.randomUUID(), name: "السلوك الوظيفي والانضباط المهني", quota: qBehavior },
                    { id: crypto.randomUUID(), name: "استخدام الادوات والمعدات وتشخيصها", quota: qTools }
                ].filter(a => a.quota > 0));

                const imgQuota = allowImg ? 3 : 0;
                const tfQuota = allowTf ? 5 : 0;
                const fbQuota = allowFb ? 5 : 0;
                const mcqQuota = totalQuestions - imgQuota - tfQuota - fbQuota;

                setTypeQuota({ MCQ: mcqQuota, TRUE_FALSE: tfQuota, FILL_BLANK: fbQuota, IMAGE: imgQuota });
            }
        }
    }, [profession, isOpen, totalQuestions, allowImg, allowTf, allowFb]);

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
        // Validation
        const axesSum = axes.reduce((sum, a) => sum + (Number(a.quota) || 0), 0);
        const typesSum = (Number(typeQuota.MCQ) || 0) + (Number(typeQuota.TRUE_FALSE) || 0) + (Number(typeQuota.FILL_BLANK) || 0) + (Number(typeQuota.IMAGE) || 0);

        if (axesSum !== totalQuestions) {
            alert(`إجمالي حصص المحاور (${axesSum}) لا يساوي عدد أسئلة الاختبار (${totalQuestions})!`);
            return;
        }

        if (typesSum !== totalQuestions) {
            alert(`إجمالي حصص الأنواع (${typesSum}) لا يساوي عدد أسئلة الاختبار (${totalQuestions})!`);
            return;
        }

        if (axes.some(a => !a.name.trim())) {
            alert("لا يمكن ترك اسم محور فارغاً!");
            return;
        }

        setLoading(true);
        try {
            const config: AlgorithmConfig = { axes, typeQuota };
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-right" dir="rtl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl text-indigo-700">تخصيص الخوارزمية والمحاور</DialogTitle>
                    <DialogDescription>
                        تحديد وتوزيع حصص الأسئلة للمهنة: <strong className="text-black">{profession?.name}</strong> 
                        <br />
                        <span className="text-orange-600 text-sm flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" /> يجب أن يكون إجمالي الحصص مطابقاً لعدد أسئلة الاختبار ({totalQuestions}).
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-2 space-y-6">
                    {/* Types Quota */}
                    <div className="bg-slate-50 p-4 rounded-xl border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">توزيع أنواع الأسئلة</h3>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${currentTypesSum === totalQuestions ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                المجموع: {currentTypesSum} / {totalQuestions}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">اختيار من متعدد (MCQ)</label>
                                <Input type="number" min="0" value={typeQuota.MCQ} onChange={e => setTypeQuota({...typeQuota, MCQ: parseInt(e.target.value) || 0})} className="text-center" />
                            </div>
                            <div>
                                <label className={`text-xs mb-1 block ${allowTf ? 'text-gray-500' : 'text-gray-300'}`}>صح/خطأ (T/F)</label>
                                <Input type="number" min="0" value={typeQuota.TRUE_FALSE} onChange={e => setTypeQuota({...typeQuota, TRUE_FALSE: parseInt(e.target.value) || 0})} className="text-center" disabled={!allowTf} />
                            </div>
                            <div>
                                <label className={`text-xs mb-1 block ${allowFb ? 'text-gray-500' : 'text-gray-300'}`}>إكمال فراغات</label>
                                <Input type="number" min="0" value={typeQuota.FILL_BLANK} onChange={e => setTypeQuota({...typeQuota, FILL_BLANK: parseInt(e.target.value) || 0})} className="text-center" disabled={!allowFb} />
                            </div>
                            <div>
                                <label className={`text-xs mb-1 block ${allowImg ? 'text-gray-500' : 'text-gray-300'}`}>أسئلة صور</label>
                                <Input type="number" min="0" value={typeQuota.IMAGE} onChange={e => setTypeQuota({...typeQuota, IMAGE: parseInt(e.target.value) || 0})} className="text-center" disabled={!allowImg} />
                            </div>
                        </div>
                    </div>

                    {/* Axes Quota */}
                    <div className="bg-white p-4 rounded-xl border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">المحاور المخصصة للمهنة</h3>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${currentAxesSum === totalQuestions ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                المجموع: {currentAxesSum} / {totalQuestions}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {axes.map((axis, index) => (
                                <div key={axis.id} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-sm font-bold text-gray-400 border">{index + 1}</div>
                                    <div className="flex-1">
                                        <Input 
                                            value={axis.name} 
                                            onChange={e => handleUpdateAxis(axis.id, 'name', e.target.value)}
                                            placeholder="اسم المحور المخصص (مثال: الصحة والسلامة)"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input 
                                            type="number" 
                                            min="0"
                                            value={axis.quota} 
                                            onChange={e => handleUpdateAxis(axis.id, 'quota', parseInt(e.target.value) || 0)}
                                            className="bg-white text-center"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAxis(axis.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={handleAddAxis} className="w-full mt-4 border-dashed gap-2 text-indigo-600 hover:text-indigo-700">
                            <Plus className="w-4 h-4" />
                            إضافة محور جديد
                        </Button>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 flex gap-2 sm:justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>إلغاء</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ التخصيص
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
