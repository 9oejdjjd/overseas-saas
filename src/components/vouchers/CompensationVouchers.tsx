"use client";

import { Voucher } from "@/hooks/pricing/useVouchersManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, Coins, ArrowUpRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CompensationVouchersProps = {
    vouchers: Voucher[];
};

export function CompensationVouchers({ vouchers }: CompensationVouchersProps) {
    const compensationVouchers = vouchers.filter(v => v.category === "COMPENSATION");

    return (
        <div className="space-y-6">
            
            {/* Descriptive Alert header */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <HelpCircle className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                    <h4 className="text-xs font-black text-amber-900">ما هي قسائم التعويضات التلقائية؟</h4>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                        عندما يقوم متقدم بإلغاء حجز اختبار أو تذكرة نقل بري، يقوم النظام تلقائياً بخصم الغرامات الزمنية (إن وجدت) وتحويل الرصيد المتبقي إلى قسيمة تعويضية مرتبطة بملفه الشخصي. يمكن للمتقدم استخدام هذا الرصيد كعملة دفع حقيقية لحجز أي اختبار جديد أو حجز تذكرة حافلة أخرى مستقبلاً.
                    </p>
                </div>
            </div>

            {/* Grid of Credit Vouchers */}
            {compensationVouchers.length === 0 ? (
                <Card className="border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-full animate-pulse">
                            <History className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">لا توجد سجلات تعويضات حالياً</h3>
                        <p className="text-slate-500 text-xs leading-normal">
                            لم تسجل أي عمليات إلغاء حجوزات أو تذاكر سفر نشطة ينتج عنها إصدار محافظ ائتمانية تعويضية للطلاب.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {compensationVouchers.map((v) => {
                        const originalAmount = v.amount || 0;
                        const remainingBalance = v.balance !== undefined ? v.balance : originalAmount;
                        const isFullyUsed = remainingBalance <= 0 || v.isUsed;

                        // Extract clean reason from notes metadata
                        const cleanReason = v.notes ? v.notes.split('[META')[0] : "إلغاء حجز خدمة تلقائي";

                        return (
                            <div 
                                key={v.id}
                                className={cn(
                                    "relative rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] group",
                                    isFullyUsed 
                                        ? "bg-slate-50/65 border-slate-200/80" 
                                        : "bg-gradient-to-br from-amber-50/30 via-white to-white border-amber-100/70"
                                )}
                            >
                                {/* Credit Card styled chip effect */}
                                <div className="absolute top-4 left-4 h-8 w-11 rounded-lg bg-amber-500/10 border border-amber-500/15 pointer-events-none flex items-center justify-center">
                                    <Coins className={cn("h-4 w-4", isFullyUsed ? "text-slate-300" : "text-amber-500")} />
                                </div>

                                <div className="p-5 space-y-4 relative z-10 pt-10">
                                    {/* User Details */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">اسم المسافر أو الطالب المستحق</span>
                                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                            <span className="p-0.5 bg-slate-100 text-slate-500 rounded">
                                                <User className="h-3 w-3" />
                                            </span>
                                            {v.applicant?.fullName || "متقدم غير مسجل"}
                                        </h4>
                                        <span className="text-[9px] text-slate-400 block font-mono">
                                            كود: {v.applicant?.applicantCode || "-"} | جواز: {v.applicant?.passportNumber || "-"}
                                        </span>
                                    </div>

                                    {/* Reason for compensation */}
                                    <div className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 leading-normal">
                                        <span className="font-bold text-slate-600 block mb-0.5">سبب التعويض المالي:</span>
                                        {cleanReason}
                                    </div>

                                    {/* Balance Wallet representation */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                                            <span className="text-[9px] text-slate-400 font-bold block">القيمة التعويضية الأصلية</span>
                                            <span className="text-xs font-bold text-slate-700 tracking-tight">
                                                {originalAmount.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">ر.ي</span>
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "p-2 border rounded-xl space-y-0.5",
                                            isFullyUsed 
                                                ? "bg-slate-50 border-slate-200" 
                                                : "bg-amber-500/5 border-amber-200/50"
                                        )}>
                                            <span className="text-[9px] text-slate-400 font-bold block">الرصيد المتاح للخصم</span>
                                            <span className={cn(
                                                "text-xs font-black tracking-tight",
                                                isFullyUsed ? "text-slate-500" : "text-amber-600"
                                            )}>
                                                {remainingBalance.toLocaleString()} <span className="text-[9px] font-bold">ر.ي</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status and Date footer */}
                                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(v.createdAt).toLocaleDateString('ar-EG')}</span>
                                    </div>

                                    <Badge 
                                        variant={isFullyUsed ? "secondary" : "outline"}
                                        className={cn(
                                            "font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5",
                                            isFullyUsed 
                                                ? "bg-slate-100 border-slate-200 text-slate-400" 
                                                : "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-sm"
                                        )}
                                    >
                                        {!isFullyUsed && <ArrowUpRight className="h-3 w-3 text-emerald-600 animate-pulse" />}
                                        {isFullyUsed ? "مستعمل بالكامل (Used)" : "رصيد معتمد (Available)"}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
