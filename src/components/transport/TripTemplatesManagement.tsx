"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Settings, Users, Bus, Zap } from "lucide-react";
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

type Route = { id: string; name: string };
type Driver = { id: string; name: string };
type Vehicle = { id: string; plateNumber: string; model: string };

type TripTemplate = {
    id: string;
    routeId: string;
    route: Route;
    name: string | null;
    recurrenceRule: string; // e.g., 'DAILY', 'WEEKLY_MON_WED'
    departureTime: string; // '08:00'
    startDate: string;
    endDate: string | null;
    defaultCapacity: number;
    busClass: string;
    defaultDriverId: string | null;
    defaultVehicleId: string | null;
    defaultDriver: Driver | null;
    defaultVehicle: Vehicle | null;
};

export function TripTemplatesManagement() {
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

    const fetchData = async () => {
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
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const generateTrips = async () => {
        const conf = confirm("سيتم توليد الرحلات للـ 14 يوماً القادمة بناءً على القوالب النشطة. قد تستغرق العملية بضع ثوانٍ. هل أنت متأكد؟");
        if (!conf) return;
        
        setLoading(true);
        try {
            const res = await fetch("/api/transport/scheduler/generate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast(`نجاح! تم توليد ${data.createdTripsCount} رحلة جديدة. (تم تخطي ${data.skippedTripsCount} رحلة مجدولة مسبقاً)`, "success");
            } else {
                toast(data.error || "حدث خطأ أثناء التوليد", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال بالخادم", "error");
        }
        setLoading(false);
    };

    const openCreate = () => {
        setEditMode(false);
        setEditId(null);
        setFormData({
            ...formData,
            name: "",
            routeId: "",
            startDate: new Date().toISOString().split('T')[0],
            endDate: "",
            defaultDriverId: "none",
            defaultVehicleId: "none"
        });
        setIsSheetOpen(true);
    };

    const openEdit = (template: TripTemplate) => {
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
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا القالب؟ لن يتم حذف الرحلات المجدولة مسبقاً.")) return;
        try {
            const res = await fetch(`/api/transport/templates?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("تم الحذف بنجاح", "success");
                fetchData();
            } else {
                toast("فشل الحذف", "error");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
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
                toast(editMode ? "تم تعديل القالب" : "تم إنشاء القالب بنجاح", "success");
                setIsSheetOpen(false);
                fetchData();
            } else {
                toast("حدث خطأ أثناء الحفظ", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في الاتصال", "error");
        }
    };

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const translateRule = (rule: string) => {
        const rules: Record<string, string> = {
            'DAILY': 'يومياً',
            'WEEKDAYS': 'أيام العمل (المحلي)',
            'WEEKENDS': 'عطلة نهاية الأسبوع',
            'WEEKLY_FRI': 'كل جمعة',
        };
        return rules[rule] || rule;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">قوالب الجدولة (Trip Templates)</h2>
                        <p className="text-sm text-gray-500">قم بإنشاء قوالب لتوليد الرحلات اليومية أو الأسبوعية تلقائياً على خطوط السير الأساسية</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={generateTrips} disabled={loading} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow">
                        <Zap className="h-4 w-4" />
                        توليد الرحلات تلقائياً (الآن)
                    </Button>
                    <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4" />
                        إضافة قالب جديد
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 border rounded-lg bg-white shadow-sm">جاري التحميل...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border rounded-lg bg-white shadow-sm">لا توجد قوالب مجدولة حالياً.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(tmp => (
                        <div key={tmp.id} className={`border rounded-lg bg-white shadow-sm p-4 relative hover:shadow-md transition-shadow`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{tmp.name || tmp.route.name}</h3>
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{translateRule(tmp.recurrenceRule)}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(tmp)} className="h-8 w-8 p-0 text-blue-600"><Settings className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteTemplate(tmp.id)} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm mt-4 text-gray-600">
                                <p><strong>الخط:</strong> {tmp.route.name}</p>
                                <p><strong>وقت المغادرة:</strong> <span className="text-lg font-bold text-indigo-700 dir-ltr inline-block">{tmp.departureTime}</span></p>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                                    <div className="flex items-center gap-1"><Users className="h-4 w-4"/> <span>{tmp.defaultCapacity} مقعد</span></div>
                                    <div className="flex items-center gap-1"><Bus className="h-4 w-4"/> <span>{tmp.busClass}</span></div>
                                </div>
                                {(tmp.defaultDriver || tmp.defaultVehicle) && (
                                    <div className="mt-2 pt-2 border-t text-xs">
                                        {tmp.defaultDriver && <p>السائق: {tmp.defaultDriver.name}</p>}
                                        {tmp.defaultVehicle && <p>المركبة: {tmp.defaultVehicle.plateNumber}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editMode ? "تعديل القالب" : "إضافة قالب جدولة جديد"}</SheetTitle>
                        <SheetDescription>
                            سيتم استخدام هذا القالب لتوليد الرحلات المستقبلية تلقائياً.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">اسم القالب (اختياري)</label>
                            <Input value={formData.name} onChange={e => updateForm('name', e.target.value)} placeholder="مثال: رحلة الصباح الباكر - صنعاء عدن" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">خط السير الأساسي *</label>
                            <Select value={formData.routeId} onValueChange={v => updateForm('routeId', v)}>
                                <SelectTrigger className="border-indigo-200">
                                    <SelectValue placeholder="اختر الخط" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">قاعدة التكرار *</label>
                                <Select value={formData.recurrenceRule} onValueChange={v => updateForm('recurrenceRule', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">يومياً</SelectItem>
                                        <SelectItem value="WEEKDAYS">أيام العمل</SelectItem>
                                        <SelectItem value="WEEKENDS">عطلة نهاية الأسبوع</SelectItem>
                                        <SelectItem value="WEEKLY_FRI">كل جمعة فقط</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">وقت المغادرة *</label>
                                <Input type="time" value={formData.departureTime} onChange={e => updateForm('departureTime', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">بدء العمل بالقالب من *</label>
                                <Input type="date" value={formData.startDate} onChange={e => updateForm('startDate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">انتهاء العمل بالقالب (اختياري)</label>
                                <Input type="date" value={formData.endDate} onChange={e => updateForm('endDate', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">المركبة الافتراضية</label>
                                <Select value={formData.defaultVehicleId} onValueChange={v => updateForm('defaultVehicleId', v)}>
                                    <SelectTrigger><SelectValue placeholder="بدون تحديد" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- بدون تحديد --</SelectItem>
                                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.model} ({v.plateNumber})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">السائق الافتراضي</label>
                                <Select value={formData.defaultDriverId} onValueChange={v => updateForm('defaultDriverId', v)}>
                                    <SelectTrigger><SelectValue placeholder="بدون تحديد" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- بدون تحديد --</SelectItem>
                                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">السعة الافتراضية (مقاعد)</label>
                                <Input type="number" min={1} value={formData.defaultCapacity} onChange={e => updateForm('defaultCapacity', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">درجة الخدمة</label>
                                <Select value={formData.busClass} onValueChange={v => updateForm('busClass', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">عادي (Standard)</SelectItem>
                                        <SelectItem value="VIP">خاص (VIP)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        </div>

                    <SheetFooter>
                        <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {editMode ? "حفظ التعديلات" : "إنشاء القالب"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
