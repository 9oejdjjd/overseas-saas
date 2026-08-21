"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Wallet, Bell, Menu, User, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AgentHeader() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState("ريال");
    const [loadingBalance, setLoadingBalance] = useState(true);

    const userName = session?.user?.name || "الوكيل";

    // Determine Page Title in Arabic
    const getPageTitle = (path: string) => {
        if (path === "/agent") return "لوحة التحكم الرئيسية";
        if (path.startsWith("/agent/clients")) return "العملاء والاختبارات";
        if (path.startsWith("/agent/exams")) return "العملاء والاختبارات";
        if (path.startsWith("/agent/wallet")) return "المحفظة المالية والحركات";
        if (path.startsWith("/agent/settings")) return "الملف الشخصي والإعدادات";
        return "بوابة الوكلاء";
    };

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch("/api/agent/wallet");
                if (res.ok) {
                    const result = await res.json();
                    const b = result.data?.walletBalance !== undefined 
                        ? Number(result.data.walletBalance)
                        : (result.data?.balance?.walletBalance !== undefined 
                            ? Number(result.data.balance.walletBalance) 
                            : Number(result.balance || 0));
                    setBalance(b);
                    if (result.data?.currency === "SAR") {
                        setCurrency("ر.س");
                    } else {
                        setCurrency("ريال");
                    }
                }
            } catch (err) {
                console.error("Failed to load agent balance", err);
            } finally {
                setLoadingBalance(false);
            }
        };

        if (session) {
            fetchBalance();
        }
    }, [session, pathname]); // Refetch balance on navigation

    const isNegative = balance !== null && balance < 0;

    return (
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 md:px-6 flex items-center justify-between relative z-10 shadow-sm">
            {/* Right Side: Page Title */}
            <div className="flex items-center gap-3">
                <button className="md:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                    <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-base md:text-lg font-black text-slate-800 dark:text-white">
                    {getPageTitle(pathname)}
                </h1>
            </div>

            {/* Left Side: Wallet + Notifications + Profile */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Wallet Balance widget (Clickable Link to Wallet Page) */}
                <Link
                    href="/agent/wallet"
                    title="انقر لفتح وتفاصيل المحفظة المالية"
                    className={cn(
                        "group flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all duration-200 shadow-sm cursor-pointer",
                        isNegative
                            ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300"
                            : "bg-[#074388]/10 hover:bg-[#074388]/15 border-[#074388]/20 text-[#074388] dark:bg-[#074388]/20 dark:border-[#074388]/40 dark:text-blue-300"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isNegative ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40" : "bg-[#074388]/15 text-[#074388] dark:bg-[#074388]/30 dark:text-blue-200"
                    )}>
                        {isNegative ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Wallet className="h-4 w-4 shrink-0" />}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-bold opacity-80 flex items-center gap-1">
                            رصيد المحفظة
                            {isNegative && <span className="text-[8px] text-rose-600 dark:text-rose-400 font-extrabold">(مكشوف)</span>}
                        </span>
                        <div className="text-xs font-black flex items-center gap-1 mt-0.5 font-sans">
                            {loadingBalance ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <>
                                    <span className={cn(isNegative && "text-rose-700 dark:text-rose-300 font-extrabold")}>
                                        {balance !== null ? balance.toLocaleString("ar-YE") : "0"}
                                    </span>
                                    <span className="text-[9px] font-bold">{currency}</span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Notifications */}
                <button className="p-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-300 relative transition-all duration-200">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-[#55943b] rounded-full"></span>
                </button>

                {/* Profile Widget */}
                <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-3 md:pr-4">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300">
                        {userName}
                    </span>
                </div>
            </div>
        </header>
    );
}
