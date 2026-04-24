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
            className={`sticky top-0 z-50 w-full transition-all duration-500 ${
                scrolled 
                    ? 'bg-white/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-white/50' 
                    : 'bg-white/10 backdrop-blur-md border-b border-white/10'
            }`}
        >
            <div className="w-full px-4 md:px-10 h-[62px] md:h-[68px] flex items-center justify-between">
                {/* Left Side: Back button or leftElement (e.g. Timer) */}
                <div className="flex items-center">
                    {!hideBackUrl ? (
                        <button 
                            onClick={() => router.push("/")} 
                            className={`flex items-center gap-2 transition-colors group ${
                                scrolled ? 'text-slate-500 hover:text-[#16539a]' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                scrolled 
                                    ? 'bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100' 
                                    : 'bg-white/10 border border-white/20 group-hover:bg-white/20'
                            }`}>
                                <ArrowRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <span className={`font-bold text-sm hidden sm:block ${scrolled ? '' : 'text-white/80'}`}>العودة</span>
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
                        className="h-7 md:h-9 w-auto object-contain"
                        width="180"
                        height="40"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    {/* Fallback if no logo image */}
                    <div className="hidden items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16539a] to-[#5c9e45] flex items-center justify-center text-white shadow-md">
                            <Award size={16} />
                        </div>
                        <span className={`font-bold text-sm hidden sm:block ${scrolled ? 'text-slate-800' : 'text-white'}`}>بوابة الاعتماد المهني</span>
                    </div>
                </div>

                {/* Right Side: Title (on exam pages) */}
                <div className="flex items-center">
                    {hideBackUrl && leftElement ? (
                        <div></div> 
                    ) : (
                        <h1 className={`font-bold text-sm hidden lg:block truncate max-w-[200px] ${scrolled ? 'text-slate-500' : 'text-white/60'}`}>{title}</h1>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
