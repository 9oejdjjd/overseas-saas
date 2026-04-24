"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Home, BookOpen, PenLine, Phone } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState("hero");
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    // Hide completely on session/exam pages
    const isSessionPage = pathname?.startsWith('/session');
    if (isSessionPage) return null;

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
        e.preventDefault();
        setActiveTab(id);
        
        if (isHomePage) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            window.location.href = `/#${id}`;
        }
    };

    const navLinks = isHomePage ? [
        { id: "hero", label: "الرئيسية" },
        { id: "about", label: "خدماتنا" },
        { id: "search", label: "ابدأ اختبارك" },
        { id: "achievements", label: "إنجازاتنا" },
        { id: "faq", label: "أسئلة شائعة" },
        { id: "contact", label: "تواصل معنا" },
    ] : [
        { id: "hero", label: "الرئيسية" },
        { id: "about", label: "خدماتنا" },
        { id: "search", label: "ابدأ اختبارك" },
        { id: "contact", label: "تواصل معنا" },
    ];

    const mobileTabItems = [
        { id: "hero", label: "الرئيسية", icon: Home },
        { id: "about", label: "خدماتنا", icon: BookOpen },
        { id: "search", label: "اختبارك", icon: PenLine, isMain: true },
        { id: "contact", label: "تواصل معنا", icon: Phone },
    ];

    return (
        <>
            {/* ===== DESKTOP NAVBAR (lg+) — Preserved exactly as original ===== */}
            <div className="hidden lg:flex fixed top-0 left-0 right-0 z-50 justify-center pointer-events-none px-4 md:px-6 pt-4 md:pt-6 transition-all duration-500">
                <motion.nav 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                    className={`pointer-events-auto transition-all duration-500 w-full max-w-7xl flex items-center justify-between px-6 lg:px-8 border rounded-full ${
                        scrolled 
                        ? 'bg-white/80 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-white/40 h-[70px]' 
                        : 'bg-white/10 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-white/20 h-[80px]'
                    }`}
                >
                    {/* Logo Area */}
                    <Link 
                        href="/" 
                        onClick={(e) => scrollToSection(e, 'hero')} 
                        className="flex items-center gap-3 shrink-0 h-full py-2 group"
                    >
                        <div className="relative h-full flex items-center transition-transform duration-300 group-hover:scale-105">
                            <img 
                                src="/logo1.png" 
                                alt="شعار بوابة الاعتماد المهني" 
                                className="h-10 md:h-12 w-auto object-contain"
                                width="180" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            {/* Box fallback if image is totally missing or fails to load */}
                            <div className="hidden text-sm font-black tracking-tight" style={{ color: scrolled ? '#16539a' : '#ffffff' }}>
                                بوابة الاعتماد المهني
                            </div>
                        </div>
                    </Link>
                    
                    {/* Desktop Links - CENTERED */}
                    <div className="flex items-center justify-center gap-1 xl:gap-2 absolute left-1/2 -translate-x-1/2">
                        {navLinks.map(link => (
                            <a 
                                key={link.id}
                                href={`#${link.id}`} 
                                onClick={(e) => scrollToSection(e, link.id)} 
                                className={`px-5 py-2.5 rounded-full text-[15px] font-bold transition-all duration-300 relative group overflow-hidden ${
                                    scrolled 
                                        ? 'text-slate-600 hover:text-[#16539a] hover:bg-blue-50/50' 
                                        : 'text-white/90 hover:text-white hover:bg-white/15'
                                }`}
                            >
                                <span className="relative z-10">{link.label}</span>
                            </a>
                        ))}
                    </div>

                    {/* CTA Button (Desktop) */}
                    <div className="flex items-center gap-3">
                        <a 
                            href="#search" 
                            onClick={(e) => scrollToSection(e, 'search')} 
                            className={`flex items-center justify-center px-7 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                                scrolled 
                                    ? 'bg-gradient-to-r from-[#16539a] to-blue-600 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5' 
                                    : 'bg-white text-[#16539a] hover:bg-blue-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105'
                            }`}
                        >
                            ابدأ اختبارك
                        </a>
                    </div>
                </motion.nav>
            </div>

            {/* ===== MOBILE: Top Logo Bar (< lg) ===== */}
            <motion.div 
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-white/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-white/50'
                        : 'bg-white/10 backdrop-blur-md border-b border-white/10'
                }`}
            >
                <div className="flex items-center justify-center h-14 px-4">
                    <Link href="/" onClick={(e) => scrollToSection(e, 'hero')} className="flex items-center">
                        <img 
                            src="/logo1.png" 
                            alt="شعار بوابة الاعتماد المهني" 
                            className="h-8 w-auto object-contain"
                            width="160"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden text-sm font-black" style={{ color: scrolled ? '#16539a' : '#ffffff' }}>
                            بوابة الاعتماد المهني
                        </div>
                    </Link>
                </div>
            </motion.div>

            {/* ===== MOBILE: Bottom Tab Bar (< lg) ===== */}
            <motion.div 
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring", delay: 0.3 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
                <div 
                    className="mx-3 mb-3 bg-white/85 backdrop-blur-2xl border border-white/50 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] rounded-[1.75rem]"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    <div className="flex items-end justify-around px-1 h-[68px]">
                        {mobileTabItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            
                            if (item.isMain) {
                                return (
                                    <button
                                        key={item.id}
                                        onClick={(e) => {
                                            scrollToSection(e, item.id);
                                            try { navigator.vibrate?.(10); } catch {}
                                        }}
                                        className="flex flex-col items-center justify-center flex-1 -mt-4 relative"
                                    >
                                        <div className="w-[52px] h-[52px] bg-gradient-to-br from-[#16539a] to-blue-600 rounded-[1.1rem] flex items-center justify-center shadow-lg shadow-blue-900/30 border-[3px] border-white transition-transform duration-200 active:scale-90">
                                            <Icon size={24} strokeWidth={2.5} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-[#16539a] mt-1">{item.label}</span>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={item.id}
                                    onClick={(e) => {
                                        scrollToSection(e, item.id);
                                        try { navigator.vibrate?.(10); } catch {}
                                    }}
                                    className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 ${
                                        isActive ? 'text-[#16539a]' : 'text-slate-400'
                                    }`}
                                >
                                    <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50' : ''}`}>
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                    </div>
                                    <span className={`text-[10px] mt-0.5 transition-all duration-300 ${isActive ? 'font-black' : 'font-semibold'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileActiveTab"
                                            className="absolute bottom-1 w-1 h-1 bg-[#16539a] rounded-full"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
