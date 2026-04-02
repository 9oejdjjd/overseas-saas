"use client";

import { motion } from "framer-motion";
import { CheckCircle, Sparkles, HeartHandshake } from "lucide-react";
import { HeroSearchSection } from "./HeroSearchSection";

interface Profession {
    id: string;
    name: string;
    slug: string;
}

export function HeroSection({ professions }: { professions: Profession[] }) {
    return (
        <section id="hero" className="relative min-h-[92vh] flex items-center pt-28 pb-20 overflow-hidden bg-[#0a0f1c] text-white">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.07] mix-blend-overlay"></div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#16539a]/20 rounded-full blur-[120px]"
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#5c9e45]/15 rounded-full blur-[120px]"
                />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 z-0 hidden md:block pointer-events-none">
                {[
                    { x: "15vw", delay: 1, duration: 15 },
                    { x: "35vw", delay: 2.5, duration: 18 },
                    { x: "55vw", delay: 0.5, duration: 12 },
                    { x: "75vw", delay: 4, duration: 20 },
                    { x: "85vw", delay: 1.5, duration: 14 },
                    { x: "25vw", delay: 3, duration: 16 },
                ].map((p, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: "100vh", x: p.x, opacity: 0 }}
                        animate={{
                            y: "-20vh",
                            x: `calc(${p.x} - 20px)`,
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear"
                        }}
                        className="absolute w-1.5 h-1.5 bg-white/20 rounded-full blur-[1px]"
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">

                {/* LEFT CONTENT */}
                <div className="text-right flex flex-col items-start pt-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl mb-8 shadow-[0_0_30px_rgba(22,83,154,0.2)]"
                    >
                        <Sparkles className="w-4 h-4 text-[#5c9e45] animate-pulse" />
                        <span className="text-sm font-semibold text-blue-100/80">اختبار تجريبي مجاني • نتيجة فورية</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="text-4xl md:text-6xl lg:text-[4.2rem] font-bold mb-6 leading-[1.2] tracking-tight"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-l from-white via-white to-white/80">
                            هل أنت مستعد للعمل في السعودية؟
                        </span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c9e45] via-[#6cc650] to-[#5c9e45] inline-block mt-3 drop-shadow-[0_0_30px_rgba(92,158,69,0.3)]">
                            نؤهلك لاجتياز فحص الاعتماد المهني
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="text-base md:text-lg text-slate-300/90 mb-10 max-w-xl leading-relaxed"
                    >
                        منصة متخصصة تقدم اختبارات تجريبية تحاكي فحص الاعتماد المهني السعودي لمختلف المهن الحرفية. اختبر مستواك مجاناً وبكل موثوقية قبل الاختبار الحقيقي.
                    </motion.p>

                    {/* PROFESSION SEARCH — Interactive Client Component */}
                    <HeroSearchSection professions={professions} />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300/80"
                    >
                        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-[#5c9e45] drop-shadow-[0_0_6px_rgba(92,158,69,0.6)]" /> اختبار مجاني 100%</div>
                        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-[#5c9e45] drop-shadow-[0_0_6px_rgba(92,158,69,0.6)]" /> نتيجة فورية على الواتساب</div>
                        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-[#5c9e45] drop-shadow-[0_0_6px_rgba(92,158,69,0.6)]" /> أسئلة محدّثة</div>
                    </motion.div>
                </div>

                {/* RIGHT CONTENT (3D Card) */}
                <div className="hidden lg:block relative h-full flex items-center justify-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: [0, -12, 0], opacity: 1 }}
                        transition={{
                            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 0.8 }
                        }}
                        className="relative z-20 w-full max-w-md mx-auto"
                    >
                        {/* Mock UI Card */}
                        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/15 p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5c9e45]/50 to-transparent"></div>

                            <div className="flex justify-between items-center mb-8">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
                                </div>
                                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-slate-300/70">اختبار_تجريبي</div>
                            </div>

                            <h3 className="text-xl font-bold mb-4 text-white">اختبار عامل تحميل وتنزيل</h3>
                            <div className="space-y-3 mb-6">
                                <div className="h-3 bg-white/10 rounded-full w-3/4"></div>
                                <div className="h-3 bg-white/10 rounded-full w-full"></div>
                                <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-xl border border-white/15 flex gap-3 items-center group cursor-pointer hover:bg-white/5 transition-colors">
                                    <div className="w-5 h-5 rounded-full border border-slate-400/50 group-hover:border-[#5c9e45]"></div>
                                    <div className="h-3 bg-white/15 rounded-full w-2/3 group-hover:bg-white/30"></div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.08] border border-[#5c9e45]/40 flex gap-3 items-center shadow-[0_0_15px_rgba(92,158,69,0.15)]">
                                    <div className="w-5 h-5 rounded-full bg-[#5c9e45] flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                    <div className="h-3 bg-white/40 rounded-full w-1/2"></div>
                                </div>
                                <div className="p-4 rounded-xl border border-white/15 flex gap-3 items-center group cursor-pointer hover:bg-white/5 transition-colors">
                                    <div className="w-5 h-5 rounded-full border border-slate-400/50 group-hover:border-[#5c9e45]"></div>
                                    <div className="h-3 bg-white/15 rounded-full w-3/4 group-hover:bg-white/30"></div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center">
                                <div className="text-slate-400/70 text-sm">المتبقي: <span className="text-[#5c9e45] font-bold">14:59</span></div>
                                <div className="px-5 py-2 bg-gradient-to-l from-[#16539a] to-[#2563eb] rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30">تسليم</div>
                            </div>
                        </div>

                        {/* Floating cards */}
                        <motion.div
                            animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-10 -top-10 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 z-30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                                    <CheckCircle size={18} />
                                </div>
                                <div>
                                    <div className="text-[11px] text-slate-500 font-bold">نتيجة الاختبار</div>
                                    <div className="text-lg font-black text-slate-800">ناجح ✅</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 18, 0], rotate: [0, -3, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -left-14 bottom-12 bg-gradient-to-br from-[#16539a] to-blue-800 p-4 rounded-2xl shadow-2xl z-10"
                        >
                            <HeartHandshake className="w-7 h-7 text-white mb-1.5" />
                            <div className="text-white font-bold text-sm">نتابعك خطوة بخطوة</div>
                            <div className="text-blue-200/80 text-xs">حتى تحصل على الاعتماد</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
