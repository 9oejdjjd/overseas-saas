"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bus, DollarSign, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

type DashboardStatsProps = {
    overview: {
        totalApplicants: number;
        totalRevenue: number;
        passedCount: number;
        failedCount: number;
        othersCount: number;
    };
    transportStats: {
        totalPassengers: number;
        activeBuses: number;
        routes: Record<string, number>;
    };
    transportDate: Date;
    passRate: number;
};

export function DashboardStats({
    overview,
    transportStats,
    transportDate,
    passRate
}: DashboardStatsProps) {
    
    const statsData = [
        {
            title: "إجمالي المتقدمين بالنظام",
            value: overview.totalApplicants,
            icon: Users,
            color: "text-indigo-650",
            bg: "bg-indigo-50 border border-indigo-100/65",
            hoverGlow: "group-hover:bg-indigo-500/5",
            trend: {
                value: "+12%",
                up: true,
                label: "مقارنة بالشهر الماضي"
            }
        },
        {
            title: `ركاب السفر والرحلات (${format(transportDate, 'MM/dd')})`,
            value: transportStats.totalPassengers,
            icon: Bus,
            color: "text-amber-600",
            bg: "bg-amber-50 border border-amber-100/65",
            hoverGlow: "group-hover:bg-amber-500/5",
            footer: (
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <Badge variant="secondary" className="font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-100/40">
                        {transportStats.activeBuses} حافلات
                    </Badge>
                    <span>نشطة في هذا التاريخ</span>
                </div>
            )
        },
        {
            title: "الإيرادات الكلية المتراكمة",
            value: Number(overview.totalRevenue).toLocaleString(),
            suffix: " ر.ي",
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border border-emerald-100/65",
            hoverGlow: "group-hover:bg-emerald-500/5",
            trend: {
                value: "+5.2%",
                up: true,
                label: "مقارنة بالشهر الماضي"
            }
        },
        {
            title: "نسبة النجاح العامة المعتمدة",
            value: `${passRate}%`,
            icon: CheckCircle2,
            color: "text-violet-650",
            bg: "bg-violet-50 border border-violet-100/65",
            hoverGlow: "group-hover:bg-violet-500/5",
            trend: {
                value: "-2%",
                up: false,
                label: "مقارنة بالشهر الماضي"
            }
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <Card 
                        key={idx} 
                        className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white flex flex-col justify-between"
                    >
                        <div className={`absolute top-0 right-0 h-16 w-16 bg-slate-50 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-150 ${stat.hoverGlow}`} />
                        
                        <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div className="text-right space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 block tracking-wide">{stat.title}</span>
                                    <span className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
                                        {stat.value}
                                        {stat.suffix && <span className="text-xs font-bold text-slate-400">{stat.suffix}</span>}
                                    </span>
                                </div>
                                <span className={`p-3 rounded-2xl shadow-inner ${stat.bg} ${stat.color}`}>
                                    <Icon className="h-5.5 w-5.5" />
                                </span>
                            </div>

                            {stat.trend ? (
                                <div className="mt-4 flex items-center text-[10px] font-bold">
                                    <span className={`flex items-center gap-0.5 ${stat.trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {stat.trend.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                        {stat.trend.value}
                                    </span>
                                    <span className="text-slate-400 mr-1.5 font-medium">{stat.trend.label}</span>
                                </div>
                            ) : (
                                stat.footer
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
