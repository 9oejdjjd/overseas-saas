"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

type ActivityLogListProps = {
    recentActivity: any[];
    getActivityLabel: (action: string) => {
        title: string;
        icon: any;
        color: string;
        bg: string;
    };
};

export function ActivityLogList({
    recentActivity,
    getActivityLabel
}: ActivityLogListProps) {
    return (
        <Card className="shadow-sm border border-slate-100 flex flex-col bg-white">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/20">
                <div className="text-right">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1 bg-indigo-50 text-indigo-650 rounded-lg animate-pulse">
                            <Activity className="h-4 w-4" />
                        </span>
                        سجل الأنشطة والعمليات اللحظي
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-bold mt-0.5">
                        آخر الإجراءات المالية والإدارية التي تمت بالنظام مؤخراً
                    </CardDescription>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto max-h-[300px] pt-4 pr-6 pl-4 relative">
                {/* Visual connecting timeline line */}
                {recentActivity.length > 1 && (
                    <div className="absolute right-[33px] top-6 bottom-6 w-0.5 bg-slate-100 pointer-events-none z-0" />
                )}

                <div className="space-y-5 relative z-10">
                    {recentActivity.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                            لا توجد أنشطة مسجلة مؤخراً
                        </div>
                    ) : (
                        recentActivity.map((log, idx) => {
                            const info = getActivityLabel(log.action);
                            const Icon = info.icon;
                            return (
                                <div key={log.id || idx} className="flex gap-4 items-start group relative">
                                    {/* Timeline bullet icon */}
                                    <div className={`h-8 w-8 rounded-xl ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-transform duration-300 group-hover:scale-110 z-10 bg-white`}>
                                        <Icon className={`h-4 w-4 ${info.color}`} />
                                    </div>
                                    
                                    <div className="flex-1 text-right">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-800">{info.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                                            {log.details || `تم إنجاز عملية ${info.title}`}
                                            {log.applicant && (
                                                <span className="text-indigo-650 font-bold">
                                                    {" "} • {log.applicant.fullName}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
