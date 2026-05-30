"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useState } from "react";
import { cn } from "@/lib/utils";

type WeeklyActivityChartProps = {
    trendData: { name: string; applicants: number }[];
};

export function WeeklyActivityChart({ trendData }: WeeklyActivityChartProps) {
    const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

    return (
        <Card className="shadow-sm border border-slate-100 bg-white">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="text-right">
                        <CardTitle className="text-sm font-bold text-slate-800">حركة نشاط المتقدمين الأسبوعي</CardTitle>
                        <CardDescription className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            متابعة أعداد ومعدلات المسجلين الجدد يومياً
                        </CardDescription>
                    </div>
                    
                    {/* Period selector */}
                    <div className="text-[10px] bg-slate-100/80 p-0.5 rounded-xl flex gap-0.5 font-bold border border-slate-200/50">
                        <button 
                            onClick={() => setPeriod("weekly")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                period === "weekly" 
                                    ? "bg-white text-indigo-700 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            أسبوعي
                        </button>
                        <button 
                            onClick={() => setPeriod("monthly")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg transition-all",
                                period === "monthly" 
                                    ? "bg-white text-indigo-700 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            شهري
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <RechartsTooltip
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid #f1f5f9', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                fontSize: '11px',
                                fontFamily: 'Inter, sans-serif',
                                direction: 'rtl',
                                textAlign: 'right'
                            }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="applicants" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorApplicants)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
