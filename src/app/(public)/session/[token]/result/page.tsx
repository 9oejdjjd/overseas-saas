"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
    Trophy, XCircle, CheckCircle2, AlertCircle, ArrowLeft, BookOpen, Clock, ChevronDown, 
    Award, Target, BarChart3, Briefcase, ShieldCheck, HelpCircle, ArrowRight, Star, Sparkles, Filter
} from "lucide-react";

// Axis mapping
const AXIS_NAMES: Record<string, string> = {
    HEALTH_SAFETY: "الصحة والسلامة",
    PROFESSION_KNOWLEDGE: "المعرفة المهنية",
    GENERAL_SKILLS: "المهارات العامة",
    OCCUPATIONAL_SAFETY: "السلامة المهنية",
    CORRECT_METHODS: "الطرق الصحيحة",
    PROFESSIONAL_BEHAVIOR: "السلوك المهني",
    TOOLS_AND_EQUIPMENT: "الأدوات والمعدات",
    EMERGENCIES_FIRST_AID: "الطوارئ والإسعافات"
};

interface QuestionResult {
    id: string;
    questionId: string;
    axis: string;
    text: string;
    explanation: string;
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    options: { id: string; text: string; isCorrect: boolean; }[];
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
    const [activeTab, setActiveTab] = useState<"ALL" | "CORRECT" | "WRONG" | "SKIPPED">("ALL");
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
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
        fetchResult();
    }, [token]);

    useEffect(() => {
        if (result && !loading) {
            // Animate score from 0 to actual score over 2.5 seconds
            let start = 0;
            const end = Math.round(result.score);
            if (start === end) {
                setAnimatedScore(end);
                return;
            }
            const duration = 2500;
            const incrementTime = Math.max(16, Math.floor(duration / end)); // at least 16ms per frame
            const timer = setInterval(() => {
                start += 1;
                setAnimatedScore(start);
                if (start >= end) clearInterval(timer);
            }, incrementTime);
            return () => clearInterval(timer);
        }
    }, [result, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-200/60 font-bold animate-pulse tracking-widest text-sm uppercase">جاري تحليل الأداء وإعداد التقرير الذكي...</p>
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
                    <p className="text-slate-400 mb-8 leading-relaxed font-medium">{error || "تأكد من إكمال الاختبار أولاً للحصول على تقريرك."}</p>
                    <Button onClick={() => router.push("/")} className="w-full bg-white text-[#0a0f1c] h-14 text-lg font-bold rounded-2xl hover:bg-white/90 transition-all">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    // 1. Calculate Axis Stats
    const axisStats: Record<string, { total: number, correct: number, score: number }> = {};
    result.questions.forEach(q => {
        const ax = q.axis || "GENERAL_SKILLS";
        if (!axisStats[ax]) axisStats[ax] = { total: 0, correct: 0, score: 0 };
        axisStats[ax].total += 1;
        if (q.isCorrect) axisStats[ax].correct += 1;
    });
    const axesArray = Object.keys(axisStats).map(key => {
        const stats = axisStats[key];
        stats.score = Math.round((stats.correct / stats.total) * 100);
        return { key, name: AXIS_NAMES[key] || "دليل مهني عام", ...stats };
    });
    // Sort axes by score ascending to easily pick the weakest
    axesArray.sort((a, b) => a.score - b.score);
    const weakestAxes = axesArray.slice(0, 2).filter(ax => ax.score < 100).map(ax => ax.name);

    // 2. Dynamic Advice Engine
    const getSmartFeedback = () => {
        const score = result.score;
        const axisTipText = weakestAxes.length > 0 ? ` ننصحك بشدة بمراجعة وتقوية مهاراتك في مسار (${weakestAxes.join(" و ")}).` : "";

        if (score < 60) {
            return {
                title: "محاولة شجاعة.. لا تستسلم!",
                message: "لكي تجتاز الاختبار الحقيقي، ستحتاج لمزيد من الدقة." + axisTipText + " حاول دوماً قراءة السؤال لنهايته ثم قراءة الخيارات كاملة مرتين على الأقل قبل الاختيار لتنجنب الاستعجال والتسرع وفهم المغزى الحقيقي للسيناريو المطروح.",
                color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-red-500/20",
                icon: <Target className="w-8 h-8 text-red-400" strokeWidth={2.5} />
            };
        } else if (score >= 60 && score < 70) {
            return {
                title: "مستوى حرج.. تجاوزت 60% ولكن احذر!",
                message: "مستواك الحالي دقيق ومقارب جداً، لكنه في الاختبار الفعلي للهيئة قد يُعرضك للرسوب المفاجئ ولا يكفي لضمان التجاوز بكل أريحية." + axisTipText + " أعطِ الأسئلة حقها في القراءة المتأنية.",
                color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/20",
                icon: <AlertCircle className="w-8 h-8 text-amber-400" strokeWidth={2.5} />
            };
        } else if (score >= 70 && score < 80) {
            return {
                title: "أداء متميز وجيد جداً! أنت مؤهل بثقة",
                message: "لقد تجاوزت الحد الأدنى بمستوى ممتاز. يعكس هذا الأداء أنك مؤهل تماماً وبكل كفاءة لاجتياز الفحص المهني الفعلي." + (weakestAxes.length > 0 ? ` لضمان نيل العلامة الكاملة والحفاظ على مستواك، راجع النقاط المفقودة في ${weakestAxes[0]}.` : " استمر بهذا الأداء القوي!"),
                color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-blue-500/20",
                icon: <Trophy className="w-8 h-8 text-blue-400" strokeWidth={2.5} />
            };
        } else {
            return {
                title: "أداء استثنائي بامتياز! 🌟",
                message: "مستوى فائق وإجابات دقيقة! معرفتك المهنية متعمقة ومستواك يؤهلك لاجتياز الفحص المهني بأعلى المراتب. أنت فخر لنا ومستعد تماماً لتمثيل مهنتك في سوق العمل بأفضل صورة ممكنة.",
                color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-emerald-500/20",
                icon: <Award className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
            };
        }
    };

    const feedback = getSmartFeedback();

    // 3. Question Arrays
    const correctQuestions = result.questions.filter(q => q.isCorrect);
    const incorrectQuestions = result.questions.filter(q => q.selectedOptionId && !q.isCorrect);
    const unansweredQuestions = result.questions.filter(q => !q.selectedOptionId);
    
    let filteredQuestions = result.questions;
    if (activeTab === "CORRECT") filteredQuestions = correctQuestions;
    if (activeTab === "WRONG") filteredQuestions = incorrectQuestions;
    if (activeTab === "SKIPPED") filteredQuestions = unansweredQuestions;

    // Circumference logic for SVG circle (radius 120 -> 2 * PI * 120 = ~754)
    const strokeDasharray = 754;
    const strokeDashoffset = strokeDasharray - (strokeDasharray * animatedScore) / 100;

    return (
        <div className="min-h-screen bg-[#0a0f1c] font-sans pb-32 text-white overflow-x-hidden relative" dir="rtl">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none z-0"></div>
            <div className={`fixed top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none z-0 transition-colors duration-1000 ${result.score >= 70 ? (result.score >= 80 ? 'bg-[#5c9e45]/10' : 'bg-blue-500/10') : 'bg-red-500/10'}`} />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#16539a]/10 rounded-full blur-[140px] pointer-events-none z-0" />
            
            <main className="max-w-6xl mx-auto px-6 pt-32 relative z-10">
                {/* 1. HERO HEADER SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none hidden md:block">
                        <ShieldCheck size={200} />
                    </div>

                    <div className="flex-1 text-center md:text-right space-y-4 md:space-y-6 w-full">
                        <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 border border-white/10 rounded-full text-[10px] md:text-xs font-black tracking-widest text-blue-300 uppercase">
                            <Sparkles size={14} className="text-amber-400" /> تقرير التقييم المهني الذكي
                        </div>
                        
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight break-words">
                            {result.visitorName}
                        </h1>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 md:gap-4 w-full">
                            <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3 bg-white/5 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl border border-white/5 text-slate-300 font-bold w-full sm:w-auto text-sm md:text-base">
                                <Briefcase size={20} className={result.score >= 80 ? "text-emerald-400" : "text-blue-400"} strokeWidth={2.5} />
                                <span className="truncate max-w-[200px] sm:max-w-none">{result.professionName}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3 bg-white/5 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl border border-white/5 text-slate-300 font-bold w-full sm:w-auto text-sm md:text-base">
                                <Clock size={20} className="text-blue-400" strokeWidth={2.5} />
                                <span>{new Date(result.completedAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 relative group mt-4 md:mt-0">
                        <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center shadow-inner relative transition-colors duration-1000 ${result.score >= 80 ? 'bg-emerald-500/5' : result.score >= 70 ? 'bg-blue-500/5' : result.score >= 60 ? 'bg-amber-500/5' : 'bg-red-500/5'}`}>
                            
                            <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
                                <circle cx="50%" cy="50%" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                                <motion.circle 
                                    cx="50%" cy="50%" r="120" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className={`${result.score >= 80 ? 'text-emerald-500' : result.score >= 70 ? 'text-blue-500' : result.score >= 60 ? 'text-amber-500' : 'text-red-500'} opacity-90 drop-shadow-[0_0_10px_currentColor] transition-all duration-100`}
                                    strokeLinecap="round"
                                />
                            </svg>

                            <div className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-1 relative z-10 transition-all duration-75">
                                {animatedScore}<span className="text-2xl md:text-3xl opacity-50">%</span>
                            </div>
                            <div className={`text-xs md:text-sm font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full border relative z-10 ${result.score >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20' : result.score >= 70 ? 'text-blue-400 border-blue-500/30 bg-blue-500/20' : result.score >= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-500/20' : 'text-red-400 border-red-500/30 bg-red-500/20'}`}>
                                {result.score >= 60 ? 'اجتياز ✓' : 'لم يجتز ✕'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. SMART FEEDBACK SECTION */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`mt-6 md:mt-10 p-6 md:p-8 rounded-[2rem] border ${feedback.bg} ${feedback.border} shadow-2xl ${feedback.glow} flex flex-col md:flex-row items-center gap-6 relative overflow-hidden text-center md:text-right`}
                >
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none scale-150 hidden md:block">
                        {feedback.icon}
                    </div>
                    <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 shadow-inner">
                        {feedback.icon}
                    </div>
                    <div>
                        <h3 className={`text-xl md:text-3xl font-black ${feedback.color} mb-2 md:mb-3`}>{feedback.title}</h3>
                        <p className="text-slate-200 text-sm md:text-lg font-medium leading-relaxed max-w-4xl">{feedback.message}</p>
                    </div>
                </motion.div>

                {/* 3. NEW AXIS RADAR / PROGRESS BARS */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 md:mt-10 bg-white/5 rounded-[2rem] p-6 md:p-8 border border-white/5"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mb-6 md:mb-8 text-center sm:text-right">
                        <BarChart3 className="text-blue-400" size={28} />
                        <h2 className="text-xl md:text-2xl font-black text-white">تحليل أداء المحاور المهنية</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {axesArray.map(ax => (
                            <div key={ax.key} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-end mb-2 md:mb-3">
                                    <span className="font-bold text-slate-200 text-base md:text-lg">{ax.name}</span>
                                    <span className={`font-black text-xs md:text-sm px-2 py-1 rounded-md ${ax.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : ax.score >= 60 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {ax.score}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${ax.score}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${ax.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : ax.score >= 60 ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}
                                    />
                                </div>
                                <div className="mt-2 text-xs text-slate-500 font-bold flex justify-between">
                                    <span>{ax.total} أسئلة مقيّمة</span>
                                    <span>{ax.correct} إجابات صحيحة</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 4. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-10">
                    <DarkStatsCard icon={<CheckCircle2 className="text-emerald-400 w-8 h-8" />} label="إجابات صحيحة" value={correctQuestions.length} color="bg-emerald-500/5 border-emerald-500/10" />
                    <DarkStatsCard icon={<XCircle className="text-red-400 w-8 h-8" />} label="إجابات خاطئة" value={incorrectQuestions.length} color="bg-red-500/5 border-red-500/10" />
                    <DarkStatsCard icon={<HelpCircle className="text-slate-400 w-8 h-8" />} label="لم يتم حلها" value={unansweredQuestions.length} color="bg-white/5 border-white/5" />
                </div>

                {/* 5. ENHANCED QUESTIONS FILTER & REVIEW */}
                <div className="mt-16 md:mt-20">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 md:mb-8 gap-6">
                        <div className="text-center md:text-right">
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">سجل المراجعة والأسئلة</h2>
                            <p className="text-sm md:text-base text-slate-400 font-medium">استعرض إجاباتك بالتفصيل واستفد من الشروحات لكل سؤال للتحضير السليم</p>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto w-full lg:w-auto scrollbar-hide snap-x">
                            <FilterTab label="الكل" active={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
                            <FilterTab label="صحيحة" active={activeTab === "CORRECT"} onClick={() => setActiveTab("CORRECT")} color="text-emerald-400" />
                            <FilterTab label="خاطئة" active={activeTab === "WRONG"} onClick={() => setActiveTab("WRONG")} color="text-red-400" />
                            <FilterTab label="متروكة" active={activeTab === "SKIPPED"} onClick={() => setActiveTab("SKIPPED")} color="text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredQuestions.map((q, idx) => {
                                const isExpanded = expandedQuestion === q.id;
                                const isUnanswered = !q.selectedOptionId;
                                const isCorrectAnswer = q.isCorrect;

                                let statusBg = "bg-white/5 text-slate-500 border-white/10";
                                let statusIcon = <Clock size={24} />;
                                let statusTxt = "تم تجاوز السؤال";

                                if (!isUnanswered) {
                                    if (isCorrectAnswer) {
                                        statusBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5";
                                        statusIcon = <CheckCircle2 size={24} />;
                                        statusTxt = "إجابة صحيحة";
                                    } else {
                                        statusBg = "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5";
                                        statusIcon = <XCircle size={24} />;
                                        statusTxt = "إجابة خاطئة";
                                    }
                                }

                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={q.id}
                                        className={`bg-white/5 rounded-[2.5rem] border transition-all duration-300 ${isExpanded ? 'border-white/20 bg-white/10 ring-4 ring-white/5' : 'border-white/5 hover:border-white/10'}`}
                                    >
                                        <div 
                                            className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-start gap-6 md:gap-8"
                                            onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                        >
                                            <div className="flex gap-4 items-center md:items-start">
                                                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black border shadow-sm ${statusBg}`}>
                                                    {statusIcon}
                                                </div>
                                                <div className="md:hidden">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${statusBg}`}>
                                                        {statusTxt}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4 flex-wrap">
                                                    <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5">
                                                        <BookOpen size={14} className="text-blue-400" />
                                                        {AXIS_NAMES[q.axis || "GENERAL_SKILLS"]}
                                                    </div>
                                                    <span className={`hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${statusBg}`}>
                                                        {statusTxt}
                                                    </span>
                                                    <div className="md:hidden inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-white/5 bg-white/5">
                                                        {AXIS_NAMES[q.axis || "GENERAL_SKILLS"]}
                                                    </div>
                                                </div>
                                                <p className="text-slate-100 text-lg md:text-xl font-bold leading-relaxed">{q.text}</p>
                                            </div>
                                            <div className={`mt-2 transition-transform duration-300 self-center md:self-start hidden md:block ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`}>
                                                <ChevronDown size={32} />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 md:px-8 pb-10 pt-2 border-t border-white/5">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                                                                    <div key={opt.id} className={`p-5 md:p-6 rounded-2xl border-2 flex items-center justify-between ${style}`}>
                                                                        <span className="text-base md:text-lg font-bold leading-snug ml-4">{opt.text}</span>
                                                                        {isCorrect ? <CheckCircle2 size={24} className="text-emerald-400 shrink-0" /> : isSelected ? <XCircle size={24} className="text-red-400 shrink-0" /> : null}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {q.explanation && (
                                                            <div className="mt-8 bg-blue-500/5 rounded-3xl p-6 md:p-8 border border-blue-500/10 relative overflow-hidden group">
                                                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-blue-400 group-hover:scale-110 transition-transform">
                                                                    <BookOpen size={80} />
                                                                </div>
                                                                <h4 className="text-blue-300 font-black flex items-center gap-3 mb-4 text-base md:text-lg">
                                                                    <BarChart3 size={24} /> التوجيه المعرفي للسؤال:
                                                                </h4>
                                                                <p className="text-slate-300 leading-relaxed font-bold text-base md:text-lg max-w-4xl">
                                                                    {q.explanation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {filteredQuestions.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-white/5 rounded-[3.5rem] p-16 md:p-24 text-center border-2 border-dashed border-white/5"
                            >
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-700">
                                    <Filter className="w-10 h-10 text-slate-500" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-300 mb-4 italic">لا توجد سجلات مطابقة</h3>
                                <p className="text-slate-500 font-bold text-lg md:text-xl">لم نجد أسئلة تطابق فلتر البحث الذي اخترته.</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Final Actions */}
                    <div className="mt-16 md:mt-24 flex flex-col items-center gap-8 md:gap-10">
                        <Button 
                            onClick={() => router.push("/")}
                            className="h-16 md:h-20 w-full sm:w-auto px-10 md:px-16 bg-white text-[#0a0f1c] hover:bg-slate-100 rounded-[2rem] transition-all shadow-2xl hover:-translate-y-1 font-black text-lg md:text-xl gap-3 flex flex-wrap"
                        >
                            العودة للرئيسية <ArrowRight size={24} className="hidden sm:block" />
                        </Button>
                        
                        <div className="text-center space-y-4 max-w-lg px-4">
                            <p className="text-slate-500 text-xs md:text-sm font-black leading-relaxed">
                                منصة بوابة الاعتماد المهني للاختبارات المهنية © 2026<br />
                                تم تصميم وتحليل هذا التقرير بدقة واحترافية عالية لتمكين العمالة اليمنية وتعليمهم تجاوز الفحص المهني السعودي.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DarkStatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border ${color} flex items-center justify-between sm:justify-start gap-4 sm:gap-6 transition-all hover:scale-[1.03] group shadow-lg`}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-black text-white mb-0 sm:mb-1 tracking-tight">{value}</div>
                <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
}

function FilterTab({ label, active, onClick, color = "text-white" }: { label: string, active: boolean, onClick: () => void, color?: string }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all snap-center whitespace-nowrap min-w-16 md:min-w-0 flex-1 md:flex-auto ${active ? 'bg-white/10 shadow-sm border border-white/10 text-white' : `hover:bg-white/5 text-slate-400 hover:${color}`}`}
        >
            {label}
        </button>
    );
}

