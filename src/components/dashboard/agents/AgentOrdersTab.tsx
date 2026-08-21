import React from "react";
import { Card } from "@/components/ui/card";

interface AgentOrdersTabProps {
    orders: any[];
}

export function AgentOrdersTab({ orders }: AgentOrdersTabProps) {
    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white text-right" dir="rtl">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black border-b text-[10px]">
                        <tr>
                            <th className="py-3.5 px-5">العميل</th>
                            <th className="py-3.5 px-5">المهنة المطلوبة</th>
                            <th className="py-3.5 px-5 text-center">الحالة</th>
                            <th className="py-3.5 px-5 text-center">الدرجة</th>
                            <th className="py-3.5 px-5 text-center">التكلفة والخصم</th>
                            <th className="py-3.5 px-5 text-center">تاريخ الإصدار</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {orders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-5 font-bold text-slate-800">{o.client.fullName}</td>
                                <td className="py-4 px-5 text-slate-600">{o.profession.name}</td>
                                <td className="py-4 px-5 text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        o.status === "COMPLETED" ? (o.isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100") : "bg-blue-50 text-blue-700 border border-blue-100"
                                    }`}>
                                        {o.status === "COMPLETED" ? (o.isPassed ? "ناجح" : "راسب") : o.status}
                                    </span>
                                </td>
                                <td className="py-4 px-5 text-center font-sans font-black text-slate-800">{o.score !== null ? `${o.score}%` : "-"}</td>
                                <td className="py-4 px-5 text-center font-sans">{Number(o.examPrice).toLocaleString("ar-YE")} ريال</td>
                                <td className="py-4 px-5 text-center text-[10px] text-slate-400 font-sans">{new Date(o.createdAt).toLocaleDateString("ar-YE")}</td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-bold">لا يوجد أي اختبارات مشتراة لهذا الوكيل بعد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
