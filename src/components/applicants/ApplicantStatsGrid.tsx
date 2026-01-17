"use client";

import { ExtendedApplicant, Ticket } from "@/types/applicant";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CheckCircle, AlertCircle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicantStatsGridProps {
    applicant: ExtendedApplicant;
    ticket: Ticket | null;
    totalPaid: number;
    remaining: number;
}

export function ApplicantStatsGrid({ applicant, ticket, totalPaid, remaining }: ApplicantStatsGridProps) {

    const formatCurrency = (value: number) => {
        return value.toLocaleString('ar-YE');
    };

    const stats = [
        {
            label: "إجمالي المبلغ",
            value: formatCurrency(Number(applicant.totalAmount || 0)),
            suffix: "ر.ي",
            icon: Wallet,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            valueColor: "text-foreground"
        },
        {
            label: "المبلغ المدفوع",
            value: formatCurrency(totalPaid),
            suffix: "ر.ي",
            icon: CheckCircle,
            iconBg: "bg-green-500/10",
            iconColor: "text-green-600",
            valueColor: "text-green-600",
            highlight: totalPaid > 0
        },
        {
            label: "المبلغ المتبقي",
            value: formatCurrency(remaining),
            suffix: "ر.ي",
            icon: remaining > 0 ? AlertCircle : CheckCircle,
            iconBg: remaining > 0 ? "bg-red-500/10" : "bg-green-500/10",
            iconColor: remaining > 0 ? "text-red-600" : "text-green-600",
            valueColor: remaining > 0 ? "text-red-600" : "text-green-600",
            badge: remaining <= 0 ? "مكتمل" : remaining > 0 ? "متبقي" : undefined,
            badgeColor: remaining <= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        },
        {
            label: "موعد الاختبار",
            value: applicant.examDate
                ? new Date(applicant.examDate).toLocaleDateString("ar-EG", {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
                : "غير محدد",
            suffix: applicant.examTime || "",
            icon: CalendarClock,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600",
            valueColor: applicant.examDate ? "text-foreground" : "text-muted-foreground"
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    {stat.label}
                                </p>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className={cn("text-xl lg:text-2xl font-bold", stat.valueColor)}>
                                        {stat.value}
                                    </span>
                                    {stat.suffix && (
                                        <span className="text-xs text-muted-foreground">{stat.suffix}</span>
                                    )}
                                </div>
                                {stat.badge && (
                                    <span className={cn(
                                        "inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-2 uppercase",
                                        stat.badgeColor
                                    )}>
                                        {stat.badge}
                                    </span>
                                )}
                            </div>
                            <div className={cn("p-2.5 rounded-lg flex-shrink-0", stat.iconBg)}>
                                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
