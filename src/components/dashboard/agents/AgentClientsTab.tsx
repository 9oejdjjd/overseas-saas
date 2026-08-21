import React from "react";
import { Card } from "@/components/ui/card";

interface AgentClientsTabProps {
    clients: any[];
}

export function AgentClientsTab({ clients }: AgentClientsTabProps) {
    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white text-right" dir="rtl">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black border-b text-[10px]">
                        <tr>
                            <th className="py-3.5 px-5">اسم العميل</th>
                            <th className="py-3.5 px-5">رقم الهاتف</th>
                            <th className="py-3.5 px-5">المهنة</th>
                            <th className="py-3.5 px-5 text-center">الاختبارات المطلوبة</th>
                            <th className="py-3.5 px-5 text-center">تاريخ الإضافة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {clients.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-5 font-bold text-slate-800">{c.fullName}</td>
                                <td className="py-4 px-5 font-sans font-bold" dir="ltr">{c.phone}</td>
                                <td className="py-4 px-5 text-slate-600">{c.profession || "-"}</td>
                                <td className="py-4 px-5 text-center font-sans font-bold">{c._count?.examOrders || 0}</td>
                                <td className="py-4 px-5 text-center text-[10px] text-slate-400 font-sans">{new Date(c.createdAt).toLocaleDateString("ar-YE")}</td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-bold">لا يوجد أي عملاء مسجلين لهذا الوكيل بعد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
