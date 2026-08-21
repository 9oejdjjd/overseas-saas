import React, { useState } from "react";
import { Plus, Eye, Check, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentClient } from "@/types/agent";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ClientsTableProps {
    clients: AgentClient[];
    loadingClients: boolean;
    copiedClientId: string | null;
    onCopyActiveExamLink: (link: string, clientName: string, profession: string, clientId: string) => void;
    onSendExamForClient: (client: AgentClient) => void;
}

export function ClientsTable({
    clients,
    loadingClients,
    copiedClientId,
    onCopyActiveExamLink,
    onSendExamForClient
}: ClientsTableProps) {
    const [search, setSearch] = useState("");

    const filteredClients = Array.isArray(clients)
        ? clients.filter((c) => c.fullName.toLowerCase().includes(search.toLowerCase()))
        : [];

    return (
        <div className="space-y-4 text-right">
            {/* Search Input */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="بحث باسم العميل..."
                    className="w-full sm:w-64 px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#074388] bg-slate-50 focus:bg-white border-slate-200 transition-all h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loadingClients ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#074388]"></div>
                </div>
            ) : (
                <div>
                    {filteredClients.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm bg-white dark:bg-slate-900">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-700/20 text-slate-400 text-[10px] font-black border-b border-slate-100 dark:border-slate-700/50">
                                        <th className="py-3.5 px-5">الاسم الكامل</th>
                                        <th className="py-3.5 px-5">الهاتف / الواتساب</th>
                                        <th className="py-3.5 px-5">المهنة</th>
                                        <th className="py-3.5 px-5 text-center">عدد الاختبارات</th>
                                        <th className="py-3.5 px-5 text-center">تاريخ الإضافة</th>
                                        <th className="py-3.5 px-5 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-200">
                                    {filteredClients.map((client) => {
                                        const activeOrder = client.examOrders?.find(o => o.status === 'SENT' || o.status === 'STARTED');
                                        const hasActiveExams = !!activeOrder;

                                        return (
                                            <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-all font-semibold">
                                                <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">
                                                    <div className="flex flex-col">
                                                        <span>{client.fullName}</span>
                                                        {client.email && <span className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">{client.email}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 font-sans font-black">{client.whatsappNumber || client.phone || "-"}</td>
                                                <td className="py-4 px-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-slate-700/50 text-[#074388] dark:text-blue-300">
                                                        {client.profession || "-"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 text-center font-sans font-black">
                                                    {client._count?.examOrders || 0}
                                                </td>
                                                <td className="py-4 px-5 text-center text-[10px] text-slate-400 font-sans">
                                                    {new Date(client.createdAt).toLocaleDateString("ar-YE")}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {hasActiveExams ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onCopyActiveExamLink(activeOrder.examLink || "", client.fullName, client.profession || "", client.id)}
                                                                className="bg-[#55943b] hover:bg-[#55943b]/90 text-white gap-1.5 rounded-lg shadow-sm h-8"
                                                            >
                                                                {copiedClientId === client.id ? (
                                                                    <>
                                                                        <Check className="w-3.5 h-3.5" />
                                                                        تم النسخ بنجاح
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                        نسخ رابط الاختبار
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onSendExamForClient(client)}
                                                                className="bg-[#074388] hover:bg-[#074388]/90 text-white gap-1.5 rounded-lg shadow-sm h-8"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                تجديد / طلب اختبارات
                                                            </Button>
                                                        )}
                                                        <Link href={`/agent/clients/${client.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-[#074388] border-[#074388]/20 hover:bg-[#074388]/5 gap-1.5 rounded-lg h-8 bg-white"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                عرض التفاصيل
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-700/10 rounded-2xl">
                            لا يوجد أي عملاء مسجلين يطابقون خيارات البحث.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
