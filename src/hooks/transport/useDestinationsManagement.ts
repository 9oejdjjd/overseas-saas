"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type Destination = { id: string; name: string; code: string | null };

export function useDestinationsManagement() {
    const { toast } = useToast();
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchDestinations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transport/destinations");
            if (res.ok) {
                setDestinations(await res.json());
            } else {
                toast("فشل تحميل الوجهات الجغرافية", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchDestinations();
    }, [fetchDestinations]);

    const handleAdd = useCallback(async () => {
        if (!newName.trim()) {
            toast("يرجى إدخال اسم المدينة", "error");
            return;
        }
        try {
            const res = await fetch("/api/transport/destinations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                toast("تم إضافة الوجهة بنجاح", "success");
                setNewName("");
                fetchDestinations();
            } else {
                const data = await res.json();
                toast(data.error || "فشل إضافة الوجهة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال", "error");
        }
    }, [newName, fetchDestinations, toast]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الوجهة؟")) return;
        try {
            const res = await fetch(`/api/transport/destinations?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchDestinations();
            } else {
                const data = await res.json();
                toast(data.error || "فشل الحذف", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
    }, [fetchDestinations, toast]);

    return {
        destinations,
        newName,
        setNewName,
        loading,
        handleAdd,
        handleDelete,
        fetchDestinations
    };
}
