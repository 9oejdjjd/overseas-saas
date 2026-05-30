"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type MockStats = {
    totalPackages: number;
    totalPurchases: number;
    totalRevenue: number;
    totalCreditsSold: number;
};

export type MockConfig = {
    mockExamSinglePrice: number;
    mockExamPackagesEnabled: boolean;
    registrationPrice: number;
};

export type MockPackage = {
    id?: string;
    name: string;
    nameEn?: string;
    description?: string;
    examCredits: number;
    includesRegistration: boolean;
    includesTransport: boolean;
    examPrice: number;
    priceSAR: number;
    registrationDiscount: number;
    transportDiscount: number;
    isActive: boolean;
    isFeatured: boolean;
    badge?: string;
    color: string;
    icon: string;
    sortOrder: number;
    transportType?: string | null;
    isFree: boolean;
    showResultScore: boolean;
    showResultQuestions: boolean;
    showResultCorrectAnswers: boolean;
    validityDays?: number | null;
};

export function useMockExamPackages() {
    const { toast } = useToast();
    const [packages, setPackages] = useState<MockPackage[]>([]);
    const [stats, setStats] = useState<MockStats>({
        totalPackages: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        totalCreditsSold: 0
    });
    const [config, setConfig] = useState<MockConfig>({
        mockExamSinglePrice: 0,
        mockExamPackagesEnabled: true,
        registrationPrice: 0
    });
    const [loading, setLoading] = useState(true);
    const [isConfigEditing, setIsConfigEditing] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<MockPackage | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pkgsRes, statsRes, configRes] = await Promise.all([
                fetch("/api/pricing/mock-packages"),
                fetch("/api/pricing/mock-stats"),
                fetch("/api/pricing/config")
            ]);

            if (pkgsRes.ok) {
                setPackages(await pkgsRes.json());
            } else {
                toast("فشل جلب باقات الاختبارات التجريبية", "error");
            }

            if (statsRes.ok) {
                setStats(await statsRes.json());
            } else {
                toast("فشل جلب إحصائيات الباقات", "error");
            }

            if (configRes.ok) {
                const c = await configRes.json();
                setConfig({
                    mockExamSinglePrice: c.mockExamSinglePrice ?? 0,
                    mockExamPackagesEnabled: c.mockExamPackagesEnabled ?? true,
                    registrationPrice: Number(c.registrationPrice ?? 0)
                });
            } else {
                toast("فشل جلب إعدادات الاختبارات العامة", "error");
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
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setIsConfigEditing(false);
                toast("تم حفظ الإعدادات العامة للاختبارات بنجاح", "success");
            } else {
                toast("فشل حفظ إعدادات الاختبارات", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لحفظ الإعدادات", "error");
        }
    }, [config, toast]);

    const handleSavePackage = useCallback(async () => {
        if (!currentPackage) return;
        setIsSaving(true);
        try {
            const method = currentPackage.id ? "PATCH" : "POST";
            const url = currentPackage.id 
                ? `/api/pricing/mock-packages/${currentPackage.id}` 
                : "/api/pricing/mock-packages";

            const payload = {
                ...currentPackage,
                examPrice: Number(currentPackage.examPrice || 0),
                registrationDiscount: Number(currentPackage.registrationDiscount || 0),
                transportDiscount: Number(currentPackage.transportDiscount || 0),
                examCredits: Number(currentPackage.examCredits || 0),
                sortOrder: Number(currentPackage.sortOrder || 0),
                validityDays: currentPackage.validityDays ? Number(currentPackage.validityDays) : null,
                priceSAR: Number(currentPackage.priceSAR || 0)
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsPackageModalOpen(false);
                toast(currentPackage.id ? "تم تعديل الباقة بنجاح" : "تم إنشاء الباقة بنجاح", "success");
                fetchData();
            } else {
                toast("حدث خطأ أثناء حفظ تفاصيل الباقة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لحفظ الباقة", "error");
        } finally {
            setIsSaving(false);
        }
    }, [currentPackage, fetchData, toast]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/pricing/mock-packages/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم حذف الباقة بنجاح", "success");
                fetchData();
            } else {
                toast("حدث خطأ أثناء حذف الباقة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لحذف الباقة", "error");
        }
    }, [fetchData, toast]);

    const handleDuplicate = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/pricing/mock-packages/${id}/duplicate`, { method: "POST" });
            if (res.ok) {
                toast("تم تكرار الباقة بنجاح", "success");
                fetchData();
            } else {
                toast("فشل تكرار الباقة المستهدفة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لتكرار الباقة", "error");
        }
    }, [fetchData, toast]);

    const handleToggle = useCallback(async (pkg: MockPackage) => {
        if (!pkg.id) return;
        try {
            const res = await fetch(`/api/pricing/mock-packages/${pkg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !pkg.isActive })
            });
            if (res.ok) {
                toast(pkg.isActive ? "تم تعطيل الباقة" : "تم تفعيل الباقة", "success");
                fetchData();
            } else {
                toast("فشل تحديث حالة الباقة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لتعديل حالة الباقة", "error");
        }
    }, [fetchData, toast]);

    const openNew = useCallback(() => {
        setCurrentPackage({
            name: "",
            nameEn: "",
            description: "",
            examCredits: 1,
            includesRegistration: false,
            includesTransport: false,
            examPrice: 0,
            priceSAR: 0,
            registrationDiscount: 0,
            transportDiscount: 0,
            isActive: true,
            isFeatured: false,
            badge: "",
            color: "#3B82F6",
            icon: "star",
            sortOrder: packages.length,
            transportType: "ONE_WAY",
            isFree: false,
            showResultScore: true,
            showResultQuestions: true,
            showResultCorrectAnswers: true,
            validityDays: null
        });
        setIsPackageModalOpen(true);
    }, [packages.length]);

    const openEdit = useCallback((pkg: MockPackage) => {
        setCurrentPackage({
            ...pkg,
            nameEn: pkg.nameEn || "",
            description: pkg.description || "",
            badge: pkg.badge || "",
            validityDays: pkg.validityDays ?? null
        });
        setIsPackageModalOpen(true);
    }, []);

    const updateConfigField = useCallback((field: keyof MockConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    const updatePackageField = useCallback((field: keyof MockPackage, value: any) => {
        setCurrentPackage(prev => {
            if (!prev) return null;
            const updated = { ...prev, [field]: value };
            // If Free is enabled, force price YER and SAR to 0
            if (field === "isFree" && value === true) {
                updated.examPrice = 0;
                updated.priceSAR = 0;
            }
            // If includesRegistration is false, reset discount
            if (field === "includesRegistration" && value === false) {
                updated.registrationDiscount = 0;
            }
            // If includesTransport is false, reset transport parameters
            if (field === "includesTransport" && value === false) {
                updated.transportDiscount = 0;
                updated.transportType = null;
            }
            return updated;
        });
    }, []);

    return {
        packages,
        stats,
        config,
        loading,
        isConfigEditing,
        setIsConfigEditing,
        isPackageModalOpen,
        setIsPackageModalOpen,
        currentPackage,
        setCurrentPackage,
        isSaving,
        handleSaveConfig,
        handleSavePackage,
        handleDelete,
        handleDuplicate,
        handleToggle,
        openNew,
        openEdit,
        updateConfigField,
        updatePackageField,
        fetchData
    };
}
