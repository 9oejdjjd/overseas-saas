"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, User, Phone, ShieldCheck, AlertCircle, BookOpen, Clock, Activity, ChevronDown, Search } from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";
import { getDeviceFingerprint } from "@/lib/fingerprint";

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

export default function MockRegistrationPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profession, setProfession] = useState<any>(null);
    const [error, setError] = useState("");
    
    // Country code selector state
    const [countryCode, setCountryCode] = useState("+967");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCountries = countries.filter(c => 
        c.name.includes(searchQuery) || c.code.includes(searchQuery)
    );

    const [formData, setFormData] = useState({
        visitorName: "",
        visitorPhone: "",
        termsAccepted: false,
        whatsappConfirmed: false,
    });

    useEffect(() => {
        const fetchProfession = async () => {
            try {
                const res = await fetch("/api/mock/public/professions");
                if (res.ok) {
                    const data = await res.json();
                    const match = data.find((p: any) => p.slug === slug);
                    if (match) {
                        setProfession(match);
                    } else {
                        setError("لم يتم العثور على التخصص أو أنه غير متاح حالياً.");
                    }
                }
            } catch (err) {
                setError("فشل الاتصال بالخادم.");
            }
        };
        fetchProfession();
    }, [slug]);

    const handleNext = () => {
        if (step === 1) setStep(2);
        else if (step === 2) {
            if (!formData.visitorName || !formData.visitorPhone) {
                setError("يرجى إدخال جميع البيانات المطلوبة.");
                return;
            }
            if (formData.visitorPhone.length < 9) {
                setError("الرجاء إدخال رقم هاتف صحيح.");
                return;
            }
            setError("");
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!formData.termsAccepted) {
            setError("يرجى الموافقة على الشروط والأحكام أولاً.");
            return;
        }
        if (!formData.whatsappConfirmed) {
            setError("يرجى تأكيد صحة رقم الواتساب.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const fingerprint = await getDeviceFingerprint();

            const res = await fetch("/api/mock/public/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visitorName: formData.visitorName,
                    visitorPhone: `${countryCode}${formData.visitorPhone}`, // Combine code + number
                    professionSlug: slug,
                    deviceFingerprint: fingerprint
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "حدث خطأ غير متوقع");

            router.push(`/session/${data.token}`);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (error && !profession) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <MockExamNavbar title="الاعتماد المهني" />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-red-100">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">{error}</h2>
                        <Button onClick={() => router.push("/")} className="w-full h-14 bg-slate-800 text-white rounded-xl text-lg">
                            العودة للرئيسية
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <MockExamNavbar title={`الاعتماد المهني - ${profession?.name || "التخصص"}`} />

            {/* SPLIT SCREEN LAYOUT */}
            <main className="flex-1 flex flex-col lg:flex-row w-full">
                
                {/* LEFT SIDE (VISUAL / INFO) */}
                <div className="lg:w-[45%] bg-[#0a0f1c] relative flex flex-col justify-center p-12 lg:p-20 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#16539a]/30 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/20 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-10 shadow-lg">
                            <BookOpen size={40} className="text-[#5c9e45]" />
                        </div>
                        
                        <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
                            مرحباً بك في بوابة <br/>
                            <span className="text-[#5c9e45]">الاعتماد المهني</span>
                        </h1>
                        
                        <p className="text-base lg:text-lg text-slate-300 mb-6 max-w-md leading-relaxed">
                            هذا اختبار تجريبي يحاكي أسلوب اختبار الاعتماد المهني السعودي لمهنة <span className="text-white font-bold">{profession?.name || "التخصص"}</span>. يساعدك على معرفة مستواك والتحضير للاختبار الحقيقي.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                            <p className="text-sm text-orange-300/80 font-semibold">⚠️ تنبيه: هذا الاختبار تجريبي تدريبي فقط ولا يمثل الاختبار الرسمي.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                                <Clock size={28} className="text-[#5c9e45]" />
                                <div>
                                    <div className="text-sm text-slate-400">المدة الزمنية للاختبار</div>
                                    <div className="text-xl font-bold">{profession?.examDuration || 60} دقيقة متواصلة</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                                <Activity size={28} className="text-[#5c9e45]" />
                                <div>
                                    <div className="text-sm text-slate-400">عدد الأسئلة المتوقعة</div>
                                    <div className="text-xl font-bold">{profession?.questionCount || 20} سؤال تقني متعدد</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE (FORM) */}
                <div className="lg:w-[55%] bg-[#fafafa] flex flex-col justify-center items-center py-16 px-6 lg:px-24">
                    <div className="w-full max-w-xl">
                        
                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-center mb-16">
                            {[1, 2, 3].map((num, i) => (
                                <React.Fragment key={num}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 z-10 ${step >= num ? "bg-[#16539a] text-white shadow-lg shadow-blue-900/30 scale-110" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
                                        {step > num ? <CheckCircle size={22} className="text-white" /> : num}
                                    </div>
                                    {i < 2 && (
                                        <div className="w-16 h-1.5 mx-1 rounded-full relative overflow-hidden bg-slate-200">
                                            <div className={`absolute left-0 top-0 h-full bg-[#16539a] transition-all duration-700 ease-in-out ${step > num ? "w-full" : "w-0"}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* STEP CONTENT */}
                        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className="p-10 md:p-14"
                                    >
                                        <div className="w-14 h-14 bg-blue-50 text-[#16539a] rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                                            <ShieldCheck size={30} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-3">تعليمات ما قبل البدء</h2>
                                        <div className="text-slate-500 mb-8 leading-relaxed space-y-3 text-[15px]">
                                            <p>• يرجى التأكد من <span className="font-bold text-slate-700">استقرار اتصالك بالإنترنت</span> قبل البدء.</p>
                                            <p>• بمجرد بدء الاختبار، سيبدأ <span className="font-bold text-slate-700">العداد التنازلي</span> ولن تتمكن من إيقافه.</p>
                                            <p>• لا يُسمح بتحديث الصفحة أو الرجوع أثناء الاختبار.</p>
                                            <p>• <span className="font-bold text-slate-700">النتيجة ستُرسل تلقائياً على رقم الواتساب</span> الذي ستدخله.</p>
                                        </div>
                                        
                                        <Button onClick={handleNext} className="w-full h-14 text-lg font-bold bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-2xl shadow-xl shadow-blue-900/20 transform hover:-translate-y-1 transition-all">
                                            فهمت — التالي
                                        </Button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className="p-10 md:p-14"
                                    >
                                        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">أدخل بياناتك لاستلام النتيجة</h2>
                                        {error && <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-xl text-sm text-center font-bold border border-red-100">{error}</div>}
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-700 font-bold text-base">الاسم الثلاثي أو الرباعي</Label>
                                                <div className="relative">
                                                    <User className="absolute right-4 top-4 text-slate-400 w-6 h-6" />
                                                    <Input 
                                                        className="pl-4 pr-14 h-16 text-lg rounded-2xl border-2 border-slate-100 focus:border-[#16539a] focus:ring-0 bg-slate-50 focus:bg-white transition-colors" 
                                                        placeholder="يكتب كما في جواز السفر"
                                                        value={formData.visitorName}
                                                        onChange={e => setFormData({...formData, visitorName: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-700 font-bold text-base">رقم التواصل الأساسي (واتساب)</Label>
                                                
                                                <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-[#16539a] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#16539a]/10 transition-all h-16 w-full group">
                                                    
                                                    {/* Country Code Dropdown Button */}
                                                    <div className="h-full flex items-center relative">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                            className="h-full px-4 flex items-center gap-2 border-l-2 border-slate-200 hover:bg-slate-100 transition-colors rounded-r-2xl text-slate-700"
                                                            dir="ltr"
                                                        >
                                                            <span className="text-2xl leading-none">{countries.find(c => c.code === countryCode)?.flag}</span>
                                                            <span className="font-mono font-bold text-lg">{countryCode}</span>
                                                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180 text-[#16539a]' : ''}`} />
                                                        </button>
                                                        
                                                        {/* Dropdown Menu */}
                                                        <AnimatePresence>
                                                            {showCountryDropdown && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute top-[calc(100%+10px)] right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 overflow-hidden z-50 flex flex-col"
                                                                >
                                                                    {/* Search Input */}
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
                                                        value={formData.visitorPhone}
                                                        onChange={e => setFormData({...formData, visitorPhone: e.target.value.replace(/\D/g, '')})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-12">
                                            <Button onClick={() => setStep(1)} variant="outline" className="w-[30%] h-16 text-lg font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                                                رجوع
                                            </Button>
                                            <Button onClick={handleNext} className="w-[70%] h-16 text-lg font-bold bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-2xl shadow-xl shadow-blue-900/20 transform hover:-translate-y-1 transition-all">
                                                المرحلة الأخيرة
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className="p-8 md:p-12"
                                    >
                                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-amber-100">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">الشروط والأحكام</h2>
                                        <p className="text-slate-400 text-sm text-center mb-6">يرجى قراءة الشروط التالية بعناية قبل بدء الاختبار</p>
                                        {error && <div className="p-3 mb-5 bg-red-50 text-red-600 rounded-xl text-sm text-center font-bold border border-red-100">{error}</div>}
                                        
                                        {/* Terms List */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 max-h-[280px] overflow-y-auto custom-scrollbar">
                                            <ol className="space-y-3 text-sm text-slate-600 leading-relaxed list-decimal list-inside">
                                                <li>بوابة الاعتماد المهني هي منصة <span className="font-bold text-slate-800">تدريبية تأهيلية مستقلة</span>، وليس لها أي علاقة رسمية بهيئة تقويم التعليم والتدريب أو الاعتماد المهني السعودي الرسمي.</li>
                                                <li>الأسئلة المقدمة هي لغرض <span className="font-bold text-slate-800">التدريب والتأهيل فقط</span>، وقد لا تتطابق مع الأسئلة الفعلية في الاختبار الرسمي.</li>
                                                <li>هذا اختبار تجريبي <span className="font-bold text-slate-800">لتحديد المستوى</span> وليس اختباراً رسمياً معتمداً.</li>
                                                <li>نتيجة هذا الاختبار التجريبي <span className="font-bold text-slate-800">لا تمثل ولا تضمن</span> نتيجة الاختبار الفعلي.</li>
                                                <li>سيتم إرسال نتيجة الاختبار على <span className="font-bold text-slate-800">رقم الواتساب المدخل</span>، لذا تأكد من صحته.</li>
                                                <li>يتحمل المستخدم <span className="font-bold text-slate-800">كامل المسؤولية</span> عن صحة البيانات المدخلة.</li>
                                                <li>لا يحق للمستخدم المطالبة بأي تعويض بناءً على نتيجة هذا الاختبار التجريبي.</li>
                                                <li>يحق لإدارة البوابة <span className="font-bold text-slate-800">تعديل أو تحديث</span> محتوى الاختبارات والشروط في أي وقت دون إشعار مسبق.</li>
                                            </ol>
                                        </div>

                                        {/* Terms Checkbox */}
                                        <div 
                                            className="flex items-start gap-3 mb-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer" 
                                            onClick={() => setFormData({...formData, termsAccepted: !formData.termsAccepted})}
                                        >
                                            <Checkbox 
                                                id="terms" 
                                                checked={formData.termsAccepted}
                                                className="w-5 h-5 rounded-md data-[state=checked]:bg-[#16539a] border-slate-300 border-2 pointer-events-none mt-0.5 shrink-0"
                                            />
                                            <Label htmlFor="terms" className="text-sm font-bold text-slate-700 pointer-events-none leading-relaxed">
                                                لقد قرأت الشروط والأحكام أعلاه وأوافق عليها بالكامل.
                                            </Label>
                                        </div>

                                        {/* WhatsApp Confirmation Checkbox */}
                                        <div 
                                            className="flex items-start gap-3 mb-8 bg-green-50/50 p-4 rounded-xl border-2 border-green-100 hover:border-green-200 transition-colors cursor-pointer" 
                                            onClick={() => setFormData({...formData, whatsappConfirmed: !formData.whatsappConfirmed})}
                                        >
                                            <Checkbox 
                                                id="whatsapp-confirm" 
                                                checked={formData.whatsappConfirmed}
                                                className="w-5 h-5 rounded-md data-[state=checked]:bg-[#5c9e45] border-green-300 border-2 pointer-events-none mt-0.5 shrink-0"
                                            />
                                            <Label htmlFor="whatsapp-confirm" className="text-sm font-bold text-slate-700 pointer-events-none leading-relaxed">
                                                أُقر بأن رقم الواتساب الذي أدخلته <span className="text-[#5c9e45]">({countryCode}{formData.visitorPhone})</span> صحيح وسيتم إرسال النتيجة عليه.
                                            </Label>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button onClick={() => setStep(2)} variant="outline" className="w-[30%] h-14 text-base font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50" disabled={loading}>
                                                رجوع
                                            </Button>
                                            <Button onClick={handleSubmit} disabled={loading || !formData.termsAccepted || !formData.whatsappConfirmed} className="w-[70%] h-14 text-base font-bold bg-gradient-to-l from-[#5c9e45] to-green-600 hover:from-[#4d853a] hover:to-[#5c9e45] text-white rounded-2xl shadow-xl shadow-green-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                                                {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : "ابدأ الاختبار الآن"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
