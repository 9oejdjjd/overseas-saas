"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/simple-toast";

type Location = {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
};

type TransportRoute = {
    id: string;
    fromId: string;
    toId: string;
    oneWayPrice: number;
    roundTripPrice: number;
    isActive: boolean;
    fromDestination?: { id: string; name: string };
    toDestination?: { id: string; name: string };
};

type ServiceConfig = {
    registrationPrice: number;
    mockExamSinglePrice?: number;
};

export function useFullRegistration() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Prefill from URL (visitor conversion)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const prefillName = searchParams?.get('name') || '';
    const prefillPhone = searchParams?.get('phone') || '';
    const visitorPurchaseId = searchParams?.get('purchaseId') || undefined;

    // Dynamic Data State
    const [locations, setLocations] = useState<Location[]>([]);
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0 });
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [mockPackages, setMockPackages] = useState<any[]>([]);
    
    // Mock Exam Packages Selected
    const [wantsMockExam, setWantsMockExam] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: prefillName,
        firstName: "",
        lastName: "",
        profession: "",
        dob: undefined as Date | undefined,
        phone: prefillPhone,
        whatsappNumber: prefillPhone,
        passportNumber: "",
        passportExpiry: undefined as Date | undefined,
        nationalId: "",
        gender: "MALE",

        // Service Details
        locationId: "",
        hasTransportation: false,
        transportFromId: "",
        transportType: "ONE_WAY",

        // Financials
        discount: 0,
        amountPaid: 0,
    });

    // Calculated Prices
    const [calculated, setCalculated] = useState({
        basePrice: 0,
        transportPrice: 0,
        total: 0,
        remaining: 0
    });

    // Promo Code State
    const [promoCode, setPromoCode] = useState("");
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [promoMessage, setPromoMessage] = useState("");
    const [promoError, setPromoError] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [locRes, configRes, routesRes, profRes, pkgRes] = await Promise.all([
                    fetch("/api/locations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes"),
                    fetch("/api/mock/admin/professions"),
                    fetch("/api/pricing/mock-packages")
                ]);

                if (locRes.ok) setLocations(await locRes.json());
                if (configRes.ok) setConfig(await configRes.json());
                if (routesRes.ok) setRoutes(await routesRes.json());
                if (profRes.ok) setProfessions(await profRes.json());
                if (pkgRes.ok) setMockPackages((await pkgRes.json()).filter((p: any) => p.isActive));
            } catch (e) {
                console.error("Failed to fetch initial data", e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Calculate Totals Logic
    useEffect(() => {
        const base = Number(config.registrationPrice);
        let transport = 0;

        if (formData.hasTransportation && formData.locationId && formData.transportFromId) {
            const selectedLocation = locations.find(l => l.id === formData.locationId);
            const selectedFrom = locations.find(l => l.id === formData.transportFromId);

            if (selectedLocation && selectedFrom) {
                const route = routes.find(r =>
                    r.toDestination?.name === selectedLocation.name &&
                    r.fromDestination?.name === selectedFrom.name
                );

                if (route) {
                    transport = formData.transportType === "ROUND_TRIP"
                        ? Number(route.roundTripPrice)
                        : Number(route.oneWayPrice);
                }
            }
        }

        const total = base + transport - Number(formData.discount);
        const remaining = total - Number(formData.amountPaid);

        setCalculated({
            basePrice: base,
            transportPrice: transport,
            total,
            remaining
        });
    }, [formData, config, routes, locations]);

    const handleCheckPromo = async () => {
        if (!promoCode) return;
        setValidatingPromo(true);
        setPromoMessage("");
        setPromoError(false);

        try {
            const res = await fetch("/api/vouchers?activeOnly=true&category=PUBLIC");
            if (res.ok) {
                const vouchers = await res.json();
                const matched = vouchers.find((v: any) => v.code === promoCode);

                if (matched) {
                    let expired = false;
                    if (matched.expiryDate) {
                        if (new Date(matched.expiryDate) < new Date()) expired = true;
                    }
                    if (matched.maxUses && matched.usageCount >= matched.maxUses) expired = true;

                    if (expired) {
                        setPromoError(true);
                        setPromoMessage("هذا الكود منتهي الصلاحية أو تم استخدامه بالكامل");
                    } else {
                        setPromoMessage(`كود صحيح! خصم ${matched.discountPercent}%`);

                        // Calculate discount value
                        const currentBase = Number(config.registrationPrice);
                        let transport = 0;
                        if (formData.hasTransportation && formData.locationId && formData.transportFromId) {
                            const selectedLoc = locations.find(l => l.id === formData.locationId);
                            const selectedFromLoc = locations.find(l => l.id === formData.transportFromId);
                            if (selectedLoc && selectedFromLoc) {
                                const route = routes.find(r => r.toDestination?.name === selectedLoc.name && r.fromDestination?.name === selectedFromLoc.name);
                                if (route) {
                                    transport = formData.transportType === "ROUND_TRIP" ? Number(route.roundTripPrice) : Number(route.oneWayPrice);
                                }
                            }
                        }
                        const gross = currentBase + transport;
                        const discountVal = gross * (matched.discountPercent / 100);

                        setFormData(prev => ({ ...prev, discount: discountVal }));
                    }
                } else {
                    setPromoError(true);
                    setPromoMessage("الكود غير صحيح");
                }
            } else {
                setPromoError(true);
                setPromoMessage("حدث خطأ أثناء التحقق");
            }
        } catch (e) {
            console.error(e);
            setPromoError(true);
            setPromoMessage("فشل الاتصال");
        } finally {
            setValidatingPromo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                dob: formData.dob ? formData.dob.toISOString() : null,
                passportExpiry: formData.passportExpiry ? formData.passportExpiry.toISOString() : null,
                totalAmount: calculated.total,
                remainingBalance: calculated.remaining,
                promoCode: promoCode || undefined,
                visitorPurchaseId: visitorPurchaseId || undefined
            };

            const res = await fetch("/api/applicants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            toast("تم تسجيل المتقدم بنجاح", "success");

            setTimeout(() => {
                router.push("/dashboard/applicants");
            }, 1000);
        } catch (error: any) {
            toast("فشل التسجيل: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const getFilteredPackages = () => {
        return mockPackages.filter(pkg => {
            if (pkg.includesTransport && !formData.hasTransportation) return false;
            if (pkg.includesRegistration && !formData.locationId) return false;
            return true;
        });
    };

    return {
        loading,
        initialLoading,
        locations,
        config,
        professions,
        formData,
        setFormData,
        calculated,
        promoCode,
        setPromoCode,
        validatingPromo,
        promoMessage,
        promoError,
        wantsMockExam,
        setWantsMockExam,
        selectedPackageId,
        setSelectedPackageId,
        handleCheckPromo,
        handleSubmit,
        getFilteredPackages,
        router
    };
}
