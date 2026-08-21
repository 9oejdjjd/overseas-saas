import React, { useState, useEffect } from "react";
import { Minus, Plus, Loader2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step3QuantityProps {
    purchaseType: "single" | "package";
    setPurchaseType: (type: "single" | "package") => void;
    quantity: number;
    setQuantity: (qty: number) => void;
    selectedPackage: any;
    setSelectedPackage: (pkg: any) => void;
    financials: {
        walletBalance: number;
        allowDebt: boolean;
        debtLimit: number;
    };
    onNext: () => void;
    onPrev: () => void;
}

export function Step3Quantity({
    purchaseType,
    setPurchaseType,
    quantity,
    setQuantity,
    selectedPackage,
    setSelectedPackage,
    financials,
    onNext,
    onPrev
}: Step3QuantityProps) {
    const [packages, setPackages] = useState<any[]>([]);
    const [loadingPkgs, setLoadingPkgs] = useState(true);
    const [customSinglePrice, setCustomSinglePrice] = useState<number | null>(null);

    useEffect(() => {
        setLoadingPkgs(true);
        fetch("/api/agent/pricing")
            .then((res) => res.json())
            .then((data) => {
                setPackages(Array.isArray(data.packages) ? data.packages : []);
                if (data.singleExamPrice !== undefined) {
                    setCustomSinglePrice(Number(data.singleExamPrice));
                } else {
                    setCustomSinglePrice(0);
                }
                setLoadingPkgs(false);
            })
            .catch(() => {
                setCustomSinglePrice(0);
                setLoadingPkgs(false);
            });
    }, []);

    // Calculate costs
    const netPrice = purchaseType === "single"
        ? (customSinglePrice !== null ? customSinglePrice * quantity : 0)
        : selectedPackage
        ? Number(selectedPackage.price)
        : 0;

    // Wallet check
    const newBalance = financials.walletBalance - netPrice;
    const canAfford = newBalance >= 0;
    const withinDebtLimit = financials.allowDebt && newBalance >= -financials.debtLimit;
    const isAllowed = canAfford || withinDebtLimit;

    if (loadingPkgs || customSinglePrice === null) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#074388]" />
                <span className="text-xs text-gray-500 font-bold">جاري تحميل باقات التسعير الخاصة بك...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-right">
            <div className="flex flex-col text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">تفاصيل الشراء والاشتراك</h2>
                <p className="text-gray-500 dark:text-slate-400">اختر نوع الاشتراك وتأكيد السعر المخصص لحسابك</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Toggle between single exam credits or predefined package */}
                <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg max-w-md mx-auto">
                    <button
                        type="button"
                        className={cn(
                            "flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all cursor-pointer",
                            purchaseType === "single" ? "bg-white dark:bg-slate-800 text-[#074388] shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                        onClick={() => setPurchaseType("single")}
                    >
                        شراء اختبارات مفردة
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all cursor-pointer",
                            purchaseType === "package" ? "bg-white dark:bg-slate-800 text-[#074388] shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                        onClick={() => setPurchaseType("package")}
                    >
                        باقات الاختبارات التجريبية
                    </button>
                </div>

                {purchaseType === "single" ? (
                    <Card className="dark:bg-slate-900/40 bg-white border border-slate-100">
                        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">حدد كمية الاختبارات</label>
                            
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                    className="rounded-full w-10 h-10 bg-white"
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <div className="w-20 text-center text-2xl font-bold text-[#074388] dark:text-blue-400">
                                    {quantity}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="rounded-full w-10 h-10 text-[#074388] border-[#074388] hover:bg-[#074388]/10 bg-white"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="text-xs font-black text-slate-500 mt-2 bg-slate-50 px-4 py-2 rounded-xl border">
                                السعر المحدد لك للاختبار الواحد: <span className="text-[#074388] font-mono">{customSinglePrice.toLocaleString()} ريال</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {packages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm text-right space-y-2 bg-white dark:bg-slate-800",
                                        selectedPackage?.id === pkg.id
                                            ? "border-[#074388] bg-[#074388]/5"
                                            : "border-gray-100 dark:border-slate-700 hover:border-gray-300"
                                    )}
                                >
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{pkg.name}</div>
                                    <div className="text-xs text-gray-500">يتضمن: {pkg.examCredits} اختبارات تجريبية</div>
                                    <div className="font-black text-sm text-[#074388] font-mono">{Number(pkg.price).toLocaleString()} ريال</div>
                                </div>
                            ))}
                            {packages.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-500">لا توجد باقات مفعلة حالياً للوكيل</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Insufficient Balance alert only (Financial Account summary card removed completely) */}
                {!isAllowed && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-2xl flex items-start gap-3 text-xs font-bold border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-black">تنبيه: رصيد المحفظة الحالي غير كافٍ لإتمام عملية الشراء.</p>
                            <p className="text-[10px] text-slate-500">الرصيد المتاح: {financials.walletBalance.toLocaleString()} ريال | تكلفة الطلب الحالية: {netPrice.toLocaleString()} ريال.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onPrev}>
                        <ArrowRight className="w-4 h-4 ml-2" /> عودة
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!isAllowed || (purchaseType === "package" && !selectedPackage)}
                        className="bg-[#074388] hover:bg-[#074388]/90 text-white font-bold"
                    >
                        متابعة <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
