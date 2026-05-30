"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type PricingPassengerType = "ADULT" | "CHILD" | "INFANT" | "ALL" | "";
export type PricingTripType = "ONE_WAY" | "ROUND_TRIP" | "MULTI_CITY" | "ALL" | "";
export type PricingBusClass = "STANDARD" | "VIP" | "ALL" | "";
export type PricingActionType = "FIXED_PRICE" | "PERCENTAGE_DISCOUNT" | "PERCENTAGE_MARKUP" | "FIXED_DISCOUNT" | "FIXED_MARKUP";

export interface PricingRule {
    id: string;
    name: string;
    priority: number;
    isActive: boolean;
    routeFromId: string | null;
    routeToId: string | null;
    passengerType: string | null;
    tripType: string | null;
    busClass: string | null;
    actionType: string;
    amount: number;
}

export function usePricingRules() {
    const { toast } = useToast();
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        priority: 0,
        routeFromId: "ALL",
        routeToId: "ALL",
        passengerType: "ALL" as PricingPassengerType,
        tripType: "ALL" as PricingTripType,
        busClass: "ALL" as PricingBusClass,
        actionType: "FIXED_PRICE" as PricingActionType,
        amount: 0,
    });

    const fetchRules = useCallback(async () => {
        try {
            const res = await fetch("/api/transport/pricing-rules");
            if (res.ok) setRules(await res.json());
        } catch (e) {
            console.error(e);
            toast("خطأ في جلب قواعد التسعير", "error");
        }
    }, [toast]);

    const fetchDestinations = useCallback(async () => {
        try {
            const res = await fetch("/api/transport/destinations");
            if (res.ok) setDestinations(await res.json());
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchRules();
        fetchDestinations();
    }, [fetchRules, fetchDestinations]);

    const handleCreate = useCallback(async () => {
        if (!formData.name) {
            toast("اسم القاعدة مطلوب ومهم", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                routeFromId: formData.routeFromId === "ALL" ? null : formData.routeFromId,
                routeToId: formData.routeToId === "ALL" ? null : formData.routeToId,
                passengerType: formData.passengerType === "ALL" ? null : (formData.passengerType || null),
                tripType: formData.tripType === "ALL" ? null : (formData.tripType || null),
                busClass: formData.busClass === "ALL" ? null : (formData.busClass || null),
            };

            const res = await fetch("/api/transport/pricing-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast("تم إضافة قاعدة التسعير بنجاح", "success");
                setShowDialog(false);
                fetchRules();
                
                // Reset form
                setFormData({
                    name: "",
                    priority: 0,
                    routeFromId: "ALL",
                    routeToId: "ALL",
                    passengerType: "ALL",
                    tripType: "ALL",
                    busClass: "ALL",
                    actionType: "FIXED_PRICE",
                    amount: 0,
                });
            } else {
                toast("حدث خطأ أثناء حفظ قاعدة التسعير", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    }, [formData, fetchRules, toast]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف قاعدة التسعير هذه؟")) return;
        try {
            const res = await fetch(`/api/transport/pricing-rules?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchRules();
            } else {
                toast("فشل حذف القاعدة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
    }, [fetchRules, toast]);

    const getDestinationName = useCallback((id: string | null) => {
        if (!id) return "الكل";
        return destinations.find(d => d.id === id)?.name || id;
    }, [destinations]);

    const translateAction = useCallback((type: string, amount: number) => {
        switch (type) {
            case "FIXED_PRICE": return `سعر أساسي: ${amount} ريال`;
            case "PERCENTAGE_DISCOUNT": return `خصم: ${amount}%`;
            case "PERCENTAGE_MARKUP": return `زيادة: ${amount}%`;
            case "FIXED_DISCOUNT": return `خصم: ${amount} ريال`;
            case "FIXED_MARKUP": return `زيادة: ${amount} ريال`;
            default: return `${type}: ${amount}`;
        }
    }, []);

    const openCreate = useCallback(() => {
        setFormData({
            name: "",
            priority: 0,
            routeFromId: "ALL",
            routeToId: "ALL",
            passengerType: "ALL",
            tripType: "ALL",
            busClass: "ALL",
            actionType: "FIXED_PRICE",
            amount: 0,
        });
        setShowDialog(true);
    }, []);

    return {
        rules,
        destinations,
        loading,
        showDialog,
        setShowDialog,
        formData,
        setFormData,
        handleCreate,
        handleDelete,
        getDestinationName,
        translateAction,
        openCreate,
        fetchRules
    };
}
