"use client";

import { useEffect, useState } from "react";
import { Building2, Settings, FileText } from "lucide-react";

export function PricingStats() {
    const [stats, setStats] = useState({
        locations: 0,
        centers: 0,
        packages: 0,
        policies: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [locs, pkgs, pols] = await Promise.all([
                    fetch("/api/locations").then(r => r.json()),
                    fetch("/api/pricing/packages").then(r => r.json()),
                    fetch("/api/pricing/policies").then(r => r.json())
                ]);

                const centerCount = locs.reduce((acc: number, loc: any) => acc + (loc.examCenters?.length || 0), 0);

                setStats({
                    locations: locs.length,
                    centers: centerCount,
                    packages: pkgs.length,
                    policies: pols.length
                });
            } catch (e) {
                console.error("Failed to fetch stats");
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <KpiCard
                title="المواقع والمدن"
                value={stats.locations}
                icon={Building2}
                color="text-blue-600"
                bg="bg-blue-50"
            />
            <KpiCard
                title="مراكز الاختبار"
                value={stats.centers}
                icon={Building2}
                color="text-purple-600"
                bg="bg-purple-50"
            />
            <KpiCard
                title="باقات الأسعار"
                value={stats.packages}
                icon={Settings}
                color="text-green-600"
                bg="bg-green-50"
            />
            <KpiCard
                title="السياسات المفعلة"
                value={stats.policies}
                icon={FileText}
                color="text-orange-600"
                bg="bg-orange-50"
            />
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
        </div>
    );
}
