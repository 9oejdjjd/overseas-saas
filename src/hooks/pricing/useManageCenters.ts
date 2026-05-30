"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type ExamCenter = {
    id: string;
    name: string;
    address: string | null;
    locationUrl: string | null;
    isActive: boolean;
};

interface Location {
    id: string;
    name: string;
    examCenters?: ExamCenter[];
}

export function useManageCenters(location: Location, onUpdate: () => void) {
    const { toast } = useToast();
    const [centers, setCenters] = useState<ExamCenter[]>(location.examCenters || []);
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Update local state when prop changes
    useEffect(() => {
        setCenters(location.examCenters || []);
    }, [location.examCenters]);

    const resetForm = useCallback(() => {
        setEditingId(null);
        setNewName("");
        setNewAddress("");
        setNewUrl("");
    }, []);

    const handleAdd = useCallback(async () => {
        if (!newName.trim()) {
            toast("اسم المركز مطلوب", "error");
            return;
        }

        try {
            let res;
            if (editingId) {
                // Update
                res = await fetch(`/api/pricing/centers/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, address: newAddress, locationUrl: newUrl }),
                });
            } else {
                // Create
                res = await fetch(`/api/locations/${location.id}/centers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, address: newAddress, locationUrl: newUrl }),
                });
            }

            if (res.ok) {
                toast(editingId ? "تم تحديث المركز بنجاح" : "تم إضافة مركز الاختبار بنجاح", "success");
                onUpdate(); 
                resetForm();
            } else {
                toast("فشل حفظ مركز الاختبار", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ أثناء الاتصال بالخادم", "error");
        }
    }, [newName, newAddress, newUrl, editingId, location.id, onUpdate, resetForm, toast]);

    const handleEdit = useCallback((center: ExamCenter) => {
        setEditingId(center.id);
        setNewName(center.name);
        setNewAddress(center.address || "");
        setNewUrl(center.locationUrl || "");
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المركز نهائياً؟")) return;
        try {
            const res = await fetch(`/api/pricing/centers/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم حذف مركز الاختبار بنجاح", "success");
                onUpdate();
            } else {
                const data = await res.json();
                toast(data.error || "فشل حذف المركز", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        }
    }, [onUpdate, toast]);

    return {
        centers,
        isOpen,
        setIsOpen,
        newName,
        setNewName,
        newAddress,
        setNewAddress,
        newUrl,
        setNewUrl,
        editingId,
        handleAdd,
        handleEdit,
        handleDelete,
        resetForm
    };
}
