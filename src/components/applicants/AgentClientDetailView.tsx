"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Phone, Mail, MapPin, User, ShieldCheck, Tag, Copy, BookOpen, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";

interface AgentClientDetailViewProps {
    agentClient: any;
    onUpdate: () => void;
    onClose: () => void;
}

export function AgentClientDetailView({ agentClient, onClose }: AgentClientDetailViewProps) {
    const { toast } = useToast();

    const handleCopyLink = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            toast("تم نسخ رابط الاختبار إلى الحافظة بنجاح.", "success");
        } catch (err) {
            toast("فشل في نسخ الرابط.", "error");
        }
    };

    const getStatusDisplay = (status: string, isPassed: boolean | null) => {
        switch (status) {
            case "COMPLETED":
                return isPassed 
                    ? { label: "ناجح", color: "bg-green-150 text-green-700 hover:bg-green-150 border-green-200" }
                    : { label: "راسب", color: "bg-rose-150 text-rose-700 hover:bg-rose-150 border-rose-200" };
            case "STARTED":
                return { label: "بدأ الاختبار", color: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" };
            case "SENT":
                return { label: "أُرسل للعميل", color: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" };
            case "PENDING":
                return { label: "معلق", color: "bg-gray-100 text-gray-500 hover:bg-gray-100 border-gray-200" };
            case "EXPIRED":
                return { label: "منتهي الصلاحية", color: "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200" };
            case "CANCELLED":
                return { label: "ملغي", color: "bg-gray-200 text-gray-700 hover:bg-gray-200 border-gray-300" };
            default:
                return { label: status, color: "bg-gray-55 text-gray-600 hover:bg-gray-55" };
        }
    };

    const examOrders = agentClient.examOrders || [];

    return (
        <div className="space-y-6 p-6 text-right" dir="rtl">
            {/* 1. Header card indicating agent-owned client */}
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-[#074388] text-white text-[10px] font-black"><Building2 className="h-3 w-3 ml-1" /> عميل وكيل معتمد</Badge>
                            <span className="text-xs font-bold text-[#074388]">{agentClient.agentName}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mt-1">{agentClient.fullName}</h2>
                        <p className="text-xs text-slate-500 font-bold">تخصص: {agentClient.profession || "غير محدد"}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 2. Client Info Card */}
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/40 font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-[#074388]" /> معلومات المتقدم (العميل)
                    </div>
                    <CardContent className="p-4 space-y-3.5 text-xs">
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">الهاتف:</span>
                            <span className="font-sans font-black text-slate-700 dir-ltr flex items-center gap-1">
                                {agentClient.phone}
                                <Phone size={12} className="text-slate-400" />
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">الواتساب:</span>
                            <span className="font-sans font-black text-slate-700 dir-ltr flex items-center gap-1">
                                {agentClient.whatsappNumber || agentClient.phone}
                                <CheckCircle2 size={12} className="text-emerald-500" />
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">البريد الإلكتروني:</span>
                            <span className="font-sans font-bold text-slate-600 flex items-center gap-1">
                                {agentClient.email || "—"}
                                {agentClient.email && <Mail size={12} className="text-slate-400" />}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">تاريخ التسجيل:</span>
                            <span className="font-sans font-bold text-slate-600 flex items-center gap-1">
                                {new Date(agentClient.createdAt).toLocaleDateString("ar-YE")}
                                <Calendar size={12} className="text-slate-400" />
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Agency Info Card */}
                <Card className="border-slate-100 shadow-sm rounded-2xl">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/40 font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-[#074388]" /> الوكالة المسؤولة
                    </div>
                    <CardContent className="p-4 space-y-3.5 text-xs">
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">اسم الوكالة:</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                {agentClient.agentName}
                                <ShieldCheck size={12} className="text-indigo-600" />
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">المسؤول عن الوكالة:</span>
                            <span className="font-bold text-slate-700">{agentClient.agentOwner || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">هاتف الوكالة:</span>
                            <span className="font-sans font-black text-slate-700 dir-ltr">{agentClient.agentPhone || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-bold">البريد الإلكتروني للوكالة:</span>
                            <span className="font-sans font-bold text-slate-600">{agentClient.agentEmail || "—"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 4. Exam Sessions History */}
            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/40 font-bold text-xs text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-[#074388]" /> سجل طلبات وجلسات الاختبار
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-black">
                            <tr>
                                <th className="p-3">التخصص</th>
                                <th className="p-3 text-center">حالة الاختبار</th>
                                <th className="p-3 text-center">الدرجة</th>
                                <th className="p-3 text-center">تاريخ الإرسال</th>
                                <th className="p-3 text-center">رابط الجلسة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                            {examOrders.map((order: any) => {
                                const statusDisp = getStatusDisplay(order.status, order.isPassed);
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50/40">
                                        <td className="p-3 text-slate-800 font-black">{order.professionName}</td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className={`${statusDisp.color} text-[10px] py-0.5`}>
                                                {statusDisp.label}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center font-sans font-black">
                                            {order.score !== null ? `${order.score}%` : "—"}
                                        </td>
                                        <td className="p-3 text-center font-sans text-[10px] text-slate-400">
                                            {order.sentAt ? new Date(order.sentAt).toLocaleDateString("ar-YE") : "—"}
                                        </td>
                                        <td className="p-3 text-center">
                                            {order.examLink ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded-md"
                                                        onClick={() => handleCopyLink(order.examLink)}
                                                        title="نسخ الرابط"
                                                    >
                                                        <Copy size={11} />
                                                    </Button>
                                                    <a 
                                                        href={order.examLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="inline-flex h-6 w-6 items-center justify-center text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded-md"
                                                        title="فتح الجلسة"
                                                    >
                                                        <BookOpen size={11} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {examOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                                        لا يوجد أي جلسات اختبار مرسلة لهذا العميل بعد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
