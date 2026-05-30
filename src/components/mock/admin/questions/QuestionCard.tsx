/**
 * @file QuestionCard.tsx
 * @description مكون بطاقة السؤال الفردي (QuestionCard) لبنك الأسئلة.
 * يدعم عرض خيارات الإجابة والشرح وتفاصيل الوسوم والصعوبة بدقة متناهية.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, Edit2, Trash2, CheckCircle, Info } from "lucide-react";

interface QuestionCardProps {
    q: any;
    selectedIds: string[];
    toggleSelect: (id: string) => void;
    setEditingQuestion: (q: any) => void;
    deleteQuestion: (id: string) => void;
}

export function QuestionCard({
    q,
    selectedIds,
    toggleSelect,
    setEditingQuestion,
    deleteQuestion
}: QuestionCardProps) {
    
    // تصنيفات وتسميات المحاور المهنية
    const axisLabels: Record<string, string> = {
        HEALTH_SAFETY: "الصحة والسلامة",
        PROFESSION_KNOWLEDGE: "المعرفة المهنية",
        GENERAL_SKILLS: "المهارات العامة",
        OCCUPATIONAL_SAFETY: "السلامة المهنية",
        CORRECT_METHODS: "الطرق الصحيحة",
        PROFESSIONAL_BEHAVIOR: "السلوك المهني",
        TOOLS_AND_EQUIPMENT: "الأدوات والمعدات",
        EMERGENCIES_FIRST_AID: "الطوارئ والإسعافات"
    };

    const diffColors: Record<string, string> = {
        HARD: "bg-red-100/60 text-red-700 border-red-200/80",
        EXPERT: "bg-purple-100/60 text-purple-700 border-purple-200/80",
        K1: "bg-amber-100/60 text-amber-700 border-amber-200/80"
    };

    const isSelected = selectedIds.includes(q.id);

    return (
        <div 
            className={`border rounded-xl p-5 bg-white shadow-sm hover:shadow hover:border-indigo-200 transition-all duration-200 flex gap-4 items-start ${
                isSelected ? "border-indigo-300 bg-indigo-50/5" : "border-gray-150"
            }`}
            dir="rtl"
        >
            {/* مربع الاختيار الجماعي الفردي */}
            <div className="pt-1.5 flex-shrink-0">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(q.id)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-colors"
                />
            </div>
            
            {/* المحتوى الرئيسي للبطاقة */}
            <div className="flex-1 space-y-3.5 pr-1">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {/* وسم المهنة */}
                        <Badge variant="outline" className="bg-indigo-50/40 text-indigo-700 border-indigo-200/60 font-black text-[10px] px-2 py-0.5 rounded-md">
                            {q.profession?.name}
                        </Badge>
                        {/* وسم الصعوبة */}
                        <Badge variant="outline" className={`${diffColors[q.difficulty] || "bg-gray-50 border-gray-200"} font-black text-[10px] px-2 py-0.5 rounded-md`}>
                            {q.difficulty}
                        </Badge>
                        {/* وسم المحور */}
                        <Badge variant="outline" className="bg-orange-50/50 text-orange-700 border-orange-200/60 flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-md">
                            <Layers className="h-3 w-3" />
                            {axisLabels[q.axis] || q.axis}
                        </Badge>
                        {/* وسم المستوى المعرفي */}
                        <Badge variant="outline" className={`${
                            q.cognitiveLevel === "K1"
                                ? "bg-amber-50/50 text-amber-700 border-amber-200/60"
                                : q.cognitiveLevel === "K3"
                                    ? "bg-purple-50/50 text-purple-700 border-purple-200/60"
                                    : "bg-blue-50/50 text-blue-700 border-blue-200/60"
                        } font-black text-[10px] px-2 py-0.5 rounded-md`}>
                            {q.cognitiveLevel === "K1" ? "K1 تذكر" : q.cognitiveLevel === "K3" ? "K3 تحليل" : "K2 تطبيق"}
                        </Badge>
                        {/* وسم نوع السؤال */}
                        <Badge variant="outline" className="bg-slate-100/60 text-slate-700 border-slate-300/60 font-black text-[10px] px-2 py-0.5 rounded-md">
                            {q.type === "TRUE_FALSE" ? "صح أو خطأ" : q.type === "FILL_BLANK" ? "إكمال الفراغ" : "اختيار من متعدد"}
                        </Badge>
                    </div>
                    
                    {/* أزرار التعديل والحذف */}
                    <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditingQuestion(q)} 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50/50 rounded-lg"
                            title="تعديل السؤال"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteQuestion(q.id)} 
                            className="h-8 w-8 text-red-500 hover:bg-red-50/50 rounded-lg"
                            title="حذف السؤال نهائياً"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                {/* نص السؤال الرئيسي */}
                <h3 className="font-extrabold text-gray-900 leading-relaxed text-sm">{q.text}</h3>
                
                {/* صور توضيحية للسؤال */}
                {q.imageUrl && (
                    <div className="my-2 rounded-xl overflow-hidden border border-gray-200 inline-block bg-slate-50 shadow-sm">
                        <img src={q.imageUrl} alt="صورة توضيحية للسؤال الفني" className="h-32 object-contain p-2 max-w-full" />
                    </div>
                )}

                {/* قائمة الخيارات الأربعة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {q.options?.map((opt: any) => (
                        <div 
                            key={opt.id} 
                            className={`p-3 rounded-xl text-xs flex items-center gap-2 border transition-colors ${
                                opt.isCorrect 
                                    ? "bg-green-50/55 border-green-200 text-green-950 font-bold" 
                                    : "bg-gray-50/60 border-gray-150 text-gray-600"
                            }`}
                        >
                            {opt.isCorrect ? (
                                <CheckCircle className="h-4.5 w-4.5 text-green-600 flex-shrink-0" />
                            ) : (
                                <div className="h-4 w-4 border-2 rounded-full border-gray-300 flex-shrink-0"></div>
                            )}
                            <span className="leading-snug">{opt.text}</span>
                        </div>
                    ))}
                </div>

                {/* الشرح التفصيلي للسؤال */}
                {q.explanation && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-150">
                        <details className="group">
                            <summary className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-800 font-black select-none flex items-center gap-1 w-max">
                                <Info className="w-3.5 h-3.5" />
                                عرض الشرح والتحليل الفني للسؤال
                            </summary>
                            <div className="mt-2.5 p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-xl text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                {q.explanation}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
