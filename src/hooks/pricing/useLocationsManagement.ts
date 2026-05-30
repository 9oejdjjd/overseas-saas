"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type Location = {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    locationUrl: string | null;
    isActive: boolean;
    examCenters?: any[];
};

export function useLocationsManagement() {
    const { toast } = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/locations");
            if (res.ok) {
                setLocations(await res.json());
            } else {
                toast("فشل تحميل المواقع والمدن", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const handleAdd = useCallback(async () => {
        if (!newName.trim()) {
            toast("اسم المدينة مطلوب", "error");
            return;
        }

        try {
            let res;
            if (editingId) {
                // Update existing
                res = await fetch(`/api/locations/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, code: newCode }),
                });
            } else {
                // Create new
                res = await fetch("/api/locations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, code: newCode }),
                });
            }

            if (res.ok) {
                toast(editingId ? "تم تحديث المدينة بنجاح" : "تم إضافة المدينة بنجاح", "success");
                setNewName("");
                setNewCode("");
                setEditingId(null);
                fetchLocations();
            } else {
                toast("حدث خطأ أثناء الحفظ", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال", "error");
        }
    }, [newName, newCode, editingId, fetchLocations, toast]);

    const handleEdit = useCallback((loc: Location) => {
        setEditingId(loc.id);
        setNewName(loc.name);
        setNewCode(loc.code || "");
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setNewName("");
        setNewCode("");
    }, []);

    const toggleActive = useCallback(async (loc: Location) => {
        try {
            const res = await fetch(`/api/locations/${loc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !loc.isActive }),
            });
            if (res.ok) {
                toast(`تم ${!loc.isActive ? "تفعيل" : "تعطيل"} الموقع بنجاح`, "success");
                fetchLocations();
            } else {
                toast("فشل تغيير حالة الموقع", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال", "error");
        }
    }, [fetchLocations, toast]);

    return {
        locations,
        newName,
        setNewName,
        newCode,
        setNewCode,
        loading,
        editingId,
        handleAdd,
        handleEdit,
        handleCancelEdit,
        toggleActive,
        fetchLocations
    };
}
