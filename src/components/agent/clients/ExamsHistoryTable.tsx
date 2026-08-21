import React, { useState } from "react";
import { Search, Loader2, Check, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentExamOrder } from "@/types/agent";
import { AgentStatusBadge } from "../AgentStatusBadge";
import { cn } from "@/lib/utils";

interface ExamsHistoryTableProps {
    exams: AgentExamOrder[];
    loadingExams: boolean;
    copiedExamId: string | null;
    onCopyExamOrResultLink: (link: string, examId: string) => void;
    examStatusFilter: string;
    setExamStatusFilter: (status: string) => void;
    examSearch: string;
    setExamSearch: (query: string) => void;
}

const EXAM_STATUS_TABS = [
    { key: "ALL", label: "الكل" },
    { key: "SENT", label: "تم الارسال" },
    { key: "STARTED", label: "قيد الاختبار" },
    { key: "PASSED", label: "نجاح الاختبار" },
    { key: "FAILED", label: "لم يجتز الاختبار" },
    { key: "CANCELLED", label: "ملغي" }
];

export function ExamsHistoryTable({
    exams,
    loadingExams,
    copiedExamId,
    onCopyExamOrResultLink,
    examStatusFilter,
    setExamStatusFilter,
    examSearch,
    setExamSearch
}: ExamsHistoryTableProps) {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-700/30 p-1 rounded-xl">
                        {EXAM_STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setExamStatusFilter(tab.key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                    examStatusFilter === tab.key
                                        ? "bg-white dark:bg-slate-700 text-[#074388] shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            placeholder="بحث باسم العميل..."
                            value={examSearch}
                            onChange={(e) => setExamSearch(e.target.value)}
                            className="h-9 pr-9 bg-slate-50 dark:bg-slate-700/30 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                        />
                    </div>
                </div>

                {/* Table */}
                {loadingExams ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#074388]" />
                    </div>
                ) : exams.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm bg-white dark:bg-slate-900">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-700/20 text-slate-400 text-[10px] font-black border-b border-slate-100 dark:border-slate-700/50">
                                    <th className="py-3 px-5">العميل</th>
                                    <th className="py-3 px-5">المهنة</th>
                                    <th className="py-3 px-5">الحالة</th>
                                    <th className="py-3 px-5">الدرجة</th>
                                    <th className="py-3 px-5">تاريخ الإرسال</th>
                                    <th className="py-3 px-5 text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-200">
                                {exams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-all font-semibold">
                                        <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">{exam.client.fullName}</td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[11px]">
                                                {exam.profession.name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <AgentStatusBadge status={exam.status} isPassed={exam.isPassed} />
                                        </td>
                                        <td className="py-4 px-5 font-sans font-black text-center sm:text-right">{exam.score !== null ? `${exam.score}%` : "-"}</td>
                                        <td className="py-4 px-5 font-sans text-right">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-850 dark:text-slate-200">{new Date(exam.createdAt).toLocaleDateString("ar-YE")}</span>
                                                <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                    {new Date(exam.createdAt).toLocaleTimeString("ar-YE", { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            {exam.examLink && (
                                                exam.status === "COMPLETED" ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onCopyExamOrResultLink(`${exam.examLink}/result`, exam.id)}
                                                        className="bg-[#074388] hover:bg-[#074388]/90 text-white gap-1.5 rounded-lg font-bold shadow-sm h-8 px-3.5 text-[10px]"
                                                    >
                                                        {copiedExamId === exam.id ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" />
                                                                تم نسخ النتيجة
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                                نسخ رابط النتيجة
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (exam.status === "SENT" || exam.status === "STARTED") ? (
                                                    <div className="flex items-center justify-center gap-1.5 text-amber-600 font-bold">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span className="text-[10px]">قيد الاختبار حالياً...</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-bold">—</span>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-700/10 rounded-2xl">
                        لا توجد اختبارات مطابقة للفلتر المحدد.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
