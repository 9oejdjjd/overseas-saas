"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Clock, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";

interface ExamWelcomeProps {
    displayName: string;
    professionName: string;
    isRegistered: boolean;
    examDuration: number;
    passingScore: number;
    onStart: () => void;
}

export function ExamWelcome({
    displayName,
    professionName,
    isRegistered,
    examDuration,
    passingScore,
    onStart
}: ExamWelcomeProps) {
    return (
        <div className="min-h-[100dvh] bg-[#0a0f1c] flex flex-col font-sans">
            <MockExamNavbar title="بوابة الاعتماد المهني" />
            <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.06] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16539a]/25 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="relative z-10 text-center max-w-lg w-full"
                >
                    <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <BookOpen size={36} className="text-[#5c9e45]" />
                    </div>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm font-semibold text-blue-200/80 mb-6">
                        <Sparkles className="w-4 h-4 text-[#5c9e45]" />
                        اختبار تجريبي — {professionName}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                        مرحباً بك <span className="text-[#5c9e45]">{displayName}</span>
                    </h1>
                    <p className="text-slate-300/90 text-base md:text-lg mb-6 max-w-md mx-auto leading-relaxed">
                        {isRegistered 
                            ? "تم إنشاء هذا الاختبار التجريبي خصيصاً لك. هذا الاختبار يحاكي أسلوب اختبار الاعتماد المهني السعودي ويساعدك على معرفة مستواك والتحضير للاختبار الحقيقي."
                            : "هذا اختبار تجريبي يحاكي أسلوب اختبار الاعتماد المهني السعودي ويساعدك على معرفة مستواك."
                        }
                    </p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
                        <p className="text-sm text-orange-300/80 font-semibold">⚠️ تنبيه: هذا الاختبار تجريبي تدريبي فقط ولا يمثل الاختبار الرسمي للاعتماد المهني السعودي.</p>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 bg-white/[0.08] border border-white/15 p-5 rounded-2xl">
                            <Clock className="w-7 h-7 text-[#5c9e45] mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{examDuration} دقيقة</div>
                            <div className="text-xs text-slate-400">المدة الزمنية</div>
                        </div>
                        <div className="flex-1 bg-white/[0.08] border border-white/15 p-5 rounded-2xl">
                            <Trophy className="w-7 h-7 text-[#5c9e45] mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{passingScore}%</div>
                            <div className="text-xs text-slate-400">النجاح المطلوب</div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={onStart} 
                        className="w-full h-14 text-lg font-bold bg-gradient-to-l from-[#16539a] to-[#2563eb] hover:from-[#1e66b8] text-white rounded-2xl shadow-xl shadow-blue-900/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                        دخول بوابة الاختبار
                        <ArrowLeft size={20} />
                    </Button>
                </motion.div>
            </main>
        </div>
    );
}
