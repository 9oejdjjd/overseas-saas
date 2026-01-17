"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, MessageSquare, Plus, Trash2 } from "lucide-react";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/templates");
            const data = await res.json();
            setTemplates(data);
            if (data.length > 0 && !selectedTemplate) setSelectedTemplate(data[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            await fetch("/api/settings/templates", {
                method: "POST", // Using POST for upsert logic ideally, or PUT
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedTemplate),
            });
            alert("تم حفظ القالب بنجاح");
            fetchTemplates();
        } catch (error) {
            alert("خطأ في الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const getTriggerLabel = (trigger: string) => {
        const map: any = {
            "ON_REGISTRATION": "عند التسجيل الجديد",
            "ON_EXAM_SCHEDULE": "عند تحديد موعد اختبار",
            "ON_PASS": "عند النجاح",
            "ON_FAIL": "عند الرسوب",
            "ON_TICKET_ISSUED": "عند قص التذكرة"
        };
        return map[trigger] || trigger;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">إدارة قوالب الرسائل</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                {/* Sidebar List */}
                <div className="border rounded-xl bg-white overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 border-b">
                        <h3 className="font-bold text-gray-700">القوالب المتوفرة</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : (
                            templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t)}
                                    className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedTemplate?.id === t.id ? "bg-blue-50 border-blue-200 shadow-sm" : "hover:bg-gray-50 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className={`h-4 w-4 ${selectedTemplate?.id === t.id ? "text-blue-600" : "text-gray-400"}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${selectedTemplate?.id === t.id ? "text-blue-900" : "text-gray-700"}`}>{t.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{getTriggerLabel(t.trigger)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t bg-gray-50 flex justify-center">
                        <Button variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setSelectedTemplate({ name: "قالب جديد", body: "", trigger: "" })}>
                            <Plus className="h-4 w-4" /> إضافة قالب جديد
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="col-span-2 border rounded-xl bg-white flex flex-col">
                    {selectedTemplate ? (
                        <>
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <div>
                                    {selectedTemplate.id && getTriggerLabel(selectedTemplate.trigger) !== selectedTemplate.trigger ? (
                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{getTriggerLabel(selectedTemplate.trigger)}</span>
                                    ) : (
                                        <Input
                                            placeholder="كود المحفز (اختياري)"
                                            className="h-8 text-xs w-40"
                                            value={selectedTemplate.trigger || ""}
                                            onChange={e => setSelectedTemplate({ ...selectedTemplate, trigger: e.target.value })}
                                        />
                                    )}
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    حفظ {selectedTemplate.id ? "التعديلات" : "الجديد"}
                                </Button>
                                {selectedTemplate.id && (
                                    <Button
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-2"
                                        onClick={async () => {
                                            if (!confirm("هل أنت متأكد من الحذف؟")) return;
                                            await fetch(`/api/settings/templates?id=${selectedTemplate.id}`, { method: "DELETE" });
                                            fetchTemplates();
                                            setSelectedTemplate(null);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم القالب</label>
                                    <Input
                                        value={selectedTemplate.name}
                                        onChange={e => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">نص الرسالة</label>
                                    <textarea
                                        className="flex-1 w-full min-h-[300px] border rounded-lg p-4 font-normal text-gray-800 leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedTemplate.body}
                                        onChange={e => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                                        dir="auto"
                                    ></textarea>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-sm font-bold text-yellow-800 mb-2">💡 المتغيرات المتاحة:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {["{name}", "{applicant_code}", "{exam_date}", "{location}", "{ticket_number}", "{travel_date}", "{transport_company}"].map(v => (
                                            <span
                                                key={v}
                                                className="px-2 py-1 bg-white border border-yellow-300 rounded text-xs font-mono text-gray-600 cursor-pointer hover:bg-yellow-100"
                                                onClick={() => setSelectedTemplate({ ...selectedTemplate, body: selectedTemplate.body + " " + v })}
                                            >
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-yellow-700 mt-2">اضغط على المتغير لإضافته إلى النص.</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            اختر قالباً للتعديل
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
