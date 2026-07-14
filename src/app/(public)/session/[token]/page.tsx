"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, MessageCircle } from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";
import { countries } from "@/constants/countries";
import { SITE_CONFIG } from "@/config/site";
import { ExamWelcome } from "@/components/exam/ExamWelcome";
import { ExamTerms } from "@/components/exam/ExamTerms";
import { ExamActiveRoom } from "@/components/exam/ExamActiveRoom";

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
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
    
    // Maintain a ref to current answers safely
    const answersRef = useRef(answers);
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);
    
    // Proactive WhatsApp Render Wakeup Sent Tracking
    const wakeupSentRef = useRef(false);
    
    const [editablePhone, setEditablePhone] = useState("");
    const [editableName, setEditableName] = useState("");
    const [nameError, setNameError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [countryCode, setCountryCode] = useState("+967");
    const [loadingLonger, setLoadingLonger] = useState(false);

    useEffect(() => {
        fetchInfo();
    }, [token]);

    useEffect(() => {
        let timer: any = null;
        if (status === "LOADING") {
            setLoadingLonger(false);
            timer = setTimeout(() => {
                setLoadingLonger(true);
            }, 6000);
        } else {
            setLoadingLonger(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [status]);

    const fetchInfo = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        try {
            const res = await fetch(`/api/mock/session/${token}/info`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInfo(data);
            
            const initialName = data.visitorName || data.applicant?.fullName || "";
            setEditableName(initialName);

            // Initialize phone number from all possible sources
            let rawPhone = data.visitorPhone || data.applicant?.whatsappNumber || data.applicant?.phone || "";
            // Normalize: convert 00xxx to +xxx format before matching
            rawPhone = rawPhone.replace(/^00/, '+');
            if (rawPhone && !rawPhone.startsWith('+')) rawPhone = '+' + rawPhone;
            
            let parsedPhone = rawPhone;
            // Sort countries by code length (longest first) to match +9665 before +966
            const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
            const matchingCountry = sortedCountries.find(c => rawPhone.startsWith(c.code));
            if (matchingCountry) {
                setCountryCode(matchingCountry.code);
                parsedPhone = rawPhone.slice(matchingCountry.code.length);
                setEditablePhone(parsedPhone);
            } else {
                parsedPhone = rawPhone.replace(/^\+?\d{1,3}/, ''); // Just a rough fallback
                setEditablePhone(parsedPhone);
            }

            if (data.status === "STARTED" || data.status === "RESUMED") {
                // Pass full phone AND name directly to avoid React state race condition
                startExam(false, parsedPhone, initialName, rawPhone);
            } else if (data.status === "SUBMITTED") {
                setStatus("ERROR");
                setErrorMsg("لقد قمت بتسليم هذا الاختبار مسبقاً.");
            } else if (data.status === "EXPIRED" || data.status === "TIMEOUT") {
                setStatus("ERROR");
                setErrorMsg("لقد انتهى وقت هذا الاختبار المسموح.");
            } else {
                // Session is NEW — check if visitor data was already collected from registration page
                if (data.visitorName && data.visitorPhone) {
                    // Data already collected & validated in /[slug] registration → skip WELCOME/TERMS
                    startExam(false, parsedPhone, initialName, rawPhone);
                } else {
                    setStatus("WELCOME");
                }
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                setErrorMsg("انتهت مهلة الاتصال بالخادم. الرجاء التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            } else {
                setErrorMsg(err.message || "فشل تحميل البيانات");
            }
            setStatus("ERROR");
        }
    };

    const isValidArabicName = (name: string) => {
        if (!name) return "الاسم مطلوب";
        // Arabic characters and spaces only
        const arabicRegex = /^[\u0600-\u06FF\s]+$/;
        if (!arabicRegex.test(name)) return "الاسم يجب أن يكون باللغة العربية فقط وبدون أرقام";
        // No repeated chars more than 2
        if (/(.)\1\1/.test(name)) return "يرجى إدخال اسم صحيح وتجنب الحروف العشوائية المكررة";
        // Word count 2 to 4
        const words = name.trim().split(/\s+/);
        if (words.length < 2) return "يرجى إدخال الاسم الثنائي على الأقل";
        if (words.length > 4) return "يرجى إدخال الاسم الرباعي كحد أقصى";
        return null;
    };

    const isFakePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '').slice(-8); // Last 8 digits check
        if (/^(\d)\1+$/.test(digits)) return true;
        if ("1234567890".includes(digits) || "0987654321".includes(digits)) return true;
        return false;
    };

    const startExam = async (isNew = true, directPhone?: string, directName?: string, directFullPhone?: string) => {
        const phoneToUse = directPhone || editablePhone;
        const nameToUse = directName || editableName;
        const isPrivateSession = info?.type === "PRIVATE" && info?.applicantId;

        // Reset errors
        setNameError("");
        setPhoneError("");

        // Only validate on FIRST start, not on resume (data was already validated)
        if (isNew && !isPrivateSession) {
            const nError = isValidArabicName(nameToUse);
            if (nError) {
                setNameError(nError);
                return;
            }

            if (!phoneToUse) {
                setPhoneError("رقم الواتساب مطلوب");
                return;
            }
            if (isFakePhone(phoneToUse)) {
                setPhoneError("رقم الهاتف يبدو غير صحيح أو وهمي");
                return;
            }
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        try {
            setIsSubmitting(true);
            const fullPhone = isNew 
                ? (phoneToUse ? `${countryCode}${phoneToUse}` : undefined)
                : (directFullPhone || phoneToUse);

            const res = await fetch(`/api/mock/session/${token}/start`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({ 
                    phone: fullPhone,
                    name: nameToUse
                })
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (!res.ok) {
                if (data.error.includes("واتساب") || data.error.includes("الهاتف")) {
                    setPhoneError(data.error);
                    setStatus("WELCOME");
                } else if (data.error.includes("الاسم")) {
                    setNameError(data.error);
                    setStatus("WELCOME");
                } else {
                    setErrorMsg(data.error);
                    setStatus("ERROR");
                }
                return;
            }

            setQuestions(data.questions);

            let restoredAnswers = data.questions
                .filter((q: any) => q.selectedOptionId)
                .map((q: any) => ({
                    questionId: q.questionId,
                    selectedOptionId: q.selectedOptionId
                }));
            
            // Try to load from localStorage if backend is empty
            if (restoredAnswers.length === 0) {
                try {
                    const localData = localStorage.getItem(`exam_answers_${token}`);
                    if (localData) restoredAnswers = JSON.parse(localData);
                } catch (e) {}
            }

            if (restoredAnswers.length > 0) {
                setAnswers(restoredAnswers);
            }

            const serverNowMs = new Date(data.session.serverNow || new Date().toISOString()).getTime();
            const durationMs = (data.session.duration || 60) * 60 * 1000;
            const startedAt = new Date(data.session.startedAt).getTime();
            const remaining = Math.max(0, durationMs - (serverNowMs - startedAt));
            setTimeLeft(Math.floor(remaining / 1000));
            setStatus("STARTED");
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                setErrorMsg("انتهت مهلة الاتصال بالخادم. الرجاء التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            } else {
                setErrorMsg(err.message || "فشل بدء الاختبار");
            }
            setStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Timer and unload protections
    useEffect(() => {
        if (status !== "STARTED") return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "هل أنت متأكد من مغادرة الاختبار؟ سيتم حفظ إجاباتك الحالية.";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    submitExam(answersRef.current, true); // auto-submit gracefully
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // SMART PROACTIVE WAKEUP: Dual-trigger to wake Render WhatsApp API
    useEffect(() => {
        if (status !== "STARTED" || wakeupSentRef.current) return;

        const isTimeTrigger = timeLeft > 0 && timeLeft <= 300; // 5 minutes or less
        const isQuestionTrigger = questions.length > 0 && currentQuestionIdx >= questions.length - 3; // Last 3 questions

        if (isTimeTrigger || isQuestionTrigger) {
            wakeupSentRef.current = true;
            console.log("[Wakeup] Proactively waking up Render WhatsApp server...");
            fetch("/api/automation/wake-whatsapp", { method: "POST" }).catch(() => {});
        }
    }, [status, timeLeft, currentQuestionIdx, questions.length]);

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers(prev => {
            const exist = prev.find(a => a.questionId === questionId);
            const newAnswers = exist 
                ? prev.map(a => a.questionId === questionId ? { ...a, selectedOptionId: optionId } : a)
                : [...prev, { questionId, selectedOptionId: optionId }];
            
            try { localStorage.setItem(`exam_answers_${token}`, JSON.stringify(newAnswers)); } catch (e) {}
            return newAnswers;
        });

        // Fire-and-forget save to backend
        fetch(`/api/mock/session/${token}/save-answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedOptionId: optionId })
        }).catch(() => {});
    };

    const submitExam = async (autoSubmitAnswers?: any[], isAutoSubmit = false) => {
        if (isSubmitting) return;

        if (!isAutoSubmit) {
            setShowSubmitConfirm(true);
            return;
        }

        await executeSubmit(autoSubmitAnswers);
    };

    const executeSubmit = async (overrideAnswers?: any[]) => {
        setShowSubmitConfirm(false);
        setIsSubmitting(true);
        const finalAnswers = overrideAnswers || answersRef.current;
        try {
            const res = await fetch(`/api/mock/session/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: finalAnswers })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            try { localStorage.removeItem(`exam_answers_${token}`); } catch (e) {}

            setResult(data.result);
            setStatus("RESULT");
        } catch (err: any) {
            setErrorMsg(err.message || "فشل تسليم الاختبار");
            setStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "ERROR") {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <MockExamNavbar title="الاعتماد المهني" />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-red-100 text-center max-w-md w-full">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-4">تعذر المتابعة</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">{errorMsg}</p>
                        <div className="space-y-3">
                            <Button 
                                onClick={() => { setStatus("LOADING"); setErrorMsg(""); fetchInfo(); }} 
                                className="w-full bg-[#16539a] hover:bg-[#1e66b8] h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-900/20 text-white"
                            >
                                إعادة المحاولة
                            </Button>
                            <Button 
                                onClick={() => router.push("/")} 
                                variant="outline"
                                className="w-full border border-slate-200 hover:bg-slate-50 h-14 text-lg font-bold rounded-2xl text-slate-600"
                            >
                                العودة للرئيسية
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "LOADING" || !info) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans gap-4">
                <div className="w-16 h-16 border-4 border-[#16539a] border-t-transparent rounded-full animate-spin"></div>
                {loadingLonger && (
                    <p className="text-slate-500 text-sm animate-pulse font-medium">
                        يستغرق هذا الأمر وقتاً أطول من المعتاد، يرجى الانتظار...
                    </p>
                )}
            </div>
        );
    }

    if (status === "WELCOME") {
        const displayName = editableName || info?.visitorName || info?.applicant?.fullName || "";
        return (
            <ExamWelcome 
                displayName={displayName}
                professionName={info?.profession?.name || "التخصص"}
                isRegistered={!!info?.applicant}
                examDuration={info?.profession?.examDuration || 60}
                passingScore={info?.profession?.passingScore || 60}
                onStart={() => setStatus("TERMS")}
            />
        );
    }

    if (status === "TERMS") {
        return (
            <ExamTerms 
                isRegistered={!!info?.applicant}
                editableName={editableName}
                setEditableName={setEditableName}
                editablePhone={editablePhone}
                setEditablePhone={setEditablePhone}
                nameError={nameError}
                phoneError={phoneError}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                whatsappConfirmed={whatsappConfirmed}
                setWhatsappConfirmed={setWhatsappConfirmed}
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                isSubmitting={isSubmitting}
                onBack={() => setStatus("WELCOME")}
                onSubmit={() => startExam(true)}
            />
        );
    }

    if (status === "RESULT") {
        const supportMessage = encodeURIComponent(`مرحباً، لم تصلني نتيجة الاختبار التجريبي الخاص بي. كود الجلسة: ${token}`);
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex flex-col font-sans">
                <MockExamNavbar title="الاعتماد المهني" />
                <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.06] mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/25 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />
                    
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 text-center max-w-lg w-full">
                        <div className="w-28 h-28 mx-auto mb-10 rounded-[2rem] bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <CheckCircle className="w-14 h-14 text-indigo-400" />
                        </div>
                        
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight font-sans">
                            تم تسليم الاختبار بنجاح <span className="text-[#5c9e45]">✓</span>
                        </h1>
                        
                        <p className="text-slate-300/90 text-lg mb-8 max-w-md mx-auto leading-relaxed font-sans">
                            لقد تم إرسال نتيجة اختبارك وتقرير الأداء التفصيلي إلى رقم الواتساب وبريدك الإلكتروني المسجلين.
                        </p>
                        
                        <div className="flex flex-col gap-4 mb-8">
                            <Button 
                                onClick={() => window.open(`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=${supportMessage}`, "_blank")} 
                                className="w-full h-16 text-xl font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl shadow-xl shadow-green-950/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-4 mt-4"
                            >
                                <MessageCircle size={24} />
                                لم تصلني نتيجتي؟ تواصل مع الدعم
                            </Button>
                            
                            <Button 
                                onClick={() => router.push("/")} 
                                variant="outline" 
                                className="w-full h-16 text-xl font-bold bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-2xl flex items-center justify-center gap-4"
                            >
                                العودة للرئيسية
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <ExamActiveRoom 
            professionName={info?.profession?.name || ""}
            questions={questions}
            currentQuestionIdx={currentQuestionIdx}
            setCurrentQuestionIdx={setCurrentQuestionIdx}
            answers={answers}
            timeLeft={timeLeft}
            isSubmitting={isSubmitting}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            showSubmitConfirm={showSubmitConfirm}
            setShowSubmitConfirm={setShowSubmitConfirm}
            onSelectOption={handleSelectOption}
            onSubmit={() => submitExam()}
            onExecuteSubmit={() => executeSubmit()}
        />
    );
}
