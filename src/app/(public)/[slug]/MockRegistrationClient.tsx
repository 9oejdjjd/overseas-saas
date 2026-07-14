"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, User, Phone, ShieldCheck, AlertCircle, BookOpen, Clock, Activity } from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { countries } from "@/constants/countries";
import { CountryCodeSelector } from "@/components/ui/CountryCodeSelector";


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
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(30); // Start with 30s instead of 5m
    const [canResend, setCanResend] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [showEmailFallback, setShowEmailFallback] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const fingerprintRef = useRef<string>("unknown-device");

    const [formData, setFormData] = useState({
        visitorName: "",
        visitorPhone: "",
        email: "",
        deliveryMethod: "WHATSAPP", // "WHATSAPP" or "EMAIL"
        termsAccepted: false,
    });

    const getNextTimer = (count: number) => {
        if (count === 0) return 30; // First request: 30 seconds
        if (count === 1) return 60; // Second request: 1 minute
        return 600; // Third request and beyond: 10 minutes
    };

    useEffect(() => {
        getDeviceFingerprint()
            .then(fp => {
                fingerprintRef.current = fp;
            })
            .catch(err => {
                console.warn("Failed to pre-load fingerprint:", err);
            });
    }, []);

    useEffect(() => {
        if (showEmailFallback && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [showEmailFallback]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 3 && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && step === 3) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

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

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!formData.visitorName || !formData.visitorPhone) {
                setError("يرجى إدخال جميع البيانات المطلوبة.");
                return;
            }
            if (formData.visitorPhone.length < 9) {
                setError("الرجاء إدخال رقم هاتف صحيح.");
                return;
            }
            
            setLoading(true);
            setError("");
            
            try {
                const res = await fetch("/api/mock/public/verify-phone", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "REQUEST",
                        visitorName: formData.visitorName,
                        visitorPhone: `${countryCode}${formData.visitorPhone}`,
                        deliveryMethod: formData.deliveryMethod,
                        email: formData.email,
                        professionName: profession?.name,
                    })
                });
                
                const data = await res.json();
                
                if (res.status === 429 && data.cooldown) {
                    setStep(3); // Already requested recently, go to OTP step
                    setTimeLeft(data.cooldown);
                    setCanResend(false);
                    return;
                }

                if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء فحص الرقم");
                
                if (data.requiresOtp) {
                    setStep(3); // Go to OTP
                    setResendCount(0);
                    setTimeLeft(getNextTimer(0));
                    setCanResend(false);
                    setOtp(["", "", "", "", "", ""]);
                } else if (data.isVerified) {
                    setStep(4); // Skip OTP, go to Terms
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVerifyOtp = async (code: string) => {
        if (code.length !== 6) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/mock/public/verify-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "VERIFY",
                    visitorPhone: `${countryCode}${formData.visitorPhone}`,
                    otp: code
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "كود التحقق غير صحيح");
            
            if (data.success) {
                setStep(4); // Proceed to Terms
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/mock/public/verify-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "REQUEST",
                    visitorName: formData.visitorName,
                    visitorPhone: `${countryCode}${formData.visitorPhone}`,
                    deliveryMethod: "WHATSAPP",
                    professionName: profession?.name,
                })
            });
            
            const data = await res.json();
            
            if (res.status === 429 && data.cooldown) {
                setTimeLeft(data.cooldown);
                setCanResend(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || "فشل إرسال الرمز");
            
            const nextCount = resendCount + 1;
            setResendCount(nextCount);
            setTimeLeft(getNextTimer(nextCount));
            setCanResend(false);
            setOtp(["", "", "", "", "", ""]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailFallbackSubmit = async () => {
        if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("الرجاء إدخال بريد إلكتروني صحيح.");
            return;
        }
        
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/mock/public/verify-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "REQUEST",
                    visitorName: formData.visitorName,
                    visitorPhone: `${countryCode}${formData.visitorPhone}`,
                    email: formData.email,
                    deliveryMethod: "EMAIL",
                    professionName: profession?.name,
                })
            });
            const data = await res.json();
            
            if (res.status === 429 && data.cooldown) {
                setFormData(prev => ({ ...prev, deliveryMethod: "EMAIL" }));
                setShowEmailFallback(false);
                setTimeLeft(data.cooldown);
                setCanResend(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || "فشل إرسال الرمز للبريد");
            
            const nextCount = resendCount + 1;
            setResendCount(nextCount);
            setFormData(prev => ({ ...prev, deliveryMethod: "EMAIL" }));
            setShowEmailFallback(false);
            setTimeLeft(getNextTimer(nextCount));
            setCanResend(false);
            setOtp(["", "", "", "", "", ""]);
            // Autofocus first OTP digit
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (loading) return; // حماية من الضغط المزدوج
        if (!formData.termsAccepted) {
            setError("يرجى الموافقة على الشروط والأحكام أولاً.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // استخدام البصمة المحملة مسبقاً مع fallback
            let fingerprint = fingerprintRef.current;
            if (fingerprint === "unknown-device") {
                try {
                    fingerprint = await Promise.race([
                        getDeviceFingerprint(),
                        new Promise<string>((_, reject) => 
                            setTimeout(() => reject(new Error("timeout")), 4000)
                        )
                    ]);
                } catch (e) {
                    console.warn("Fingerprint generation failed or timed out, using fallback", e);
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const res = await fetch("/api/mock/public/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    visitorName: formData.visitorName,
                    visitorPhone: `${countryCode}${formData.visitorPhone}`,
                    visitorEmail: formData.email,
                    professionSlug: slug,
                    deviceFingerprint: fingerprint
                })
            });
            clearTimeout(timeoutId);

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "حدث خطأ غير متوقع");

            if (data.token) {
                router.push(`/session/${data.token}`);
            } else {
                throw new Error("لم يتم إنشاء الجلسة بشكل صحيح. يرجى المحاولة مرة أخرى.");
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError("انتهت مهلة الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
            } else {
                setError(err.message || "حدث خطأ غير متوقع");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            if (pastedData.length === 6) {
                handleVerifyOtp(newOtp.join(""));
            } else {
                inputRefs.current[pastedData.length]?.focus();
            }
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
                
                {/* LEFT SIDE (VISUAL / INFO) — Hidden on mobile, compact bar shown instead */}
                <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#16539a]/5 via-white to-[#5c9e45]/5 relative flex-col justify-center p-14 xl:p-20 text-slate-800 overflow-hidden border-l border-slate-200/60">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
                    <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10 text-right">
                        <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center mb-8">
                            <BookOpen size={32} className="text-[#16539a]" />
                        </div>
                        
                        <h1 className="text-3xl xl:text-4xl font-black leading-tight mb-5 text-slate-900">
                            مرحباً بك في بوابة <br/>
                            <span className="text-[#16539a]">الاعتماد المهني</span>
                        </h1>
                        
                        <p className="text-base text-slate-600 mb-5 max-w-md leading-relaxed font-semibold">
                            هذا اختبار تجريبي يحاكي أسلوب اختبار الاعتماد المهني السعودي لمهنة <span className="text-slate-950 font-bold">{profession?.name || "التخصص"}</span>. يساعدك على معرفة مستواك والتحضير للاختبار الحقيقي.
                        </p>
                        <div className="bg-orange-50/70 border border-orange-100/80 rounded-xl p-3 mb-5">
                            <p className="text-sm text-orange-700 font-bold">⚠️ تنبيه: هذا الاختبار تجريبي تدريبي فقط ولا يمثل الاختبار الرسمي.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
                                <Clock size={24} className="text-[#5c9e45]" />
                                <div>
                                    <div className="text-xs text-slate-400 font-bold">المدة الزمنية</div>
                                    <div className="text-lg font-black text-slate-800 font-latin">{profession?.examDuration || 60} دقيقة</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
                                <Activity size={24} className="text-[#16539a]" />
                                <div>
                                    <div className="text-xs text-slate-400 font-bold">عدد الأسئلة</div>
                                    <div className="text-lg font-black text-slate-800 font-latin">{profession?.questionCount || 30} سؤال</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MOBILE: Compact Info Bar (replaces dark panel) */}
                <div className="lg:hidden bg-[#0a0f1c] px-4 py-4 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen size={20} className="text-[#5c9e45]" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold">اختبار تجريبي — <span className="text-[#5c9e45]">{profession?.name || "التخصص"}</span></h1>
                            <p className="text-[11px] text-slate-400">يحاكي اختبار الاعتماد المهني السعودي</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                            <Clock size={14} className="text-[#5c9e45] shrink-0" />
                            <span className="text-xs font-bold">{profession?.examDuration || 60} دقيقة</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                            <Activity size={14} className="text-[#5c9e45] shrink-0" />
                            <span className="text-xs font-bold">{profession?.questionCount || 30} سؤال</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE (FORM) */}
                <div className="lg:w-[55%] bg-[#fafafa] flex flex-col justify-center items-center py-6 px-4 md:py-16 md:px-6 lg:px-24">
                    <div className="w-full max-w-xl">
                        
                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-center mb-6 md:mb-12">
                            {[1, 2, 3].map((num, i) => (
                                <React.Fragment key={num}>
                                    <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-500 z-10 ${step >= num ? "bg-[#16539a] text-white shadow-lg shadow-blue-900/30 scale-110" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
                                        {step > num ? <CheckCircle size={18} className="text-white" /> : num}
                                    </div>
                                    {i < 2 && (
                                        <div className="w-10 md:w-16 h-1 md:h-1.5 mx-1 rounded-full relative overflow-hidden bg-slate-200">
                                            <div className={`absolute left-0 top-0 h-full bg-[#16539a] transition-all duration-700 ease-in-out ${step > num ? "w-full" : "w-0"}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* STEP CONTENT */}
                        <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] md:shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 overflow-visible relative">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className="p-5 md:p-10 lg:p-14"
                                    >
                                        <div className="w-11 h-11 md:w-14 md:h-14 bg-blue-50 text-[#16539a] rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border border-blue-100">
                                            <ShieldCheck size={24} className="md:w-[30px] md:h-[30px]" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-3">تعليمات ما قبل البدء</h2>
                                        <div className="text-slate-500 mb-5 md:mb-8 leading-relaxed space-y-2 md:space-y-3 text-[13px] md:text-[15px]">
                                            <p>• يرجى التأكد من <span className="font-bold text-slate-700">استقرار اتصالك بالإنترنت</span> قبل البدء.</p>
                                            <p>• بمجرد بدء الاختبار، سيبدأ <span className="font-bold text-slate-700">العداد التنازلي</span> ولن تتمكن من إيقافه.</p>
                                            <p>• لا يُسمح بتحديث الصفحة أو الرجوع أثناء الاختبار.</p>
                                            <p>• <span className="font-bold text-slate-700">النتيجة ستُرسل تلقائياً على رقم الواتساب</span> الذي ستدخله.</p>
                                        </div>
                                        
                                        <Button onClick={handleNext} className="w-full h-12 md:h-14 text-base md:text-lg font-bold bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-900/20 transform hover:-translate-y-1 transition-all">
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
                                        className="p-5 md:p-10 lg:p-14"
                                    >
                                        <h2 className="text-lg md:text-2xl font-bold text-slate-800 mb-4 md:mb-6 text-center">أدخل بياناتك لاستلام النتيجة</h2>
                                        {error && <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-xl text-sm text-center font-bold border border-red-100">{error}</div>}
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <Label className="text-slate-700 font-bold text-sm md:text-base">الاسم الثلاثي أو الرباعي</Label>
                                                <div className="relative">
                                                    <User className="absolute right-3 md:right-4 top-3 md:top-3.5 text-slate-400 w-5 h-5 md:w-6 md:h-6" />
                                                    <Input 
                                                        className="pl-4 pr-11 md:pr-14 h-12 md:h-14 text-base md:text-lg rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-[#16539a] focus:ring-0 bg-slate-50 focus:bg-white transition-colors" 
                                                        placeholder="يكتب كما في جواز السفر"
                                                        value={formData.visitorName}
                                                        onChange={e => setFormData({...formData, visitorName: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-700 font-bold text-sm md:text-base">رقم التواصل الأساسي (واتساب)</Label>
                                                
                                                <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus-within:border-[#16539a] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#16539a]/10 transition-all h-12 md:h-14 w-full group">
                                                    <CountryCodeSelector 
                                                        selectedCode={countryCode} 
                                                        onSelect={setCountryCode} 
                                                        disabled={loading} 
                                                    />
                                                    <Input 
                                                        className="flex-1 h-full px-3 md:px-4 text-base md:text-xl border-0 focus:ring-0 bg-transparent font-mono focus-visible:ring-0 focus-visible:ring-offset-0 text-left outline-none placeholder:text-slate-300" 
                                                        placeholder="أدخل رقم الواتس اب"
                                                        dir="ltr"
                                                        type="tel"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={formData.visitorPhone}
                                                        onChange={e => setFormData({...formData, visitorPhone: e.target.value.replace(/\D/g, '')})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6 md:mt-12">
                                            <Button onClick={() => setStep(1)} disabled={loading} variant="outline" className="w-[30%] h-12 md:h-14 text-sm md:text-lg font-bold rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                                                رجوع
                                            </Button>
                                            <Button 
                                                onClick={handleNext} 
                                                disabled={loading}
                                                className="w-[70%] h-12 md:h-14 text-sm md:text-lg font-bold bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-900/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                            >
                                                {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : "المرحلة الأخيرة"}
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
                                        className="p-5 md:p-10 lg:p-14"
                                    >
                                        <div className="w-16 h-16 bg-blue-50 text-[#16539a] rounded-2xl flex items-center justify-center mb-6 mx-auto border border-blue-100 shadow-sm relative overflow-hidden">
                                            <motion.div 
                                                animate={{ y: [0, -5, 0] }} 
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            >
                                                <ShieldCheck size={32} />
                                            </motion.div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">تأكيد الاستلام</h2>
                                        <p className="text-slate-500 text-sm md:text-base text-center mb-8 leading-relaxed">
                                            لقد أرسلنا كود تحقق (OTP) عبر {formData.deliveryMethod === "EMAIL" ? "البريد الإلكتروني" : "الواتساب"} <br/>
                                            <span className="font-bold text-[#16539a]" dir="ltr">
                                                {formData.deliveryMethod === "EMAIL" ? formData.email : `${countryCode}${formData.visitorPhone}`}
                                            </span>
                                        </p>
                                        
                                        {error && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-xl text-sm text-center font-bold border border-red-100">{error}</div>}
                                        
                                        <div className="flex justify-center gap-2 md:gap-3 mb-6" dir="ltr" onPaste={handlePaste}>
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="tel"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={1}
                                                    value={digit}
                                                    ref={(el) => { inputRefs.current[index] = el; }}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        const newOtp = [...otp];
                                                        newOtp[index] = value;
                                                        setOtp(newOtp);
                                                        
                                                        if (value && index < 5) {
                                                            inputRefs.current[index + 1]?.focus();
                                                        }
                                                        if (newOtp.join("").length === 6) {
                                                            handleVerifyOtp(newOtp.join(""));
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                                                            inputRefs.current[index - 1]?.focus();
                                                        } else if (e.key === "Enter") {
                                                            const fullCode = otp.join("");
                                                            if (fullCode.length === 6) handleVerifyOtp(fullCode);
                                                        }
                                                    }}
                                                    className="w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold rounded-xl border-2 border-slate-200 focus:border-[#16539a] focus:ring-4 focus:ring-[#16539a]/10 outline-none transition-all bg-slate-50 focus:bg-white"
                                                />
                                            ))}
                                        </div>

                                        <div className="flex justify-center mb-8">
                                            {!canResend ? (
                                                <div className="text-sm font-medium text-slate-500 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                                    <Clock size={16} className="text-slate-400" />
                                                    يمكنك إعادة المحاولة بعد: <span className="text-[#16539a] font-mono font-bold" dir="ltr">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                                </div>
                                            ) : !showEmailFallback ? (
                                                <div className="flex flex-col items-center gap-3 w-full">
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={handleResendOtp} 
                                                        disabled={loading}
                                                        className="text-sm font-bold text-[#16539a] hover:text-[#1e66b8] hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
                                                    >
                                                        لم يصلني الرمز، إعادة إرساله عبر الواتساب
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        onClick={() => setShowEmailFallback(true)} 
                                                        disabled={loading}
                                                        className="w-full max-w-[280px] h-11 text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                                                    >
                                                        التحقق عبر البريد الإلكتروني (طريقة بديلة)
                                                    </Button>
                                                </div>
                                            ) : (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                                    className="w-full flex flex-col items-center gap-3"
                                                >
                                                    <div className="w-full max-w-[320px] relative">
                                                        <Input 
                                                            ref={emailInputRef}
                                                            type="email"
                                                            className="px-4 h-12 text-base rounded-xl border-2 border-slate-200 focus:border-[#16539a] focus:ring-0 bg-slate-50 focus:bg-white text-left transition-all" 
                                                            placeholder="أدخل بريدك الإلكتروني"
                                                            dir="ltr"
                                                            value={formData.email}
                                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" && formData.email) {
                                                                    handleEmailFallbackSubmit();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 w-full max-w-[320px]">
                                                        <Button 
                                                            variant="ghost" 
                                                            onClick={() => setShowEmailFallback(false)} 
                                                            disabled={loading}
                                                            className="flex-1 text-slate-500 hover:bg-slate-100"
                                                        >
                                                            إلغاء
                                                        </Button>
                                                        <Button 
                                                            onClick={handleEmailFallbackSubmit} 
                                                            disabled={loading || !formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)}
                                                            className="flex-1 bg-[#16539a] hover:bg-[#1e66b8] text-white"
                                                        >
                                                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "إرسال الرمز"}
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button onClick={() => setStep(2)} variant="outline" className="w-[30%] h-12 md:h-14 text-sm md:text-base font-bold rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50" disabled={loading}>
                                                تعديل الرقم
                                            </Button>
                                            <Button 
                                                onClick={() => handleVerifyOtp(otp.join(""))} 
                                                disabled={loading || otp.join("").length !== 6} 
                                                className="w-[70%] h-12 md:h-14 text-sm md:text-base font-bold bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-900/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : "تحقق من الرمز"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className="p-5 md:p-8 lg:p-12"
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
                                            className="flex items-start gap-3 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer" 
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

                                        <div className="flex gap-3">
                                            <Button onClick={handleSubmit} disabled={loading || !formData.termsAccepted} className="w-full h-12 md:h-14 text-sm md:text-base font-bold bg-gradient-to-l from-[#5c9e45] to-green-600 hover:from-[#4d853a] hover:to-[#5c9e45] text-white rounded-xl md:rounded-2xl shadow-lg shadow-green-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
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
