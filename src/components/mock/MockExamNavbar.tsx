"use client";
import { ArrowRight, Award } from "lucide-react";
import { useRouter } from "next/navigation";
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

    return (
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm w-full">
            <div className="w-full px-4 md:px-10 h-[68px] flex items-center justify-between">
                {/* Left Side: Back button or leftElement (e.g. Timer) */}
                <div className="flex items-center">
                    {!hideBackUrl ? (
                        <button onClick={() => router.push("/")} className="text-slate-500 hover:text-[#16539a] flex items-center gap-2 transition-colors group">
                            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <ArrowRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <span className="font-bold text-sm hidden sm:block">العودة</span>
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
                        className="h-16 md:h-20 w-auto object-contain max-w-[300px] transform scale-110"
                        width="300"
                        height="80"
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
                        <span className="font-bold text-sm text-slate-800 hidden sm:block">بوابة الاعتماد المهني</span>
                    </div>
                </div>

                {/* Right Side: Title (on exam pages) */}
                <div className="flex items-center">
                    {hideBackUrl && leftElement ? (
                        <div></div> 
                    ) : (
                        <h1 className="font-bold text-sm text-slate-500 hidden lg:block truncate max-w-[200px]">{title}</h1>
                    )}
                </div>
            </div>
        </header>
    );
}
