/**
 * @file QuestionsBulkActionBar.tsx
 * @description مكون شريط العمليات الجماعية العائم (QuestionsBulkActionBar).
 * يظهر بانتقالات أنيقة عند اختيار عدة أسئلة ويتيح حذفها جماعياً وبشكل موثق.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface QuestionsBulkActionBarProps {
    selectedCount: number;
    setSelectedIds: (ids: string[]) => void;
    bulkDeleteQuestions: () => void;
    deletingBulk: boolean;
}

export function QuestionsBulkActionBar({
    selectedCount,
    setSelectedIds,
    bulkDeleteQuestions,
    deletingBulk
}: QuestionsBulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-md flex items-center justify-between gap-8 min-w-[340px] max-w-[90vw] animate-in fade-in slide-in-from-bottom-4 duration-300"
            dir="rtl"
        >
            {/* إحصائيات التحديد */}
            <div className="flex flex-col text-right">
                <span className="text-sm font-black tracking-wide">تم تحديد {selectedCount} أسئلة</span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5">يمكنك إجراء عمليات وحذف جماعي فوري عليها</span>
            </div>
            
            {/* أزرار العمليات */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                    className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-3 py-1.5 h-auto font-black rounded-lg transition-colors"
                >
                    إلغاء التحديد
                </Button>
                <Button
                    onClick={bulkDeleteQuestions}
                    disabled={deletingBulk}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-2 px-4 py-2 h-auto rounded-xl border border-transparent shadow-md transition-all active:scale-95 duration-150"
                >
                    {deletingBulk ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                    )}
                    حذف المحدد ({selectedCount})
                </Button>
            </div>
        </div>
    );
}
