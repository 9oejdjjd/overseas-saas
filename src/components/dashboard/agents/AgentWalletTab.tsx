import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentWalletTabProps {
    transactions: any[];
}

export function AgentWalletTab({ transactions }: AgentWalletTabProps) {
    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white text-right" dir="rtl">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black border-b text-[10px]">
                        <tr>
                            <th className="py-3.5 px-5">نوع الحركة</th>
                            <th className="py-3.5 px-5">المبلغ بالريال</th>
                            <th className="py-3.5 px-5">الرصيد بعد</th>
                            <th className="py-3.5 px-5">الوصف / السبب</th>
                            <th className="py-3.5 px-5 text-center">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {transactions.map(t => {
                            const isDebit = ["EXAM_PURCHASE"].includes(t.type);
                            return (
                                <tr key={t.id} className="hover:bg-slate-50/50">
                                    <td className="py-4 px-5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isDebit ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        }`}>
                                            {t.type === "DEPOSIT" ? "إيداع شحن" : t.type === "EXAM_PURCHASE" ? "خصم اختبار" : t.type}
                                        </span>
                                    </td>
                                    <td className={cn("py-4 px-5 font-sans font-black", isDebit ? "text-rose-600" : "text-emerald-600")}>
                                        {isDebit ? "-" : "+"}{Number(t.amount).toLocaleString("ar-YE")} ريال
                                    </td>
                                    <td className="py-4 px-5 font-sans font-bold text-slate-800">{Number(t.balanceAfter).toLocaleString("ar-YE")} ريال</td>
                                    <td className="py-4 px-5 text-slate-500 max-w-[250px] truncate">{t.description || "-"}</td>
                                    <td className="py-4 px-5 text-center text-[10px] text-slate-400 font-sans">{new Date(t.createdAt).toLocaleDateString("ar-YE")}</td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-bold">لا توجد أي حركات مالية مسجلة في محفظة الوكيل.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
