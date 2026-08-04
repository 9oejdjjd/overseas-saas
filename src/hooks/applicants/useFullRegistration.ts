"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/simple-toast";

type Location = {
    id: string;
    name: string;
    nameEn: string | null;
    nameAr: string | null;
    code: string | null;
    isActive: boolean;
};

type TransportDestination = {
    id: string;
    name: string;
    nameEn: string | null;
    nameAr: string | null;
    code: string | null;
};

type TransportRoute = {
    id: string;
    fromId: string;
    toId: string;
    oneWayPrice: number;
    roundTripPrice: number;
    isActive: boolean;
    fromDestination?: { id: string; name: string; nameEn?: string | null; nameAr?: string | null };
    toDestination?: { id: string; name: string; nameEn?: string | null; nameAr?: string | null };
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
    const [transportDestinations, setTransportDestinations] = useState<TransportDestination[]>([]);
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0 });
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [mockPackages, setMockPackages] = useState<any[]>([]);
    
    // Mock Exam Packages Selected
    const [wantsMockExam, setWantsMockExam] = useState(false);
    const [mockExamType, setMockExamType] = useState<"package" | "individual">("package");
    const [mockExamCount, setMockExamCount] = useState(1);
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
        notificationEmail: "",
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
        mockExamPrice: 0,
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
                const [locRes, destRes, configRes, routesRes, profRes, pkgRes] = await Promise.all([
                    fetch("/api/locations"),
                    fetch("/api/transport/destinations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes"),
                    fetch("/api/mock/admin/professions"),
                    fetch("/api/pricing/mock-packages")
                ]);

                if (locRes.ok) setLocations(await locRes.json());
                if (destRes.ok) setTransportDestinations(await destRes.json());
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
        let base = Number(config.registrationPrice);
        let transport = 0;

        if (formData.hasTransportation && formData.locationId && formData.transportFromId) {
            const examCenter = locations.find(l => l.id === formData.locationId);
            let route = undefined;
            
            if (examCenter) {
                const centerName = examCenter.name?.trim().toUpperCase();
                const centerNameEn = examCenter.nameEn?.trim().toUpperCase();
                
                route = routes.find(r => {
                    if (r.fromId !== formData.transportFromId) return false;
                    const dest = r.toDestination;
                    if (!dest) return false;
                    
                    const destName = dest.name?.trim().toUpperCase();
                    const destNameEn = dest.nameEn?.trim().toUpperCase();
                    
                    // Match Location.name (English) with TransportDestination.nameEn
                    if (centerName && destNameEn && centerName === destNameEn) return true;
                    // Match Location.nameEn with TransportDestination.nameEn
                    if (centerNameEn && destNameEn && centerNameEn === destNameEn) return true;
                    // Direct name match
                    if (centerName && destName && centerName === destName) return true;
                    
                    return false;
                });
            }

            if (route) {
                transport = formData.transportType === "ROUND_TRIP"
                    ? Number(route.roundTripPrice)
                    : Number(route.oneWayPrice);
            }
        }

        let mockExamPrice = 0;
        if (wantsMockExam) {
            if (mockExamType === "package" && selectedPackageId) {
                const selectedPkg = mockPackages.find(p => p.id === selectedPackageId);
                if (selectedPkg) {
                    mockExamPrice = Number(selectedPkg.price || 0);
                    if (selectedPkg.includesRegistration) {
                        base = base - Number(selectedPkg.registrationDiscount || 0);
                        if (base < 0) base = 0;
                    }
                    if (selectedPkg.includesTransport && transport > 0) {
                        transport = transport - Number(selectedPkg.transportDiscount || 0);
                        if (transport < 0) transport = 0;
                    }
                }
            } else if (mockExamType === "individual") {
                mockExamPrice = (Number(config.mockExamSinglePrice) || 0) * mockExamCount;
            }
        }

        const total = base + transport + mockExamPrice - Number(formData.discount);
        const remaining = total - Number(formData.amountPaid);

        setCalculated({
            basePrice: base,
            transportPrice: transport,
            mockExamPrice,
            total,
            remaining
        });
    }, [formData, config, routes, locations, wantsMockExam, mockExamType, mockExamCount, selectedPackageId, mockPackages]);

    // Clear selected package if it's no longer valid based on the current filters
    useEffect(() => {
        if (selectedPackageId) {
            const validPackages = mockPackages.filter(pkg => {
                if (!pkg.includesRegistration) return false;
                if (pkg.includesRegistration && !formData.locationId) return false;
                if (formData.hasTransportation) {
                    return pkg.includesTransport === true;
                } else {
                    return pkg.includesTransport === false;
                }
            });
            
            const isValid = validPackages.some(p => p.id === selectedPackageId);
            if (!isValid) {
                setSelectedPackageId(null);
            }
        }
    }, [formData.hasTransportation, formData.locationId, selectedPackageId, mockPackages]);

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
                            const route = routes.find(r => r.toId === formData.locationId && r.fromId === formData.transportFromId);
                            if (route) {
                                transport = formData.transportType === "ROUND_TRIP" ? Number(route.roundTripPrice) : Number(route.oneWayPrice);
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
                visitorPurchaseId: visitorPurchaseId || undefined,
                wantsMockExam,
                mockExamType,
                mockExamCount,
                selectedPackageId
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
            // 1. Exclude packages that are "Mock Exams Only" (Type 1)
            if (!pkg.includesRegistration) return false;

            // 2. Hide registration-bundled packages if no location is selected yet
            if (pkg.includesRegistration && !formData.locationId) return false;

            // 3. Filter by transportation choice
            if (formData.hasTransportation) {
                // If they want transportation, show only packages that include transportation
                return pkg.includesTransport === true;
            } else {
                // If they don't want transportation, show only packages that DO NOT include transportation
                return pkg.includesTransport === false;
            }
        });
    };

    return {
        loading,
        initialLoading,
        locations,
        transportDestinations,
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
        mockExamType,
        setMockExamType,
        mockExamCount,
        setMockExamCount,
        selectedPackageId,
        setSelectedPackageId,
        handleCheckPromo,
        handleSubmit,
        getFilteredPackages,
        router
    };
}
