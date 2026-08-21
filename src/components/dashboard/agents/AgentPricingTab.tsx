import React from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AgentPricingTabProps {
    loadingPricing: boolean;
    pricingData: any;
    customSingleExamPrice: string;
    setCustomSingleExamPrice: (val: string) => void;
    customPackages: any[];
    setCustomPackages: (val: any[]) => void;
    savingPricing: boolean;
    onSavePricing: () => void;
}

export function AgentPricingTab({
    loadingPricing,
    pricingData,
    customSingleExamPrice,
    setCustomSingleExamPrice,
    customPackages,
    setCustomPackages,
    savingPricing,
    onSavePricing
}: AgentPricingTabProps) {
    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white text-right" dir="rtl">
            <CardHeader className="border-b border-slate-50 bg-slate-50/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-bold text-slate-800">⚙️ تخصيص تسعير الخدمات وباقات الاختبارات للوكيل</CardTitle>
                        <p className="text-xs text-slate-500 font-bold">التحكم في سعر الاختبارات المفردة وتفعيل أو إلغاء باقات الاختبارات مع تحديد أسعار مخصصة لكل باقة.</p>
                    </div>
                    <Button 
                        onClick={onSavePricing} 
                        disabled={savingPricing || loadingPricing || !pricingData}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-6 h-9 shadow-md shadow-indigo-100 gap-1.5"
                    >
                        {savingPricing ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} /> حفظ التغييرات والأسعار</>}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {loadingPricing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                        <p className="text-xs text-slate-400 font-semibold animate-pulse">جاري تحميل بيانات الأسعار المخصصة...</p>
                    </div>
                ) : !pricingData ? (
                    <div className="text-center py-10 text-rose-500 font-bold">فشل تحميل تفاصيل التسعير.</div>
                ) : (
                    <>
                        {/* 1. Single exam pricing section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">💰 تسعير الاختبار التجريبي المفرد</h3>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 grid md:grid-cols-3 gap-6 items-center">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block">السعر الأساسي للوكلاء (الافتراضي)</span>
                                    <span className="text-sm font-black text-slate-700 block mt-1">{pricingData.pricing.singleExam.baseAgentPrice.toLocaleString()} ر.ي</span>
                                    <span className="text-[9px] text-slate-400 block mt-0.5">(السعر العام للجمهور: {pricingData.pricing.singleExam.basePublicPrice.toLocaleString()} ر.ي)</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-700">السعر المخصص لهذا الوكيل (ر.ي)</label>
                                    <div className="relative max-w-xs">
                                        <Input 
                                            type="number"
                                            placeholder="استخدام السعر الافتراضي"
                                            value={customSingleExamPrice}
                                            onChange={e => setCustomSingleExamPrice(e.target.value)}
                                            className="h-9 rounded-xl font-bold bg-white pl-10 text-right pr-3 border border-slate-250"
                                            lang="en"
                                        />
                                        <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">ر.ي</span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-505 font-bold leading-relaxed bg-white/60 p-3 rounded-xl border border-dashed border-slate-200">
                                    💡 إذا تركت الحقل فارغاً، سيتم تلقائياً محاسبة الوكيل بالسعر الأساسي للوكلاء وهو <strong className="text-indigo-650">{pricingData.pricing.singleExam.baseAgentPrice.toLocaleString()} ر.ي</strong>. 
                                    <br/>
                                    <span className="text-amber-600">⚠️ يجب أن يكون السعر المخصص أكبر من أو يساوي السعر الأساسي للوكلاء.</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Packages list section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">📦 التحكم بالباقات المتاحة للوكيل</h3>
                            <div className="overflow-x-auto rounded-2xl border border-slate-150">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-150">
                                        <tr>
                                            <th className="p-4 font-bold text-slate-600">اسم الباقة</th>
                                            <th className="p-4 font-bold text-slate-600">الرصيد</th>
                                            <th className="p-4 font-bold text-slate-600">السعر العام</th>
                                            <th className="p-4 font-bold text-slate-600">الحد الأدنى للوكلاء</th>
                                            <th className="p-4 font-bold text-slate-600 w-32">الحالة للوكيل</th>
                                            <th className="p-4 font-bold text-slate-600">السعر المخصص للوكيل (ر.ي)</th>
                                            <th className="p-4 font-bold text-slate-600">فرق الربح المتوقع للوكيل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {customPackages.map((pkg, idx) => {
                                            const expectedProfit = Number(pkg.customPrice || 0) - Number(pkg.baseAgentPrice || 0);
                                            return (
                                                <tr key={pkg.packageId} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-850">{pkg.name}</td>
                                                    <td className="p-4 text-slate-500 font-bold">{pkg.examCredits} اختبارات</td>
                                                    <td className="p-4 text-slate-500 font-bold">{pkg.publicPrice.toLocaleString()} ر.ي</td>
                                                    <td className="p-4 text-indigo-650 font-black">{pkg.baseAgentPrice.toLocaleString()} ر.ي</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Switch 
                                                                checked={pkg.isEnabled}
                                                                onCheckedChange={checked => {
                                                                    const updated = [...customPackages];
                                                                    updated[idx].isEnabled = checked;
                                                                    setCustomPackages(updated);
                                                                }}
                                                            />
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                                pkg.isEnabled ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                                                            )}>
                                                                {pkg.isEnabled ? "متاحة" : "معطلة"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative w-36">
                                                            <Input 
                                                                type="number"
                                                                disabled={!pkg.isEnabled}
                                                                value={pkg.customPrice}
                                                                onChange={e => {
                                                                    const updated = [...customPackages];
                                                                    updated[idx].customPrice = e.target.value;
                                                                    setCustomPackages(updated);
                                                                }}
                                                                className="h-8 rounded-lg font-bold pl-8 text-xs bg-white text-right pr-2 border border-slate-250"
                                                                lang="en"
                                                            />
                                                            <span className="absolute left-2.5 top-1.5 text-[9px] font-bold text-slate-400">ر.ي</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-bold">
                                                        {pkg.isEnabled ? (
                                                            expectedProfit >= 0 ? (
                                                                <span className="text-emerald-600 font-black">+{expectedProfit.toLocaleString()} ر.ي</span>
                                                            ) : (
                                                                <span className="text-rose-500 font-black">{expectedProfit.toLocaleString()} ر.ي (أقل من الأساسي!)</span>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
