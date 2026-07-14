"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Award, BookOpen, Calendar, Clock, HelpCircle, 
    ArrowLeft, MessageSquare, Phone, Sparkles, 
    Lock, Star, CheckCircle2, XCircle, ArrowRight, 
    MapPin, Bus, User, CreditCard, ChevronRight, FileText,
    ExternalLink, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";

interface ApplicantProfile {
    id: string;
    fullName: string;
    profession: string;
    phone: string;
    whatsappNumber: string;
    examDate: string | null;
    examTime: string | null;
    status: string;
    notes: string | null;
    hasTransportation: boolean;
    travelDate: string | null;
    totalAmount: string;
    amountPaid: string;
    remainingBalance: string;
    applicantCode: string | null;
    examLocation: string | null;
    examCenter?: { name: string; address: string | null; locationUrl: string | null } | null;
    location?: { name: string } | null;
    transportFrom?: { name: string } | null;
    ticket?: {
        ticketNumber: string;
        busNumber: string | null;
        seatNumber: string | null;
        departureDate: string;
        departureLocation: string;
        arrivalLocation: string;
        transportCompany: string;
        status: string;
    } | null;
}

interface MockPurchase {
    id: string;
    packageId: string;
    totalCredits: number;
    usedCredits: number;
    amount: string;
    isPaid: boolean;
    status: string;
    activatedAt: string | null;
    expiresAt: string | null;
    package?: {
        name: string;
        nameEn: string | null;
        examCredits: number;
        price: string;
        isFree: boolean;
        validityDays: number | null;
    } | null;
}

interface ExamSession {
    id: string;
    token: string;
    status: string;
    score: number | null;
    passingScore: number;
    isPassed: boolean | null;
    createdAt: string;
    completedAt: string | null;
    attemptNumber: number;
    profession: {
        name: string;
        slug: string;
        questionCount: number;
        examDuration: number;
    };
}

interface Profession {
    id: string;
    name: string;
    slug: string;
    questionCount: number;
    examDuration: number;
}

