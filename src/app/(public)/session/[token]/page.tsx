"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, ArrowLeft, ArrowRight, Trophy, XCircle, FileText, Check, LayoutGrid, AlertTriangle, ShieldCheck, BookOpen, Sparkles, MessageCircle, User, Phone, Search, ChevronDown } from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const countries = [
    { code: "+966", flag: "🇸🇦", name: "السعودية" },
    { code: "+971", flag: "🇦🇪", name: "الإمارات" },
    { code: "+965", flag: "🇰🇼", name: "الكويت" },
    { code: "+974", flag: "🇶🇦", name: "قطر" },
    { code: "+973", flag: "🇧🇭", name: "البحرين" },
    { code: "+968", flag: "🇴🇲", name: "عُمان" },
    { code: "+20",  flag: "🇪🇬", name: "مصر" },
    { code: "+962", flag: "🇯🇴", name: "الأردن" },
    { code: "+963", flag: "🇸🇾", name: "سوريا" },
    { code: "+964", flag: "🇮🇶", name: "العراق" },
    { code: "+961", flag: "🇱🇧", name: "لبنان" },
    { code: "+970", flag: "🇵🇸", name: "فلسطين" },
    { code: "+967", flag: "🇾🇪", name: "اليمن" },
    { code: "+249", flag: "🇸🇩", name: "السودان" },
    { code: "+218", flag: "🇱🇾", name: "ليبيا" },
    { code: "+216", flag: "🇹🇳", name: "تونس" },
    { code: "+213", flag: "🇩🇿", name: "الجزائر" },
    { code: "+212", flag: "🇲🇦", name: "المغرب" },
    { code: "+222", flag: "🇲🇷", name: "موريتانيا" },
    { code: "+252", flag: "🇸🇴", name: "الصومال" },
    { code: "+253", flag: "🇩🇯", name: "جيبوتي" },
    { code: "+269", flag: "🇰🇲", name: "جزر القمر" },
];

