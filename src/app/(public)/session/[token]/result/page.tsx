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
    ArrowRight,
    Star,
    Sparkles
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
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-200/60 font-bold animate-pulse tracking-widest text-sm uppercase">جاري تحضير تقريرك الشخصي</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans" dir="rtl">
                <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border border-white/10">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">تعذر الوصول للتقرير</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed font-medium">{error || "تأكد من إكمال الاختبار أولاً للحصول على التقرير."}</p>
                    <Button onClick={() => router.push("/")} className="w-full bg-white text-[#0a0f1c] h-14 text-lg font-bold rounded-2xl hover:bg-white/90 transition-all">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    // Feedback logic (restored as requested)
    const getFeedback = () => {
        if (!result.isPassed) {
            return {
                title: "محاولة شجاعة.. لا تستسلم!",
                message: "الاختبار الحقيقي يتطلب دقة عالية. هذه الدرجة تعني أنك بحاجة لمراجعة الأساسيات بشكل أعمق. اطلع على شروحات الأسئلة بالأسفل لتقوية نقاط الضعف لديك.",
                color: "text-red-400",
                bg: "bg-red-500/10",
                border: "border-red-500/20",
                icon: <Target className="w-8 h-8 text-red-400" strokeWidth={2.5} />
            };
        }
        if (result.score < 80) {
            return {
                title: "كفؤ! أحسنت النجاح",
                message: "لقد تجاوزت الحد الأدنى، وهذا رائع! ولكن لضمان النجاح في الاختبار الفعلي للهيئة، ننصحك بالتدرب أكثر حتى تصل لنسبة 80% وما فوق. ركز على الأسئلة التي تعثرت بها بالأسفل.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
                icon: <Award className="w-8 h-8 text-amber-400" strokeWidth={2.5} />
            };
        }
        return {
            title: "أسطوري! أنت مستعد تماماً",
            message: "ما شاء الله! هذا المستوى يؤهلك وبثقة لاجتياز اختبار الاعتماد المهني السعودي. استمر بهذا التركيز وحافظ على هدوئك يوم الاختبار. أنت فخر لنا!",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            icon: <Trophy className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
        };
    };

    const feedback = getFeedback();
    const reviewQuestions = result.questions.filter(q => !q.isCorrect);
    const correctCount = result.questions.filter(q => q.isCorrect).length;
    const incorrectCount = result.questions.filter(q => q.selectedOptionId && !q.isCorrect).length;
    const unansweredCount = result.questions.filter(q => !q.selectedOptionId).length;
    
    return (
        <div className="min-h-screen bg-[#0a0f1c] font-sans pb-32 text-white overflow-x-hidden relative" dir="rtl">
            {/* Background Aesthetic Blobs (matching success screen) */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none z-0"></div>
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#16539a]/20 rounded-full blur-[160px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#5c9e45]/10 rounded-full blur-[140px] pointer-events-none z-0" />
            
            <main className="max-w-6xl mx-auto px-6 pt-32 relative z-10">
                
                {/* 1. HERO HEADER SECTION */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-2xl rounded-[3.5rem] p-10 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                        <ShieldCheck size={200} />
                    </div>

                    {/* Left: Info */}
                    <div className="flex-1 text-center md:text-right space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black tracking-widest text-blue-300 uppercase">
                            <Sparkles size={14} className="text-amber-400" /> تقرير الاعتماد المهني الرسمي
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                            {result.visitorName}
                        </h1>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-slate-300 font-bold">
                                <Briefcase size={20} className="text-emerald-400" strokeWidth={2.5} />
                                <span>{result.professionName}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-slate-300 font-bold">
                                <Clock size={20} className="text-blue-400" strokeWidth={2.5} />
                                <span>{new Date(result.completedAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Result Ring (Static as requested) */}
                    <div className="shrink-0 relative group">
                        <div className={`w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-inner relative ${result.isPassed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                            
                            {/* SVG Ring Background */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
                                <circle 
                                    cx="50%" cy="50%" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" 
                                />
                                <circle 
                                    cx="50%" cy="50%" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray="754"
                                    strokeDashoffset={754 - (754 * result.score) / 100}
                                    className={`${result.isPassed ? 'text-emerald-500' : 'text-red-500'} opacity-80`}
                                    strokeLinecap="round"
                                />
                            </svg>

                            <div className="text-7xl font-black text-white tracking-tighter mb-1 relative z-10">
                                {Math.round(result.score)}<span className="text-3xl opacity-50">%</span>
                            </div>
                            <div className={`text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full border relative z-10 ${result.isPassed ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                {result.isPassed ? 'ناجح ✓' : 'لم يجتز'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. FEEDBACK SECTION (New Position under Header) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`mt-10 p-8 rounded-[2.5rem] border ${feedback.bg} ${feedback.border} flex flex-col md:flex-row items-center gap-8 relative overflow-hidden`}
                >
                    <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5">
                        {feedback.icon}
                    </div>
                    <div>
                        <h3 className={`text-2xl font-black ${feedback.color} mb-2`}>{feedback.title}</h3>
                        <p className="text-slate-300 font-medium leading-relaxed max-w-3xl">{feedback.message}</p>
                    </div>
                </motion.div>

                {/* 3. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <DarkStatsCard 
                        icon={<CheckCircle2 className="text-emerald-400" />}
                        label="صحيح"
                        value={correctCount}
                        color="bg-emerald-500/5 border-emerald-500/10"
                    />
                    <DarkStatsCard 
                        icon={<XCircle className="text-red-400" />}
                        label="خطأ"
                        value={incorrectCount}
                        color="bg-red-500/5 border-red-500/10"
                    />
                    <DarkStatsCard 
                        icon={<HelpCircle className="text-slate-400" />}
                        label="لم يحل"
                        value={unansweredCount}
                        color="bg-white/5 border-white/5"
                    />
                </div>

                {/* 4. QUESTIONS REVIEW (Failed/Skipped Only) */}
                <div className="mt-20">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2">مراجعة الأخطاء</h2>
                            <p className="text-slate-400 font-medium">عرض الأسئلة التي تعثرت بها لفهم الإجابة الصحيحة ({reviewQuestions.length} سؤال)</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-blue-300 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 text-sm font-black">
                            تحليل الخبراء <Sparkles size={16} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {reviewQuestions.map((q, idx) => {
                            const isExpanded = expandedQuestion === q.id;
                            const isUnanswered = !q.selectedOptionId;

                            return (
                                <div 
                                    key={q.id}
                                    className={`bg-white/5 rounded-[2.5rem] border transition-all duration-300 ${isExpanded ? 'border-white/20 bg-white/10 ring-4 ring-white/5' : 'border-white/5 hover:border-white/10'}`}
                                >
                                    <div 
                                        className="p-8 cursor-pointer flex items-start gap-8"
                                        onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                    >
                                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black ${isUnanswered ? 'bg-white/5 text-slate-500' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {isUnanswered ? <Clock size={24} /> : <XCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-100 text-xl font-bold leading-relaxed mb-4">{q.text}</p>
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${isUnanswered ? 'bg-white/5 text-slate-500' : 'bg-red-500/10 text-red-400'}`}>
                                                {isUnanswered ? "تم تجاوز السؤال" : "إجابة خاطئة"}
                                            </span>
                                        </div>
                                        <div className={`mt-2 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`}>
                                            <ChevronDown size={32} />
                                        </div>
                                    </div>

                                    {/* Simple Toggle Content (No Animation as requested) */}
                                    {isExpanded && (
                                        <div className="px-8 pb-10 pt-2 border-t border-white/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                {q.options.map(opt => {
                                                    const isSelected = opt.id === q.selectedOptionId;
                                                    const isCorrect = opt.isCorrect;
                                                    
                                                    let style = "border-white/5 bg-white/5 text-slate-400 opacity-60";
                                                    if (isCorrect) {
                                                        style = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 opacity-100 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-900/10";
                                                    } else if (isSelected) {
                                                        style = "border-red-500/40 bg-red-500/5 text-red-300 opacity-100";
                                                    }

                                                    return (
                                                        <div key={opt.id} className={`p-6 rounded-2xl border-2 flex items-center justify-between ${style}`}>
                                                            <span className="text-lg font-bold">{opt.text}</span>
                                                            {isCorrect ? <CheckCircle2 size={24} className="text-emerald-400" /> : isSelected ? <XCircle size={24} className="text-red-400" /> : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="mt-8 bg-blue-500/5 rounded-3xl p-8 border border-blue-500/10 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-blue-400 group-hover:scale-110 transition-transform">
                                                        <BookOpen size={80} />
                                                    </div>
                                                    <h4 className="text-blue-300 font-black flex items-center gap-3 mb-4 text-lg">
                                                        <BarChart3 size={24} /> شرح الإجابة الصحيحة:
                                                    </h4>
                                                    <p className="text-slate-300 leading-relaxed font-bold text-lg max-w-4xl">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {reviewQuestions.length === 0 && (
                            <div className="bg-white/5 rounded-[3.5rem] p-24 text-center border-2 border-dashed border-white/5">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4 italic italic">أداء أسطوري! لا توجد أخطاء</h3>
                                <p className="text-slate-400 font-bold text-lg">لقد أجبت على جميع الأسئلة ببراعة. أنت مستعد تماماً لاجتياز اختبار الهيئة.</p>
                            </div>
                        )}
                    </div>

                    {/* Final Actions */}
                    <div className="mt-24 flex flex-col items-center gap-10">
                        <Button 
                            onClick={() => router.push("/")}
                            className="h-20 px-16 bg-white text-[#0a0f1c] hover:bg-slate-100 rounded-[2.5rem] transition-all shadow-2xl hover:-translate-y-2 font-black text-xl gap-4"
                        >
                            العودة للرئيسية <ArrowRight size={24} />
                        </Button>
                        
                        <div className="text-center space-y-4">
                            <p className="text-slate-500 text-sm font-black leading-relaxed">
                                تم توليد هذا التقرير تلقائياً بواسطة نظام بوابة الاعتماد المهني.<br />
                                جميع الحقوق محفوظة © 2026
                            </p>
                            <div className="flex items-center justify-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
                                <div className="w-8 h-[1px] bg-slate-500"></div>
                                <Star size={12} className="text-slate-500" />
                                <div className="w-8 h-[1px] bg-slate-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DarkStatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div className={`p-8 rounded-[2rem] border ${color} flex items-center gap-6 transition-all hover:scale-[1.03] group`}>
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <div>
                <div className="text-3xl font-black text-white mb-1 tracking-tight">{value}</div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
}
