"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, ChevronLeft, Clock, MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format, isSameDay, addDays } from "date-fns";

type ExamScheduleListProps = {
    examSchedule: {
        date: string;
        count: number;
        list: {
            id: string;
            fullName: string;
            examLocation: string;
            examTime: string;
            status: string;
        }[];
    };
    examDate: Date;
    changeDate: (days: number) => void;
    loading: boolean;
};

export function ExamScheduleList({
    examSchedule,
    examDate,
    changeDate,
    loading
}: ExamScheduleListProps) {
    
    const formattedDateTitle = isSameDay(examDate, new Date()) 
        ? "اليوم" 
        : isSameDay(examDate, addDays(new Date(), 1)) 
        ? "غداً" 
        : format(examDate, 'yyyy-MM-dd');

    return (
        <Card className="shadow-sm border border-slate-100 flex flex-col h-[400px] bg-white">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/20">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1 bg-indigo-50 text-indigo-650 rounded-lg">
                            <Calendar className="h-4 w-4" />
                        </span>
                        جدول الاختبارات المهنية
                    </CardTitle>
                </div>
                
                {/* Date Navigation Bar */}
                <div className="flex items-center justify-between bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-800" 
                        onClick={() => changeDate(-1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold w-32 text-center text-slate-700 select-none">
                        {formattedDateTitle}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-800" 
                        onClick={() => changeDate(1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-2.5 border-b border-slate-150 z-10 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>إجمالي المتقدمين في هذا اليوم</span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-750 px-2 py-0.5 rounded-full">
                        {examSchedule.count} متقدمين
                    </span>
                </div>

                {loading ? (
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                ) : examSchedule.list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <Calendar className="h-8 w-8 mb-2 opacity-20 animate-pulse text-indigo-650" />
                        <p className="text-xs font-bold">لا توجد اختبارات مجدولة في هذا التاريخ</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {examSchedule.list.map((exam) => (
                            <div 
                                key={exam.id} 
                                className="p-3 hover:bg-indigo-550/5 transition-all duration-200 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-extrabold shadow-inner">
                                        {exam.fullName.substring(0, 1)}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800 text-xs line-clamp-1">{exam.fullName}</p>
                                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-0.5 font-bold">
                                            <span className="flex items-center gap-1 font-mono">
                                                <Clock className="h-3 w-3 text-slate-350" /> {exam.examTime}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-slate-350" /> {exam.examLocation}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/dashboard/applicants/${exam.id}`}>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="opacity-0 group-hover:opacity-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[10px] font-bold h-7 px-2.5 transition-all flex items-center gap-0.5"
                                    >
                                        مشاهدة الملف
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <Link href="/dashboard/applicants">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] font-bold h-8 border-dashed border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl"
                    >
                        عرض وتصدير الكشف المكتمل للاختبارات
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
