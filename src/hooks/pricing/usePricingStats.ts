"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export function usePricingStats() {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        locations: 0,
        centers: 0,
        packages: 0,
        policies: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const [locsRes, pkgsRes, polsRes] = await Promise.all([
                fetch("/api/locations"),
                // Fetch mock packages to match the mock exams backend API
                fetch("/api/pricing/mock-packages").catch(() => fetch("/api/pricing/packages")),
                fetch("/api/pricing/policies")
            ]);

            let locs = [];
            let pkgs = [];
            let pols = [];

            if (locsRes.ok) locs = await locsRes.json();
            if (pkgsRes && pkgsRes.ok) pkgs = await pkgsRes.json();
            if (polsRes.ok) pols = await polsRes.json();

            const centerCount = locs.reduce(
                (acc: number, loc: any) => acc + (loc.examCenters?.length || 0), 
                0
            );

            setStats({
                locations: locs.length,
                centers: centerCount,
                packages: pkgs.length,
                policies: pols.length
            });
        } catch (e) {
            console.error("Failed to fetch pricing stats dashboard", e);
            toast("فشل في جلب الإحصائيات الكلية للرسوم", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        fetchStats
    };
}
