"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    User, 
    Phone, 
    Mail, 
    Briefcase, 
    Calendar, 
    Send, 
    ArrowRight, 
    Loader2, 
    FileText,
    BookOpen,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ExamOrder {
    id: string;
    createdAt: string;
    status: string;
    examPrice: number;
    score: number | null;
    isPassed: boolean | null;
    examLink: string | null;
    profession: { name: string };
}

interface ClientDetails {
    id: string;
    fullName: string;
    phone: string;
    whatsappNumber: string | null;
    email: string | null;
    profession: string | null;
    nationalId: string | null;
    passportNumber: string | null;
    notes: string | null;
    createdAt: string;
    examOrders: ExamOrder[];
}

export default function ClientDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    
    const [client, setClient] = useState<ClientDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchClientDetails = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/agent/clients/${id}`);
                if (!res.ok) throw new Error("فشل في تحميل تفاصيل العميل");
                const json = await res.json();
                setClient(json.data);
            } catch (err: any) {
                setError(err.message || "حدث خطأ غير متوقع");
            } finally {
                setLoading(false);
            }
        };

        if (session && id) {
            fetchClientDetails();
        }
    }, [id, session]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-bold text-center">
                    {error || "العميل غير موجود"}
                </div>
                <Button onClick={() => router.push("/agent/clients")} className="bg-slate-200 text-slate-800 rounded-xl">
                    <ArrowRight size={14} /> العودة للعملاء
                </Button>
            </div>
        );
    }

    const getStatusBadge = (status: string, isPassed: boolean | null) => {
        switch (status) {
            case "COMPLETED":
                return isPassed ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 size={10} /> ناجح
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <XCircle size={10} /> راسب
                    </span>
                );
            case "SENT":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Send size={10} /> تم الإرسال
                    </span>
                );
            case "STARTED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock size={10} className="animate-spin" /> بدأ الاختبار
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Bar: Navigation back */}
            <div className="flex items-center justify-between">
                <Button 
                    onClick={() => router.push("/agent/clients")}
                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700 rounded-xl font-bold flex items-center gap-2 transition-all text-xs"
                >
                    <ArrowRight size={14} /> العودة لقائمة العملاء
                </Button>

                <Link 
                    href={`/agent/exams/send?clientId=${client.id}`}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-violet-900/10 transition-all text-xs"
                >
                    <Send size={14} /> إرسال اختبار لهذا العميل
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Client profile details */}
                <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl h-fit">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700/50">
                        <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-850 dark:text-white">
                            <User className="h-5 w-5 text-violet-500" /> ملف العميل الشخصي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        {/* Avatar / Title */}
                        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="h-16 w-16 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3 shadow-inner">
                                {client.fullName[0]}
                            </div>
                            <h3 className="text-base font-black text-slate-850 dark:text-white">{client.fullName}</h3>
                            {client.profession && <span className="text-xs text-slate-400 font-bold">{client.profession}</span>}
                        </div>

                        {/* Contacts & Metadata */}
                        <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                            <div className="flex items-center gap-3">
                                <Phone size={14} className="text-slate-450 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-black">رقم الهاتف</span>
                                    <span className="font-sans font-bold mt-0.5">{client.phone}</span>
                                </div>
                            </div>

                            {client.whatsappNumber && (
                                <div className="flex items-center gap-3">
                                    <Phone size={14} className="text-emerald-500 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black">رقم الواتساب</span>
                                        <span className="font-sans font-bold mt-0.5">{client.whatsappNumber}</span>
                                    </div>
                                </div>
                            )}

                            {client.email && (
                                <div className="flex items-center gap-3">
                                    <Mail size={14} className="text-slate-450 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black">البريد الإلكتروني</span>
                                        <span className="font-sans mt-0.5">{client.email}</span>
                                    </div>
                                </div>
                            )}

                            {client.nationalId && (
                                <div className="flex items-center gap-3">
                                    <FileText size={14} className="text-slate-450 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black">رقم الهوية الوطنية</span>
                                        <span className="font-sans mt-0.5">{client.nationalId}</span>
                                    </div>
                                </div>
                            )}

                            {client.passportNumber && (
                                <div className="flex items-center gap-3">
                                    <FileText size={14} className="text-slate-450 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black">رقم جواز السفر</span>
                                        <span className="font-sans mt-0.5">{client.passportNumber}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Calendar size={14} className="text-slate-450 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-black">تاريخ التسجيل بالبوابة</span>
                                    <span className="font-sans mt-0.5">{new Date(client.createdAt).toLocaleDateString("ar-YE")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {client.notes && (
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                                <span className="text-[10px] text-slate-400 font-black block mb-1">ملاحظات الإدارة:</span>
                                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">{client.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right side: Exams history timeline */}
                <Card className="lg:col-span-2 border-none shadow-sm dark:bg-slate-800 rounded-2xl">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700/50">
                        <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-850 dark:text-white">
                            <BookOpen className="h-5 w-5 text-violet-500" /> سجل اختبارات العميل
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {client.examOrders && client.examOrders.length > 0 ? (
                            <div className="relative border-r border-slate-100 dark:border-slate-700 pr-5 space-y-6">
                                {client.examOrders.map((exam, idx) => (
                                    <div key={exam.id} className="relative">
                                        {/* Timeline marker */}
                                        <span className="absolute -right-[26px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 bg-violet-600 shadow-sm" />
                                        
                                        <div className="p-4 bg-slate-50/50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                                    اختبار: {exam.profession.name}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                                                    <span className="font-sans">{new Date(exam.createdAt).toLocaleDateString("ar-YE")}</span>
                                                    <span>•</span>
                                                    <span>التكلفة: {Number(exam.examPrice).toLocaleString("ar-YE")} ريال</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {/* Status badge */}
                                                {getStatusBadge(exam.status, exam.isPassed)}
                                                
                                                {/* Score */}
                                                {exam.score !== null && (
                                                    <span className="text-xs font-black font-sans bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                                        الدرجة: {exam.score}%
                                                    </span>
                                                )}

                                                {/* Link to retry / view if active */}
                                                {exam.status === "SENT" && exam.examLink && (
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(exam.examLink || "");
                                                            alert("تم نسخ رابط الاختبار بنجاح!");
                                                        }}
                                                        className="h-8 px-3 border border-violet-200 text-violet-600 rounded-lg font-bold text-[10px] hover:bg-violet-50 transition-all"
                                                    >
                                                        نسخ الرابط
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-700/10 rounded-2xl">
                                لا توجد اختبارات مسجلة لهذا العميل حتى الآن.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
