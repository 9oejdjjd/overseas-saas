"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";
import { Trip } from "@/components/transport/table/columns";

export type Destination = { id: string; name: string };
export type TripStop = { destinationId: string; departureDate: string; departureTime: string; price: string; boardingPoint?: string };
export type RouteDefault = { id: string; fromDestinationId: string; toDestinationId: string; fromDestination: { name: string }; toDestination: { name: string }; price: number; cost: number };
export type TripTemplate = { id: string; name: string; route: { name: string }; departureTime: string; defaultCapacity: number; busClass: string };

export function useScheduleManagement() {
    const { toast } = useToast();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [routeDefaults, setRouteDefaults] = useState<RouteDefault[]>([]);
    const [templates, setTemplates] = useState<TripTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form Fields
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [arrivalDate, setArrivalDate] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");
    const [price, setPrice] = useState("");
    const [cost, setCost] = useState("");
    const [capacity, setCapacity] = useState("13");
    const [daysToRepeat, setDaysToRepeat] = useState("1");
    const [busNumber, setBusNumber] = useState("");
    const [driverName, setDriverName] = useState("");
    const [status, setStatus] = useState("SCHEDULED");

    // Stops
    const [stops, setStops] = useState<TripStop[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resTrips, resDest, resDefaults, resTemplates] = await Promise.all([
                fetch("/api/transport/trips"),
                fetch("/api/transport/destinations"),
                fetch("/api/transport/route-defaults"),
                fetch("/api/transport/templates")
            ]);
            if (resTrips.ok) setTrips(await resTrips.json());
            if (resDest.ok) setDestinations(await resDest.json());
            if (resDefaults.ok) setRouteDefaults(await resDefaults.json());
            if (resTemplates.ok) setTemplates(await resTemplates.json());
        } catch (e) {
            console.error(e);
            toast("فشل تحميل بيانات الرحلات", "error");
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openCreate = useCallback(() => {
        setEditMode(false);
        setEditId(null);
        setTemplateId("");
        setFromId("");
        setToId("");
        setDate("");
        setTime("");
        setArrivalDate("");
        setArrivalTime("");
        setPrice("");
        setCost("");
        setCapacity("13");
        setDaysToRepeat("1");
        setBusNumber("");
        setDriverName("");
        setStatus("SCHEDULED");
        setStops([]);
        setIsSheetOpen(true);
    }, []);

    const openEdit = useCallback((trip: Trip) => {
        setEditMode(true);
        setEditId(trip.id);

        const t: any = trip;
        setFromId(t.fromDestinationId || t.fromDestination?.id || "");
        setToId(t.toDestinationId || t.toDestination?.id || "");

        setDate(trip.date ? new Date(trip.date).toISOString().split('T')[0] : "");
        setTime(trip.departureTime);
        setArrivalDate(trip.arrivalDate ? new Date(trip.arrivalDate).toISOString().split('T')[0] : "");
        setArrivalTime(trip.arrivalTime || "");

        setPrice(trip.price.toString());
        setCapacity(trip.capacity?.toString() || "13");
        setBusNumber(trip.busNumber || "");
        setDriverName(trip.driverName || "");

        if (trip.stops && trip.stops.length > 0) {
            setStops(trip.stops.map((s: any) => ({
                destinationId: s.destinationId,
                departureDate: s.departureDate ? new Date(s.departureDate).toISOString().split('T')[0] : "",
                departureTime: s.departureTime || "",
                price: s.price?.toString() || "",
                boardingPoint: s.boardingPoint || ""
            })));
        } else {
            setStops([]);
        }

        setIsSheetOpen(true);
    }, []);

    const deleteTrip = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
        try {
            const res = await fetch(`/api/transport/trips?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchData();
            } else {
                toast("فشل الحذف", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        }
    }, [fetchData, toast]);

    // Handle Edit/Delete Events safely
    useEffect(() => {
        const handleEdit = (e: Event) => {
            const customEvent = e as CustomEvent<Trip>;
            if (customEvent.detail) openEdit(customEvent.detail);
        };
        const handleDelete = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) deleteTrip(customEvent.detail);
        };

        document.addEventListener('edit-trip', handleEdit);
        document.addEventListener('delete-trip', handleDelete);

        return () => {
            document.removeEventListener('edit-trip', handleEdit);
            document.removeEventListener('delete-trip', handleDelete);
        };
    }, [openEdit, deleteTrip]);

    // Auto-price logic (Only when NOT in edit mode to avoid overwriting)
    useEffect(() => {
        if (editMode) return;
        if (fromId && toId) {
            const def = routeDefaults.find(r => r.fromDestinationId === fromId && r.toDestinationId === toId);
            if (def) {
                setPrice(def.price.toString());
                setCost(def.cost.toString());
            } else {
                setPrice("");
                setCost("");
            }
        }
    }, [fromId, toId, routeDefaults, editMode]);

    const handleAddStop = useCallback(() => {
        setStops(prev => [...prev, { destinationId: "", departureDate: "", departureTime: "", price: "", boardingPoint: "" }]);
    }, []);

    const handleUpdateStop = useCallback((index: number, field: keyof TripStop, value: string) => {
        setStops(prev => {
            const newStops = [...prev];
            newStops[index][field] = value;

            // Auto-price for stop: Origin -> Stop Destination
            if (field === 'destinationId' && fromId && value) {
                const def = routeDefaults.find(r => r.fromDestinationId === fromId && r.toDestinationId === value);
                if (def) {
                    newStops[index].price = def.price.toString();
                }
            }
            return newStops;
        });
    }, [fromId, routeDefaults]);

    const handleRemoveStop = useCallback((index: number) => {
        setStops(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(async () => {
        if (!fromId || !toId || !date || !time) {
            toast("يرجى تعبئة الحقول الأساسية", "error");
            return;
        }

        let finalPrice = price;
        if (!editMode || !price) {
            const def = routeDefaults.find(r => r.fromDestinationId === fromId && r.toDestinationId === toId);
            finalPrice = def ? def.price.toString() : "0";
        }

        const payload = {
            templateId,
            fromId,
            toId,
            date,
            time,
            arrivalDate,
            arrivalTime,
            price: finalPrice,
            capacity: parseInt(capacity),
            busNumber,
            driverName,
            stops,
            status,
            daysToRepeat: editMode ? undefined : daysToRepeat
        };

        try {
            let res;
            if (editMode && editId) {
                res = await fetch("/api/transport/trips", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, id: editId })
                });
            } else {
                res = await fetch("/api/transport/trips", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast(editMode ? "تم التعديل بنجاح" : "تمت الجدولة بنجاح", "success");
                fetchData();
                setIsSheetOpen(false);
            } else {
                toast("حدث خطأ أثناء حفظ الرحلة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("حدث خطأ في الاتصال", "error");
        }
    }, [fromId, toId, date, time, price, editMode, routeDefaults, templateId, arrivalDate, arrivalTime, capacity, busNumber, driverName, stops, status, daysToRepeat, editId, toast, fetchData]);

    return {
        trips,
        destinations,
        routeDefaults,
        templates,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        fromId,
        setFromId,
        toId,
        setToId,
        templateId,
        setTemplateId,
        date,
        setDate,
        time,
        setTime,
        arrivalDate,
        setArrivalDate,
        arrivalTime,
        setArrivalTime,
        price,
        setPrice,
        cost,
        setCost,
        capacity,
        setCapacity,
        daysToRepeat,
        setDaysToRepeat,
        busNumber,
        setBusNumber,
        driverName,
        setDriverName,
        status,
        setStatus,
        stops,
        handleAddStop,
        handleUpdateStop,
        handleRemoveStop,
        handleSave,
        openCreate,
        fetchData
    };
}
