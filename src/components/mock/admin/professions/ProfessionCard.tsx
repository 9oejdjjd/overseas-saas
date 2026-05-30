/**
 * @file ProfessionCard.tsx
 * @description مكون بطاقة المهنة الفردية (ProfessionCard) لقسم المهن والتخصصات.
 * يعرض الإحصائيات وأنواع الأسئلة المفعلة وشريط تقدم التوليد التلقائي بالذكاء الاصطناعي بدقة تامة.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Settings2, Edit2, Loader2 } from "lucide-react";

interface ProfessionCardProps {
    prof: any;
    aiLoading: string | null;
    deleteProfession: (id: string, name: string) => void;
    setAlgorithmModalProf: (prof: any) => void;
    openEditModal: (prof: any) => void;
}

export function ProfessionCard({
    prof,
    aiLoading,
    deleteProfession,
    setAlgorithmModalProf,
    openEditModal
}: ProfessionCardProps) {
    const isThisLoading = aiLoading === prof.id;
    const activeJob = prof.aiJobs?.find((j: any) => j.status === "PROCESSING");
    const isProcessing = isThisLoading || !!activeJob;
    const generated = activeJob?.questionsGenerated || 0;
    const requested = activeJob?.questionsRequested || 32;
    const progressPercent = Math.min(100, Math.max(5, (generated / requested) * 100));

    // معالجة وسم أنواع الأسئلة المفعلة بصرياً
    const enabledTypesList = (prof.enabledQuestionTypes || "MCQ").split(",");
    
    const questionTypeBadges: Record<string, { label: string; style: string }> = {
        MCQ: { label: "متعدد", style: "bg-blue-50/50 text-blue-700 border-blue-200" },
        TRUE_FALSE: { label: "صح/خطأ", style: "bg-emerald-50/50 text-emerald-700 border-emerald-200" },
        FILL_BLANK: { label: "إكمال", style: "bg-purple-50/50 text-purple-700 border-purple-200" },
        IMAGE: { label: "صور", style: "bg-amber-50/50 text-amber-700 border-amber-200" }
    };

    return (
        <div className="border border-gray-150 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {/* خط مؤشر الحالة الجانبي الأنيق */}
            <div className={`absolute top-0 right-0 w-1.5 h-full ${prof.isActive ? "bg-emerald-500" : "bg-gray-300"}`}></div>
            
            {/* رأس البطاقة والأزرار التشغيلية */}
            <div className="flex justify-between items-start mb-4 pr-1">
                <div>
                    <h3 className="font-extrabold text-gray-900 text-base">{prof.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5" dir="ltr">{prof.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-lg" 
                        onClick={() => deleteProfession(prof.id, prof.name)}
                        title="حذف المهنة"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-lg" 
                        onClick={() => setAlgorithmModalProf(prof)} 
                        title="إعدادات الخوارزمية الفنية"
                    >
                        <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg" 
                        onClick={() => openEditModal(prof)}
                        title="تعديل خصائص المهنة"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Badge variant={prof.isActive ? "default" : "secondary"} className="text-[9px] font-bold px-2 py-0.5 rounded-md">
                        {prof.isActive ? "نشط" : "معطل"}
                    </Badge>
                </div>
            </div>

            {/* أوسمة أنواع الأسئلة المفعلة */}
            <div className="flex flex-wrap gap-1.5 mb-3.5 pr-1">
                {enabledTypesList.map((t: string) => {
                    const badge = questionTypeBadges[t];
                    if (!badge) return null;
                    return (
                        <span 
                            key={t} 
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${badge.style}`}
                        >
                            {badge.label}
                        </span>
                    );
                })}
            </div>
            
            {/* الإحصائيات الأربعة للمهنة */}
            <div className="grid grid-cols-2 gap-3 mb-4 border-t border-gray-100 pt-4">
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5">الأسئلة المتوفرة</p>
                    <p className="font-extrabold text-base text-indigo-700">{prof._count?.questions || 0}</p>
                </div>
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5">الامتحانات المُجراة</p>
                    <p className="font-extrabold text-base text-blue-700">{prof._count?.examSessions || 0}</p>
                </div>
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5">درجة النجاح</p>
                    <p className="font-extrabold text-xs text-gray-700">{prof.passingScore}%</p>
                </div>
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5">مدة الاختبار</p>
                    <p className="font-extrabold text-xs text-gray-700">{prof.examDuration} دقيقة</p>
                </div>
            </div>

            {/* شريط تقدم توليد الأسئلة قيد المعالجة */}
            {isProcessing && (
                <div className="mt-3.5 bg-purple-50/60 rounded-xl p-3 border border-purple-100/50 relative overflow-hidden">
                    <div 
                        className="absolute bottom-0 right-0 h-1 bg-purple-500 transition-all duration-1000 ease-in-out" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2 text-purple-700">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-[11px] font-black">جاري توليد الأسئلة بالـ AI...</span>
                        </div>
                        <span className="text-[11px] font-black font-mono text-purple-600">
                            {generated} / {requested}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
