import React from "react";
import { Search, Loader2, ArrowRight, ArrowUpCircle, ArrowDownCircle, RotateCcw, Gift, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgentWalletTransaction } from "@/types/agent";

interface WalletTransactionsTableProps {
    transactions: AgentWalletTransaction[];
    loading: boolean;
    typeFilter: string;
    setTypeFilter: (filter: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    currency: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; badge: string; isDebit: boolean }> = {
    DEPOSIT: { 
        label: "إيداع / شحن", 
        icon: ArrowUpCircle, 
        color: "text-emerald-700 dark:text-emerald-400", 
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300",
        isDebit: false 
    },
    EXAM_PURCHASE: { 
        label: "شراء اختبارات", 
        icon: ArrowDownCircle, 
        color: "text-rose-700 dark:text-rose-400", 
        badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300",
        isDebit: true 
    },
    REFUND: { 
        label: "استرجاع رصيد", 
        icon: RotateCcw, 
        color: "text-blue-700 dark:text-blue-400", 
        badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-300",
        isDebit: false 
    },
    BONUS: { 
        label: "مكافأة / حافز", 
        icon: Gift, 
        color: "text-amber-700 dark:text-amber-400", 
        badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300",
        isDebit: false 
    },
    ADJUSTMENT: { 
        label: "تسوية يدوية", 
        icon: Wrench, 
        color: "text-slate-700 dark:text-slate-300", 
        badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
        isDebit: false 
    },
};

const FILTER_TABS = [
    { key: "ALL", label: "كافة الحركات" },
    { key: "DEPOSIT", label: "الإيداعات والشحن" },
    { key: "EXAM_PURCHASE", label: "مشتريات الاختبارات" },
    { key: "REFUND", label: "الاسترجاع والتسويات" },
];

export function WalletTransactionsTable({
    transactions,
    loading,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    currency
}: WalletTransactionsTableProps) {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-5 space-y-4">
                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    {/* Type Tabs */}
                    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-700/30 p-1 rounded-xl">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setTypeFilter(tab.key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                    typeFilter === tab.key
                                        ? "bg-white dark:bg-slate-700 text-[#074388] shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            placeholder="بحث في تفاصيل العملية أو العميل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pr-9 bg-slate-50 dark:bg-slate-700/30 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                        />
                    </div>
                </div>

                {/* Transactions Table */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#074388]" />
                    </div>
                ) : transactions.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm bg-white dark:bg-slate-900">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-700/20 text-slate-400 text-[10px] font-black border-b border-slate-100 dark:border-slate-700/50">
                                    <th className="py-3.5 px-5">نوع الحركة</th>
                                    <th className="py-3.5 px-5">المبلغ</th>
                                    <th className="py-3.5 px-5">الرصيد قبل / بعد</th>
                                    <th className="py-3.5 px-5">بيان وتفاصيل العملية</th>
                                    <th className="py-3.5 px-5 text-center">التاريخ والوقت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-200">
                                {transactions.map((tx) => {
                                    const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.ADJUSTMENT;
                                    const isDebit = ["EXAM_PURCHASE"].includes(tx.type);
                                    const Icon = config.icon;

                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-all font-semibold">
                                            {/* Type Badge */}
                                            <td className="py-4 px-5">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border", config.badge)}>
                                                    <Icon size={12} /> {config.label}
                                                </span>
                                            </td>

                                            {/* Amount with sign */}
                                            <td className={cn(
                                                "py-4 px-5 font-sans font-black text-sm",
                                                isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                            )}>
                                                <div className="flex items-center gap-1">
                                                    <span>{isDebit ? "-" : "+"}</span>
                                                    <span>{Number(tx.amount).toLocaleString("ar-YE")}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 font-sans">{currency}</span>
                                                </div>
                                            </td>

                                            {/* Balance before & after */}
                                            <td className="py-4 px-5 font-sans text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-650 dark:text-slate-300">
                                                    <span className="text-slate-400 text-[11px]">{Number(tx.balanceBefore).toLocaleString("ar-YE")}</span>
                                                    <ArrowRight size={11} className="text-slate-400 rotate-180 shrink-0" />
                                                    <span className="font-bold text-[#074388] dark:text-blue-300">{Number(tx.balanceAfter).toLocaleString("ar-YE")}</span>
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="py-4 px-5">
                                                <div className="text-xs text-slate-800 dark:text-slate-100 font-semibold max-w-md leading-relaxed">
                                                    {tx.description || "عملية مالية مسجلة"}
                                                </div>
                                            </td>

                                            {/* Date & Time */}
                                            <td className="py-4 px-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-800 dark:text-white font-sans text-xs">
                                                        {new Date(tx.createdAt).toLocaleDateString("ar-YE")}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                                        {new Date(tx.createdAt).toLocaleTimeString("ar-YE", { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-700/10 rounded-2xl">
                        لا توجد أي حركات مالية مسجلة مطابقة للبحث أو الفلتر المحدد.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
