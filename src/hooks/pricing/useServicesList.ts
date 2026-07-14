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

export type SystemCurrency = {
    id: string;
    code: string;
    name: string;
    buyRate: number;
    sellRate: number;
    isActive: boolean;
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
    const [currencies, setCurrencies] = useState<SystemCurrency[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [configRes, currencyRes] = await Promise.all([
                fetch("/api/pricing/config"),
                fetch("/api/pricing/currencies")
            ]);

            if (configRes.ok) {
                const data = await configRes.json();
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

            if (currencyRes.ok) {
                const currencyData = await currencyRes.json();
                setCurrencies(currencyData);
            } else {
                toast("فشل جلب إعدادات صرف العملات", "error");
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
            const [configRes, ...currencyPromises] = await Promise.all([
                fetch("/api/pricing/config", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(config),
                }),
                ...currencies.map(curr => 
                    fetch("/api/pricing/currencies", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: curr.id,
                            buyRate: curr.buyRate,
                            sellRate: curr.sellRate,
                            isActive: curr.isActive
                        })
                    })
                )
            ]);

            const allSuccess = configRes.ok && currencyPromises.every(res => res.ok);

            if (allSuccess) {
                setIsEditing(false);
                toast("تم حفظ الإعدادات الأساسية وأسعار الصرف بنجاح", "success");
                fetchData();
            } else {
                toast("حدث خطأ أثناء حفظ الإعدادات", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الحفظ والاتصال بالخادم", "error");
        }
    }, [config, currencies, fetchData, toast]);

    const updateConfig = useCallback((field: keyof ServiceConfig, value: number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateCurrency = useCallback((index: number, field: "buyRate" | "sellRate", value: number) => {
        setCurrencies(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    }, []);

    return {
        config,
        currencies,
        loading,
        isEditing,
        setIsEditing,
        handleSaveConfig,
        updateConfig,
        updateCurrency,
        fetchData
    };
}
