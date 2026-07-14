"use client";
  
import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Home, BookOpen, PenLine, Phone, Tag } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 30);
    });

    // Hide completely on session/exam pages or dynamic registration pages [slug]
    const isSessionPage = pathname?.startsWith('/session');
    const staticRoutes = ['/guide', '/pricing', '/blog', '/contact', '/about', '/checkout', '/professions'];
    const isRegistrationPage = pathname !== '/' && !staticRoutes.some(route => pathname?.startsWith(route));
    if (isSessionPage || isRegistrationPage) return null;

    // Force scrolled state (solid navbar) on subpages to ensure readability
    const showSolidNavbar = scrolled || !isHomePage;

    // Desktop nav links (Removed "Our Services" to clean up desktop layout)
    const navLinks = [
        { id: "hero", label: "الرئيسية", path: "/" },
        { id: "services", label: "خدماتنا", path: "/#services" },
        { id: "achievements", label: "إنجازاتنا", path: "/#achievements" },
        { id: "faq", label: "الأسئلة الشائعة", path: "/#faq" },
        { id: "contact", label: "تواصل معنا", path: "/contact" },
    ];

    // Mobile Bottom Tab Bar items
    const mobileTabItems = [
        { id: "hero", label: "الرئيسية", icon: Home, path: "/" },
        { id: "services", label: "خدماتنا", icon: BookOpen, path: "/#services" },
        { id: "search", label: "ابدأ اختبارك", icon: PenLine, path: "/#search", isMain: true },
        { id: "faq", label: "الأسئلة", icon: Tag, path: "/#faq" },
        { id: "contact", label: "تواصل", icon: Phone, path: "/contact" },
    ];

    // Detect active path
    const getActiveTab = () => {
        if (pathname === '/contact') return 'contact';
        return 'hero';
    };

    const activeTab = getActiveTab();

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, path: string) => {
        if (path.startsWith('/#') && isHomePage) {
            e.preventDefault();
            const id = path.replace('/#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <>
            {/* ===== DESKTOP NAVBAR (lg+) ===== */}
            <div className="hidden lg:flex fixed top-0 left-0 right-0 z-50 justify-center pointer-events-none px-6 pt-5 transition-all duration-500">
                <motion.nav 
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                    className={`pointer-events-auto transition-all duration-500 w-full max-w-7xl flex items-center justify-between px-8 border rounded-[2rem] relative overflow-hidden ${
                        showSolidNavbar 
                        ? 'bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border-slate-200/60 h-[72px]' 
                        : 'bg-[#16539a] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.1)] border-[#16539a] h-[80px]'
                    }`}
                >
                    {/* Top edge glow accent */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-white/40 opacity-70" />

                    {/* Logo Area */}
                    <Link 
                        href="/"
                        className="flex items-center gap-3 shrink-0 h-full py-2 group"
                    >
                        <div className="relative h-full flex items-center transition-transform duration-300 group-hover:scale-102">
                            <img 
                                src="/logo1.png" 
                                alt="شعار بوابة الاعتماد المهني" 
                                className={`h-11 md:h-12 w-auto object-contain transition-all duration-300 ${
                                    showSolidNavbar ? 'brightness-100' : 'brightness-0 invert'
                                }`}
                                width="185" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            {/* Fallback if logo fails to load */}
                            <div className={`hidden font-black tracking-tight text-lg transition-colors duration-300 ${
                                showSolidNavbar ? 'text-brand-blue' : 'text-white'
                             }`}>
                                بوابة الاعتماد المهني
                            </div>
                        </div>
                    </Link>
                    
                    {/* Desktop Links - CENTERED */}
                    <div className="flex items-center justify-center gap-1 xl:gap-2 absolute left-1/2 -translate-x-1/2">
                        {navLinks.map(link => {
                            const isLinkActive = activeTab === link.id || (link.id === 'hero' && pathname === '/');
                            return (
                                <Link 
                                    key={link.id}
                                    href={link.path} 
                                    onClick={(e) => handleLinkClick(e, link.path)} 
                                    className={`px-5 py-2.5 rounded-xl text-[14px] font-black transition-all duration-300 relative group overflow-hidden ${
                                        showSolidNavbar 
                                            ? isLinkActive
                                                ? 'text-[#16539a] bg-blue-50/80 shadow-sm' 
                                                : 'text-slate-650 hover:text-[#16539a] hover:bg-slate-50'
                                            : isLinkActive
                                                ? 'text-white bg-white/20'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span className="relative z-10">{link.label}</span>
                                    {isLinkActive && (
                                        <motion.div 
                                            layoutId="activeIndicator"
                                            className={`absolute bottom-1.5 left-5 right-5 h-0.5 rounded-full ${
                                                showSolidNavbar ? 'bg-[#16539a]' : 'bg-white'
                                            }`}
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* CTA Button (Desktop) */}
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/#search"
                            onClick={(e) => handleLinkClick(e, '/#search')} 
                            className={`flex items-center justify-center px-6 py-2.5 rounded-xl text-[13px] font-black transition-all duration-300 shadow-sm hover:shadow active:scale-95 ${
                                showSolidNavbar 
                                    ? 'bg-[#16539a] text-white hover:bg-[#1f66b8] shadow-[#16539a]/10 hover:shadow-lg' 
                                    : 'bg-white text-[#16539a] hover:bg-slate-50'
                            }`}
                        >
                            ابدأ اختبارك مجاناً
                        </Link>
                    </div>
                </motion.nav>
            </div>

            {/* ===== MOBILE: Top Logo Bar ===== */}
            <motion.div 
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
                    showSolidNavbar
                        ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_25px_rgba(15,23,42,0.04)] border-slate-200/50'
                        : 'bg-[#16539a] shadow-md border-[#16539a]'
                }`}
            >
                <div className="flex items-center justify-center h-16 px-4">
                    <Link href="/" className="flex items-center">
                        <img 
                            src="/logo1.png" 
                            alt="شعار بوابة الاعتماد المهني" 
                            className={`h-9 w-auto object-contain transition-all duration-300 ${
                                showSolidNavbar ? 'brightness-100' : 'brightness-0 invert'
                            }`}
                            width="160"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className={`hidden font-black text-md transition-colors ${
                            showSolidNavbar ? 'text-brand-blue' : 'text-white'
                        }`}>
                            بوابة الاعتماد المهني
                        </div>
                    </Link>
                </div>
            </motion.div>

            {/* ===== MOBILE: Bottom Tab Bar (Overhauled Floating iOS Dock) ===== */}
            <motion.div 
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-5 pb-5 pointer-events-none"
            >
                <div 
                    className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-2xl border border-slate-200/50 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] rounded-[2.2rem] p-2 pointer-events-auto"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) / 2)' }}
                >
                    <div className="flex items-end justify-around px-1 h-[70px] relative">
                        {mobileTabItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id || (item.id === 'hero' && pathname === '/');
                            
                            // Futuristic Floating Action Button in the center
                            if (item.isMain) {
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.path}
                                        onClick={(e) => {
                                            handleLinkClick(e, item.path);
                                            try { navigator.vibrate?.(15); } catch {}
                                        }}
                                        className="flex flex-col items-center justify-center flex-1 -mt-7 relative z-10"
                                    >
                                        <div className="relative flex items-center justify-center">
                                            {/* Outer double aura rings */}
                                            <span className="absolute inline-flex h-14 w-14 rounded-full bg-brand-green/20 animate-ping opacity-75" />
                                            <span className="absolute inline-flex h-16 w-16 rounded-full bg-brand-blue/10 animate-pulse opacity-50" />
                                            
                                            <div className="w-[58px] h-[58px] bg-gradient-to-br from-[#16539a] via-[#1f66b8] to-[#5c9e45] rounded-[1.4rem] flex items-center justify-center shadow-lg shadow-blue-900/30 border-[4px] border-white transition-transform duration-200 active:scale-90">
                                                <Icon size={24} strokeWidth={2.5} className="text-white" />
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-[#16539a] mt-1.5">{item.label}</span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.id}
                                    href={item.path}
                                    onClick={() => {
                                        try { navigator.vibrate?.(10); } catch {}
                                    }}
                                    className={`flex flex-col items-center justify-center flex-1 pb-2.5 pt-1.5 transition-all duration-300 relative ${
                                        isActive ? 'text-[#16539a]' : 'text-slate-400'
                                    }`}
                                >
                                    <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50/90 text-[#16539a] scale-105' : 'hover:bg-slate-50'}`}>
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                                    </div>
                                    <span className={`text-[9px] mt-1 transition-all duration-300 ${isActive ? 'font-black text-[#16539a]' : 'font-bold'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileActiveTabDot"
                                            className="absolute bottom-0 w-1 h-1 bg-[#16539a] rounded-full"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
