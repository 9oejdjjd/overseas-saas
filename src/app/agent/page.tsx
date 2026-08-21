"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
    Users, 
    BookOpen, 
    Wallet, 
    Award, 
    Send, 
    UserPlus, 
    ArrowLeft, 
    Loader2,
    Calendar,
    BadgeAlert,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    Play
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardData {
    clientCount: number;
    examStats: Record<string, number>;
    walletBalance: number;
    recentExams: Array<{
        id: string;
        createdAt: string;
        status: string;
        examPrice: number;
        score: number | null;
        isPassed: boolean | null;
        client: { fullName: string };
        profession: { name: string };
    }>;
    passRate: number;
}

export default function AgentDashboard() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const companyName = session?.user?.companyName || "وكالتنا";

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/agent/dashboard");
            if (!res.ok) throw new Error("فشل في تحميل بيانات لوحة التحكم");
            const json = await res.json();
            setData(json.data);
        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#074388]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-bold text-center" dir="rtl">
                {error}
            </div>
        );
    }

    const totalExams = Object.values(data?.examStats || {}).reduce((a, b) => a + b, 0);

    const cards = [
        {
            title: "إجمالي العملاء المسجلين",
            value: data?.clientCount || 0,
            icon: Users,
            description: "عملاء مضافين بواسطة موظفيك",
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/10",
        },
        {
            title: "إجمالي الاختبارات المطلوبة",
            value: totalExams,
            icon: BookOpen,
            description: `منها ${data?.examStats['COMPLETED'] || 0} مكتمل و ${data?.examStats['SENT'] || 0} مرسل`,
            color: "text-[#074388] bg-[#074388]/10",
        },
        {
            title: "نسبة النجاح العامة لعملائك",
            value: `${data?.passRate || 0}%`,
            icon: Award,
            description: "للاختبارات المكتملة فقط",
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10",
        },
        {
            title: "رصيد المحفظة المالي الحالي",
            value: `${Number(data?.walletBalance || 0).toLocaleString("ar-YE")} ريال`,
            icon: Wallet,
            description: "العملة المحلية المعتمدة",
            color: "text-amber-600 bg-amber-50 dark:bg-amber-900/10",
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    const getStatusBadge = (status: string, isPassed: boolean | null) => {
        switch (status) {
            case "COMPLETED":
                return isPassed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 size={12} /> ناجح
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <XCircle size={12} /> راسب
                    </span>
                );
            case "SENT":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Send size={12} /> تم الإرسال
                    </span>
                );
            case "STARTED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock size={12} className="animate-spin" /> بدأ الاختبار
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Top Bar: Greetings */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-l from-[#074388] to-[#063570] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                <div className="relative z-10 space-y-1">
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
                        مرحباً بك، {companyName}
                    </h2>
                    <p className="text-xs text-white/80 font-bold">بوابة خدمات الوكلاء وإرسال اختبارات الاعتماد المهني فوراً للعملاء.</p>
                </div>
                <div className="relative z-10 flex flex-wrap gap-2 w-full md:w-auto">
                    <Link 
                        href="/agent/clients" 
                        className="flex-1 sm:flex-initial h-10 px-5 bg-[#55943b] hover:bg-[#4a8333] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#55943b]/30 transition-all text-xs"
                    >
                        <Send size={14} /> إضافة عميل - طلب اختبارات
                    </Link>
                    <Link 
                        href="/agent/clients?tab=exams" 
                        className="flex-1 sm:flex-initial h-10 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs"
                    >
                        <UserPlus size={14} /> سجل الاختبارات
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {cards.map((card, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl overflow-hidden relative group hover:shadow-md transition-all duration-300">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl shrink-0 transition-transform duration-300 group-hover:scale-105", card.color)}>
                                    <card.icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1 truncate">
                                    <span className="text-[10px] md:text-xs font-black text-slate-400 block truncate">{card.title}</span>
                                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white truncate font-sans">{card.value}</h3>
                                    <p className="text-[10px] font-bold text-slate-400/90 truncate">{card.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Right: Recent Exams */}
                <Card className="lg:col-span-2 border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-850 dark:text-white">آخر الاختبارات المرسلة</h3>
                        <Link href="/agent/clients?tab=exams" className="text-xs font-bold text-[#55943b] hover:underline flex items-center gap-1">
                            عرض الكل <ArrowLeft size={12} className="rotate-180" />
                        </Link>
                    </div>
                    <CardContent className="p-0">
                        {data?.recentExams && data.recentExams.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-700/20 text-slate-400 text-[10px] font-black border-b border-slate-100 dark:border-slate-700/50">
                                            <th className="py-3 px-5">اسم العميل</th>
                                            <th className="py-3 px-5">المهنة</th>
                                            <th className="py-3 px-5">حالة الاختبار</th>
                                            <th className="py-3 px-5">النتيجة</th>
                                            <th className="py-3 px-5">التاريخ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-200 text-xs">
                                        {data.recentExams.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all font-semibold">
                                                <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">{exam.client.fullName}</td>
                                                <td className="py-4 px-5">{exam.profession.name}</td>
                                                <td className="py-4 px-5">{getStatusBadge(exam.status, exam.isPassed)}</td>
                                                <td className="py-4 px-5 font-sans font-black">{exam.score !== null ? `${exam.score}%` : "-"}</td>
                                                <td className="py-4 px-5 text-[10px] text-slate-400 font-sans">
                                                    {new Date(exam.createdAt).toLocaleDateString("ar-YE")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold">
                                لم يتم إرسال أي اختبار بعد. اضغط على زر "طلب اختبارات" للبدء.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Left: Quick Guide */}
                <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-[#074388] text-white overflow-hidden relative flex flex-col justify-between">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#55943b]/20 rounded-tl-full blur-[40px] pointer-events-none" />
                    <div className="p-6 space-y-5 relative z-10">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-yellow-400" />
                            دليل الاستخدام السريع
                        </h3>
                        <div className="space-y-4 text-xs leading-relaxed text-white/90 font-semibold">
                            <div className="flex gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-sans font-black text-[10px] shrink-0">1</span>
                                <p>ادخل لقسم <strong>العملاء والاختبارات</strong> واضغط على زر <strong>إضافة عميل - طلب اختبارات</strong>.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-sans font-black text-[10px] shrink-0">2</span>
                                <p>قم بتعبئة بيانات العميل (الاسم، رقم الهاتف، والبريد الإلكتروني) بدقة للتحقق.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-sans font-black text-[10px] shrink-0">3</span>
                                <p>اختر المهنة والتخصص المناسب للاختبار لتوليد روابط الاختبار المخصصة فوراً.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-sans font-black text-[10px] shrink-0">4</span>
                                <p>انسخ روابط الاختبارات من واجهة النجاح وشاركها معهم مباشرة لبدء التدريب.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-sans font-black text-[10px] shrink-0">5</span>
                                <p>بمجرد انتهاء العميل من الإجابة، ستظهر الدرجة ورابط نتيجته في سجل الاختبارات.</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Link 
                                href="/agent/clients" 
                                className="w-full h-10 bg-white text-[#074388] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all text-xs shadow-md"
                            >
                                <Play size={12} className="fill-[#074388]" /> ابدأ الآن
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
