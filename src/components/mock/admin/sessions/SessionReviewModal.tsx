/**
 * @file SessionReviewModal.tsx
 * @description مكون نافذة مراجعة إجابات وتفاصيل الجلسة الفردية (SessionReviewModal).
 * يقارن بين الإجابات الصحيحة والخاطئة مع إتاحة شرح الأسئلة والأخطاء الشائعة بصرياً.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle2, Globe, Fingerprint, Calendar, Info } from "lucide-react";

interface ReviewModalProps {
    reviewSessionId: string | null;
    setReviewSessionId: (id: string | null) => void;
    reviewData: any;
    reviewSessionMeta: any;
    loadingReview: boolean;
}

export function SessionReviewModal({
    reviewSessionId,
    setReviewSessionId,
    reviewData,
    reviewSessionMeta,
    loadingReview
}: ReviewModalProps) {
    if (!reviewSessionId) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 min-h-screen">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" dir="rtl">
                {/* رأس النافذة */}
                <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5.5 w-5.5 text-green-600" />
                        تقرير مراجعة وتحليل الاختبار
                    </h2>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setReviewSessionId(null)} 
                        className="hover:bg-gray-100 rounded-full h-8 w-8"
                    >
                        <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" />
                    </Button>
                </div>
                
                {/* محتوى النافذة القابل للتمرير */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/40">
                    {loadingReview ? (
                        <div className="flex flex-col justify-center items-center h-60 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-xs text-gray-500 font-bold">جاري تحميل تقرير الاختبار بالكامل...</p>
                        </div>
                    ) : reviewData ? (
                        <div className="space-y-6">
                            {/* صندوق بيانات المتقدم والاتصال */}
                            {reviewSessionMeta && (
                                <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs shadow-sm">
                                    <div>
                                        <span className="text-gray-400 block mb-0.5 font-semibold">المتقدم</span>
                                        <span className="font-extrabold text-gray-800">{reviewSessionMeta.applicant?.fullName || reviewSessionMeta.visitorName || "غير معروف"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block mb-0.5 font-semibold">الرقم الموثق</span>
                                        <span className="font-mono font-extrabold text-gray-800" dir="ltr">{reviewSessionMeta.applicant?.whatsappNumber || reviewSessionMeta.visitorPhone || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block mb-0.5 font-semibold">عنوان IP للجلسة</span>
                                        <span className="font-mono text-gray-600 font-bold" dir="ltr">{reviewSessionMeta.ipAddress || "غير متوفر"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block mb-0.5 font-semibold">بصمة المتصفح</span>
                                        <span className="font-mono text-gray-600 text-[11px] font-bold" dir="ltr">
                                            {reviewSessionMeta.deviceFingerprint ? `${reviewSessionMeta.deviceFingerprint.substring(0, 16)}...` : "غير متوفر"}
                                        </span>
                                    </div>
                                    {reviewSessionMeta.startedAt && (
                                        <div className="border-t pt-2 mt-1 col-span-2 md:col-span-1">
                                            <span className="text-gray-400 block mb-0.5 font-semibold">وقت البدء</span>
                                            <span className="text-gray-600 font-bold" dir="ltr">
                                                {new Date(reviewSessionMeta.startedAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "medium" })}
                                            </span>
                                        </div>
                                    )}
                                    {reviewSessionMeta.completedAt && (
                                        <div className="border-t pt-2 mt-1 col-span-2 md:col-span-1">
                                            <span className="text-gray-400 block mb-0.5 font-semibold">وقت الانتهاء</span>
                                            <span className="text-gray-600 font-bold" dir="ltr">
                                                {new Date(reviewSessionMeta.completedAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "medium" })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* الإحصائيات الأربعة السريعة */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500"></div>
                                    <p className="text-xs text-gray-500 mb-1 font-bold">إجمالي الأسئلة</p>
                                    <p className="text-2xl font-black text-gray-900">{reviewData.summary.total}</p>
                                </div>
                                <div className="bg-green-50/50 p-4 rounded-xl shadow-sm border border-green-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-green-500"></div>
                                    <p className="text-xs text-green-700 mb-1 font-bold">إجابات صحيحة</p>
                                    <p className="text-2xl font-black text-green-700">{reviewData.summary.correct}</p>
                                </div>
                                <div className="bg-red-50/50 p-4 rounded-xl shadow-sm border border-red-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-red-500"></div>
                                    <p className="text-xs text-red-700 mb-1 font-bold">إجابات خاطئة</p>
                                    <p className="text-2xl font-black text-red-700">{reviewData.summary.wrong}</p>
                                </div>
                                <div className="bg-orange-50/50 p-4 rounded-xl shadow-sm border border-orange-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-orange-500"></div>
                                    <p className="text-xs text-orange-700 mb-1 font-bold">لم يُجب عليها</p>
                                    <p className="text-2xl font-black text-orange-700">{reviewData.summary.unanswered}</p>
                                </div>
                            </div>

                            {/* سجل مراجعة الأسئلة بالتفصيل */}
                            <div className="space-y-4">
                                <h3 className="font-black text-gray-800 text-base sticky top-0 bg-slate-50/95 backdrop-blur py-2.5 z-10 border-b border-slate-200 flex justify-between items-center">
                                    <span>تفاصيل إجابات الأسئلة</span>
                                    <span className="text-sm font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                                        درجة الاختبار: {reviewData.session.score}%
                                    </span>
                                </h3>

                                <div className="space-y-4">
                                    {reviewData.questions.map((q: any) => (
                                        <div 
                                            key={q.number} 
                                            className="border border-gray-150 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            {/* نص السؤال ورقمه */}
                                            <div className="flex gap-3 items-start mb-4">
                                                <div className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm
                                                    ${q.isCorrect ? "bg-green-500" : q.isAnswered ? "bg-red-500" : "bg-orange-400"}`}>
                                                    {q.number}
                                                </div>
                                                <h3 className="font-extrabold text-gray-900 leading-relaxed text-[14px]">{q.text}</h3>
                                            </div>

                                            {/* خيارات الإجابة الأربعة ملونة ديناميكياً */}
                                            <div className="space-y-2.5 mt-4 pr-10">
                                                {q.options.map((opt: any) => {
                                                    const isSelected = opt.isSelected;
                                                    const isCorrect = opt.isCorrect;
                                                    
                                                    let bgClass = "bg-gray-50/80 border-gray-200/80 text-gray-600";
                                                    
                                                    if (isSelected && isCorrect) {
                                                        bgClass = "bg-green-50/80 border-green-200 text-green-950 ring-1 ring-green-500 shadow-sm font-bold";
                                                    } else if (isSelected && !isCorrect) {
                                                        bgClass = "bg-red-50/80 border-red-200 text-red-950 ring-1 ring-red-500 shadow-sm font-bold";
                                                    } else if (!isSelected && isCorrect) {
                                                        bgClass = "bg-green-50/30 border-green-200 border-dashed text-green-800 font-bold";
                                                    }
                                                    
                                                    return (
                                                        <div 
                                                            key={opt.id} 
                                                            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${bgClass}`}
                                                        >
                                                            <span className="leading-snug">{opt.text}</span>
                                                            {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                                                            {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                                            {!isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500/60 shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* الشرح التفصيلي التلقائي للسؤال */}
                                            {q.explanation && (
                                                <div className="mt-4 pt-4 border-t border-dashed pr-10">
                                                    <details className="group">
                                                        <summary className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold select-none flex items-center gap-1.5 w-max">
                                                            <Info className="w-3.5 h-3.5" />
                                                            عرض الشرح والتحليل الفني
                                                        </summary>
                                                        <p className="mt-2.5 p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-xl text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                            {q.explanation}
                                                        </p>
                                                    </details>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                            <XCircle className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-xs font-bold text-gray-400">تعذر تحميل تقرير المراجعة، يرجى المحاولة مرة أخرى.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
