"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";

interface PendingExpense {
    id: string;
    date: string;
    description: string;
    amount: number;
    notes?: string;
    applicant?: {
        fullName: string;
    };
}

interface PendingExpensesTabProps {
    pendingExpenses: PendingExpense[];
    onRefresh: () => void;
}

export function PendingExpensesTab({ pendingExpenses, onRefresh }: PendingExpensesTabProps) {
    if (pendingExpenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 border rounded-2xl animate-fade-in">
                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">لا توجد مصروفات مستحقة حالياً 🎉</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs">لقد قمت باعتماد وتأكيد جميع مستحقات النقل بنجاح.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-amber-50/20 dark:bg-amber-950/5 flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm">المصروفات التشغيلية المستحقة (معلقات النقل)</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">مصروفات سفر وحافلات تم رصدها آلياً، بانتظار مراجعتك واعتمادك لصرفها وتنزيلها من الأرباح.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50/50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3.5 font-bold">التاريخ</th>
                            <th className="px-6 py-3.5 font-bold">البيان الأساسي والتفاصيل</th>
                            <th className="px-6 py-3.5 font-bold">المبلغ المالي (ر.ي)</th>
                            <th className="px-6 py-3.5 font-bold">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pendingExpenses.map((ex) => (
                            <PendingExpenseRow key={ex.id} expense={ex} onRefresh={onRefresh} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PendingExpenseRow({ expense, onRefresh }: { expense: PendingExpense; onRefresh: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [notes, setNotes] = useState(expense.notes || "");

    const handleApprove = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast("يرجى إدخال مبلغ صحيح", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/accounting/transactions/${expense.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: Number(amount), 
                    notes, 
                    isPending: false 
                })
            });

            if (res.ok) {
                toast("تم اعتماد وصرف المصروف بنجاح وترحيله للأرباح", "success");
                onRefresh();
            } else {
                toast("فشل اعتماد المصروف", "error");
            }
        } catch (e) {
            console.error("Expense approval error:", e);
            toast("حدث خطأ أثناء الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                {new Date(expense.date).toLocaleDateString("ar-EG", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                })}
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">
                    {new Date(expense.date).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                </span>
            </td>
            <td className="px-6 py-4">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{expense.description}</p>
                {expense.applicant && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 font-medium">
                        <UserIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{expense.applicant.fullName}</span>
                    </p>
                )}
                
                <div className="mt-3 max-w-sm">
                    <Input 
                        placeholder="رقم الفاتورة أو ملاحظات الصرف..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-lg pr-3"
                    />
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        className="h-8.5 w-24 text-rose-600 dark:text-rose-400 font-black text-center bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <span className="text-[10px] text-slate-400">ر.ي</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8.5 px-3.5 rounded-lg text-xs shadow-sm transition-all"
                    onClick={handleApprove}
                    disabled={loading}
                >
                    {loading ? "..." : "اعتماد وصرف"}
                </Button>
            </td>
        </tr>
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
