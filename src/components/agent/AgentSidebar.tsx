"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export function AgentSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const navigation = [
        { name: "الرئيسية", href: "/agent", icon: LayoutDashboard },
        { name: "العملاء والاختبارات", href: "/agent/clients", icon: Users },
        { name: "الإعدادات", href: "/agent/settings", icon: Settings },
    ];

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-[#074388] text-white transition-all duration-300 ease-in-out relative z-20 shadow-2xl border-l border-white/10",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header: Brand Logo */}
            <div className="h-20 flex items-center justify-center px-4 border-b border-white/10 bg-[#074388]/80 backdrop-blur">
                {!collapsed ? (
                    <div className="flex items-center justify-center w-full px-2 animate-in fade-in duration-300">
                        <img 
                            src="/logo2.png" 
                            alt="بوابة الاعتماد المهني" 
                            className="h-16 w-auto object-contain max-w-full"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full animate-in fade-in duration-300">
                        <img 
                            src="/logo2.png" 
                            alt="Logo" 
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/agent" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-xl px-4 py-3 text-sm transition-all duration-200 mb-1 group font-bold font-sans",
                                isActive
                                    ? "bg-[#55943b] text-white shadow-lg shadow-[#55943b]/25 border-r-4 border-white"
                                    : "hover:text-white hover:bg-white/5 text-white/70 hover:translate-x-[-2px]",
                                collapsed && "justify-center px-2 border-r-0 hover:translate-x-0"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105", collapsed ? "ml-0" : "ml-3")} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Trigger (Floating button) */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -left-3 top-24 bg-white dark:bg-slate-800 text-[#074388] dark:text-white p-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
            >
                {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>

            {/* Logout Footer */}
            <div className="p-4 border-t border-white/10 bg-black/10">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl py-3 font-bold transition-all duration-200 cursor-pointer",
                        collapsed ? "justify-center" : "px-4"
                    )}
                >
                    <LogOut className={cn("h-5 w-5 shrink-0", collapsed ? "ml-0" : "ml-3")} />
                    {!collapsed && <span>تسجيل خروج</span>}
                </button>
            </div>
        </div>
    );
}
