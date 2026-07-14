"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type RouteDefault = {
    id: string;
    fromDestinationId: string;
    toDestinationId: string;
    price: number;
    priceRoundTrip: number | null;
    cost: number;
    costRoundTrip: number;
    fromDestination: { name: string };
    toDestination: { name: string };
    currency: string;
};

export function useRoutePricing() {
    const { toast } = useToast();
    const [routes, setRoutes] = useState<RouteDefault[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fromId: "",
        toId: "",
        price: "",
        priceRoundTrip: "",
        cost: "",
        costRoundTrip: "",
        currency: "YER",
    });

    const fetchRoutes = useCallback(async () => {
        try {
            const res = await fetch("/api/transport/route-defaults");
            if (res.ok) setRoutes(await res.json());
        } catch (e) {
            console.error(e);
            toast("خطأ في تحميل أسعار المسارات", "error");
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
        fetchRoutes();
        fetchDestinations();
    }, [fetchRoutes, fetchDestinations]);

    const handleSave = useCallback(async () => {
        if (!formData.fromId || !formData.toId || !formData.price) {
            toast("يرجى تعبئة الحقول الأساسية (من، إلى، السعر)", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/transport/route-defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast("تم حفظ المسار والسعر بنجاح", "success");
                setShowDialog(false);
                fetchRoutes();
                setFormData({
                    fromId: "",
                    toId: "",
                    price: "",
                    priceRoundTrip: "",
                    cost: "",
                    costRoundTrip: "",
                    currency: "YER",
                });
            } else {
                toast("حدث خطأ أثناء حفظ الأسعار الافتراضية", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    }, [formData, fetchRoutes, toast]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف تسعير هذا المسار؟")) return;
        try {
            const res = await fetch(`/api/transport/route-defaults?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchRoutes();
            } else {
                toast("فشل حذف تسعير المسار", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
    }, [fetchRoutes, toast]);

    const handleEdit = useCallback((route: RouteDefault) => {
        setFormData({
            fromId: route.fromDestinationId,
            toId: route.toDestinationId,
            price: route.price.toString(),
            priceRoundTrip: route.priceRoundTrip ? route.priceRoundTrip.toString() : "",
            cost: route.cost ? route.cost.toString() : "",
            costRoundTrip: route.costRoundTrip ? route.costRoundTrip.toString() : "",
            currency: route.currency || "YER",
        });
        setShowDialog(true);
    }, []);

    const openCreate = useCallback(() => {
        setFormData({
            fromId: "",
            toId: "",
            price: "",
            priceRoundTrip: "",
            cost: "",
            costRoundTrip: "",
            currency: "YER",
        });
        setShowDialog(true);
    }, []);

    return {
        routes,
        destinations,
        loading,
        showDialog,
        setShowDialog,
        formData,
        setFormData,
        handleSave,
        handleDelete,
        handleEdit,
        openCreate,
        fetchRoutes
    };
}
