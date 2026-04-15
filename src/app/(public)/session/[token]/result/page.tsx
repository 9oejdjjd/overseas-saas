"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
    Trophy, 
    XCircle, 
    CheckCircle2, 
    AlertCircle, 
    ArrowLeft, 
    BookOpen, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    Award,
    Target,
    BarChart3,
    User,
    Briefcase,
    ShieldCheck,
    HelpCircle,
    ArrowRight
} from "lucide-react";

interface QuestionResult {
    id: string;
    questionId: string;
    text: string;
    explanation: string;
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
}

interface ResultData {
    score: number;
    passingScore: number;
    isPassed: boolean;
    visitorName: string;
    professionName: string;
    startedAt: string;
    completedAt: string;
    questions: QuestionResult[];
}

export default function ExamResultPage() {
    const { token } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ResultData | null>(null);
    const [error, setError] = useState("");
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    useEffect(() => {
        fetchResult();
    }, [token]);

    const fetchResult = async () => {
        try {
            const res = await fetch(`/api/mock/session/${token}/result`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "فشل تحميل النتيجة");
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">جاري تحضير تقريرك الشخصي...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6" dir="rtl">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border border-red-50">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">تعذر الوصول للتقرير</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">{error || "تأكد من إكمال الاختبار أولاً للحصول على التقرير."}</p>
                    <Button onClick={() => router.push("/")} className="w-full bg-[#16539a] h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-900/20">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    // Only show incorrect or unanswered questions
    const reviewQuestions = result.questions.filter(q => !q.isCorrect);
    
    const correctCount = result.questions.filter(q => q.isCorrect).length;
    const incorrectCount = result.questions.filter(q => q.selectedOptionId && !q.isCorrect).length;
    const unansweredCount = result.questions.filter(q => !q.selectedOptionId).length;
    
    return (
        <div className="min-h-screen bg-[#fcfdfe] font-sans pb-32" dir="rtl">
            {/* 1. PREMIUM HEADER SECTION */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#16539a]/5 to-transparent pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-96 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row items-center gap-10"
                    >
                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-right space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#16539a] rounded-full text-sm font-black mb-2">
                                <ShieldCheck size={16} /> تقرير الاعتماد المهني الرسمي
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                {result.visitorName}
                            </h1>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-bold">
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <Briefcase size={18} className="text-[#5c9e45]" />
                                    <span>{result.professionName}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <Clock size={18} className="text-[#16539a]" />
                                    <span>{new Date(result.completedAt).toLocaleDateString('ar-SA')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Result Ring */}
                        <div className="shrink-0 relative">
                            <div className={`w-56 h-56 rounded-full border-[10px] flex flex-col items-center justify-center shadow-2xl shadow-blue-900/10 ${result.isPassed ? 'border-[#5c9e45]/20 bg-green-50/10' : 'border-red-100 bg-red-50/10'}`}>
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.3 }}
                                    className="text-6xl font-black text-slate-800"
                                >
                                    {Math.round(result.score)}%
                                </motion.div>
                                <div className={`text-sm font-black uppercase tracking-tighter mt-1 ${result.isPassed ? 'text-[#5c9e45]' : 'text-red-500'}`}>
                                    {result.isPassed ? 'اجتياز بنجاح' : 'لم يتم الاجتياز'}
                                </div>
                                
                                {/* SVG Ring Helper */}
                                <svg className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] -rotate-90">
                                    <circle 
                                        cx="53%" cy="53%" r="102" stroke="currentColor" strokeWidth="10" fill="transparent" 
                                        strokeDasharray="640"
                                        strokeDashoffset={640 - (640 * result.score) / 100}
                                        className={`${result.isPassed ? 'text-[#5c9e45]' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            
                            {/* Floating Trophy Icon */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className={`absolute -top-4 -right-4 w-16 h-16 rounded-3xl shadow-xl flex items-center justify-center text-white ${result.isPassed ? 'bg-gradient-to-br from-[#5c9e45] to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}
                            >
                                {result.isPassed ? <Trophy size={32} /> : <Target size={32} />}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* 2. STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        <StatsCard 
                            icon={<CheckCircle2 className="text-[#5c9e45]" />}
                            label="الإجابات الصحيحة"
                            value={correctCount}
                            color="border-green-100 bg-green-50/30"
                        />
                        <StatsCard 
                            icon={<XCircle className="text-red-500" />}
                            label="إجابات غير صحيحة"
                            value={incorrectCount}
                            color="border-red-100 bg-red-50/30"
                        />
                        <StatsCard 
                            icon={<HelpCircle className="text-slate-400" />}
                            label="أسئلة لم يتم حلها"
                            value={unansweredCount}
                            color="border-slate-200 bg-slate-50/50"
                        />
                    </div>
                </div>
            </div>

            {/* 3. REVIEW SECTION (ERRORS ONLY) */}
            <div className="max-w-4xl mx-auto px-6 mt-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1">مراجعة نقاط الضعف</h2>
                        <p className="text-slate-500 font-bold">عرض فقط الأسئلة التي تحتاج لمراجعة وفهم أعمق ({reviewQuestions.length})</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100 text-sm font-black">
                        <Award size={18} /> نصيحة: راجع الشروحات بدقة
                    </div>
                </div>

                <div className="space-y-6">
                    {reviewQuestions.map((q, idx) => {
                        const isExpanded = expandedQuestion === q.id;
                        const isUnanswered = !q.selectedOptionId;

                        return (
                            <motion.div 
                                layout
                                key={q.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`group bg-white rounded-[2rem] border transition-all duration-500 ${isExpanded ? 'border-[#16539a] shadow-2xl shadow-[#16539a]/10 ring-1 ring-[#16539a]/5' : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl'}`}
                            >
                                <div 
                                    className="p-8 cursor-pointer flex items-start gap-6"
                                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-[1.25rem] flex items-center justify-center text-xl font-black shadow-sm ${isUnanswered ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                                        {isUnanswered ? <Clock size={20} /> : <XCircle size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-800 text-lg font-black leading-relaxed mb-3">{q.text}</p>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase ${isUnanswered ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                                            {isUnanswered ? "تم تجاوز السؤال" : "إجابة خاطئة"}
                                        </span>
                                    </div>
                                    <div className={`mt-2 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#16539a]' : 'text-slate-300'}`}>
                                        <ChevronDown size={28} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-8 pt-2 border-t border-slate-50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                                                    {q.options.map(opt => {
                                                        const isSelected = opt.id === q.selectedOptionId;
                                                        const isCorrect = opt.isCorrect;
                                                        
                                                        let style = "border-slate-100 bg-slate-50/50 text-slate-500";
                                                        if (isCorrect) {
                                                            style = "border-[#5c9e45] bg-green-50/50 text-[#4d853a] ring-1 ring-green-100 shadow-sm";
                                                        } else if (isSelected) {
                                                            style = "border-red-400 bg-red-50/50 text-red-600 ring-1 ring-red-100";
                                                        }

                                                        return (
                                                            <div key={opt.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${style}`}>
                                                                <span className="text-sm font-black">{opt.text}</span>
                                                                {isCorrect ? <CheckCircle2 size={20} /> : isSelected ? <XCircle size={20} /> : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation Section */}
                                                <div className="bg-blue-50/60 rounded-[1.75rem] p-6 border border-blue-100 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                                        <BookOpen size={60} />
                                                    </div>
                                                    <h4 className="text-[#16539a] font-black flex items-center gap-3 mb-3">
                                                        <BarChart3 size={20} /> لماذا هذه هي الإجابة الصحيحة؟
                                                    </h4>
                                                    <p className="text-slate-600 leading-relaxed font-bold">
                                                        {q.explanation || "لا يوجد شرح متوفر لهذا السؤال حالياً."}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {reviewQuestions.length === 0 && (
                        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-green-100">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-[#5c9e45]" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">سجل ذهبي! لا توجد أخطاء</h3>
                            <p className="text-slate-500 font-bold">لقد أجبت على جميع الأسئلة بشكل مثالي. أنت فخر للاعتماد المهني السعودي.</p>
                        </div>
                    )}
                </div>

                {/* Final Cta */}
                <div className="mt-16 flex flex-col items-center gap-6">
                    <Button 
                        onClick={() => router.push("/")}
                        className="h-16 px-12 bg-slate-900 hover:bg-black text-white rounded-2xl transition-all shadow-xl hover:-translate-y-1 font-black text-lg gap-4"
                    >
                        العودة للرئيسية <ArrowRight size={20} />
                    </Button>
                    <p className="text-slate-400 text-xs font-bold text-center">
                        تم توليد هذا التقرير تلقائياً بواسطة نظام الاعتماد المهني السعودي المطور.<br/>
                        جميع الحقوق محفوظة © ٢٠٢٤
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div className={`p-6 rounded-3xl border ${color} flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300`}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-tight">{label}</div>
            </div>
        </div>
    );
}
