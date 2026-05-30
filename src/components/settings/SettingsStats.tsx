"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, ShieldCheck, Shield } from "lucide-react";

type SettingsStatsProps = {
    stats: {
        total: number;
        active: number;
        admins: number;
        staff: number;
    };
};

export function SettingsStats({ stats }: SettingsStatsProps) {
    const statCards = [
        { 
            label: "إجمالي المستخدمين", 
            value: stats.total, 
            icon: Users, 
            color: "text-indigo-650", 
            bg: "bg-indigo-50/70 border border-indigo-100/60",
            hoverGlow: "group-hover:bg-indigo-500/5"
        },
        { 
            label: "الحسابات النشطة", 
            value: stats.active, 
            icon: UserCheck, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50/70 border border-emerald-100/60",
            hoverGlow: "group-hover:bg-emerald-500/5"
        },
        { 
            label: "مدراء النظام (التحكم الكامل)", 
            value: stats.admins, 
            icon: ShieldCheck, 
            color: "text-violet-650", 
            bg: "bg-violet-50/70 border border-violet-100/60",
            hoverGlow: "group-hover:bg-violet-500/5"
        },
        { 
            label: "طاقم العمل المسجل", 
            value: stats.staff, 
            icon: Shield, 
            color: "text-amber-600", 
            bg: "bg-amber-50/70 border border-amber-100/60",
            hoverGlow: "group-hover:bg-amber-500/5"
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
                <Card 
                    key={idx} 
                    className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white"
                >
                    {/* Glow overlay */}
                    <div className={`absolute top-0 right-0 h-16 w-16 bg-slate-50 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-150 ${stat.hoverGlow}`} />
                    <CardContent className="p-5 flex items-center justify-between relative z-10">
                        <div className="text-right space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block tracking-wide">{stat.label}</span>
                            <span className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</span>
                        </div>
                        <span className={`p-3 rounded-2xl shadow-inner ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-5.5 w-5.5" />
                        </span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
