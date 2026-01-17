"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Ticket, CreditCard, User, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stats {
    pendingPayment: number;
    missingTicket: number;
    expiringPassport: number;
}

export function ActionCenter() {
    const [stats, setStats] = useState<Stats | null>(null);

    if (!stats) return null;

    // Check if everything is good
    const allGood = stats.pendingPayment === 0 && stats.missingTicket === 0 && stats.expiringPassport === 0;

    if (allGood) {
        return (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 flex items-center gap-3 text-green-700">
                <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-bold">كل شيء ممتاز!</p>
                    <p className="text-sm opacity-90">لا توجد تنبيهات تتطلب تدخلك حالياً.</p>
                </div>
            </div>
        );
    }

    const items = [
        {
            label: "دفعات معلقة (متأخرة)",
            count: stats.pendingPayment,
            icon: CreditCard,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100"
        },
        {
            label: "اختبار قريب بدون تذكرة",
            count: stats.missingTicket,
            icon: Ticket,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100"
        },
        {
            label: "جوازات تنتهي قريباً",
            count: stats.expiringPassport,
            icon: User,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {items.map((item, idx) => (
                item.count > 0 && (
                    <div
                        key={idx}
                        className={cn(
                            "flex items-center p-4 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer",
                            item.bg, item.border
                        )}
                    >
                        <div className={cn("p-2 rounded-full bg-white mr-4", item.color)}>
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{item.label}</p>
                            <p className={cn("text-2xl font-bold", item.color)}>{item.count}</p>
                        </div>
                        <AlertCircle className={cn("h-4 w-4 opacity-50", item.color)} />
                    </div>
                )
            ))}
        </div>
    );
}
