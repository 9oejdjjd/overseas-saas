import React, { useState, useEffect } from "react";
import { AlertCircle, User, Briefcase, Receipt, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Step4ReviewProps {
    client: any;
    profession: any;
    purchaseType: "single" | "package";
    quantity: number;
    selectedPackage: any;
    financials: any;
    onNext: (examUrls: string[]) => void;
    onPrev: () => void;
}

export function Step4Review({
    client,
    profession,
    purchaseType,
    quantity,
    selectedPackage,
    financials,
    onNext,
    onPrev
}: Step4ReviewProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errorType, setErrorType] = useState<"general" | "insufficient_funds">("general");
    const [customSinglePrice, setCustomSinglePrice] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/agent/pricing")
            .then((res) => res.json())
            .then((data) => {
                if (data.singleExamPrice) {
                    setCustomSinglePrice(Number(data.singleExamPrice));
                }
            })
            .catch(() => {});
    }, []);

    const netPrice = purchaseType === "single"
        ? (customSinglePrice !== null ? customSinglePrice * quantity : 0)
        : selectedPackage
        ? Number(selectedPackage.price)
        : 0;

    // Check balance validity before making API call
    const newBalance = financials.walletBalance - netPrice;
    const canAfford = newBalance >= 0;
    const withinDebtLimit = financials.allowDebt && newBalance >= -financials.debtLimit;
    const isAllowed = canAfford || withinDebtLimit;

    const handleConfirm = async () => {
        setLoading(true);
        setError("");
        setErrorType("general");

        // 1. Balance verification
        if (!isAllowed) {
            setErrorType("insufficient_funds");
            setError("عذراً، الرصيد المالي المتاح في محفظتك غير كافٍ لإتمام عملية الشراء.");
            setLoading(false);
            return;
        }

        try {
            // 2. Submit order placement
            const payload = {
                ...(client.isNew ? {
                    newClientData: {
                        fullName: client.fullName,
                        phone: client.phone,
                        whatsappNumber: client.whatsappNumber,
                        email: client.email
                    }
                } : { clientId: client.id }),
                professionId: profession.id,
                ...(purchaseType === "package" ? { packageId: selectedPackage.id } : { quantity }),
            };

            const res = await fetch("/api/agent/exams/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 402 || data.error?.includes("رصيد")) {
                    setErrorType("insufficient_funds");
                }
                throw new Error(data.message || data.error || "حدث خطأ أثناء إرسال الاختبار");
            }

            onNext(data.examUrls || data.links || [data.examLink || data.examUrl].filter(Boolean));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 text-right">
            <div className="flex flex-col text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المراجعة والتأكيد</h2>
                <p className="text-gray-500 dark:text-slate-400">يرجى مراجعة البيانات قبل اعتماد الاشتراك والموافقة</p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
                {error && errorType === "insufficient_funds" ? (
                    /* Beautiful Insufficient Funds Alert */
                    <div className="p-5 bg-amber-50/80 border border-amber-250 text-amber-800 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-sm text-slate-800">عذراً، رصيدك الحالي غير كافٍ لإتمام هذا الطلب</h4>
                        <p className="text-xs text-slate-650 max-w-sm leading-relaxed font-semibold">
                            تكلفة هذا الطلب هي <strong className="text-slate-800 font-mono">{netPrice.toLocaleString()} ريال</strong> بينما رصيدك المتوفر حالياً هو <strong className="text-slate-800 font-mono">{financials.walletBalance.toLocaleString()} ريال</strong>.
                            {financials.allowDebt && (
                                <span className="block mt-1 text-[10px] text-amber-700">سقف المديونية المتبقي غير كافٍ لتغطية العجز.</span>
                            )}
                        </p>
                        <div className="flex gap-2 pt-2 w-full max-w-xs">
                            <a 
                                href="https://wa.me/967777123456" 
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-colors shadow-sm"
                            >
                                تواصل مع الدعم الفني
                            </a>
                            <Button 
                                variant="outline" 
                                onClick={() => setError("")}
                                className="flex-1 rounded-xl text-[10px] font-bold h-9 bg-white border-slate-200"
                            >
                                محاولة أخرى
                            </Button>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-650 rounded-2xl flex items-start gap-3 text-xs font-bold">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>{error}</div>
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="dark:bg-slate-900/40 bg-white border border-slate-100 rounded-2xl">
                        <CardContent className="p-4 space-y-2">
                            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> العميل</div>
                            <div className="font-bold text-slate-800 dark:text-white">{client?.fullName}</div>
                            <div className="text-xs text-slate-500 dir-ltr text-right">{client?.whatsappNumber || client?.phone}</div>
                            <div className="text-xs text-slate-500 dir-ltr text-right font-sans font-bold">{client?.email}</div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-slate-900/40 bg-white border border-slate-100 rounded-2xl">
                        <CardContent className="p-4 space-y-2">
                            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> المهنة والتخصص</div>
                            <div className="font-bold text-indigo-600 dark:text-blue-400">{profession?.name}</div>
                            <div className="text-xs text-slate-500 font-semibold">
                                {purchaseType === "single" ? `الكمية: ${quantity} اختبار مفرّد` : `باقة: ${selectedPackage?.name}`}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-[#074388] text-white border-none shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-5 flex justify-between items-center">
                        <div>
                            <div className="text-white/80 text-xs mb-1 font-bold">المبلغ الإجمالي المعتمد للخصم</div>
                            <div className="text-3xl font-black font-sans">{netPrice.toLocaleString()} ريال</div>
                            <div className="text-[9px] text-white/70 mt-1 font-semibold">
                                (سيتم خصم هذا المبلغ مباشرة من رصيد المحفظة)
                            </div>
                        </div>
                        <Receipt className="w-12 h-12 text-white/20" />
                    </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onPrev} disabled={loading} className="bg-white rounded-xl text-xs font-bold border-slate-200 h-10 px-5">
                        <ArrowRight className="w-4 h-4 ml-2" /> عودة للتعديل
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-[#55943b] hover:bg-[#55943b]/90 text-white px-8 gap-2 font-bold rounded-xl text-xs h-10 shadow-md transition-all hover:scale-[1.01]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        تأكيد طلب الاختبارات
                    </Button>
                </div>
            </div>
        </div>
    );
}
