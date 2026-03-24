
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Repeat, Plus, Trash2, Bus } from "lucide-react";
import { format } from "date-fns";
import { TripsDataTable } from "./table/TripsDataTable";
import { columns, Trip } from "./table/columns";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/simple-toast";

type Destination = { id: string; name: string };
type TripStop = { destinationId: string; departureDate: string; departureTime: string; price: string; boardingPoint?: string };
type RouteDefault = { id: string; fromDestinationId: string; toDestinationId: string; fromDestination: { name: string }; toDestination: { name: string }; price: number; cost: number };
type TripTemplate = { id: string; name: string; route: { name: string }; departureTime: string; defaultCapacity: number; busClass: string };

export function ScheduleManagement() {
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

    // Form
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

    const fetchData = async () => {
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
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Listen for Edit/Delete events from Table
    useEffect(() => {
        const handleEdit = (e: any) => openEdit(e.detail);
        const handleDelete = (e: any) => deleteTrip(e.detail);

        document.addEventListener('edit-trip', handleEdit);
        document.addEventListener('delete-trip', handleDelete);

        return () => {
            document.removeEventListener('edit-trip', handleEdit);
            document.removeEventListener('delete-trip', handleDelete);
        };
    }); // Removed empty dependency array to fix stale closures, or should add dependencies? 
    // Adding dependencies causing re-bind on every render is safer for keeping fresh state access.

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

    const openCreate = () => {
        setEditMode(false);
        setEditId(null);
        setTemplateId(""); setFromId(""); setToId(""); setDate(""); setTime(""); setArrivalDate(""); setArrivalTime("");
        setPrice(""); setCost("");
        setCapacity("13"); setDaysToRepeat("1"); setBusNumber(""); setDriverName("");
        setStatus("SCHEDULED");
        setStops([]);
        setIsSheetOpen(true);
    };

    const handleRouteSelect = (routeId: string) => {
        const route = routeDefaults.find(r => r.id === routeId);
        if (route) {
            setFromId(route.fromDestinationId);
            setToId(route.toDestinationId);
            // Price/Cost are handled by the effect or we can set them directly, but we removed price input.
            // setPrice(route.price.toString());
        }
    };

    const openEdit = (trip: Trip) => {
        setEditMode(true);
        setEditId(trip.id);

        // Populate form
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

        // Stops
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
    };

    const deleteTrip = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
        try {
            const res = await fetch(`/api/transport/trips?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchData();
            } else {
                toast("فشل الحذف", "error");
            }
        } catch (e) { console.error(e); }
    };

    const handleAddStop = () => {
        setStops([...stops, { destinationId: "", departureDate: "", departureTime: "", price: "", boardingPoint: "" }]);
    };

    const handleUpdateStop = (index: number, field: keyof TripStop, value: string) => {
        const newStops = [...stops];
        newStops[index][field] = value;

        // Auto-price for stop: Origin -> Stop Destination
        if (field === 'destinationId' && fromId && value) {
            const def = routeDefaults.find(r => r.fromDestinationId === fromId && r.toDestinationId === value);
            if (def) {
                newStops[index].price = def.price.toString();
            }
        }

        setStops(newStops);
    };

    const handleRemoveStop = (index: number) => {
        setStops(stops.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!fromId || !toId || !date || !time) {
            toast("يرجى تعبئة الحقول الأساسية", "error");
            return;
        }

        // Auto-calculate price if new trip (or always update? maybe keep existing if edit?)
        // If edit mode, we might want to keep existing price unless we changed route? 
        // For now, let's lookup default price if it's 0 or empty? 
        // But we hid the price field. So we should re-fetch it from defaults to be safe.
        // If no default exists, we might default to 0.
        let finalPrice = price;
        if (!editMode || !price) {
            const def = routeDefaults.find(r => r.fromDestinationId === fromId && r.toDestinationId === toId);
            finalPrice = def ? def.price.toString() : "0";
        }

        const payload = {
            templateId,
            fromId, toId, date, time,
            arrivalDate, arrivalTime,
            price: finalPrice, capacity: parseInt(capacity), busNumber, driverName, stops, status,
            daysToRepeat: editMode ? undefined : daysToRepeat // Don't repeat on edit
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
                toast("حدث خطأ", "error");
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">جدول الرحلات</h2>
                        <p className="text-sm text-gray-500">إدارة ومتابعة الرحلات ووجهاتها</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    إضافة رحلة استثنائية
                </Button>
            </div>

            {/* Trips List Table */}
            <div className="w-full">
                <TripsDataTable
                    columns={columns}
                    data={trips}
                    loading={loading}
                    onFiltersChange={() => { }}
                />
            </div>

            {/* Scheduling Sheet Sidebar */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editMode ? "تعديل الرحلة" : "جدولة رحلة جديدة"}</SheetTitle>
                        <SheetDescription>
                            {editMode ? "تعديل بيانات الرحلة الحالية" : "قم بتعبئة البيانات لإنشاء رحلة جديدة"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        {/* Saved Routes Selection */}
                        {!editMode && (
                            <div className="space-y-2 bg-gray-50 p-4 rounded-lg border">
                                <label className="text-sm font-bold text-gray-700">اختر قالب الجدولة (لإنشاء رحلة استثنائية) *</label>
                                <Select value={templateId} onValueChange={setTemplateId}>
                                    <SelectTrigger><SelectValue placeholder="اختر القالب..." /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map(rt => (
                                            <SelectItem key={rt.id} value={rt.id}>
                                                {rt.name || rt.route.name} ({rt.departureTime}) - {rt.busClass}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Main Route */}
                        {(editMode || !templateId) && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">من</label>
                                    <Select value={fromId} onValueChange={setFromId} disabled={editMode}>
                                        <SelectTrigger><SelectValue placeholder="الانطلاق" /></SelectTrigger>
                                        <SelectContent>
                                            {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">إلى</label>
                                    <Select value={toId} onValueChange={setToId} disabled={editMode}>
                                        <SelectTrigger><SelectValue placeholder="الوصول" /></SelectTrigger>
                                        <SelectContent>
                                            {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">تاريخ المغادرة</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{templateId ? "تعديل وقت المغادرة (اختياري)" : "وقـت المغادرة"}</label>
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">تاريخ الوصول (اختياري)</label>
                                <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">وقت الوصول (اختياري)</label>
                                <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                {/* Price is hidden/auto-calculated, showing capacity full width or maybe leaving empty space for layout balance */}
                                <label className="text-sm font-medium">عدد الركاب</label>
                                <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                {/* Placeholder for grid balance */}
                            </div>
                        </div>

                        {/* Stops Section */}
                        {(editMode || !templateId) && (
                            <div className="border-t pt-4">
                                <label className="text-sm font-bold flex justify-between items-center mb-3">
                                    نقاط التوقف
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddStop}>
                                        <Plus className="h-3 w-3 mr-1" /> إضافة
                                    </Button>
                                </label>
                                <div className="space-y-3">
                                    {stops.map((stop, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded border">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">محطة {idx + 1}</span>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleRemoveStop(idx)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Select value={stop.destinationId} onValueChange={v => handleUpdateStop(idx, 'destinationId', v)}>
                                                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="المحطة" /></SelectTrigger>
                                                    <SelectContent>
                                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="date"
                                                    className="h-8 text-xs w-[110px]"
                                                    value={stop.departureDate}
                                                    onChange={e => handleUpdateStop(idx, 'departureDate', e.target.value)}
                                                />
                                                <Input
                                                    type="time"
                                                    className="h-8 text-xs w-[70px]"
                                                    value={stop.departureTime}
                                                    onChange={e => handleUpdateStop(idx, 'departureTime', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs w-[60px]"
                                                    placeholder="سعر"
                                                    value={stop.price}
                                                    onChange={e => handleUpdateStop(idx, 'price', e.target.value)}
                                                />
                                            </div>
                                            <div className="mt-1">
                                                <Input
                                                    type="text"
                                                    className="h-8 text-xs w-full bg-white"
                                                    placeholder="نقطة التجمع / عنوان المحطة"
                                                    value={stop.boardingPoint || ""}
                                                    onChange={e => handleUpdateStop(idx, 'boardingPoint', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!editMode && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                                    <Repeat className="h-4 w-4" /> تكرار الجدولة
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Input type="number" className="h-9 bg-white" value={daysToRepeat} onChange={e => setDaysToRepeat(e.target.value)} min={1} max={365} />
                                    <span className="text-sm text-blue-700 whitespace-nowrap">يوم متتالي</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">رقم الباص</label>
                                <Input placeholder="مثال: 104" value={busNumber} onChange={e => setBusNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">اسم السائق</label>
                                <Input placeholder="مثال: محمد علي" value={driverName} onChange={e => setDriverName(e.target.value)} />
                            </div>
                        </div>

                        {editMode && (
                            <div className="space-y-2 pt-2 border-t">
                                <label className="text-sm font-bold text-red-600">حالة الرحلة</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="border-red-200 focus:ring-red-500"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHEDULED">مجدولة (فعالة)</SelectItem>
                                        <SelectItem value="CANCELLED">ملغاة (CANCELLED)</SelectItem>
                                        <SelectItem value="DEPARTED">غادرت (DEPARTED)</SelectItem>
                                        <SelectItem value="COMPLETED">مكتملة (COMPLETED)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <SheetFooter>
                        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
                            {editMode ? "حفظ التعديلات" : "جدولة الرحلة"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
