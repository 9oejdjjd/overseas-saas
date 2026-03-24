"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X, Award } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    if (pathname !== '/') return null;

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setMobileOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (window.location.pathname !== '/') {
            window.location.href = `/#${id}`;
        }
    };

    const navLinks = [
        { id: "hero", label: "الرئيسية" },
        { id: "about", label: "خدماتنا" },
        { id: "search", label: "ابدأ اختبارك" },
        { id: "achievements", label: "إنجازاتنا" },
        { id: "faq", label: "أسئلة شائعة" },
        { id: "contact", label: "تواصل معنا" },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                className={`pointer-events-auto transition-all duration-500 w-full px-6 md:px-12 lg:px-16 flex items-center justify-between ${
                    scrolled 
                    ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-slate-100 h-[72px]' 
                    : 'bg-transparent h-[88px]'
                }`}
            >
                {/* Logo Area — accepts any size logo */}
                <Link 
                    href="/" 
                    onClick={(e) => scrollToSection(e, 'hero')} 
                    className="flex items-center gap-3 shrink-0"
                >
                    {/* Logo image placeholder — replace src with your actual logo */}
                    <div className={`flex items-center justify-center transition-all duration-300 ${scrolled ? 'h-11' : 'h-14'}`}>
                        <img 
                            src="/logo.png" 
                            alt="بوابة الاعتماد المهني" 
                            className="h-full w-auto object-contain"
                            onError={(e) => {
                                // Fallback if logo not found
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        {/* Fallback text logo — hidden when image loads */}
                        <div className={`hidden items-center gap-2.5 ${scrolled ? 'text-slate-800' : 'text-white'}`}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16539a] to-[#5c9e45] flex items-center justify-center text-white shadow-lg">
                                <Award size={22} />
                            </div>
                            <span className="text-lg font-bold tracking-tight">بوابة الاعتماد المهني</span>
                        </div>
                    </div>
                </Link>
                
                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1 lg:gap-2">
                    {navLinks.map(link => (
                        <a 
                            key={link.id}
                            href={`#${link.id}`} 
                            onClick={(e) => scrollToSection(e, link.id)} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 relative group ${
                                scrolled 
                                    ? 'text-slate-600 hover:text-[#16539a] hover:bg-blue-50' 
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {link.label}
                            <span className={`absolute bottom-0 right-1/2 translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-3/4 ${
                                scrolled ? 'bg-[#5c9e45]' : 'bg-white/60'
                            }`}></span>
                        </a>
                    ))}
                </div>

                {/* CTA Button (Desktop) */}
                <div className="hidden md:block">
                    <a 
                        href="#search" 
                        onClick={(e) => scrollToSection(e, 'search')} 
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                            scrolled 
                                ? 'bg-[#16539a] text-white border-[#16539a] hover:bg-[#1e66b8] shadow-lg shadow-blue-900/10' 
                                : 'bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md'
                        }`}
                    >
                        ابدأ اختبارك المجاني
                    </a>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className={`md:hidden p-2.5 rounded-xl transition-colors ${
                        scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                    }`} 
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-auto bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-slate-100 md:hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-1">
                            {navLinks.map(link => (
                                <a 
                                    key={link.id}
                                    href={`#${link.id}`} 
                                    onClick={(e) => scrollToSection(e, link.id)} 
                                    className="py-3 px-4 rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:text-[#16539a] transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <a 
                                href="#search" 
                                onClick={(e) => scrollToSection(e, 'search')} 
                                className="mt-2 py-3 px-4 rounded-xl bg-[#16539a] text-white font-bold text-center shadow-lg"
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
