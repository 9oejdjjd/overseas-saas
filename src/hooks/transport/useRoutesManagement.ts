"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/simple-toast";

export type Destination = { id: string; name: string };
export type RouteStop = {
    destinationId: string;
    minutesFromStart: number;
    stopDurationMinutes: number;
    priceFromStart: number;
    allowBoarding: boolean;
    allowDropoff: boolean;
    boardingPoint?: string;
};
export type TransportRoute = {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
    returnRouteId: string | null;
    stops: (RouteStop & { id?: string; destination?: Destination; orderIndex: number; boardingPoint?: string | null })[];
};

export function useRoutesManagement() {
    const { toast } = useToast();
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [originId, setOriginId] = useState<string>("");
    const [destinationId, setDestinationId] = useState<string>("");
    const [createReturnRoute, setCreateReturnRoute] = useState(true);

    // Derived Name Memoized
    const derivedDetails = useMemo(() => {
        const originObj = destinations.find(d => d.id === originId);
        const destObj = destinations.find(d => d.id === destinationId);
        
        const origin = originObj?.name || "غير محدد";
        const dest = destObj?.name || "غير محدد";
        
        const name = (!originId || !destinationId) ? "خط غير مكتمل" : `من ${origin} إلى ${dest}`;
        const code = `RT-${Date.now().toString().slice(-4)}`;
        return { name, code, origin, dest, isComplete: origin !== "غير محدد" && dest !== "غير محدد" };
    }, [originId, destinationId, destinations]);

    // Keep stops in sync with origin and destination if they are just the basic two
    useEffect(() => {
        if (!editMode && originId && destinationId && stops.length <= 2) {
            setStops([
                { destinationId: originId, minutesFromStart: 0, stopDurationMinutes: 0, priceFromStart: 0, allowBoarding: true, allowDropoff: false, boardingPoint: "" },
                { destinationId: destinationId, minutesFromStart: 60, stopDurationMinutes: 0, priceFromStart: 0, allowBoarding: false, allowDropoff: true, boardingPoint: "" }
            ]);
        }
    }, [originId, destinationId, editMode, stops.length]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resRoutes, resDest] = await Promise.all([
                fetch("/api/transport/routes"),
                fetch("/api/transport/destinations")
            ]);
            if (resRoutes.ok) setRoutes(await resRoutes.json());
            if (resDest.ok) setDestinations(await resDest.json());
        } catch (e) {
            console.error("Failed to fetch routes data", e);
            toast("خطأ في جلب بيانات خطوط السير", "error");
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openCreate = useCallback(() => {
        setEditMode(false);
        setEditId(null);
        setOriginId("");
        setDestinationId("");
        setStops([]);
        setCreateReturnRoute(true);
        setIsSheetOpen(true);
    }, []);

    const openEdit = useCallback((route: TransportRoute) => {
        setEditMode(true);
        setEditId(route.id);
        setCreateReturnRoute(false); 

        const sortedStops = [...route.stops].sort((a, b) => a.orderIndex - b.orderIndex);
        if (sortedStops.length >= 2) {
            setOriginId(sortedStops[0].destinationId);
            setDestinationId(sortedStops[sortedStops.length - 1].destinationId);
        }

        setStops(sortedStops.map(s => ({
            destinationId: s.destinationId,
            minutesFromStart: s.minutesFromStart,
            stopDurationMinutes: s.stopDurationMinutes,
            priceFromStart: typeof s.priceFromStart === 'string' ? parseFloat(s.priceFromStart) : s.priceFromStart || 0,
            allowBoarding: s.allowBoarding,
            allowDropoff: s.allowDropoff,
            boardingPoint: s.boardingPoint || ""
        })));

        setIsSheetOpen(true);
    }, []);

    const deleteRoute = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الخط؟ سيتم حذف جميع المحطات والرحلات والبيانات المتصلة به.")) return;
        try {
            const res = await fetch(`/api/transport/routes?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchData();
            } else {
                toast("فشل الحذف", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ أثناء الحذف", "error");
        }
    }, [fetchData, toast]);

    const handleAddStop = useCallback(() => {
        setStops(prevStops => {
            if (prevStops.length < 2) return prevStops;
            const newStops = [...prevStops];
            newStops.splice(newStops.length - 1, 0, { 
                destinationId: "", 
                minutesFromStart: 0, 
                stopDurationMinutes: 0,
                priceFromStart: 0, 
                allowBoarding: true, 
                allowDropoff: true,
                boardingPoint: ""
            });
            return newStops;
        });
    }, []);

    const handleUpdateStop = useCallback((index: number, field: keyof RouteStop, value: any) => {
        setStops(prevStops => {
            const newStops = [...prevStops];
            // @ts-ignore
            newStops[index][field] = value;

            if (field === 'destinationId') {
                if (index === 0) setOriginId(value as string);
                if (index === newStops.length - 1) setDestinationId(value as string);
            }
            return newStops;
        });
    }, []);

    const handleRemoveStop = useCallback((index: number) => {
        setStops(prevStops => prevStops.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(async () => {
        if (!originId || !destinationId) {
            toast("يجب تحديد نقطة الانطلاق والوصول الأساسية أولاً", "error");
            return;
        }

        if (stops.length < 2) {
            toast("يجب إضافة محطتين على الأقل (انطلاق ووصول)", "error");
            return;
        }

        const missingDestinations = stops.some(s => !s.destinationId);
        if (missingDestinations) {
            toast("يرجى تحديد المدينة لجميع المحطات الوسيطة", "error");
            return;
        }

        const payload = {
            name: derivedDetails.name,
            code: derivedDetails.code,
            stops: stops.map((s, idx) => ({ ...s, orderIndex: idx }))
        };

        try {
            const url = "/api/transport/routes";
            const method = editMode ? "PATCH" : "POST";
            const body = editMode ? JSON.stringify({ ...payload, id: editId }) : JSON.stringify(payload);

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body
            });

            if (res.ok) {
                const createdRoute = await res.json();
                
                // Inverse route creation
                if (!editMode && createReturnRoute) {
                    const returnStops = [...stops].reverse().map((s, idx) => ({
                        destinationId: s.destinationId,
                        orderIndex: idx,
                        minutesFromStart: idx === 0 ? 0 : stops[stops.length - 1 - idx].minutesFromStart || 0,
                        stopDurationMinutes: s.stopDurationMinutes,
                        priceFromStart: idx === 0 ? 0 : stops[stops.length - 1 - idx].priceFromStart || 0,
                        allowBoarding: s.allowDropoff, 
                        allowDropoff: s.allowBoarding, 
                        boardingPoint: s.boardingPoint || ""
                    }));

                    const returnPayload = {
                        name: `من ${derivedDetails.dest} إلى ${derivedDetails.origin} (عودة)`,
                        code: `${derivedDetails.code}-RET`,
                        returnRouteId: createdRoute.id,
                        stops: returnStops
                    };

                    await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(returnPayload)
                    });
                }

                toast(editMode ? "تم تعديل الخط بنجاح" : "تم إنشاء الخط بنجاح", "success");
                fetchData();
                setIsSheetOpen(false);
            } else {
                const data = await res.json();
                toast(data.error || "حدث خطأ أثناء الحفظ", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال", "error");
        }
    }, [originId, destinationId, stops, derivedDetails, editMode, createReturnRoute, editId, toast, fetchData]);

    return {
        routes,
        destinations,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        stops,
        setStops,
        originId,
        setOriginId,
        destinationId,
        setDestinationId,
        createReturnRoute,
        setCreateReturnRoute,
        derivedDetails,
        openCreate,
        openEdit,
        deleteRoute,
        handleAddStop,
        handleUpdateStop,
        handleRemoveStop,
        handleSave,
        fetchData
    };
}
