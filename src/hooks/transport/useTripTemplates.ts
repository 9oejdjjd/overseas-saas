"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type Route = { id: string; name: string };
export type Driver = { id: string; name: string };
export type Vehicle = { id: string; plateNumber: string; model: string };

export type TripTemplate = {
    id: string;
    routeId: string;
    route: Route;
    name: string | null;
    recurrenceRule: string; 
    departureTime: string; 
    startDate: string;
    endDate: string | null;
    defaultCapacity: number;
    busClass: string;
    defaultDriverId: string | null;
    defaultVehicleId: string | null;
    defaultDriver: Driver | null;
    defaultVehicle: Vehicle | null;
};

export function useTripTemplates() {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<TripTemplate[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        routeId: "",
        recurrenceRule: "DAILY",
        departureTime: "08:00",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        defaultCapacity: 50,
        busClass: "STANDARD",
        defaultDriverId: "none",
        defaultVehicleId: "none"
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resTemplates, resRoutes, resDrivers, resVehicles] = await Promise.all([
                fetch("/api/transport/templates"),
                fetch("/api/transport/routes"),
                fetch("/api/transport/drivers"),
                fetch("/api/transport/vehicles")
            ]);
            
            if (resTemplates.ok) setTemplates(await resTemplates.json());
            if (resRoutes.ok) setRoutes(await resRoutes.json());
            if (resDrivers.ok) setDrivers(await resDrivers.json());
            if (resVehicles.ok) setVehicles(await resVehicles.json());
        } catch (e) {
            console.error(e);
            toast("خطأ في جلب قوالب الجدولة", "error");
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generateTrips = useCallback(async () => {
        const conf = confirm("سيتم توليد الرحلات للـ 14 يوماً القادمة بناءً على القوالب النشطة. قد تستغرق العملية بضع ثوانٍ. هل أنت متأكد؟");
        if (!conf) return;
        
        setLoading(true);
        try {
            const res = await fetch("/api/transport/scheduler/generate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast(`نجاح! تم توليد ${data.createdTripsCount} رحلة جديدة. (تم تخطي ${data.skippedTripsCount} رحلة مجدولة مسبقاً)`, "success");
                fetchData();
            } else {
                toast(data.error || "حدث خطأ أثناء التوليد", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
        setLoading(false);
    }, [fetchData, toast]);

    const openCreate = useCallback(() => {
        setEditMode(false);
        setEditId(null);
        setFormData({
            name: "",
            routeId: "",
            recurrenceRule: "DAILY",
            departureTime: "08:00",
            startDate: new Date().toISOString().split('T')[0],
            endDate: "",
            defaultCapacity: 50,
            busClass: "STANDARD",
            defaultDriverId: "none",
            defaultVehicleId: "none"
        });
        setIsSheetOpen(true);
    }, []);

    const openEdit = useCallback((template: TripTemplate) => {
        setEditMode(true);
        setEditId(template.id);
        setFormData({
            name: template.name || "",
            routeId: template.routeId,
            recurrenceRule: template.recurrenceRule,
            departureTime: template.departureTime,
            startDate: template.startDate ? new Date(template.startDate).toISOString().split('T')[0] : "",
            endDate: template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : "",
            defaultCapacity: template.defaultCapacity,
            busClass: template.busClass || "STANDARD",
            defaultDriverId: template.defaultDriverId || "none",
            defaultVehicleId: template.defaultVehicleId || "none"
        });
        setIsSheetOpen(true);
    }, []);

    const deleteTemplate = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا القالب؟ لن يتم حذف الرحلات المجدولة مسبقاً.")) return;
        try {
            const res = await fetch(`/api/transport/templates?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchData();
            } else {
                toast("فشل حذف القالب", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
    }, [fetchData, toast]);

    const handleSave = useCallback(async () => {
        if (!formData.routeId || !formData.departureTime || !formData.startDate) {
            toast("يرجى تعبئة الحقول الإلزامية (الخط، وقت المغادرة، تاريخ البدء)", "error");
            return;
        }

        const payload: any = { ...formData };
        if (payload.defaultDriverId === "none") payload.defaultDriverId = null;
        if (payload.defaultVehicleId === "none") payload.defaultVehicleId = null;
        if (!payload.endDate) payload.endDate = null;

        try {
            const res = await fetch("/api/transport/templates", {
                method: editMode ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editMode ? { ...payload, id: editId } : payload)
            });

            if (res.ok) {
                toast(editMode ? "تم تعديل القالب بنجاح" : "تم إنشاء القالب بنجاح", "success");
                setIsSheetOpen(false);
                fetchData();
            } else {
                toast("حدث خطأ أثناء الحفظ", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال", "error");
        }
    }, [formData, editMode, editId, fetchData, toast]);

    const updateForm = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const translateRule = useCallback((rule: string) => {
        const rules: Record<string, string> = {
            'DAILY': 'يومياً',
            'WEEKDAYS': 'أيام العمل (المحلي)',
            'WEEKENDS': 'عطلة نهاية الأسبوع',
            'WEEKLY_FRI': 'كل جمعة',
        };
        return rules[rule] || rule;
    }, []);

    return {
        templates,
        routes,
        drivers,
        vehicles,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        formData,
        generateTrips,
        openCreate,
        openEdit,
        deleteTemplate,
        handleSave,
        updateForm,
        translateRule,
        fetchData
    };
}
