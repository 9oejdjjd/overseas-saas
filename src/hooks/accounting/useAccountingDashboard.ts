"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export interface AccountingData {
    summary: {
        revenue: number;
        expenses: number;
        withdrawals: number;
        netProfit: number;
    };
    transactions: any[];
    pendingExpenses: any[];
    applicantProfits: any[];
    profitByLocation: any[];
    locations: { id: string; name: string }[];
}

export function useAccountingDashboard() {
    const { toast } = useToast();
    const [data, setData] = useState<AccountingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [locationId, setLocationId] = useState("");
    const [showQuickTransaction, setShowQuickTransaction] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (period) params.append("period", period);
            if (locationId) params.append("locationId", locationId);

            const res = await fetch(`/api/accounting?${params}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                throw new Error("Failed to load financial records");
            }
        } catch (error) {
            console.error("Accounting data load failure:", error);
            toast("حدث خطأ أثناء تحميل سجلات المركز المالي", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [period, locationId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        period,
        setPeriod,
        locationId,
        setLocationId,
        showQuickTransaction,
        setShowQuickTransaction,
        showRefundModal,
        setShowRefundModal,
        refresh: () => fetchData(false),
        silentRefresh: () => fetchData(true)
    };
}
