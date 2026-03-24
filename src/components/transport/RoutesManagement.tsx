"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Plus, Trash2, ArrowRightLeft, Route } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/simple-toast";
import { Checkbox } from "@/components/ui/checkbox";

type Destination = { id: string; name: string };
type RouteStop = {
    destinationId: string;
    minutesFromStart: number;
    stopDurationMinutes: number;
    priceFromStart: number;
    allowBoarding: boolean;
    allowDropoff: boolean;
    boardingPoint?: string;
};
type TransportRoute = {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
    returnRouteId: string | null;
    stops: (RouteStop & { id?: string; destination?: Destination; orderIndex: number; boardingPoint?: string | null })[];
};

export function RoutesManagement() {
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

    // Derived Name
    const getDerivedDetails = () => {
        const originObj = destinations.find(d => d.id === originId);
        const destObj = destinations.find(d => d.id === destinationId);
        
        const origin = originObj?.name || "غير محدد";
        const dest = destObj?.name || "غير محدد";
        
        const name = (!originId || !destinationId) ? "خط غير مكتمل" : `من ${origin} إلى ${dest}`;
        // Simple code generation
        const code = `RT-${Date.now().toString().slice(-4)}`;
        return { name, code, origin, dest, isComplete: origin !== "غير محدد" && dest !== "غير محدد" };
    };

    // Keep stops in sync with origin and destination if they are just the basic two
    useEffect(() => {
        if (!editMode && originId && destinationId && stops.length <= 2) {
            setStops([
                { destinationId: originId, minutesFromStart: 0, stopDurationMinutes: 0, priceFromStart: 0, allowBoarding: true, allowDropoff: false, boardingPoint: "" },
                { destinationId: destinationId, minutesFromStart: 60, stopDurationMinutes: 0, priceFromStart: 0, allowBoarding: false, allowDropoff: true, boardingPoint: "" }
            ]);
        }
    }, [originId, destinationId, editMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRoutes, resDest] = await Promise.all([
                fetch("/api/transport/routes"),
                fetch("/api/transport/destinations")
            ]);
            if (resRoutes.ok) setRoutes(await resRoutes.json());
            if (resDest.ok) setDestinations(await resDest.json());
        } catch (e) {
            console.error("Failed to fetch data", e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditMode(false);
        setEditId(null);
        setOriginId("");
        setDestinationId("");
        setStops([]);
        setCreateReturnRoute(true);
        setIsSheetOpen(true);
    };

    const openEdit = (route: TransportRoute) => {
        setEditMode(true);
        setEditId(route.id);
        setCreateReturnRoute(false); // Can't auto-create on edit usually

        const sortedStops = [...route.stops].sort((a, b) => a.orderIndex - b.orderIndex);
        if (sortedStops.length >= 2) {
            setOriginId(sortedStops[0].destinationId);
            setDestinationId(sortedStops[sortedStops.length - 1].destinationId);
        }

        // Map stops to state format
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
    };

    const deleteRoute = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الخط؟ سيتم حذف جميع المحطات المرتبطة به.")) return;
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
    };

    const handleAddStop = () => {
        // Add before the last stop (destination)
        if (stops.length < 2) return;
        const newStops = [...stops];
        newStops.splice(newStops.length - 1, 0, { 
            destinationId: "", 
            minutesFromStart: 0, 
            stopDurationMinutes: 0,
            priceFromStart: 0, 
            allowBoarding: true, 
            allowDropoff: true,
            boardingPoint: ""
        });
        setStops(newStops);
    };

    const handleUpdateStop = (index: number, field: keyof RouteStop, value: any) => {
        const newStops = [...stops];
        // @ts-ignore
        newStops[index][field] = value;

        // If updating the first or last stop's destination, sync it with the state
        if (field === 'destinationId') {
            if (index === 0) setOriginId(value as string);
            if (index === newStops.length - 1) setDestinationId(value as string);
        }

        setStops(newStops);
    };

    const handleRemoveStop = (index: number) => {
        setStops(stops.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
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

        const { name, code } = getDerivedDetails();

        const payload = {
            name,
            code,
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
                
                // If requested, create the inverse return route automatically
                if (!editMode && createReturnRoute) {
                    const returnStops = [...stops].reverse().map((s, idx) => ({
                        destinationId: s.destinationId,
                        orderIndex: idx,
                        minutesFromStart: idx === 0 ? 0 : stops[stops.length - 1 - idx].minutesFromStart || 0, // Simplified time mirroring
                        stopDurationMinutes: s.stopDurationMinutes,
                        priceFromStart: idx === 0 ? 0 : stops[stops.length - 1 - idx].priceFromStart || 0, // Simplified price mirroring
                        allowBoarding: s.allowDropoff, // Inverse
                        allowDropoff: s.allowBoarding, // Inverse
                        boardingPoint: s.boardingPoint || ""
                    }));

                    const { origin, dest } = getDerivedDetails();
                    const returnPayload = {
                        name: `من ${dest} إلى ${origin} (عودة)`,
                        code: `${code}-RET`,
                        returnRouteId: createdRoute.id, // Linking them
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
    };

    return (
        <div className="space-y-4">
            {/* Header Area similar to ScheduleManagement */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Route className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">إدارة خطوط السير والمحطات</h2>
                        <p className="text-sm text-gray-500">قم بتعريف المسارات الثابتة ومحطات التعبئة والنزول والأسعار الافتراضية</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" />
                    إضافة خط جديد
                </Button>
            </div>

            {/* List of Routes */}
            {loading ? (
                <div className="text-center py-10 text-gray-500 border rounded-lg bg-white shadow-sm">جاري تحميل الخطوط...</div>
            ) : routes.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border rounded-lg bg-white shadow-sm">لا توجد خطوط سير مضافة حالياً. ابدأ بإضافة خط جديد.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routes.map(route => (
                        <div key={route.id} className="border rounded-lg bg-white shadow-sm p-4 relative hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{route.name}</h3>
                                    {route.code && <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">كود: {route.code}</span>}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(route)} className="h-8 w-8 p-0 text-blue-600">تعديل</Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteRoute(route.id)} className="h-8 w-8 p-0 text-red-500">حذف</Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                                <p className="text-sm font-semibold text-gray-600 mb-1">المسار والمحطات ({route.stops?.length}):</p>
                                <div className="relative pl-4 border-r-2 border-indigo-200 space-y-3 mr-2 pr-4 pl-0">
                                    {route.stops?.sort((a,b) => a.orderIndex - b.orderIndex).map((stop, idx) => (
                                        <div key={stop.id || idx} className="relative">
                                            <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -right-5 top-1.5 ring-4 ring-white"></div>
                                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                <span className="font-bold">{stop.destination?.name || 'محطة غير معروفة'}</span>
                                                <div className="flex gap-2 text-xs text-gray-500 font-medium">
                                                    {idx > 0 && <span>+{stop.minutesFromStart} د</span>}
                                                    {idx > 0 && <span>{parseFloat(stop.priceFromStart.toString())} ريال</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {route.returnRouteId && (
                                <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex items-center gap-1">
                                    <ArrowRightLeft className="h-3 w-3" />
                                    <span>مرتبط بخط العودة</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Editing Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editMode ? "تعديل خط السير" : "إضافة خط سير جديد"}</SheetTitle>
                        <SheetDescription>
                            حدد نقطة الانطلاق والوصول أولاً، ثم أضف أي محطات وسيطة يمر بها الخط.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">مدينة الانطلاق (Origin)</label>
                                <Select value={originId} onValueChange={setOriginId}>
                                    <SelectTrigger className="border-indigo-200 focus:ring-indigo-500">
                                        <SelectValue placeholder="اختر الانطلاق" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">الوجهة النهائية (Destination)</label>
                                <Select value={destinationId} onValueChange={setDestinationId}>
                                    <SelectTrigger className="border-indigo-200 focus:ring-indigo-500">
                                        <SelectValue placeholder="اختر الوجهة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {getDerivedDetails().isComplete && (
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex flex-col gap-2">
                                <p className="text-sm font-bold text-indigo-900">مسودة اسم الخط التلقائي:</p>
                                <p className="text-lg font-black text-indigo-700">{getDerivedDetails().name}</p>
                            </div>
                        )}

                        {!editMode && (
                            <div className="bg-white border p-4 rounded-lg space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <Checkbox 
                                        checked={createReturnRoute} 
                                        onCheckedChange={(c) => setCreateReturnRoute(!!c)} 
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">إنشاء خط العودة تلقائياً (ذهاب وعودة)</p>
                                        <p className="text-xs text-gray-500">سيقوم النظام بإنشاء خط معاكس بنفس المحطات ولكن بترتيب عكسي لتتمكن من جدولة رحلات العودة.</p>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Stops Management */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-md font-bold text-gray-800">محطات الخط (Stops)</h3>
                                    <p className="text-xs text-gray-500">أضف المحطات بالترتيب. المحطة الأولى هي نقطة الانطلاق.</p>
                                </div>
                                <Button size="sm" onClick={handleAddStop} className="gap-1">
                                    <Plus className="h-4 w-4" /> إضافة محطة
                                </Button>
                            </div>

                            {stops.length > 0 && (
                                <div className="space-y-4">
                                    {stops.map((stop, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-lg border relative">
                                            {/* Allow removing intermediate stops only */}
                                            {(idx > 0 && idx < stops.length - 1) && (
                                                <div className="absolute top-4 left-4">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleRemoveStop(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 text-xs font-bold font-mono">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-sm text-gray-700">
                                                    {idx === 0 ? "نقطة الانطلاق" : idx === stops.length - 1 ? "الوجهة النهائية" : "محطة وسيطة"}
                                                </span>
                                            </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600">اختر المدينة / المحطة</label>
                                                <Select value={stop.destinationId} onValueChange={v => handleUpdateStop(idx, 'destinationId', v)}>
                                                    <SelectTrigger><SelectValue placeholder="اختر المحطة" /></SelectTrigger>
                                                    <SelectContent>
                                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600">نقطة التجمع / العنوان</label>
                                                <Input 
                                                    placeholder="شارع/معلم (اختياري)" 
                                                    value={stop.boardingPoint || ""} 
                                                    onChange={e => handleUpdateStop(idx, 'boardingPoint', e.target.value)} 
                                                />
                                            </div>

                                            {idx > 0 && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-600">وقت الوصول (بالدقائق من الانطلاق)</label>
                                                        <Input 
                                                            type="number" 
                                                            min={0}
                                                            value={stop.minutesFromStart} 
                                                            onChange={e => handleUpdateStop(idx, 'minutesFromStart', parseInt(e.target.value) || 0)} 
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-600">مدة التوقف للراحة (بالدقائق)</label>
                                                        <Input 
                                                            type="number" 
                                                            min={0}
                                                            value={stop.stopDurationMinutes} 
                                                            onChange={e => handleUpdateStop(idx, 'stopDurationMinutes', parseInt(e.target.value) || 0)} 
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex gap-6 mt-4 pr-8">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox 
                                                    checked={stop.allowBoarding} 
                                                    onCheckedChange={(c) => handleUpdateStop(idx, 'allowBoarding', !!c)} 
                                                />
                                                <span className="text-xs font-medium text-gray-700">يسمح بالركوب (صعود مسافرين)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox 
                                                    checked={stop.allowDropoff} 
                                                    onCheckedChange={(c) => handleUpdateStop(idx, 'allowDropoff', !!c)} 
                                                />
                                                <span className="text-xs font-medium text-gray-700">يسمح بالنزول (تنزيل مسافرين)</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            )}

                            {stops.length === 0 && (
                                <div className="text-center p-6 bg-gray-50 border border-dashed rounded text-gray-500 text-sm">
                                    قم باختيار نقطة الانطلاق والوجهة لتهيئة المحطات وإضافة مسارات أخرى.
                                </div>
                            )}
                        </div>

                    </div>

                    <SheetFooter>
                        <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {editMode ? "حفظ التعديلات" : "حفظ وإنشاء خط السير"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
