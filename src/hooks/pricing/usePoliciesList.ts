"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type CancellationPolicy = {
    id: string;
    name: string;
    category: string;
    hoursTrigger: number | null;
    condition: string | null;
    feeAmount: number;
    isActive: boolean;
};

export type PolicyConfig = {
    maxAllowedExamChanges: number;
    examModificationDeadline: number;
    examCancellationDeadline: number;
};

export function usePoliciesList() {
    const { toast } = useToast();
    const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
    const [config, setConfig] = useState<PolicyConfig>({
        maxAllowedExamChanges: 1,
        examModificationDeadline: 72,
        examCancellationDeadline: 72
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resPolicies, resConfig] = await Promise.all([
                fetch("/api/pricing/policies"),
                fetch("/api/pricing/config")
            ]);

            if (resPolicies.ok) {
                const policiesData = await resPolicies.json();
                setPolicies(policiesData);
            } else {
                toast("فشل جلب سياسات الإلغاء والتعديل", "error");
            }

            if (resConfig.ok) {
                const configData = await resConfig.json();
                setConfig({
                    maxAllowedExamChanges: configData.maxAllowedExamChanges ?? 1,
                    examModificationDeadline: configData.examModificationDeadline ?? 72,
                    examCancellationDeadline: configData.examCancellationDeadline ?? 72
                });
            } else {
                toast("فشل جلب إعدادات الحدود الزمنية العامة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ أثناء الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveConfig = useCallback(async () => {
        try {
            const res = await fetch("/api/pricing/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                setIsEditing(false);
                toast("تم حفظ القواعد العامة للاختبارات بنجاح", "success");
            } else {
                toast("حدث خطأ أثناء حفظ القواعد العامة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لحفظ القواعد", "error");
        }
    }, [config, toast]);

    const updateConfig = useCallback((field: keyof PolicyConfig, value: number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleDeletePolicy = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/pricing/policies/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم حذف السياسة بنجاح", "success");
                fetchData();
            } else {
                toast("حدث خطأ أثناء حذف السياسة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لحذف السياسة", "error");
        }
    }, [fetchData, toast]);

    const handleCreatePolicy = useCallback(async (policyData: {
        name: string;
        category: string;
        hoursTrigger: number | null;
        condition: string;
        feeAmount: number;
    }) => {
        try {
            const res = await fetch("/api/pricing/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(policyData),
            });
            if (res.ok) {
                toast("تمت إضافة السياسة بنجاح", "success");
                fetchData();
                return true;
            } else {
                toast("حدث خطأ أثناء إضافة السياسة الجديدة", "error");
                return false;
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لإضافة السياسة", "error");
            return false;
        }
    }, [fetchData, toast]);

    return {
        policies,
        config,
        loading,
        isEditing,
        setIsEditing,
        handleSaveConfig,
        updateConfig,
        handleDeletePolicy,
        handleCreatePolicy,
        fetchData
    };
}
