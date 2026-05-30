"use client";

import { usePricingStats } from "@/hooks/pricing/usePricingStats";
import { Building2, Settings, FileText, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PricingStats() {
    const { stats, loading } = usePricingStats();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right no-print" dir="rtl">
            <KpiCard
                title="المواقع والمدن الجغرافية"
                value={stats.locations}
                icon={Landmark}
                color="text-blue-600"
                bg="bg-blue-50"
                loading={loading}
            />
            <KpiCard
                title="مراكز الاختبار المعتمدة"
                value={stats.centers}
                icon={Building2}
                color="text-purple-600"
                bg="bg-purple-50"
                loading={loading}
            />
            <KpiCard
                title="باقات الأسعار والاختبارات"
                value={stats.packages}
                icon={Settings}
                color="text-emerald-600"
                bg="bg-emerald-50"
                loading={loading}
            />
            <KpiCard
                title="السياسات والغرامات النشطة"
                value={stats.policies}
                icon={FileText}
                color="text-amber-600"
                bg="bg-amber-50"
                loading={loading}
            />
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg, loading }: any) {
    return (
        <Card className="border border-slate-100/80 shadow-sm rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-300 bg-white">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${bg} ${color} shadow-inner`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="text-xs font-bold text-slate-500">{title}</h3>
                {loading ? (
                    <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg mt-2"></div>
                ) : (
                    <p className="text-2xl font-black mt-2 tracking-tight text-slate-800 font-mono">{value}</p>
                )}
            </CardContent>
        </Card>
    );
}
