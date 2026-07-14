"use client";

import { motion } from "framer-motion";
import { CheckCircle, Sparkles, HeartHandshake, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { HeroSearchSection } from "./HeroSearchSection";

interface Profession {
    id: string;
    name: string;
    slug: string;
}

export function HeroSection({ professions }: { professions: Profession[] }) {
    return (
        <section 
            id="hero" 
            className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden bg-slate-50/50 bg-grid-pattern text-slate-900 border-b border-slate-200/60"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">

                {/* LEFT CONTENT */}
                <div className="text-right flex flex-col items-start pt-6">

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        className="text-4xl md:text-5xl lg:text-[3.4rem] font-black mb-6 leading-[1.35] tracking-tight text-slate-800"
                    >
                        <span>اجتز اختبار الاعتماد المهني السعودي</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#074388] via-[#0c53a7] to-[#55943b] inline-block mt-2">
                            بكل ثقة ومن أول محاولة
                        </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        className="text-base md:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed font-medium"
                    >
                        أول محاكاة متكاملة تحاكي فحص الاعتماد المهني السعودي لمختلف الحرف والمهن. تدرّب على بنك الأسئلة المهنية، واجتز الاختبار الحقيقي بكل ثقة ومن أول محاولة.
                    </motion.p>

                    {/* PROFESSION SEARCH — Interactive Client Component */}
                    <HeroSearchSection professions={professions} />

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500 font-bold"
                    >
                        <div className="flex items-center gap-1.5">
                            <CheckCircle size={15} className="text-[#55943b]" /> 
                            <span>تحليل فوري للمحاور والدرجات</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle size={15} className="text-[#55943b]" /> 
                            <span>أسئلة مطابقة لمعايير الفحص المهني</span>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT CONTENT (Minimalist Premium Mockup Card) */}
                <div className="hidden lg:flex relative h-full items-center justify-center">
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative z-20 w-full max-w-md mx-auto"
                    >
                        {/* Mock UI Card */}
                        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-[0_20px_45px_rgba(15,23,42,0.04)] relative overflow-hidden">
                            {/* Accent Line */}
                            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-[#074388] via-[#0c53a7] to-[#55943b]"></div>

                            {/* Header bar */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                                    محاكي_الاختبار
                                </div>
                            </div>

                            {/* Mock Question Area */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#074388] uppercase tracking-wider">
                                    <ShieldCheck className="w-4 h-4 text-[#55943b]" />
                                    <span>المحور: السلامة المهنية</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 leading-normal">
                                    ما هو الإجراء الأول الذي يجب اتخاذه عند حدوث التماس كهربائي في ورشة العمل؟
                                </h3>
                                
                                {/* Options */}
                                <div className="space-y-2.5 pt-2">
                                    <div className="p-3.5 rounded-xl border border-slate-100 flex gap-3 items-center bg-slate-50/50">
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                                        <div className="h-2 bg-slate-200 rounded-full w-2/3"></div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-green-50/50 border border-green-200/60 flex gap-3 items-center shadow-sm">
                                        <div className="w-4 h-4 rounded-full bg-[#55943b] flex items-center justify-center shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">فصل التيار الكهربائي من المفتاح الرئيسي فوراً</span>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-slate-100 flex gap-3 items-center bg-slate-50/50">
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                                        <div className="h-2 bg-slate-200 rounded-full w-1/2"></div>
                                    </div>
                                </div>

                                {/* Footer of Card */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                                    <div className="text-slate-455 font-semibold flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-[#074388]" />
                                        <span>المتبقي: </span>
                                        <span className="text-[#074388] font-bold">14:59</span>
                                    </div>
                                    <div className="px-4.5 py-2 bg-[#074388] hover:bg-[#0c53a7] text-white rounded-lg text-[11px] font-bold transition-all shadow-sm">
                                        إرسال الإجابة
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements (Minimally designed, clean, white cards) */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-8 -top-8 bg-white p-3.5 rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.05)] border border-slate-100/90 z-30 flex items-center gap-3"
                        >
                            <div className="w-8 h-8 bg-green-50 text-[#55943b] rounded-lg flex items-center justify-center shrink-0">
                                <CheckCircle size={18} />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-bold">حالة التقييم</div>
                                <div className="text-sm font-black text-slate-800">مكتمل وناجح ✅</div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -left-10 bottom-8 bg-white p-4 rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.05)] border border-slate-100/90 z-10 flex flex-col gap-1 items-start text-right"
                        >
                            <div className="w-8 h-8 bg-blue-50 text-[#074388] rounded-lg flex items-center justify-center mb-1">
                                <HeartHandshake className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">نتابعك خطوة بخطوة</span>
                            <span className="text-[10px] text-slate-400 font-semibold">حتى حصولك على الاعتماد</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
