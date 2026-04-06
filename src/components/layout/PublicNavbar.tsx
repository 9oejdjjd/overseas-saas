"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function PublicNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setMobileOpen(false);
        
        if (isHomePage) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Navigate to homepage with hash
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

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 md:px-6 pt-4 md:pt-6 transition-all duration-500">
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
                                // Fallback if logo not found
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
                <div className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 absolute left-1/2 -translate-x-1/2">
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

                {/* CTA Button (Desktop) & Mobile Toggle - LEFT SIDE */}
                <div className="flex items-center gap-3">
                    <a 
                        href="#search" 
                        onClick={(e) => scrollToSection(e, 'search')} 
                        className={`hidden md:flex items-center justify-center px-7 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                            scrolled 
                                ? 'bg-gradient-to-r from-[#16539a] to-blue-600 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5' 
                                : 'bg-white text-[#16539a] hover:bg-blue-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105'
                        }`}
                    >
                        ابدأ اختبارك
                    </a>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className={`lg:hidden p-2.5 rounded-full transition-colors flex items-center justify-center ${
                            scrolled ? 'text-slate-800 bg-slate-100/50 hover:bg-slate-200' : 'text-white bg-white/10 hover:bg-white/20'
                        }`} 
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle Menu"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="pointer-events-auto absolute top-[90px] left-4 right-4 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-3xl border border-slate-100 lg:hidden overflow-hidden"
                    >
                        <div className="p-4 flex flex-col gap-1">
                            {navLinks.map(link => (
                                <a 
                                    key={link.id}
                                    href={`#${link.id}`} 
                                    onClick={(e) => scrollToSection(e, link.id)} 
                                    className="py-3.5 px-5 rounded-2xl text-slate-700 font-bold hover:bg-blue-50 hover:text-[#16539a] transition-colors flex items-center"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="h-px w-full bg-slate-100 my-2"></div>
                            <a 
                                href="#search" 
                                onClick={(e) => scrollToSection(e, 'search')} 
                                className="py-4 px-5 rounded-2xl bg-gradient-to-r from-[#16539a] to-blue-600 text-white font-bold text-center shadow-lg transform active:scale-95 transition-transform"
                            >
                                ابدأ اختبارك المجاني
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
