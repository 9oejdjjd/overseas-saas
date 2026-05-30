/**
 * @file MockExamsStats.tsx
 * @description مكون عرض البطاقات الإحصائية (MockExamsStats) لنظام الاختبارات التجريبية.
 * يعرض إجمالي المحاولات ونسب النجاح والأنشطة المشبوهة بدقة بصرية وتصميم راقٍ جداً.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, TrendingUp, Clock, ShieldAlert } from "lucide-react";

interface StatsProps {
    stats: {
        total: number;
        passed: number;
        failed: number;
        pending: number;
        suspiciousCount: number;
        criticalCount: number;
        passRate: number;
    };
}

export function MockExamsStats({ stats }: StatsProps) {
    const { total, passed, failed, pending, suspiciousCount, criticalCount, passRate } = stats;

    const cardsData = [
        {
            title: "إجمالي الجلسات",
            value: total,
            icon: <Users className="h-5 w-5 text-indigo-600" />,
            iconBg: "bg-indigo-50",
            textColor: "text-gray-900",
            cardBg: "bg-white",
            border: "border-transparent"
        },
        {
            title: "الناجحين",
            value: passed,
            icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
            iconBg: "bg-green-50",
            textColor: "text-green-600",
            cardBg: "bg-white",
            border: "border-transparent"
        },
        {
            title: "لم يجتز",
            value: failed,
            icon: <XCircle className="h-5 w-5 text-red-600" />,
            iconBg: "bg-red-50",
            textColor: "text-red-600",
            cardBg: "bg-white",
            border: "border-transparent"
        },
        {
            title: "معدل النجاح",
            value: `${passRate}%`,
            icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
            iconBg: "bg-blue-50",
            textColor: "text-blue-600",
            cardBg: "bg-white",
            border: "border-transparent"
        },
        {
            title: "قيد التنفيذ",
            value: pending,
            icon: <Clock className="h-5 w-5 text-orange-600" />,
            iconBg: "bg-orange-50",
            textColor: "text-orange-600",
            cardBg: "bg-white",
            border: "border-transparent"
        },
        {
            title: "أنشطة مشبوهة",
            value: suspiciousCount,
            icon: <ShieldAlert className={`h-5 w-5 ${suspiciousCount > 0 ? "text-red-600" : "text-gray-400"}`} />,
            iconBg: suspiciousCount > 0 ? "bg-red-100" : "bg-gray-50",
            textColor: suspiciousCount > 0 ? "text-red-600" : "text-gray-400",
            cardBg: criticalCount > 0 ? "bg-red-50/30" : "bg-white",
            border: criticalCount > 0 ? "border-red-200" : "border-transparent"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cardsData.map((card, i) => (
                <Card 
                    key={i} 
                    className={`border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${card.cardBg} ${card.border} shadow-sm rounded-xl overflow-hidden`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-gray-500 tracking-wide">{card.title}</p>
                            <p className={`text-2xl font-black ${card.textColor}`}>{card.value}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.iconBg} transition-colors`}>
                            {card.icon}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
