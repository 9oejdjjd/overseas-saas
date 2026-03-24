"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Bus, Save, AlertTriangle, Pencil } from "lucide-react";
import { PolicyForm } from "./PolicyForm";

type CancellationPolicy = {
    id: string;
    name: string;
    category: string;
    hoursTrigger: number | null;
    condition: string | null;
    feeAmount: number;
    isActive: boolean;
};

type ServiceConfig = {
    maxAllowedExamChanges: number;
    examModificationDeadline: number;
    examCancellationDeadline: number;
};

export function PoliciesList() {
    const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
    const [config, setConfig] = useState<ServiceConfig>({
        maxAllowedExamChanges: 1,
        examModificationDeadline: 72,
        examCancellationDeadline: 72
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resPolicies, resConfig] = await Promise.all([
                fetch("/api/pricing/policies"),
                fetch("/api/pricing/config")
            ]);

            if (resPolicies.ok) setPolicies(await resPolicies.json());
            if (resConfig.ok) {
                const data = await resConfig.json();
                setConfig({
                    maxAllowedExamChanges: data.maxAllowedExamChanges ?? 1,
                    examModificationDeadline: data.examModificationDeadline ?? 72,
                    examCancellationDeadline: data.examCancellationDeadline ?? 72
                });
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveConfig = async () => {
        try {
            await fetch("/api/pricing/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            setIsEditing(false);
            alert("تم حفظ القواعد العامة");
        } catch (e) { alert("Error saving config"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) return;
        await fetch(`/api/pricing/policies/${id}`, { method: "DELETE" });
        fetchData();
    };

    const examPolicies = policies.filter(p => p.category.startsWith("EXAM"));
    const transportPolicies = policies.filter(p => !p.category.startsWith("EXAM"));

    return (
        <div className="space-y-8">
            {/* 1. Global Exam Rules */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                        <AlertTriangle className="h-5 w-5" /> القواعد العامة للاختبارات
                    </CardTitle>
                    <CardDescription>القيود الصارمة المطبقة على جميع المتقدمين (بغض النظر عن الرسوم)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">الحد الأقصى لعدد مرات التعديل</label>
                            <div className="flex items-center gap-2 ltr:flex-row-reverse">
                                <Input
                                    type="number"
                                    value={config.maxAllowedExamChanges}
                                    onChange={e => setConfig({ ...config, maxAllowedExamChanges: Number(e.target.value) })}
                                    className="bg-white text-center font-bold [direction:ltr]"
                                    lang="en"
                                    disabled={!isEditing}
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap min-w-[60px]">مرة واحدة</span>
                            </div>
                            <p className="text-xs text-slate-500">لن يسمح النظام بأي تعديل إضافي بعد استنفاذ هذا العدد.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">آخر موعد مسموح للتعديل</label>
                            <div className="flex items-center gap-2 ltr:flex-row-reverse">
                                <Input
                                    type="number"
                                    value={config.examModificationDeadline}
                                    onChange={e => setConfig({ ...config, examModificationDeadline: Number(e.target.value) })}
                                    className="bg-white text-center font-bold [direction:ltr]"
                                    lang="en"
                                    disabled={!isEditing}
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap min-w-[60px]">ساعة قبل الموعد</span>
                            </div>
                            <p className="text-xs text-slate-500">مثال: 72 ساعة (3 أيام). سيتم إغلاق التعديل بعدها.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">آخر موعد مسموح للإلغاء</label>
                            <div className="flex items-center gap-2 ltr:flex-row-reverse">
                                <Input
                                    type="number"
                                    value={config.examCancellationDeadline}
                                    onChange={e => setConfig({ ...config, examCancellationDeadline: Number(e.target.value) })}
                                    className="bg-white text-center font-bold [direction:ltr]"
                                    lang="en"
                                    disabled={!isEditing}
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap min-w-[60px]">ساعة قبل الموعد</span>
                            </div>
                            <p className="text-xs text-slate-500">سيتم منع الإلغاء نهائياً إذا تبقى أقل من هذه المدة.</p>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                        {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-100">
                                <Pencil className="h-4 w-4" /> تعديل
                            </Button>
                        ) : (
                            <>
                                <Button onClick={() => { setIsEditing(false); fetchData(); }} size="sm" variant="outline" className="text-gray-500">
                                    إلغاء
                                </Button>
                                <Button onClick={handleSaveConfig} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    <Save className="h-4 w-4" /> حفظ القواعد
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Fee Policies */}
            <PolicySection
                title="سياسات الرسوم والغرامات (اختبارات)"
                description="الرسوم المطبقة عند التعديل أو الإلغاء (ضمن الفترة المسموحة)"
                icon={<FileText className="h-5 w-5 text-purple-600" />}
                type="EXAM"
                policies={examPolicies}
                onDelete={handleDelete}
                onUpdate={fetchData}
            />

            <PolicySection
                title="سياسات النقل والتذاكر"
                description="غرامات الإلغاء، التعديل، والـ No Show لرحلات النقل"
                icon={<Bus className="h-5 w-5 text-blue-600" />}
                type="TRANSPORT"
                policies={transportPolicies}
                onDelete={handleDelete}
                onUpdate={fetchData}
            />
        </div>
    );
}

function PolicySection({ title, description, icon, type, policies, onDelete, onUpdate }: any) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {icon} {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <PolicyForm type={type} onSave={onUpdate} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-slate-700">السياسة</th>
                                <th className="px-4 py-3 font-medium text-slate-700">النوع</th>
                                <th className="px-4 py-3 font-medium text-slate-700 text-left ltr">الشرط</th>
                                <th className="px-4 py-3 font-medium text-slate-700 text-left ltr">الغرامة/الخصم</th>
                                <th className="px-4 py-3 font-medium text-slate-700 text-center">حذف</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {policies.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{getCategoryLabel(p.category)}</Badge>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-left ltr">
                                        {formatCondition(p.condition, p.hoursTrigger)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-red-600 text-left ltr">
                                        {Number(p.feeAmount).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => onDelete(p.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {policies.length === 0 && (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-400 text-sm">لا توجد سياسات مفعلة</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function getCategoryLabel(cat: string) {
    const map: Record<string, string> = {
        "EXAM_CANCELLATION": "إلغاء اختبار",
        "EXAM_MODIFICATION": "تعديل اختبار",
        "CANCELLATION": "إلغاء تذكرة",
        "MODIFICATION": "تعديل تذكرة",
        "NO_SHOW": "فوات رحلة",
        "ROUTE_CHANGE": "تغيير طريق"
    };
    return map[cat] || cat;
}

function formatCondition(cond: string, hours: number) {
    if (!hours) return "دائماً (Always Applied)";
    if (cond === "LESS_THAN") return `< ${hours} Hours before`;
    if (cond === "GREATER_THAN") return `> ${hours} Hours before`;
    return `${hours} Hours`;
}
