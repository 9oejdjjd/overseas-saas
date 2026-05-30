"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    title: string;
    amount: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    trend?: string;
    highlight?: boolean;
}

export function KpiCard({ title, amount, icon: Icon, color, bg, trend, highlight }: KpiCardProps) {
    return (
        <Card className={cn(
            "border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group rounded-2xl overflow-hidden",
            highlight
                ? "bg-slate-900 border-slate-800 text-white shadow-slate-950/20 relative"
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
        )}>
            {/* Glowing accent border for highlight */}
            {highlight && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-60 pointer-events-none" />
            )}

            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                        "p-3 rounded-xl transition-transform duration-300 group-hover:scale-105",
                        highlight ? "bg-slate-800 text-blue-400" : bg
                    )}>
                        <Icon className={cn("h-6 w-6", highlight ? "text-blue-400" : color)} />
                    </div>
                    {trend && (
                        <span className="text-[10px] font-bold bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
                            {trend}
                        </span>
                    )}
                </div>
                
                <h3 className={cn(
                    "text-xs font-medium tracking-wide",
                    highlight ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                )}>
                    {title}
                </h3>
                
                <p className="text-3xl font-black mt-2 tracking-tight flex items-baseline gap-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    <span>{amount.toLocaleString()}</span>
                    <span className={cn(
                        "text-xs font-medium",
                        highlight ? "text-slate-500" : "text-slate-400 dark:text-slate-500"
                    )}>
                        ر.ي
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
