"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    type: "PAYMENT" | "EXPENSE" | "WITHDRAWAL" | string;
    description: string;
    amount: number;
    applicant?: {
        fullName: string;
    };
}

interface TransactionsTableProps {
    transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
    const [localSearch, setLocalSearch] = useState("");

    const filtered = transactions.filter(tx => 
        (tx.description || "").toLowerCase().includes(localSearch.toLowerCase()) ||
        (tx.applicant?.fullName || "").toLowerCase().includes(localSearch.toLowerCase()) ||
        tx.type.toLowerCase().includes(localSearch.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-900/40">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">سجل العمليات المالية الأخيرة</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">تفاصيل عمليات القبض والصرف الفردية المعتمدة.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="بحث في العمليات..." 
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="pr-9 h-9.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl text-xs" 
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3.5 font-bold">التاريخ</th>
                            <th className="px-6 py-3.5 font-bold">النوع</th>
                            <th className="px-6 py-3.5 font-bold">الوصف والبيان</th>
                            <th className="px-6 py-3.5 font-bold">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                                    لا توجد معاملات مالية مطابقة للبحث
                                </td>
                            </tr>
                        ) : (
                            filtered.map((tx) => {
                                const isPayment = tx.type === "PAYMENT";
                                const isExpense = tx.type === "EXPENSE";
                                const isWithdrawal = tx.type === "WITHDRAWAL";
                                
                                return (
                                    <tr key={tx.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                                            {new Date(tx.date).toLocaleDateString("ar-EG", {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">
                                                {new Date(tx.date).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                                variant="outline"
                                                className={`text-xs py-0.5 px-2.5 rounded-full font-bold shrink-0 ${
                                                    isPayment 
                                                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" 
                                                        : isExpense 
                                                        ? "text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" 
                                                        : "text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                                                }`}
                                            >
                                                {isPayment ? "قبض" : isExpense ? "صرف" : "مسحوب"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                                {tx.description || "-"}
                                            </p>
                                            {tx.applicant && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 font-medium">
                                                    <UserIcon className="h-3.5 w-3.5 shrink-0" /> 
                                                    <span>{tx.applicant.fullName}</span>
                                                </p>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 font-black whitespace-nowrap text-sm font-mono ${
                                            isPayment ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        }`}>
                                            {isPayment ? "+" : "-"} {Number(tx.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