export default function ExamSessionPage() {
    const { token } = useParams();
    const router = useRouter();

    const [status, setStatus] = useState<"LOADING" | "WELCOME" | "TERMS" | "STARTED" | "RESULT" | "ERROR">("LOADING");
    const [info, setInfo] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
    
    const [editablePhone, setEditablePhone] = useState("");
    const [countryCode, setCountryCode] = useState("+967");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCountries = countries.filter(c => 
        c.name.includes(searchQuery) || c.code.includes(searchQuery)
    );

    useEffect(() => {
        fetchInfo();
    }, [token]);

    const fetchInfo = async () => {
        try {
            const res = await fetch(`/api/mock/session/${token}/info`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInfo(data);
            
            // Initialize phone number
            const rawPhone = data.visitorPhone || data.applicant?.whatsappNumber || data.applicant?.phoneNumber || "";
            // simple matching to split code and number
            const matchingCountry = countries.find(c => rawPhone.startsWith(c.code));
            if (matchingCountry) {
                setCountryCode(matchingCountry.code);
                setEditablePhone(rawPhone.slice(matchingCountry.code.length));
            } else {
                setEditablePhone(rawPhone.replace(/^\+?\d{1,3}/, '')); // Just a rough fallback
            }

            if (data.status === "STARTED") {
                startExam(false); // Resume
            } else if (data.status === "SUBMITTED") {
                setStatus("ERROR");
                setErrorMsg("لقد قمت بتسليم هذا الاختبار مسبقاً.");
            } else {
                setStatus("WELCOME");
            }
        } catch (err: any) {
            setErrorMsg(err.message || "فشل تحميل البيانات");
            setStatus("ERROR");
        }
    };

    const startExam = async (isNew = true) => {
        if (!editablePhone) {
            setErrorMsg("رقم الواتساب مطلوب");
            setStatus("ERROR");
            return;
        }
        
        try {
            setStatus("LOADING");
            const res = await fetch(`/api/mock/session/${token}/start`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: `${countryCode}${editablePhone}` })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setQuestions(data.questions);
            
            // Calculate remaining time
            const durationMs = (data.session.duration || 60) * 60 * 1000;
            const startedAt = new Date(data.session.startedAt).getTime();
            const now = new Date().getTime();
            const remaining = Math.max(0, durationMs - (now - startedAt));
            setTimeLeft(Math.floor(remaining / 1000));
            
            setStatus("STARTED");
        } catch (err: any) {
            setErrorMsg(err.message || "فشل بدء الاختبار");
            setStatus("ERROR");
        }
    };

    useEffect(() => {
        if (status === "STARTED" && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status, timeLeft]);

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers(prev => {
            const exist = prev.find(a => a.questionId === questionId);
            if (exist) {
                return prev.map(a => a.questionId === questionId ? { ...a, selectedOptionId: optionId } : a);
            }
            return [...prev, { questionId, selectedOptionId: optionId }];
        });
    };

    const submitExam = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/mock/session/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data.result);
            setStatus("RESULT");
        } catch (err: any) {
            setErrorMsg(err.message || "فشل تسليم الاختبار");
            setStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (status === "LOADING") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="w-16 h-16 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (status === "ERROR") {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <MockExamNavbar title="الاعتماد المهني" />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-red-100 text-center max-w-md w-full">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-4">تعذر المتابعة</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">{errorMsg}</p>
                        <Button onClick={() => router.push("/")} className="w-full bg-[#16539a] hover:bg-[#1e66b8] h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-900/20">
                            العودة للرئيسية
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "WELCOME") {
        const displayName = info?.visitorName || info?.applicant?.fullName || "";
        const professionName = info?.profession?.name || "التخصص";
        const isRegistered = !!info?.applicant;
        
        return (
            <div className="min-h-[100dvh] bg-[#0a0f1c] flex flex-col font-sans">
                <MockExamNavbar title="بوابة الاعتماد المهني" />
                <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/25 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-lg w-full">
                        <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                            <BookOpen size={36} className="text-[#5c9e45]" />
                        </div>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm font-semibold text-blue-200/80 mb-6">
                            <Sparkles className="w-4 h-4 text-[#5c9e45]" />
                            اختبار تجريبي — {professionName}
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                            مرحباً بك <span className="text-[#5c9e45]">{displayName}</span>
                        </h1>
                        <p className="text-slate-300/90 text-base md:text-lg mb-6 max-w-md mx-auto leading-relaxed">
                            {isRegistered 
                                ? "تم إنشاء هذا الاختبار التجريبي خصيصاً لك. هذا الاختبار يحاكي أسلوب اختبار الاعتماد المهني السعودي ويساعدك على معرفة مستواك والتحضير للاختبار الحقيقي."
                                : "هذا اختبار تجريبي يحاكي أسلوب اختبار الاعتماد المهني السعودي ويساعدك على معرفة مستواك."
                            }
                        </p>
                        
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
                            <p className="text-sm text-orange-300/80 font-semibold">⚠️ تنبيه: هذا الاختبار تجريبي تدريبي فقط ولا يمثل الاختبار الرسمي للاعتماد المهني السعودي.</p>
                        </div>
                        
                        <div className="flex gap-4 mb-8">
                            <div className="flex-1 bg-white/[0.08] border border-white/15 p-5 rounded-2xl">
                                <Clock className="w-7 h-7 text-[#5c9e45] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{info?.profession?.examDuration} دقيقة</div>
                                <div className="text-xs text-slate-400">المدة الزمنية</div>
                            </div>
                            <div className="flex-1 bg-white/[0.08] border border-white/15 p-5 rounded-2xl">
                                <Trophy className="w-7 h-7 text-[#5c9e45] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{info?.profession?.passingScore}%</div>
                                <div className="text-xs text-slate-400">النجاح المطلوب</div>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={() => isRegistered ? setStatus("TERMS") : startExam()} 
                            className="w-full h-14 text-lg font-bold bg-gradient-to-l from-[#16539a] to-[#2563eb] hover:from-[#1e66b8] text-white rounded-2xl shadow-xl shadow-blue-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            {isRegistered ? "التالي — الشروط والأحكام" : "بدء الاختبار الآن"}
                            {isRegistered ? <ArrowLeft size={20} /> : <Sparkles size={20} />}
                        </Button>
                    </motion.div>
                </main>
            </div>
        );
    }

    if (status === "TERMS") {
        const displayName = info?.visitorName || info?.applicant?.fullName || "";
        
        return (
            <div className="min-h-[100dvh] bg-white flex flex-col font-sans">
                <MockExamNavbar title="الشروط والأحكام" />
                <main className="flex-1 flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-amber-100">
                                <ShieldCheck size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">الشروط والأحكام</h2>
                            <p className="text-slate-400 text-sm text-center mb-6">يرجى قراءة الشروط التالية بعناية قبل بدء الاختبار</p>
                            
                            {/* Terms List */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar">
                                <ol className="space-y-3 text-sm text-slate-600 leading-relaxed list-decimal list-inside">
                                    <li>بوابة الاعتماد المهني هي منصة <span className="font-bold text-slate-800">تدريبية تأهيلية مستقلة</span>، وليس لها أي علاقة رسمية بهيئة تقويم التعليم والتدريب أو الاعتماد المهني السعودي الرسمي.</li>
                                    <li>الأسئلة المقدمة هي لغرض <span className="font-bold text-slate-800">التدريب والتأهيل فقط</span>، وقد لا تتطابق مع الأسئلة الفعلية في الاختبار الرسمي.</li>
                                    <li>هذا اختبار تجريبي <span className="font-bold text-slate-800">لتحديد المستوى</span> وليس اختباراً رسمياً معتمداً.</li>
                                    <li>نتيجة هذا الاختبار التجريبي <span className="font-bold text-slate-800">لا تمثل ولا تضمن</span> نتيجة الاختبار الفعلي.</li>
                                    <li>سيتم إرسال نتيجة الاختبار على <span className="font-bold text-slate-800">رقم الواتساب المسجل</span>، لذا تأكد من صحته.</li>
                                    <li>يتحمل المستخدم <span className="font-bold text-slate-800">كامل المسؤولية</span> عن صحة البيانات المدخلة.</li>
                                    <li>لا يحق للمستخدم المطالبة بأي تعويض بناءً على نتيجة هذا الاختبار التجريبي.</li>
                                    <li>يحق لإدارة البوابة <span className="font-bold text-slate-800">تعديل أو تحديث</span> محتوى الاختبارات والشروط في أي وقت دون إشعار مسبق.</li>
                                </ol>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <div className="text-sm text-slate-600 space-y-2">
                                    <p>• لا تغلق الصفحة أو تحدثها أثناء الاختبار.</p>
                                    <p>• تأكد من <span className="font-bold">استقرار اتصالك بالإنترنت</span>.</p>
                                    <p>• بمجرد بدء الاختبار سيبدأ العداد التنازلي ولن يتوقف.</p>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div 
                                className="flex items-start gap-3 mb-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer" 
                                onClick={() => setTermsAccepted(!termsAccepted)}
                            >
                                <Checkbox 
                                    checked={termsAccepted}
                                    className="w-5 h-5 rounded-md data-[state=checked]:bg-[#16539a] border-slate-300 border-2 pointer-events-none mt-0.5 shrink-0"
                                />
                                <Label className="text-sm font-bold text-slate-700 pointer-events-none leading-relaxed">
                                    لقد قرأت الشروط والأحكام أعلاه وأوافق عليها بالكامل.
                                </Label>
                            </div>

                            {/* Editable WhatsApp Confirmation */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-[#25D366]" /> تأكيد رقم الواتساب
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-bold text-sm">الاسم</Label>
                                        <div className="relative">
                                            <User className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                                            <Input 
                                                readOnly
                                                className="pl-4 pr-12 h-12 text-base rounded-xl border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed" 
                                                value={displayName}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-bold text-sm">رقم الواتساب (لإرسال النتيجة)</Label>
                                        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-[#16539a] focus-within:ring-2 focus-within:ring-[#16539a]/20 transition-all h-14 w-full group">
                                            {/* Country Code Dropdown */}
                                            <div className="h-full flex items-center relative">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                    className="h-full px-4 flex items-center gap-2 border-l border-slate-200 hover:bg-slate-50 transition-colors rounded-r-xl text-slate-700"
                                                    dir="ltr"
                                                >
                                                    <span className="text-xl leading-none">{countries.find(c => c.code === countryCode)?.flag}</span>
                                                    <span className="font-mono font-bold text-base">{countryCode}</span>
                                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180 text-[#16539a]' : ''}`} />
                                                </button>
                                                
                                                {/* Dropdown Menu */}
                                                <AnimatePresence>
                                                    {showCountryDropdown && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 overflow-hidden z-50 flex flex-col"
                                                        >
                                                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                                                <div className="relative">
                                                                    <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                                                                    <Input 
                                                                        autoFocus
                                                                        placeholder="ابحث بالدولة أو الرمز..."
                                                                        value={searchQuery}
                                                                        onChange={e => setSearchQuery(e.target.value)}
                                                                        className="h-10 pl-3 pr-9 border-slate-200 focus:border-[#16539a] text-sm bg-white rounded-xl shadow-sm"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                                                                {filteredCountries.length > 0 ? filteredCountries.map(c => (
                                                                    <button 
                                                                        key={c.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCountryCode(c.code);
                                                                            setShowCountryDropdown(false);
                                                                            setSearchQuery("");
                                                                        }}
                                                                        className={`w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors mb-1 ${countryCode === c.code ? 'bg-blue-50 text-[#16539a] border border-blue-100' : 'text-slate-700 border border-transparent'}`}
                                                                        dir="ltr"
                                                                    >
                                                                        <span className="text-2xl leading-none">{c.flag}</span>
                                                                        <span className="flex-1 text-right pr-4 font-bold">{c.name}</span>
                                                                        <span className="font-mono font-medium text-slate-500 w-16 text-left">{c.code}</span>
                                                                    </button>
                                                                )) : (
                                                                    <div className="p-6 text-center text-slate-400 font-medium">لم يتم العثور على نتائج</div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Number Input */}
                                            <Input 
                                                className="flex-1 h-full px-4 text-xl border-0 focus:ring-0 bg-transparent font-mono focus-visible:ring-0 focus-visible:ring-offset-0 text-left outline-none placeholder:text-slate-300" 
                                                placeholder="5X XXX XXXX"
                                                dir="ltr"
                                                value={editablePhone}
                                                onChange={e => setEditablePhone(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>

                                    <div 
                                        className="flex items-start gap-3 mt-4 bg-green-50/60 p-3 rounded-lg border border-green-200/60 hover:border-green-300 transition-colors cursor-pointer" 
                                        onClick={() => setWhatsappConfirmed(!whatsappConfirmed)}
                                    >
                                        <Checkbox 
                                            checked={whatsappConfirmed}
                                            className="w-5 h-5 rounded-md data-[state=checked]:bg-[#5c9e45] border-green-300 border-2 pointer-events-none mt-0.5 shrink-0"
                                        />
                                        <Label className="text-sm font-bold text-[#4d853a] pointer-events-none leading-relaxed">
                                            أُقر بأن هذا الرقم صحيح ومفعل عليه واتساب لاستلام النتيجة
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={() => setStatus("WELCOME")} variant="outline" className="w-[30%] h-14 text-base font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                                    رجوع
                                </Button>
                                <Button 
                                    onClick={() => startExam(true)} 
                                    disabled={!termsAccepted || !whatsappConfirmed}
                                    className="w-[70%] h-14 text-base font-bold bg-gradient-to-l from-[#5c9e45] to-green-600 hover:from-[#4d853a] hover:to-[#5c9e45] text-white rounded-2xl shadow-xl shadow-green-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    ابدأ الاختبار الآن
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    if (status === "RESULT") {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex flex-col font-sans">
                <MockExamNavbar title="الاعتماد المهني" />
                <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/25 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />
                    
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 text-center max-w-lg w-full">
                        <div className="w-28 h-28 mx-auto mb-10 rounded-[2rem] bg-[#25D366]/10 border-2 border-[#25D366]/30 flex items-center justify-center shadow-lg shadow-green-500/10">
                            <MessageCircle className="w-14 h-14 text-[#25D366]" />
                        </div>
                        
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                            تم تسليم الاختبار بنجاح <span className="text-[#5c9e45]">✓</span>
                        </h1>
                        
                        <p className="text-slate-300/90 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                            سيتم إرسال نتيجتك إلى رقم الواتساب الخاص بك خلال لحظات.
                        </p>
                        
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
                            <div className="flex items-center justify-center gap-3 text-[#25D366] mb-3">
                                <Phone size={20} />
                                <span className="font-bold text-lg">تابع رسائل الواتساب</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                تأكد من أن رقم الواتساب الذي أدخلته صحيح ومفعّل لاستلام النتيجة. إذا لم تصلك الرسالة خلال دقائق، يرجى التواصل مع الدعم.
                            </p>
                        </div>

                        <Button onClick={() => router.push("/")} className="w-full h-16 text-xl font-bold bg-gradient-to-l from-[#16539a] to-[#2563eb] hover:from-[#1e66b8] text-white rounded-2xl shadow-xl shadow-blue-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-4">
                            العودة للرئيسية <ArrowLeft size={24} />
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // STARTED State (The Enterprise Exam Interface)
    const currentQuestion = questions[currentQuestionIdx];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId)?.selectedOptionId;

    const answeredCount = answers.length;
    const progressPercent = (answeredCount / questions.length) * 100;

    const TimerComponent = (
        <div className={`flex items-center gap-3 px-6 py-2 rounded-xl font-black text-xl border-2 transition-colors ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse shadow-inner' : 'bg-slate-100 text-[#16539a] border-slate-200'}`}>
            <Clock size={24} className="shrink-0" />
            <span dir="ltr" className="tracking-widest">{formatTime(timeLeft)}</span>
        </div>
    );

    return (
        <div className="h-screen bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
            {/* The Unified Navbar spanning full width */}
            <MockExamNavbar 
                title={`قاعة الاختبار: ${info?.profession?.name || ""}`} 
                hideBackUrl={true}
                leftElement={TimerComponent}
            />

            {/* Main Workspace Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Right Sidebar: Map & Progress (Visible on lg screens) */}
                <aside className={`w-[22rem] bg-white border-l border-slate-200 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 transition-transform ${showSidebar ? 'translate-x-0 absolute right-0 h-full' : 'hidden lg:flex'}`}>
                    <div className="p-6 md:p-8 border-b border-slate-100 relative">
                        {/* Mobile Close Button */}
                        <button 
                            className="lg:hidden absolute top-6 left-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                            onClick={() => setShowSidebar(false)}
                        >
                            <XCircle size={20} />
                        </button>
                        
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <LayoutGrid className="text-[#16539a]" /> خريطة الأسئلة
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm mb-3">
                            <span className="font-bold text-slate-500">مستوى الإنجاز</span>
                            <span className="font-black text-[#5c9e45]">{answeredCount} / {questions.length}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-l from-[#16539a] to-[#5c9e45] transition-all duration-500 ease-out" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => {
                                const isAnswered = answers.some(a => a.questionId === q.questionId);
                                const isCurrent = currentQuestionIdx === idx;
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                        className={`w-full aspect-square rounded-xl font-bold flex items-center justify-center text-lg transition-all
                                            ${isCurrent 
                                                ? 'bg-[#16539a] text-white shadow-lg shadow-blue-900/40 ring-4 ring-blue-100 scale-110 z-10' 
                                                : isAnswered 
                                                    ? 'bg-blue-50 text-[#16539a] border-2 border-blue-200 hover:bg-blue-100' 
                                                    : 'bg-slate-50 text-slate-400 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-600'}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 hidden lg:block">
                        <Button 
                            onClick={submitExam}
                            disabled={isSubmitting || answers.length < questions.length - 5} // allow submitting if near end
                            className="w-full h-16 text-lg font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-2xl shadow-xl shadow-green-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Check size={24} />
                            {isSubmitting ? "جاري الإرسال..." : "إنهاء الاختبار وتسليمه"}
                        </Button>
                        <p className="text-xs text-center text-slate-400 mt-4 font-medium">الزر يتفعل عند الإجابة على أغلب الأسئلة.</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
                    
                    {/* Top Content Bar for Mobile toggle or aesthetics */}
                    <div className="h-16 border-b border-slate-200 bg-white flex items-center px-8 lg:hidden justify-between">
                         <div className="font-bold text-slate-500">السؤال {currentQuestionIdx + 1} من {questions.length}</div>
                         <Button variant="outline" onClick={() => setShowSidebar(!showSidebar)} className="rounded-xl border-slate-200 font-bold">
                             {showSidebar ? 'إغلاق الخريطة' : 'عرض الخريطة'}
                         </Button>
                    </div>

                    {/* Scrollable Question area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 custom-scrollbar">
                        <div className="max-w-[1200px] mx-auto w-full">
                            
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuestionIdx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                     {/* Question Card */}
                                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-14 lg:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 mb-6 md:mb-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-[#16539a]"></div>
                                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                                            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-blue-50 text-[#16539a] rounded-xl md:rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl shadow-sm border border-blue-100">
                                                {currentQuestionIdx + 1}
                                            </div>
                                            <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-800 leading-[1.6] md:pt-2">
                                                {currentQuestion?.question.text}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Options Grid */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                                        {currentQuestion?.question.options.map((opt: any, index: number) => {
                                            const isSelected = currentAnswer === opt.id;
                                            const letters = ["أ", "ب", "ج", "د", "هـ"];
                                            
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleSelectOption(currentQuestion.questionId, opt.id)}
                                                    className={`w-full text-right p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 group relative overflow-hidden
                                                        ${isSelected 
                                                            ? "bg-blue-50/80 border-[#16539a] shadow-[0_8px_30px_rgba(22,83,154,0.12)]" 
                                                            : "bg-white border-slate-200 hover:border-[#16539a] hover:bg-slate-50 hover:shadow-md"
                                                        }
                                                    `}
                                                >
                                                    {/* Letter Indicator (A, B, C...) */}
                                                    <div className={`w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black transition-all border-2
                                                        ${isSelected ? "bg-[#16539a] text-white border-[#16539a]" : "bg-slate-100 text-slate-400 border-slate-200 group-hover:border-[#16539a] group-hover:text-[#16539a]"}
                                                    `}>
                                                        {letters[index] || index + 1}
                                                    </div>
                                                    
                                                    <span className={`text-base md:text-xl lg:text-2xl leading-[1.6] ${isSelected ? "text-[#16539a] font-black" : "text-slate-700 font-bold"}`}>
                                                        {opt.text}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Fixed Navigation Footer within Main Area (Full Width of Content) */}
                    <div className="h-24 md:h-28 bg-white border-t border-slate-200 px-4 md:px-8 lg:px-16 flex items-center justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-10 w-full">
                        <Button 
                            variant="outline"
                            onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIdx === 0}
                            className="h-14 md:h-16 px-6 md:px-10 text-base md:text-xl font-black rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 gap-2 md:gap-3 hover:text-slate-800 disabled:opacity-40"
                        >
                            <span className="hidden sm:inline">السؤال</span> السابق
                        </Button>
                        
                        {currentQuestionIdx === questions.length - 1 ? (
                            <Button 
                                onClick={submitExam}
                                disabled={isSubmitting || answers.length < questions.length - 5}
                                className="h-14 md:h-16 px-6 md:px-12 text-base md:text-xl font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-xl md:rounded-2xl shadow-xl shadow-green-900/20 gap-2 md:gap-3 flex items-center justify-center disabled:opacity-50"
                            >
                                <Check size={24} className="hidden md:block" />
                                {isSubmitting ? "جاري الإرسال..." : "إنهاء الاختبار"}
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => {
                                    if (currentQuestionIdx < questions.length - 1) {
                                      setCurrentQuestionIdx(prev => prev + 1);
                                    }
                                }}
                                disabled={currentQuestionIdx === questions.length - 1} // Can't go next if last. use submit button in sidebar.
                                className="h-14 md:h-16 px-6 md:px-12 text-base md:text-xl font-black bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-xl md:rounded-2xl shadow-xl shadow-blue-900/20 gap-2 md:gap-3 flex-row-reverse disabled:opacity-40"
                            >
                                <ArrowLeft size={24} className="md:w-7 md:h-7" />
                                <span className="hidden sm:inline">السؤال</span> التالي
                            </Button>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}
