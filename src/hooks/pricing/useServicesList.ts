"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type ServiceConfig = {
    registrationPrice: number;
    registrationCost: number;
    examChangeFee: number;
    examChangeCost: number;
    maxFreeChanges: number;
};

export function useServicesList() {
    const { toast } = useToast();
    const [config, setConfig] = useState<ServiceConfig>({
        registrationPrice: 0,
        registrationCost: 0,
        examChangeFee: 0,
        examChangeCost: 0,
        maxFreeChanges: 1
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pricing/config");
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    registrationPrice: data.registrationPrice ?? 0,
                    registrationCost: data.registrationCost ?? 0,
                    examChangeFee: data.examChangeFee ?? 0,
                    examChangeCost: data.examChangeCost ?? 0,
                    maxFreeChanges: data.maxFreeChanges ?? 1
                });
            } else {
                toast("فشل جلب إعدادات الرسوم الإدارية", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
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
                toast("تم حفظ الإعدادات الأساسية بنجاح", "success");
            } else {
                toast("حدث خطأ أثناء حفظ الإعدادات", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الحفظ والاتصال بالخادم", "error");
        }
    }, [config, toast]);

    const updateConfig = useCallback((field: keyof ServiceConfig, value: number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    return {
        config,
        loading,
        isEditing,
        setIsEditing,
        handleSaveConfig,
        updateConfig,
        fetchData
    };
}
