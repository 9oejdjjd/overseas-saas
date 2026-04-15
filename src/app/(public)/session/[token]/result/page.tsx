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
    ArrowRight, 
    LayoutGrid, 
    BookOpen, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    Star,
    Award,
    Target,
    BarChart3,
    ArrowLeft,
    Sparkles
} from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";

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
    const [filter, setFilter] = useState<"ALL" | "INCORRECT" | "UNANSWERED">("ALL");
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <MockExamNavbar title="نتائج الاختبار" />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-red-100">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-4">خطأ في عرض النتيجة</h2>
                        <p className="text-slate-500 mb-8">{error || "الجلسة غير موجودة أو لم تنتهِ بعد."}</p>
                        <Button onClick={() => router.push("/")} className="w-full bg-[#16539a] h-14 text-lg font-bold rounded-2xl">
                            العودة للرئيسية
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const correctCount = result.questions.filter(q => q.isCorrect).length;
    const incorrectCount = result.questions.filter(q => q.selectedOptionId && !q.isCorrect).length;
    const unansweredCount = result.questions.filter(q => !q.selectedOptionId).length;
    const totalQuestions = result.questions.length;

    // Feedback message logic
    const getFeedback = () => {
        if (!result.isPassed) {
            return {
                title: "محاولة شجاعة.. لا تستسلم!",
                message: "الاختبار الحقيقي يتطلب دقة عالية. هذه الدرجة تعني أنك بحاجة لمراجعة الأساسيات بشكل أعمق. اطلع على شروحات الأسئلة بالأسفل لتقوية نقاط الضعف لديك.",
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-200",
                icon: <Target className="w-8 h-8 text-red-500" />
            };
        }
        if (result.score < 70) {
            return {
                title: "أحسنت النجاح.. ولكن!",
                message: "لقد تجاوزت الحد الأدنى، وهذا رائع! ولكن لضمان النجاح في الاختبار الفعلي للهيئة، ننصحك بالتدرب أكثر حتى تصل لنسبة 70% وما فوق. ركز على الأسئلة التي تعثرت بها بالأسفل.",
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-200",
                icon: <Award className="w-8 h-8 text-amber-500" />
            };
        }
        return {
            title: "كفؤ! أنت مستعد تماماً",
            message: "ما شاء الله! هذا المستوى يؤهلك وبثقة لاجتياز اختبار الاعتماد المهني السعودي. استمر بهذا التركيز وحافظ على هدوئك يوم الاختبار. أنت فخر لنا!",
            color: "text-[#5c9e45]",
            bg: "bg-green-50",
            border: "border-green-200",
            icon: <Trophy className="w-8 h-8 text-[#5c9e45]" />
        };
    };

    const feedback = getFeedback();

    const filteredQuestions = result.questions.filter(q => {
        if (filter === "INCORRECT") return q.selectedOptionId && !q.isCorrect;
        if (filter === "UNANSWERED") return !q.selectedOptionId;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans pb-20 overflow-x-hidden" dir="rtl">
            <MockExamNavbar title={`تقرير النتيجة: ${result.professionName}`} />
            
            <main className="max-w-5xl mx-auto w-full px-4 pt-8">
                
                {/* 1. TOP HERO SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Score Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-1 bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#16539a]/5 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <h3 className="text-slate-500 font-bold mb-2">نسبة الإنجاز</h3>
                            <div className="relative w-40 h-40 flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                    <circle 
                                        cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * result.score) / 100}
                                        className={`${result.isPassed ? 'text-[#5c9e45]' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-800">{Math.round(result.score)}%</span>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${result.isPassed ? 'text-[#5c9e45]' : 'text-red-500'}`}>
                                        {result.isPassed ? 'ناجح' : 'راسب'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 justify-center text-sm text-slate-400 font-medium">
                                <CheckCircle2 size={16} className="text-[#5c9e45]" />
                                درجة النجاح المطلوبة: {result.passingScore}%
                            </div>
                        </div>
                    </motion.div>

                    {/* Feedback Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={`lg:col-span-2 ${feedback.bg} ${feedback.border} border-2 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-center`}
                    >
                        <div className="absolute top-4 left-4 opacity-10">
                            {feedback.icon}
                        </div>
                        <h2 className={`text-2xl md:text-3xl font-black ${feedback.color} mb-4 flex items-center gap-3`}>
                            {feedback.icon}
                            {feedback.title}
                        </h2>
                        <p className="text-slate-700 text-lg leading-relaxed mb-6 font-medium">
                            {feedback.message}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-auto">
                            <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/80">
                                <span className="w-10 h-10 rounded-xl bg-green-100 text-[#5c9e45] flex items-center justify-center font-bold">{correctCount}</span>
                                <span className="text-sm font-bold text-slate-600">إجابة صحيحة</span>
                            </div>
                            <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/80">
                                <span className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center font-bold">{incorrectCount}</span>
                                <span className="text-sm font-bold text-slate-600">إجابة خاطئة</span>
                            </div>
                            <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/80">
                                <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold">{unansweredCount}</span>
                                <span className="text-sm font-bold text-slate-600">لم تُحل</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 2. FILTER TABS */}
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-[#16539a]" /> تقرير الأسئلة
                    </h3>
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                        <button 
                            onClick={() => setFilter("ALL")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "ALL" ? 'bg-white text-[#16539a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >الكل</button>
                        <button 
                            onClick={() => setFilter("INCORRECT")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "INCORRECT" ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >الأخطاء ({incorrectCount})</button>
                        <button 
                            onClick={() => setFilter("UNANSWERED")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "UNANSWERED" ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >الفارغة ({unansweredCount})</button>
                    </div>
                </div>

                {/* 3. QUESTIONS LIST */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((q, idx) => {
                            const isExpanded = expandedQuestion === q.id;
                            const isUnanswered = !q.selectedOptionId;
                            
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={q.id}
                                    className={`bg-white rounded-[1.5rem] border transition-all duration-300 ${isExpanded ? 'border-[#16539a] shadow-xl shadow-[#16539a]/5' : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}
                                >
                                    <div 
                                        className="p-6 cursor-pointer flex items-start gap-4"
                                        onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                    >
                                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${q.isCorrect ? 'bg-green-50 text-[#5c9e45]' : isUnanswered ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-800 font-bold mb-1 leading-relaxed">{q.text}</p>
                                            <div className="flex gap-4">
                                                {q.isCorrect && (
                                                    <span className="text-[#5c9e45] text-xs font-black flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 size={14} /> إجابة صحيحة
                                                    </span>
                                                )}
                                                {q.selectedOptionId && !q.isCorrect && (
                                                    <span className="text-red-500 text-xs font-black flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                                                        <XCircle size={14} /> إجابة خاطئة
                                                    </span>
                                                )}
                                                {isUnanswered && (
                                                    <span className="text-slate-400 text-xs font-black flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                                                        <Clock size={14} /> لم يتم الحل
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-slate-300">
                                            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="px-6 pb-6 pt-2 border-t border-slate-50"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                                                {q.options.map(opt => {
                                                    const isSelected = opt.id === q.selectedOptionId;
                                                    const isCorrect = opt.isCorrect;
                                                    
                                                    let borderClass = "border-slate-100";
                                                    let bgClass = "bg-slate-50";
                                                    let icon = null;

                                                    if (isCorrect) {
                                                        borderClass = "border-[#5c9e45] ring-1 ring-[#5c9e45]/20";
                                                        bgClass = "bg-green-50/50";
                                                        icon = <CheckCircle2 className="text-[#5c9e45]" size={18} />;
                                                    } else if (isSelected && !isCorrect) {
                                                        borderClass = "border-red-400 ring-1 ring-red-100";
                                                        bgClass = "bg-red-50/50";
                                                        icon = <XCircle className="text-red-400" size={18} />;
                                                    }

                                                    return (
                                                        <div key={opt.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between ${borderClass} ${bgClass}`}>
                                                            <span className={`text-sm font-bold ${isCorrect ? 'text-slate-800' : 'text-slate-500'}`}>{opt.text}</span>
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation Box */}
                                            {q.explanation && (
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-[1.5rem] p-5">
                                                    <h4 className="text-sm font-black text-[#16539a] mb-2 flex items-center gap-2">
                                                        <BookOpen size={18} /> شرح الإجابة الصحيحة:
                                                    </h4>
                                                    <p className="text-slate-600 text-sm leading-relaxed">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    {filteredQuestions.length === 0 && (
                        <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
                            <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">لا توجد أسئلة تطابق الفلتر المختار.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-center">
                    <Button 
                        onClick={() => router.push("/")}
                        className="h-16 px-10 rounded-2xl bg-[#16539a] hover:bg-[#1e66b8] text-white font-black text-lg gap-3 shadow-xl shadow-blue-900/20"
                    >
                        العودة للرئيسية <ArrowLeft size={20} />
                    </Button>
                    <div className="text-slate-400 text-xs font-medium text-center md:text-right">
                        تذكر أن هذا الاختبار تجريبي لمساعدتك على التحضير.<br />
                        جميع الحقوق محفوظة لمنصة الاعتماد المهني السعودي © ٢٠٢٤
                    </div>
                </div>

            </main>
        </div>
    );
}
