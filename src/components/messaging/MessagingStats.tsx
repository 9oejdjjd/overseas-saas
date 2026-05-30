"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Send, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

interface Stats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    sentToday: number;
}

interface MessagingStatsProps {
    stats: Stats;
}

export function MessagingStats({ stats }: MessagingStatsProps) {
    const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 100;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
                title="رسائل معلقة"
                value={stats.pending}
                icon={Clock}
                color="text-amber-600 dark:text-amber-400"
                bg="bg-amber-50 dark:bg-amber-950/40"
                borderColor="border-amber-100 dark:border-amber-900/50"
                shadowColor="shadow-amber-100/40"
            />
            <StatsCard
                title="أُرسلت اليوم"
                value={stats.sentToday}
                icon={Send}
                color="text-emerald-600 dark:text-emerald-400"
                bg="bg-emerald-50 dark:bg-emerald-950/40"
                borderColor="border-emerald-100 dark:border-emerald-900/50"
                shadowColor="shadow-emerald-100/40"
            />
            <StatsCard
                title="إجمالي المُرسل"
                value={stats.sent}
                icon={CheckCircle2}
                color="text-teal-600 dark:text-teal-400"
                bg="bg-teal-50 dark:bg-teal-950/40"
                borderColor="border-teal-100 dark:border-teal-900/50"
                shadowColor="shadow-teal-100/40"
            />
            <StatsCard
                title="رسائل فاشلة"
                value={stats.failed}
                icon={XCircle}
                color="text-rose-600 dark:text-rose-400"
                bg="bg-rose-50 dark:bg-rose-950/40"
                borderColor="border-rose-100 dark:border-rose-900/50"
                shadowColor="shadow-rose-100/40"
            />
            <StatsCard
                title="معدل النجاح"
                value={`${successRate}%`}
                icon={TrendingUp}
                color="text-indigo-600 dark:text-indigo-400"
                bg="bg-indigo-50 dark:bg-indigo-950/40"
                borderColor="border-indigo-100 dark:border-indigo-900/50"
                shadowColor="shadow-indigo-100/40"
            />
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    borderColor: string;
    shadowColor: string;
}

function StatsCard({ title, value, icon: Icon, color, bg, borderColor, shadowColor }: StatsCardProps) {
    return (
        <Card className={`border ${borderColor} bg-white dark:bg-slate-900 shadow-sm ${shadowColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group`}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">{title}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {value}
                        </p>
                    </div>
                    <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
