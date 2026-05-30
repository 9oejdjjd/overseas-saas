"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/simple-toast";

type ServiceConfig = {
    registrationPrice: number;
    mockExamSinglePrice?: number;
};

export function useQuickSale() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Dynamic Data State
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0 });
    const [professions, setProfessions] = useState<any[]>([]);
    const [mockPackages, setMockPackages] = useState<any[]>([]);
    
    // Quick Sale Form
    const [quickSale, setQuickSale] = useState({
        buyerName: "",
        profession: "",
        phone: "",
        whatsapp: "",
        packageId: "",
        saleType: "package" as "package" | "individual",
        examCount: 1,
        isPaid: false,
        paymentMethod: "CASH",
        paymentNote: "",
        discount: 0,
        amountPaid: 0
    });

    const [qsDropdownOpen, setQsDropdownOpen] = useState(false);
    const [qsPromoCode, setQsPromoCode] = useState("");
    const [qsPromoMsg, setQsPromoMsg] = useState("");
    const [qsPromoErr, setQsPromoErr] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [configRes, profRes, pkgRes] = await Promise.all([
                    fetch("/api/pricing/config"),
                    fetch("/api/mock/admin/professions"),
                    fetch("/api/pricing/mock-packages")
                ]);

                if (configRes.ok) setConfig(await configRes.json());
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

    // Exam-only packages for quick sale
    const examOnlyPackages = mockPackages.filter(p => !p.includesRegistration && !p.includesTransport);
    
    const singlePrice = Number(config.mockExamSinglePrice ?? 0);
    const selectedPkg = examOnlyPackages.find(p => p.id === quickSale.packageId);
    const baseTotal = quickSale.saleType === "package" && selectedPkg ? Number(selectedPkg.examPrice) : singlePrice * quickSale.examCount;
    const qsTotal = Math.max(0, baseTotal - quickSale.discount);
    const qsRemaining = qsTotal - quickSale.amountPaid;

    const handleApplyPromo = async () => {
        if (!qsPromoCode) return;
        try {
            const res = await fetch("/api/vouchers?activeOnly=true&category=PUBLIC");
            if (res.ok) {
                const vs = await res.json();
                const m = vs.find((v: any) => v.code === qsPromoCode);
                
                if (m && !(m.expiryDate && new Date(m.expiryDate) < new Date()) && !(m.maxUses && m.usageCount >= m.maxUses)) {
                    setQsPromoErr(false);
                    setQsPromoMsg(`كود صحيح! خصم ${m.discountPercent}%`);
                    setQuickSale(p => ({ ...p, discount: baseTotal * (m.discountPercent / 100) }));
                } else {
                    setQsPromoErr(true);
                    setQsPromoMsg(m ? "منتهي الصلاحية" : "كود غير صحيح");
                }
            }
        } catch {
            setQsPromoErr(true);
            setQsPromoMsg("خطأ في التحقق");
        }
    };

    const handleQuickSale = async () => {
        if (!quickSale.buyerName || !quickSale.phone) {
            toast("يرجى ملء الاسم ورقم الهاتف", "error");
            return;
        }
        if (quickSale.saleType === "package" && !quickSale.packageId) {
            toast("يرجى اختيار باقة", "error");
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                ...quickSale,
                saleType: quickSale.saleType,
                examCount: quickSale.examCount
            };
            
            const res = await fetch("/api/pricing/mock-packages/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error(await res.text());
            
            toast("تم البيع بنجاح ✓", "success");
            
            setQuickSale({
                buyerName: "",
                profession: "",
                phone: "",
                whatsapp: "",
                packageId: "",
                saleType: "package",
                examCount: 1,
                isPaid: false,
                paymentMethod: "CASH",
                paymentNote: "",
                discount: 0,
                amountPaid: 0
            });
            
            setTimeout(() => {
                router.push("/dashboard/applicants");
            }, 1000);
        } catch (e: any) {
            toast("فشل: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        initialLoading,
        config,
        professions,
        quickSale,
        setQuickSale,
        qsDropdownOpen,
        setQsDropdownOpen,
        qsPromoCode,
        setQsPromoCode,
        qsPromoMsg,
        setQsPromoMsg,
        qsPromoErr,
        examOnlyPackages,
        singlePrice,
        baseTotal,
        qsTotal,
        qsRemaining,
        handleApplyPromo,
        handleQuickSale,
        router
    };
}
