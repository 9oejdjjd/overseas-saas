import React from "react";
import { Wallet, TrendingUp, TrendingDown, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WalletKPICardsProps {
    balance: number;
    isNegative: boolean;
    currency: string;
    wallet: any;
    transactionsCount: number;
}

export function WalletKPICards({
    balance,
    isNegative,
    currency,
    wallet,
    transactionsCount
}: WalletKPICardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
            {/* 1. Primary Balance Card */}
            <div className={cn(
                "p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between h-36",
                isNegative 
                    ? "bg-gradient-to-br from-rose-700 to-rose-900 border-2 border-rose-500/30" 
                    : "bg-gradient-to-br from-[#074388] to-[#042852] border border-[#074388]/30"
            )}>
                <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                        <Wallet className="h-4 w-4" /> 
                        {isNegative ? "الرصيد المكشوف (مديونية)" : "الرصيد المتاح حالياً"}
                    </span>
                    {isNegative && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white flex items-center gap-1">
                            <ShieldAlert size={10} /> بالسالب
                        </span>
                    )}
                </div>
                <div className="relative z-10 my-3">
                    <div className="text-3xl font-black font-sans tracking-tight">
                        {balance.toLocaleString("ar-YE")} <span className="text-sm font-bold text-white/80">{currency}</span>
                    </div>
                    {wallet?.allowDebt && (
                        <div className="text-[10px] text-white/70 font-semibold mt-1">
                            سقف الدين المسموح: {wallet.debtLimit.toLocaleString("ar-YE")} {currency}
                        </div>
                    )}
                </div>
                <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
                    <span>سعر الاختبار للوكالة:</span>
                    <span className="font-black text-[#074388] bg-white px-2 py-0.5 rounded-md font-sans text-[10px] text-center">
                        {wallet?.customSingleExamPrice !== null && wallet?.customSingleExamPrice !== undefined ? `${wallet.customSingleExamPrice} YER` : "الأساسي للوكلاء"}
                    </span>
                </div>
            </div>

            {/* 2. Total Deposited */}
            <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl p-5 flex flex-col justify-between h-36 bg-white">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>إجمالي الإيداعات والشحن</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black font-sans text-slate-800 dark:text-white">
                        +{(wallet?.totalDeposited || 0).toLocaleString("ar-YE")} <span className="text-xs font-bold text-slate-400">{currency}</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">مجموع المبالغ المودعة والمشحونة في حسابك</p>
            </Card>

            {/* 3. Total Spent */}
            <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl p-5 flex flex-col justify-between h-36 bg-white">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>إجمالي مصروفات الاختبارات</span>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                        <TrendingDown className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black font-sans text-slate-800 dark:text-white">
                        {(wallet?.totalSpent || 0).toLocaleString("ar-YE")} <span className="text-xs font-bold text-slate-400">{currency}</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">مجموع المبالغ المصروفة على إرسال الاختبارات</p>
            </Card>

            {/* 4. Total Operations */}
            <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl p-5 flex flex-col justify-between h-36 bg-white">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>إجمالي العمليات المنفذة</span>
                    <div className="p-2 rounded-xl bg-[#074388]/10 text-[#074388]">
                        <FileText className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black font-sans text-slate-800 dark:text-white">
                        {transactionsCount} <span className="text-xs font-bold text-slate-400">حركة</span>
                    </div>
                </div>
                <div className="text-[10px] text-[#55943b] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> محفظة نشطة وموثقة
                </div>
            </Card>
        </div>
    );
}
