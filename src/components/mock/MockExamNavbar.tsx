"use client";
import { useState } from "react";
import { ArrowRight, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import React from "react";

export function MockExamNavbar({ 
    title = "الاعتماد المهني", 
    leftElement,
    hideBackUrl = false 
}: { 
    title?: string;
    leftElement?: React.ReactNode;
    hideBackUrl?: boolean;
}) {
    const router = useRouter();
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 30);
    });

    return (
        <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="sticky top-0 z-50 w-full transition-all duration-500 bg-white/95 backdrop-blur-xl shadow-[0_2px_15px_rgba(15,23,42,0.03)] border-b border-slate-200/60"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="w-full px-4 md:px-10 h-[64px] md:h-[72px] flex items-center justify-between">
                {/* Left Side: Back button or leftElement (e.g. Timer) */}
                <div className="flex items-center">
                    {!hideBackUrl ? (
                        <button 
                            onClick={() => router.push("/")} 
                            className="flex items-center gap-2.5 transition-colors group text-slate-600 hover:text-[#16539a]"
                        >
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-colors bg-slate-50 border border-slate-200/80 group-hover:bg-blue-50 group-hover:border-blue-100 text-slate-500 group-hover:text-brand-blue shadow-sm">
                                <ArrowRight size={16} className="md:w-[18px] md:h-[18px] transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <span className="font-bold text-xs md:text-sm hidden sm:block">العودة للرئيسية</span>
                        </button>
                    ) : (
                        leftElement || <div></div>
                    )}
                </div>
                
                {/* Center: Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                    <img 
                        src="/logo1.png" 
                        alt="بوابة الاعتماد المهني" 
                        className="h-9 md:h-11 w-auto object-contain brightness-100"
                        width="180"
                        height="44"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    {/* Fallback if no logo image */}
                    <div className="hidden items-center gap-2">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#16539a] to-[#5c9e45] flex items-center justify-center text-white shadow-md">
                            <Award size={18} />
                        </div>
                        <span className="font-bold text-sm md:text-base hidden sm:block text-slate-800">بوابة الاعتماد المهني</span>
                    </div>
                </div>

                {/* Right Side: Title (on exam pages) */}
                <div className="flex items-center">
                    {hideBackUrl && leftElement ? (
                        <div></div> 
                    ) : (
                        <h1 className="font-bold text-xs md:text-sm text-slate-500 hidden lg:block truncate max-w-[200px]">{title}</h1>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