export function ApplicantDashboardView() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // API Data States
    const [applicant, setApplicant] = useState<ApplicantProfile | null>(null);
    const [purchases, setPurchases] = useState<MockPurchase[]>([]);
    const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    
    // Exam launcher state
    const [selectedSlug, setSelectedSlug] = useState("");
    const [launching, setLaunching] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/dashboard/applicant");
                if (!res.ok) {
                    throw new Error("حدث خطأ أثناء تحميل بيانات لوحة التحكم.");
                }
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                setApplicant(data.applicant);
                setPurchases(data.purchases || []);
                setExamSessions(data.examSessions || []);
                setProfessions(data.professions || []);
                
                if (data.professions && data.professions.length > 0) {
                    // Match applicant's profession name to set default slug if possible
                    const match = data.professions.find((p: Profession) => 
                        p.name.toLowerCase().includes(data.applicant?.profession?.toLowerCase() || "")
                    );
                    setSelectedSlug(match?.slug || data.professions[0].slug);
                }
            } catch (err: any) {
                setError(err.message || "عفواً، فشل تحميل بيانات لوحة التحكم الخاصة بك.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Status mapping helper
    const getStatusInfo = (status: string) => {
        switch (status) {
            case "NEW_REGISTRATION": 
                return { text: "تسجيل جديد", color: "bg-indigo-50 text-indigo-700 border-indigo-100" };
            case "ACCOUNT_CREATED": 
                return { text: "تم إنشاء الحساب الفني", color: "bg-blue-50 text-blue-700 border-blue-100" };
            case "EXAM_SCHEDULED": 
                return { text: "تم حجز موعد الاختبار", color: "bg-violet-50 text-violet-750 border-violet-100" };
            case "AWAITING_EXAM": 
                return { text: "بانتظار تأدية الاختبار", color: "bg-amber-50 text-amber-700 border-amber-100" };
            case "ATTENDED_EXAM": 
                return { text: "تم حضور الاختبار", color: "bg-slate-100 text-slate-700 border-slate-200" };
            case "PASSED": 
                return { text: "ناجح ومجتاز ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
            case "FAILED": 
                return { text: "غير مجتاز ✕", color: "bg-rose-50 text-rose-700 border-rose-200" };
            case "POSTPONED": 
                return { text: "مؤجل", color: "bg-sky-50 text-sky-700 border-sky-100" };
            case "CANCELLED": 
                return { text: "ملغي", color: "bg-red-50 text-red-700 border-red-200" };
            case "SERVICES_CONFIGURED": 
                return { text: "تم تكوين الخدمات", color: "bg-teal-50 text-teal-700 border-teal-100" };
            case "ABSENT": 
                return { text: "غائب عن الاختبار", color: "bg-slate-100 text-slate-500 border-slate-200" };
            default: 
                return { text: status, color: "bg-slate-50 text-slate-600 border-slate-200" };
        }
    };

    const handleLaunchExam = () => {
        if (!selectedSlug) return;
        setLaunching(true);
        router.push(`/${selectedSlug}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-right" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-brand-blue animate-spin" />
                    <p className="text-slate-500 font-bold text-sm">جاري تحميل لوحتك المهنية الذكية...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-rose-600 font-bold text-xs bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-12 animate-in fade-in" dir="rtl">
                {error}
            </div>
        );
    }

    const activeStatus = applicant ? getStatusInfo(applicant.status) : { text: "غير مسجل", color: "bg-slate-50 text-slate-400" };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto text-right font-sans" dir="rtl">
            
            {/* 1. TOP PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-brand-blue text-[11px] font-black">
                        <Sparkles size={12} className="text-brand-green" />
                        بوابة المتقدم الحصري للاعتماد
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        أهلاً بك، {applicant?.fullName || "المتقدم الكريم"} 👋
                    </h1>
                    <p className="text-slate-500 text-xs font-medium">
                        تتبع ملفك، حجز مواعيد اختبار الفحص المهني، خض اختبارات المحاكاة واستعرض نتائجك مباشرة.
                    </p>
                </div>
                
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 shadow-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-450" />
                    {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* 2. WELCOME PROFILE & GENERAL SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Card & Target Profession */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black text-slate-400">المهنة المستهدفة للاعتماد</span>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <Award className="text-brand-green shrink-0" size={24} />
                                    {applicant?.profession || "غير محدد"}
                                </h2>
                            </div>
                            <span className={`px-4 py-2 text-xs font-black rounded-xl border ${activeStatus.color}`}>
                                {activeStatus.text}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400">رقم الملف (PNR)</span>
                                <p className="text-sm font-extrabold text-slate-700 font-latin">
                                    {applicant?.applicantCode || "---"}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400">المدينة المعتمدة</span>
                                <p className="text-sm font-extrabold text-slate-700">
                                    {applicant?.location?.name || "---"}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400">رقم الواتساب</span>
                                <p className="text-sm font-extrabold text-slate-700 font-latin" dir="ltr">
                                    {applicant?.whatsappNumber || "---"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Support Link */}
                    <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-slate-500">تحتاج للمساعدة الفنية بملفك الرسمي؟</span>
                        <a 
                            href={`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=${encodeURIComponent(`مرحباً، أنا المتقدم ${applicant?.fullName || ""}، رقم ملفي ${applicant?.applicantCode || ""}، أحتاج لمساعدة بخصوص خدمات اعتمادي المهني.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-black text-brand-green hover:underline"
                        >
                            <MessageSquare size={16} />
                            تحدث مع مسؤول الاعتماد المالي والفني
                        </a>
                    </div>
                </div>

                {/* Subscription / Credit Widget */}
                <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-br-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="text-brand-blue" size={20} />
                            <h3 className="text-base font-black text-slate-800">باقات ومحاولات الاختبارات</h3>
                        </div>

                        {purchases.length > 0 ? (
                            <div className="space-y-4">
                                {purchases.slice(0, 1).map((sub) => {
                                    const credits = sub.totalCredits;
                                    const used = sub.usedCredits;
                                    const remaining = credits === -1 ? "بلا حدود" : credits - used;
                                    const percent = credits === -1 ? 100 : Math.min(100, (used / credits) * 100);

                                    return (
                                        <div key={sub.id} className="space-y-3">
                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-black text-slate-800">{sub.package?.name || "باقة الفحص المهني"}</span>
                                                    <span className="text-[10px] font-bold text-brand-green px-2 py-0.5 bg-brand-green/10 rounded-full">نشطة</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold">باقة اختبارات تجريبية ذكية للمحاكاة</p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                                    <span>المحاولات المستهلكة: {used}</span>
                                                    <span>المتبقي: {remaining}</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-brand-blue rounded-full transition-all duration-500" 
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {sub.expiresAt && (
                                                <p className="text-[10px] font-bold text-slate-400">
                                                    تنتهي الصلاحية في: <span className="font-latin">{new Date(sub.expiresAt).toLocaleDateString("ar-SA")}</span>
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 leading-relaxed mb-3">لا توجد لديك باقة اختبارات تجريبية نشطة حالياً.</p>
                                <Link href="/pricing">
                                    <Button className="w-full h-8 text-[10px] font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg">
                                        اشترك الآن واستعد للفحص
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {purchases.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <Link href="/pricing" className="text-xs font-black text-brand-blue hover:underline flex items-center gap-1">
                                ترقية باقتي أو شراء أرصدة إضافية
                                <ChevronRight size={14} className="rotate-180" />
                            </Link>
                        </div>
                    )}
                </div>

            </div>

            {/* 3. SCHEDULED EXAM DETAILS & TRANSPORT CARD */}
            {applicant?.examDate && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Exam Appointment Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50/50 border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-750">
                                    <Calendar size={18} />
                                </div>
                                <h3 className="text-base font-black text-slate-800">موعد الاختبار المهني الرسمي</h3>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400">تاريخ ووقت الاختبار</span>
                                        <p className="text-sm font-black text-slate-800">
                                            <span className="font-latin">{new Date(applicant.examDate).toLocaleDateString("ar-SA", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            {applicant.examTime && <span className="mr-2 text-xs font-bold text-slate-500 font-latin">({applicant.examTime})</span>}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400">مركز الاختبار</span>
                                        <p className="text-sm font-black text-slate-800">
                                            {applicant.examCenter?.name || applicant.examLocation || "قيد التعيين..."}
                                        </p>
                                    </div>
                                </div>

                                {applicant.examCenter?.address && (
                                    <div className="flex items-start gap-1.5 text-xs text-slate-500 leading-relaxed font-semibold">
                                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                        <span>العنوان: {applicant.examCenter.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {applicant.examCenter?.locationUrl && (
                            <div className="shrink-0 flex items-center justify-center self-end md:self-center">
                                <a 
                                    href={applicant.examCenter.locationUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 h-11 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
                                >
                                    <MapPin size={16} className="text-red-500" />
                                    موقع المركز على الخريطة
                                    <ExternalLink size={14} className="text-slate-400" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Transport / Boarding Ticket Pass */}
                    {applicant.hasTransportation && applicant.ticket && (
                        <div className="bg-[#16539a] text-white p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col justify-between border border-blue-900">
                            {/* Decorative notches to simulate boarding ticket */}
                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#f0f2f5] rounded-full border-r border-[#f0f2f5] -translate-y-1/2 z-10 pointer-events-none" />
                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#f0f2f5] rounded-full border-l border-[#f0f2f5] -translate-y-1/2 z-10 pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent pointer-events-none" />

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center border-b border-white/20 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Bus size={18} className="text-brand-green" />
                                        <span className="text-xs font-black tracking-wide">تذكرة نقل الاعتماد</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md font-latin">
                                        {applicant.ticket.ticketNumber}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between text-xs">
                                        <div>
                                            <span className="block text-[9px] text-blue-200/80 font-bold">من</span>
                                            <span className="font-extrabold text-sm">{applicant.ticket.departureLocation}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-[9px] text-blue-200/80 font-bold">إلى</span>
                                            <span className="font-extrabold text-sm">{applicant.ticket.arrivalLocation}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                                        <div>
                                            <span className="block text-[9px] text-blue-200/80 font-bold">تاريخ السفر</span>
                                            <span className="text-xs font-bold font-latin">
                                                {new Date(applicant.ticket.departureDate).toLocaleDateString("ar-SA")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] text-blue-200/80 font-bold">رقم الحافلة / المقعد</span>
                                            <span className="text-xs font-bold font-latin">
                                                {applicant.ticket.busNumber ? `حافلة ${applicant.ticket.busNumber}` : "---"}
                                                {applicant.ticket.seatNumber ? ` / مقعد ${applicant.ticket.seatNumber}` : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[10px] font-bold text-blue-100 relative z-10">
                                <span>شركة النقل: {applicant.ticket.transportCompany}</span>
                                <span className="text-brand-green">مؤكد ✓</span>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* 4. ACTION CENTER: START PRACTICE EXAM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Practice Exam Launcher */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-br-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="text-brand-green" size={20} />
                            <h3 className="text-base font-black text-slate-800">ابدأ اختبار فحص تجريبي (محاكاة)</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
                            اختر تخصصك الحرفي من القائمة أدناه لتخوض محاكاة كاملة تماثل تماماً نظام فحص الهيئة السعودية، مع خيارات مراجعة وتصحيح الأخطاء.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-3 max-w-xl">
                            <select
                                value={selectedSlug}
                                onChange={(e) => setSelectedSlug(e.target.value)}
                                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-700 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                            >
                                {professions.map((prof) => (
                                    <option key={prof.id} value={prof.slug} className="font-bold">
                                        {prof.name} ({prof.questionCount} سؤال - {prof.examDuration} دقيقة)
                                    </option>
                                ))}
                            </select>

                            <Button 
                                onClick={handleLaunchExam}
                                disabled={launching || !selectedSlug}
                                className="h-12 px-6 bg-brand-blue hover:bg-brand-blue/90 text-white font-black text-xs rounded-xl shadow-sm"
                            >
                                {launching ? "جاري الإعداد..." : "دخول جلسة الاختبار"}
                                <ArrowLeft size={16} className="mr-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>يرجى البقاء متصلاً بالإنترنت لتسجيل إجاباتك أوتوماتيكياً في قاعدة البيانات.</span>
                    </div>
                </div>

                {/* Important Guidelines */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-tl-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="text-amber-500" size={20} />
                            <h3 className="text-base font-black text-slate-800">إرشادات هامة للمتقدمين</h3>
                        </div>

                        <div className="space-y-3">
                            {[
                                "احرص على أداء الاختبار التجريبي من متصفح وجهاز مستقر.",
                                "الاختبارات تحتوي على شروحات وتفاصيل الأجوبة لكل سؤال.",
                                "سجل الدخول للملف المهني بالرمز السري المرسل لهاتفك."
                            ].map((guide, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                    <span>{guide}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <a 
                            href="/guide" 
                            className="text-xs font-black text-brand-blue hover:underline flex items-center gap-1"
                        >
                            تصفح دليل المهن والمهارات بالمنصة
                            <ChevronRight size={14} className="rotate-180" />
                        </a>
                    </div>
                </div>

            </div>

            {/* 5. PREVIOUS ATTEMPTS & EXAM HISTORY */}
            <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="text-brand-blue" size={20} />
                        <h3 className="text-base font-black text-slate-800">سجل محاولاتك واختباراتك السابقة</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                        إجمالي الاختبارات المكتملة: {examSessions.length} محاولات
                    </span>
                </div>

                {examSessions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">رقم المحاولة</th>
                                    <th className="py-3 px-4">اسم التخصص</th>
                                    <th className="py-3 px-4">النتيجة</th>
                                    <th className="py-3 px-4">حالة الاجتياز</th>
                                    <th className="py-3 px-4">تاريخ المحاولة</th>
                                    <th className="py-3 px-4 text-left">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                {examSessions.map((session, index) => {
                                    const score = session.score !== null ? Number(session.score) : null;
                                    const isPassed = session.isPassed;
                                    const isCompleted = session.status === "SUBMITTED" || session.status === "TIMEOUT" || session.status === "EXPIRED";

                                    return (
                                        <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 font-latin font-semibold">
                                                #{examSessions.length - index}
                                            </td>
                                            <td className="py-4 px-4 font-extrabold text-slate-850">
                                                {session.profession.name}
                                            </td>
                                            <td className="py-4 px-4 font-latin font-bold">
                                                {score !== null ? `${Math.round(score)}%` : "---"}
                                            </td>
                                            <td className="py-4 px-4">
                                                {!isCompleted ? (
                                                    <span className="px-2.5 py-1 text-[10px] rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                                                        غير مكتملة
                                                    </span>
                                                ) : isPassed ? (
                                                    <span className="px-2.5 py-1 text-[10px] rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        اجتياز ✓
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-[10px] rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                                                        لم تجتز ✕
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-latin text-slate-400">
                                                {new Date(session.createdAt).toLocaleDateString("ar-SA", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-4 text-left">
                                                {isCompleted ? (
                                                    <Link href={`/session/${session.token}/result`}>
                                                        <Button className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg">
                                                            عرض ومراجعة الإجابات
                                                            <ArrowLeft size={12} className="mr-1.5" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/session/${session.token}`}>
                                                        <Button className="h-8 px-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold text-[10px] rounded-lg">
                                                            استئناف الاختبار
                                                            <ArrowLeft size={12} className="mr-1.5" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                        <p className="text-sm text-slate-400 font-bold leading-relaxed mb-4">لا توجد محاولات اختبارات سابقة مسجلة في ملفك المهني حالياً.</p>
                        <Button 
                            onClick={handleLaunchExam}
                            className="h-10 px-5 bg-brand-blue hover:bg-brand-blue/90 text-white font-black text-xs rounded-xl"
                        >
                            ابدأ أول اختبار تجريبي الآن
                        </Button>
                    </div>
                )}
            </div>

        </div>
    );
}
