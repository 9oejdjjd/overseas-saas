"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, ArrowLeft, Check, LayoutGrid, AlertTriangle, XCircle } from "lucide-react";
import { MockExamNavbar } from "@/components/mock/MockExamNavbar";

interface ExamActiveRoomProps {
    professionName: string;
    questions: any[];
    currentQuestionIdx: number;
    setCurrentQuestionIdx: (idx: number) => void;
    answers: any[];
    timeLeft: number;
    isSubmitting: boolean;
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    showSubmitConfirm: boolean;
    setShowSubmitConfirm: (show: boolean) => void;
    onSelectOption: (questionId: string, optionId: string) => void;
    onSubmit: () => void;
    onExecuteSubmit: () => void;
}

export function ExamActiveRoom({
    professionName,
    questions,
    currentQuestionIdx,
    setCurrentQuestionIdx,
    answers,
    timeLeft,
    isSubmitting,
    showSidebar,
    setShowSidebar,
    showSubmitConfirm,
    setShowSubmitConfirm,
    onSelectOption,
    onSubmit,
    onExecuteSubmit
}: ExamActiveRoomProps) {
    const currentQuestion = questions[currentQuestionIdx];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId)?.selectedOptionId;

    const answeredCount = answers.length;
    const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const TimerComponent = (
        <div className={`flex items-center gap-1.5 md:gap-3 px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-base md:text-xl border-2 transition-colors ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse shadow-inner' : 'bg-slate-100 text-[#16539a] border-slate-200'}`}>
            <Clock size={18} className="shrink-0 md:w-6 md:h-6" />
            <span dir="ltr" className="tracking-widest">{formatTime(timeLeft)}</span>
        </div>
    );

    return (
        <div className="h-[100dvh] bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
            {/* The Unified Navbar spanning full width */}
            <MockExamNavbar 
                title={`قاعة الاختبار: ${professionName || ""}`} 
                hideBackUrl={true}
                leftElement={TimerComponent}
            />

            {/* Progress Bar - fixed thin bar showing answered progress */}
            <div className="h-1 w-full bg-slate-100 shrink-0">
                <motion.div 
                    className="h-full bg-gradient-to-l from-[#16539a] to-[#5c9e45]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Main Workspace Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Right Sidebar: Map & Progress */}
                <aside className={`w-full lg:w-[22rem] bg-white border-l border-slate-200 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.03)] z-30 transition-all duration-300 ${showSidebar ? 'fixed inset-0 lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
                    <div className="p-6 md:p-8 border-b border-slate-100 relative">
                        {/* Mobile Close Button */}
                        <button 
                            className="lg:hidden absolute top-6 left-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                            onClick={() => setShowSidebar(false)}
                        >
                            <XCircle size={20} />
                        </button>
                        
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <LayoutGrid className="text-[#16539a]" /> خريطة الأسئلة
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm mb-3">
                            <span className="font-bold text-slate-500">مستوى الإنجاز</span>
                            <span className="font-black text-[#5c9e45]">{answeredCount} / {questions.length}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-l from-[#16539a] to-[#5c9e45] transition-all duration-500 ease-out" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => {
                                const isAnswered = answers.some(a => a.questionId === q.questionId);
                                const isCurrent = currentQuestionIdx === idx;
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentQuestionIdx(idx);
                                            setShowSidebar(false);
                                        }}
                                        className={`w-full aspect-square rounded-xl font-bold flex items-center justify-center text-lg transition-all
                                            ${isCurrent 
                                                ? 'bg-[#16539a] text-white shadow-lg shadow-blue-900/40 ring-4 ring-blue-100 scale-110 z-10' 
                                                : isAnswered 
                                                    ? 'bg-blue-50 text-[#16539a] border-2 border-blue-200 hover:bg-blue-100' 
                                                    : 'bg-slate-50 text-slate-400 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-600'}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 hidden lg:block">
                        <Button 
                            onClick={onSubmit}
                            disabled={isSubmitting || answers.length < questions.length - 5}
                            className="w-full h-16 text-lg font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-2xl shadow-xl shadow-green-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Check size={24} />
                            {isSubmitting ? "جاري الإرسال..." : "إنهاء الاختبار وتسليمه"}
                        </Button>
                        <p className="text-xs text-center text-slate-400 mt-4 font-medium">الزر يتفعل عند الإجابة على أغلب الأسئلة.</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
                    
                    {/* Top Content Bar for Mobile toggle */}
                    <div className="h-16 border-b border-slate-200 bg-white flex items-center px-8 lg:hidden justify-between">
                         <div className="font-bold text-slate-500">السؤال {currentQuestionIdx + 1} من {questions.length}</div>
                         <Button variant="outline" onClick={() => setShowSidebar(!showSidebar)} className="rounded-xl border-slate-200 font-bold">
                             {showSidebar ? 'إغلاق الخريطة' : 'عرض الخريطة'}
                         </Button>
                    </div>

                    {/* Scrollable Question area */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-8 lg:p-14 custom-scrollbar">
                        <div className="max-w-[1200px] mx-auto w-full">
                            
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuestionIdx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                     {/* Question Card */}
                                    <div className="bg-white rounded-xl md:rounded-[2rem] p-4 md:p-10 lg:p-14 shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 mb-4 md:mb-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-[#16539a]"></div>
                                        <div className="flex flex-row items-start gap-3 md:gap-6">
                                            <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 bg-blue-50 text-[#16539a] rounded-lg md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl shadow-sm border border-blue-100">
                                                {currentQuestionIdx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-base md:text-2xl lg:text-3xl font-black text-slate-800 leading-[1.7] md:leading-[1.6]">
                                                    {currentQuestion?.question?.text || "جاري تحميل السؤال..."}
                                                </h2>
                                                {currentQuestion?.question?.imageUrl && (
                                                    <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 w-full">
                                                        <img 
                                                            src={currentQuestion.question.imageUrl} 
                                                            alt="صورة توضيحية للسؤال" 
                                                            className="max-h-[180px] md:max-h-[350px] w-full object-contain p-1 md:p-2"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Options Grid */}
                                    {currentQuestion?.question?.type === "TRUE_FALSE" ? (
                                        <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-4xl mx-auto">
                                            {currentQuestion?.question?.options?.map((opt: any) => {
                                                const isSelected = currentAnswer === opt.id;
                                                const isTrueOption = opt.text.includes("صح");
                                                
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => onSelectOption(currentQuestion.questionId, opt.id)}
                                                        className={`w-full p-5 md:p-10 rounded-xl md:rounded-[2rem] border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 md:gap-4 group relative overflow-hidden
                                                            ${isSelected 
                                                                ? "bg-blue-50 border-[#16539a] shadow-[0_8px_30px_rgba(22,83,154,0.12)]"
                                                                : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
                                                            }
                                                        `}
                                                    >
                                                        <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center transition-all
                                                            ${isSelected 
                                                                ? "bg-[#16539a] text-white" 
                                                                : "bg-slate-100 text-slate-400 group-hover:scale-110"
                                                            }
                                                        `}>
                                                            {isTrueOption ? (
                                                                <CheckCircle size={28} strokeWidth={2.5} className="md:w-9 md:h-9" />
                                                            ) : (
                                                                <XCircle size={28} strokeWidth={2.5} className="md:w-9 md:h-9" />
                                                            )}
                                                        </div>
                                                        <span className={`text-xl md:text-3xl font-black ${isSelected ? "text-[#16539a]" : "text-slate-700"}`}>
                                                            {opt.text}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-5 w-full">
                                            {currentQuestion?.question?.options?.map((opt: any, index: number) => {
                                                const isSelected = currentAnswer === opt.id;
                                                const letters = ["أ", "ب", "ج", "د", "هـ"];
                                                
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => onSelectOption(currentQuestion.questionId, opt.id)}
                                                        className={`w-full text-right p-3.5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl border-2 transition-all duration-200 flex flex-row items-center gap-3 md:gap-5 group relative overflow-hidden
                                                            ${isSelected 
                                                                ? "bg-blue-50/80 border-[#16539a] shadow-[0_4px_20px_rgba(22,83,154,0.1)]" 
                                                                : "bg-white border-slate-200 hover:border-[#16539a] hover:bg-slate-50 hover:shadow-md"
                                                            }
                                                        `}
                                                    >
                                                        <div className={`w-9 h-9 md:w-12 md:h-12 shrink-0 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl font-black transition-all border-2
                                                            ${isSelected ? "bg-[#16539a] text-white border-[#16539a]" : "bg-slate-100 text-slate-400 border-slate-200 group-hover:border-[#16539a] group-hover:text-[#16539a]"}
                                                        `}>
                                                            {letters[index] || index + 1}
                                                        </div>
                                                        
                                                        <span className={`text-sm md:text-lg lg:text-xl leading-[1.6] ${isSelected ? "text-[#16539a] font-black" : "text-slate-700 font-bold"}`}>
                                                            {opt.text}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Fixed Navigation Footer */}
                    <div className="h-16 md:h-20 bg-white border-t border-slate-200 px-3 md:px-8 lg:px-16 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10 w-full">
                        <Button 
                            variant="outline"
                            onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                            disabled={currentQuestionIdx === 0}
                            className="h-11 md:h-14 px-4 md:px-8 text-sm md:text-lg font-black rounded-lg md:rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 gap-1.5 md:gap-3 hover:text-slate-800 disabled:opacity-40"
                        >
                            السابق
                        </Button>
                        
                        {currentQuestionIdx === questions.length - 1 ? (
                            <Button 
                                onClick={onSubmit}
                                disabled={isSubmitting || answers.length < questions.length - 5}
                                className="h-11 md:h-14 px-5 md:px-10 text-sm md:text-lg font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-lg md:rounded-xl shadow-lg shadow-green-900/20 gap-1.5 md:gap-2 flex items-center justify-center disabled:opacity-50"
                            >
                                <Check size={18} className="md:w-6 md:h-6" />
                                {isSubmitting ? "إرسال..." : "إنهاء الاختبار"}
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => {
                                    if (currentQuestionIdx < questions.length - 1) {
                                      setCurrentQuestionIdx(currentQuestionIdx + 1);
                                    }
                                }}
                                className="h-11 md:h-14 px-5 md:px-10 text-sm md:text-lg font-black bg-[#16539a] hover:bg-[#1e66b8] text-white rounded-lg md:rounded-xl shadow-lg shadow-blue-900/20 gap-1.5 md:gap-2 flex-row-reverse disabled:opacity-40"
                            >
                                <ArrowLeft size={18} className="md:w-6 md:h-6" />
                                التالي
                            </Button>
                        )}
                    </div>

                    {/* Mobile Submit Button */}
                    <div className="lg:hidden h-14 bg-white border-t border-slate-200 px-3 flex items-center shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <Button 
                            onClick={onSubmit}
                            disabled={isSubmitting || answers.length < questions.length - 5}
                            className="w-full h-11 text-sm font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white rounded-xl shadow-lg shadow-green-900/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <Check size={16} />
                            {isSubmitting ? "إرسال..." : `إنهاء (${answers.length}/${questions.length})`}
                        </Button>
                    </div>

                </main>
            </div>

            {/* ===== Submit Confirmation Bottom Sheet ===== */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSubmitConfirm(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        />
                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 32, stiffness: 400 }}
                            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-3xl z-[61] bg-white rounded-t-[2rem] shadow-2xl"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                        >
                            {/* Handle bar (mobile only) */}
                            <div className="flex justify-center pt-3 pb-1 md:hidden">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>
                            
                            <div className="p-6 md:p-8 text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-100">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد تسليم الاختبار</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    {questions.length - answers.length > 0 
                                        ? <span>لديك <strong className="text-amber-600">{questions.length - answers.length}</strong> أسئلة غير مجابة من أصل <strong>{questions.length}</strong>. هل أنت متأكد من التسليم النهائي؟</span>
                                        : "هل أنت متأكد من تأكيد وتسليم جميع إجاباتك؟"
                                    }
                                </p>
                                
                                {/* Progress indicator */}
                                <div className="bg-slate-50 rounded-xl p-3 mb-6 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">الإجابات المكتملة</span>
                                    <span className="text-sm font-black text-[#16539a]">{answers.length} / {questions.length}</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => setShowSubmitConfirm(false)}
                                        variant="outline" 
                                        className="flex-1 h-14 rounded-2xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-base"
                                    >
                                        متابعة الاختبار
                                    </Button>
                                    <Button 
                                        onClick={onExecuteSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 rounded-2xl font-black bg-[#5c9e45] hover:bg-[#4d853a] text-white shadow-lg shadow-green-900/20 text-base disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Check size={20} />
                                        {isSubmitting ? "جاري..." : "تأكيد التسليم"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
