"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, FileText, Settings, Pencil } from "lucide-react";

type ServiceConfig = {
    registrationPrice: number;
    registrationCost: number;
    examChangeFee: number;
    examChangeCost: number;
    maxFreeChanges: number;
};

export function ServicesList() {
    // State
    const [config, setConfig] = useState<ServiceConfig>({
        registrationPrice: 0, registrationCost: 0,
        examChangeFee: 0, examChangeCost: 0,
        maxFreeChanges: 1
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pricing/config");
            if (res.ok) {
                const data = await res.json();
                // Ensure no undefined values to prevent uncontrolled input error
                setConfig({
                    registrationPrice: data.registrationPrice ?? 0,
                    registrationCost: data.registrationCost ?? 0,
                    examChangeFee: data.examChangeFee ?? 0,
                    examChangeCost: data.examChangeCost ?? 0,
                    maxFreeChanges: data.maxFreeChanges ?? 1
                });
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Handlers
    const handleSaveConfig = async () => {
        try {
            await fetch("/api/pricing/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            setIsEditing(false);
            alert("تم حفظ الإعدادات الأساسية");
        } catch (e) { alert("فشل الحفظ"); }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">جاري التحميل...</div>;

    return (
        <div className="space-y-8">
            {/* Global Services Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        الخدمات الأساسية
                    </CardTitle>
                    <CardDescription>الرسوم الإدارية الثابتة المطبقة على جميع المتقدمين</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Registration Fee */}
                    <div className="grid md:grid-cols-3 gap-6 items-end p-4 bg-slate-50 rounded-lg border">
                        <div className="space-y-2 flex-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> رسوم التسجيل وفتح الملف
                            </span>
                            <p className="text-xs text-slate-500">تدفع مرة واحدة عند التسجيل الجديد (موحدة لجميع المراكز)</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">سعر البيع (للعميل)</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={config.registrationPrice}
                                    onChange={e => setConfig({ ...config, registrationPrice: Number(e.target.value) })}
                                    className="pl-12 font-bold [direction:ltr] text-right"
                                    lang="en"
                                    disabled={!isEditing}
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-gray-400">ر.ي</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">التكلفة التشغيلية</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={config.registrationCost}
                                    onChange={e => setConfig({ ...config, registrationCost: Number(e.target.value) })}
                                    className="pl-12 bg-red-50/50 border-red-100 [direction:ltr] text-right"
                                    lang="en"
                                    disabled={!isEditing}
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-gray-400">ر.ي</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-100">
                                <Pencil className="h-4 w-4" /> تعديل
                            </Button>
                        ) : (
                            <>
                                <Button onClick={() => { setIsEditing(false); fetchData(); }} variant="outline" className="text-gray-500">
                                    إلغاء
                                </Button>
                                <Button onClick={handleSaveConfig} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                                    <Save className="h-4 w-4" /> حفظ التغييرات الأساسية
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
