"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type Voucher = {
    id: string;
    category: "PUBLIC" | "PERSONAL" | "COMPENSATION";
    type: string;
    code: string;
    discountPercent: number;
    amount?: number;
    balance?: number;
    maxUses?: number;
    usageCount?: number;
    isUsed: boolean;
    expiryDate?: string | null;
    notes?: string | null;
    createdAt: string;
    applicant?: {
        fullName: string;
        passportNumber: string;
        applicantCode: string;
    } | null;
};

export type VoucherStats = {
    active: number;
    used: number;
    totalAmount: number;
};

export type LocationDropdown = {
    id: string;
    name: string;
};

export function useVouchersManagement() {
    const { toast } = useToast();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [locations, setLocations] = useState<LocationDropdown[]>([]);
    const [stats, setStats] = useState<VoucherStats>({ active: 0, used: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Public Voucher Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: "",
        discountPercent: 10,
        maxUses: 100,
        expiryDate: "",
        notes: ""
    });

    // Personal Voucher States
    const [personalSearchTerm, setPersonalSearchTerm] = useState("");
    const [foundApplicants, setFoundApplicants] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
    const [personalVoucherType, setPersonalVoucherType] = useState("EXAM");
    const [personalNotes, setPersonalNotes] = useState("");
    const [personalDiscount, setPersonalDiscount] = useState("100");
    const [personalLocationId, setPersonalLocationId] = useState("");

    const fetchVouchers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/vouchers");
            if (res.ok) {
                const data: Voucher[] = await res.json();
                setVouchers(data);

                // Calculate Stats
                const active = data.filter(v => !v.isUsed).length;
                const used = data.filter(v => v.isUsed).length;
                const totalComp = data
                    .filter(v => v.category === "COMPENSATION")
                    .reduce((sum, v) => sum + (v.amount || 0), 0);

                setStats({ active, used, totalAmount: totalComp });
            } else {
                toast("فشل جلب سجل القسائم", "error");
            }
        } catch (err) {
            console.error(err);
            toast("حدث خطأ أثناء الاتصال بالخادم لجلب القسائم", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch("/api/locations");
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchVouchers();
        fetchLocations();
    }, [fetchVouchers, fetchLocations]);

    const handleCreateVoucher = useCallback(async () => {
        if (!newVoucher.code.trim()) {
            toast("يرجى إدخال رمز كود الخصم", "error");
            return;
        }
        try {
            setCreating(true);
            const res = await fetch("/api/vouchers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "PUBLIC",
                    type: "EXAM",
                    code: newVoucher.code.toUpperCase(),
                    discountPercent: Number(newVoucher.discountPercent),
                    maxUses: Number(newVoucher.maxUses),
                    expiryDate: newVoucher.expiryDate ? new Date(newVoucher.expiryDate).toISOString() : null,
                    notes: newVoucher.notes
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewVoucher({ code: "", discountPercent: 10, maxUses: 100, expiryDate: "", notes: "" });
                toast("تم إنشاء كود الخصم العام بنجاح", "success");
                fetchVouchers();
            } else {
                toast("فشل إنشاء كود الخصم العام", "error");
            }
        } catch (err) {
            console.error(err);
            toast("خطأ أثناء معالجة طلب إنشاء الكود", "error");
        } finally {
            setCreating(false);
        }
    }, [newVoucher, fetchVouchers, toast]);

    const generateRandomCode = useCallback(() => {
        const code = "PROMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        setNewVoucher(prev => ({ ...prev, code }));
    }, []);

    // Personal Voucher Logic
    const handlePersonalSearch = useCallback(async (term: string) => {
        setPersonalSearchTerm(term);
        if (term.length < 3) {
            setFoundApplicants([]);
            return;
        }
        try {
            const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.applicants || []);
                setFoundApplicants(list);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const handleCreatePersonalVoucher = useCallback(async () => {
        if (!selectedApplicant) {
            toast("يرجى تحديد متقدم أولاً", "error");
            return;
        }
        try {
            setCreating(true);
            const res = await fetch("/api/vouchers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "PERSONAL",
                    applicantId: selectedApplicant.id,
                    type: personalVoucherType,
                    notes: personalNotes,
                    discountPercent: parseFloat(personalDiscount) || 100,
                    locationId: personalLocationId === "ALL" || !personalLocationId ? null : personalLocationId
                })
            });
            if (res.ok) {
                toast(`تم إصدار قسيمة الشخصية لـ ${selectedApplicant.fullName} بنجاح`, "success");
                setSelectedApplicant(null);
                setPersonalSearchTerm("");
                setPersonalNotes("");
                setPersonalDiscount("100");
                setPersonalLocationId("");
                setFoundApplicants([]);
                fetchVouchers();
            } else {
                toast("حدث خطأ أثناء إصدار القسيمة الشخصية", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل الاتصال بالخادم لإصدار القسيمة", "error");
        } finally {
            setCreating(false);
        }
    }, [selectedApplicant, personalVoucherType, personalNotes, personalDiscount, personalLocationId, fetchVouchers, toast]);

    const updateNewVoucherField = useCallback((field: string, value: any) => {
        setNewVoucher(prev => ({ ...prev, [field]: value }));
    }, []);

    return {
        vouchers,
        locations,
        stats,
        loading,
        creating,
        showCreateModal,
        setShowCreateModal,
        newVoucher,
        personalSearchTerm,
        setPersonalSearchTerm,
        foundApplicants,
        selectedApplicant,
        setSelectedApplicant,
        personalVoucherType,
        setPersonalVoucherType,
        personalNotes,
        setPersonalNotes,
        personalDiscount,
        setPersonalDiscount,
        personalLocationId,
        setPersonalLocationId,
        fetchVouchers,
        handleCreateVoucher,
        generateRandomCode,
        handlePersonalSearch,
        handleCreatePersonalVoucher,
        updateNewVoucherField
    };
}

