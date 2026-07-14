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

export type AttemptConfig = {
    attempt: number;
    allowedQuestionTypes: string;
    showResultScore: boolean;
    showResultQuestions: boolean;
    showResultCorrectAnswers: boolean;
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
    firstAttemptFullFeatures: boolean;
    allowedQuestionTypes: string;
    validityDays?: number | null;
    features?: string[] | any;
    actualCost?: number;
    attemptsConfig?: AttemptConfig[];
};

const REGISTRATION_FEATURES = [
    "إتمام إجراءات التسجيل كاملة في البوابة الرسمية",
    "تسجيل فوري ومكتمل 100% مع مراجعة دقيقة للمستندات",
    "حجز وتأكيد موعد الاختبار في أقرب مركز معتمد",
    "حجز الموعد الأسرع والأقرب جغرافياً لمركز إقامتك",
    "متابعة مستمرة للطلب حتى صدور الموعد والاعتماد",
    "دعم فني استباقي عبر الواتساب لحل أي عقبات تقنية",
    "ضمان اجتياز الاختبار الفعلي (إعادة حجز وتأهيل مجاني)"
];

const TRANSPORT_B2B_FEATURES = [
    "نقل وتأمين مواصلات لمركز الاختبار (ذهاب وعودة مشتركة)",
    "مواصلات VIP خاصة (ذهاباً وإياباً) من مكان إقامتك شاملة الضيافة",
    "مرافق شخصي معتمد من فريقنا لتسهيل كافة إجراءات المركز والدخول",
    "لوحة تحكم مركزية للشركات ومكاتب الاستقدام",
    "لوحة تحكم إشرافية متعددة الموظفين",
    "مدير حساب مخصص لمتابعة أداء مجموعات العمالة",
    "جدولة مواعيد موحدة وحسومات استثنائية للشركات"
];

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
    const [isFreePackageModalOpen, setIsFreePackageModalOpen] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<MockPackage | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [sarRate, setSarRate] = useState<number>(530);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pkgsRes, statsRes, configRes, currenciesRes] = await Promise.all([
                fetch("/api/pricing/mock-packages"),
                fetch("/api/pricing/mock-stats"),
                fetch("/api/pricing/config"),
                fetch("/api/pricing/currencies")
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

            if (currenciesRes.ok) {
                const currencies = await currenciesRes.json();
                const sar = currencies.find((c: any) => c.code === "SAR");
                if (sar) {
                    setSarRate(Number(sar.buyRate) || 530);
                }
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
                price: Number(currentPackage.examPrice || 0),
                actualCost: Number(currentPackage.actualCost || 0),
                registrationDiscount: Number(currentPackage.registrationDiscount || 0),
                transportDiscount: Number(currentPackage.transportDiscount || 0),
                examCredits: Number(currentPackage.examCredits || 0),
                sortOrder: Number(currentPackage.sortOrder || 0),
                validityDays: currentPackage.validityDays ? Number(currentPackage.validityDays) : null,
                priceSAR: Number(currentPackage.priceSAR || 0),
                badge: currentPackage.isFeatured ? (currentPackage.badge || null) : null,
                color: currentPackage.isFeatured ? (currentPackage.color || "#16539a") : "#16539a",
                attemptsConfig: currentPackage.attemptsConfig || []
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsPackageModalOpen(false);
                setIsFreePackageModalOpen(false);
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

    // Generate default attempts config for free packages
    const generateDefaultAttemptsConfig = useCallback((credits: number): AttemptConfig[] => {
        const configs: AttemptConfig[] = [];
        for (let i = 1; i <= credits; i++) {
            configs.push({
                attempt: i,
                allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
                showResultScore: true,
                showResultQuestions: true,
                showResultCorrectAnswers: true
            });
        }
        return configs;
    }, []);

    // Open new FREE package dialog
    const openNewFree = useCallback(() => {
        const defaultCredits = 3;
        setCurrentPackage({
            name: "",
            nameEn: "",
            description: "",
            examCredits: defaultCredits,
            includesRegistration: false,
            includesTransport: false,
            examPrice: 0,
            priceSAR: 0,
            registrationDiscount: 0,
            transportDiscount: 0,
            isActive: true,
            isFeatured: false,
            badge: "",
            color: "#16539a",
            icon: "gift",
            sortOrder: packages.length,
            transportType: null,
            isFree: true,
            showResultScore: true,
            showResultQuestions: true,
            showResultCorrectAnswers: true,
            firstAttemptFullFeatures: false,
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
            validityDays: null,
            features: [],
            actualCost: 0,
            attemptsConfig: generateDefaultAttemptsConfig(defaultCredits)
        });
        setIsFreePackageModalOpen(true);
    }, [packages.length, generateDefaultAttemptsConfig]);

    // Open new PAID package dialog
    const openNewPaid = useCallback(() => {
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
            color: "#16539a",
            icon: "star",
            sortOrder: packages.length,
            transportType: "ONE_WAY",
            isFree: false,
            showResultScore: true,
            showResultQuestions: true,
            showResultCorrectAnswers: true,
            firstAttemptFullFeatures: false,
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
            validityDays: null,
            features: [],
            actualCost: 0,
            attemptsConfig: []
        });
        setIsPackageModalOpen(true);
    }, [packages.length]);

    const openEdit = useCallback((pkg: MockPackage) => {
        const editPkg: MockPackage = {
            ...pkg,
            nameEn: pkg.nameEn || "",
            description: pkg.description || "",
            badge: pkg.badge || "",
            showResultScore: pkg.showResultScore ?? true,
            showResultQuestions: pkg.showResultQuestions ?? true,
            showResultCorrectAnswers: pkg.showResultCorrectAnswers ?? true,
            firstAttemptFullFeatures: pkg.firstAttemptFullFeatures ?? false,
            allowedQuestionTypes: pkg.allowedQuestionTypes || "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
            validityDays: pkg.validityDays ?? null,
            features: Array.isArray(pkg.features) ? pkg.features : [],
            actualCost: Number(pkg.actualCost || 0),
            attemptsConfig: Array.isArray(pkg.attemptsConfig) ? pkg.attemptsConfig : []
        };
        setCurrentPackage(editPkg);

        // Open the correct dialog based on package type
        if (pkg.isFree) {
            setIsFreePackageModalOpen(true);
        } else {
            setIsPackageModalOpen(true);
        }
    }, []);

    const updateConfigField = useCallback((field: keyof MockConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    const updatePackageField = useCallback((field: keyof MockPackage, value: any) => {
        setCurrentPackage(prev => {
            if (!prev) return null;
            const updated = { ...prev, [field]: value };
            
            // Auto-calculate currency fields
            if (field === "examPrice") {
                const yerPrice = Number(value || 0);
                updated.priceSAR = Math.round(yerPrice / sarRate) || 0;
            }
            if (field === "priceSAR") {
                const sarPrice = Number(value || 0);
                updated.examPrice = Math.round(sarPrice * sarRate) || 0;
            }

            // If Free is enabled, force price YER and SAR to 0
            if (field === "isFree" && value === true) {
                updated.examPrice = 0;
                updated.priceSAR = 0;
            }

            // When examCredits changes on a free package, adjust attemptsConfig
            if (field === "examCredits" && updated.isFree) {
                const newCredits = Number(value || 0);
                const existing = Array.isArray(updated.attemptsConfig) ? updated.attemptsConfig : [];
                const newConfig: AttemptConfig[] = [];
                for (let i = 1; i <= newCredits; i++) {
                    const existingAttempt = existing.find((a: AttemptConfig) => a.attempt === i);
                    newConfig.push(existingAttempt || {
                        attempt: i,
                        allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
                        showResultScore: true,
                        showResultQuestions: true,
                        showResultCorrectAnswers: true
                    });
                }
                updated.attemptsConfig = newConfig;
            }

            // If includesRegistration is false, reset discount and remove registration/transport features
            if (field === "includesRegistration" && value === false) {
                updated.registrationDiscount = 0;
                updated.includesTransport = false;
                updated.transportDiscount = 0;
                updated.transportType = null;
                if (Array.isArray(updated.features)) {
                    updated.features = updated.features.filter((f: any) => 
                        !REGISTRATION_FEATURES.includes(String(f)) && 
                        !TRANSPORT_B2B_FEATURES.includes(String(f))
                    );
                }
            }
            // If includesTransport is false, reset transport parameters and remove transport features
            if (field === "includesTransport" && value === false) {
                updated.transportDiscount = 0;
                updated.transportType = null;
                if (Array.isArray(updated.features)) {
                    updated.features = updated.features.filter((f: any) => 
                        !TRANSPORT_B2B_FEATURES.includes(String(f))
                    );
                }
            }
            return updated;
        });
    }, [sarRate]);

    // Update a specific attempt's config
    const updateAttemptConfig = useCallback((attemptNumber: number, field: keyof AttemptConfig, value: any) => {
        setCurrentPackage(prev => {
            if (!prev) return null;
            const configs = Array.isArray(prev.attemptsConfig) ? [...prev.attemptsConfig] : [];
            const idx = configs.findIndex(c => c.attempt === attemptNumber);
            if (idx >= 0) {
                configs[idx] = { ...configs[idx], [field]: value };
            }
            return { ...prev, attemptsConfig: configs };
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
        isFreePackageModalOpen,
        setIsFreePackageModalOpen,
        currentPackage,
        setCurrentPackage,
        isSaving,
        handleSaveConfig,
        handleSavePackage,
        handleDelete,
        handleDuplicate,
        handleToggle,
        openNewFree,
        openNewPaid,
        openEdit,
        updateConfigField,
        updatePackageField,
        updateAttemptConfig,
        fetchData
    };
}
