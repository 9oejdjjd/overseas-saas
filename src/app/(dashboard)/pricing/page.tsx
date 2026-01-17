"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Plus, Trash2, Save, MapPin, Bus, Settings, FileText } from "lucide-react";

// Types
type Location = {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    locationUrl: string | null;
    isActive: boolean;
};

type TransportRoute = {
    id: string;
    fromId: string;
    toId: string;
    oneWayPrice: number;
    roundTripPrice: number;
    isActive: boolean;
    from: Location;
    to: Location;
    departureTime?: string | null;
    arrivalTime?: string | null;
};

type ServiceConfig = {
    registrationPrice: number;
    examChangeFee: number;
    maxFreeChanges: number;
};

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState("locations");

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">إدارة الأسعار والباقات</h1>
                    <p className="text-gray-500 mt-2">نظام إدارة التسعير الموحد والمواصلات</p>
                </div>
            </div>

            <Tabs defaultValue="locations" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                    <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> المواقع</TabsTrigger>
                    <TabsTrigger value="services" className="gap-2"><Settings className="h-4 w-4" /> الخدمات</TabsTrigger>
                    <TabsTrigger value="transport" className="gap-2"><Bus className="h-4 w-4" /> النقل</TabsTrigger>
                    <TabsTrigger value="policies" className="gap-2"><FileText className="h-4 w-4" /> السياسات</TabsTrigger>
                </TabsList>

                <TabsContent value="locations">
                    <LocationsTab />
                </TabsContent>

                <TabsContent value="services">
                    <ServicesTab />
                </TabsContent>

                <TabsContent value="transport">
                    <TransportTab />
                </TabsContent>

                <TabsContent value="policies">
                    <PoliciesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function LocationsTab() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/locations");
            if (res.ok) setLocations(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchLocations(); }, []);

    const handleAdd = async () => {
        if (!newName) return;

        try {
            if (editingId) {
                // Update existing
                await fetch(`/api/locations/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name: newName, code: newCode, address: newAddress, locationUrl: newUrl }),
                });
            } else {
                // Create new
                await fetch("/api/locations", {
                    method: "POST",
                    body: JSON.stringify({ name: newName, code: newCode, address: newAddress, locationUrl: newUrl }),
                });
            }

            setNewName("");
            setNewCode("");
            setNewAddress("");
            setNewUrl("");
            setEditingId(null);
            fetchLocations();
        } catch (e) { alert("حدث خطأ"); }
    };

    const handleEdit = (loc: Location) => {
        setEditingId(loc.id);
        setNewName(loc.name);
        setNewCode(loc.code || "");
        setNewAddress(loc.address || "");
        setNewUrl(loc.locationUrl || "");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewName("");
        setNewCode("");
        setNewAddress("");
        setNewUrl("");
    };

    const toggleActive = async (loc: Location) => {
        await fetch(`/api/locations/${loc.id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: !loc.isActive }),
        });
        fetchLocations();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>مراكز الاختبار</CardTitle>
                <CardDescription>إدارة المدن والمراكز المتاحة للتسجيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                    <div className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">اسم المركز (مثال: مأرب)</label>
                            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المركز" />
                        </div>
                        <div className="space-y-2 w-32">
                            <label className="text-sm font-medium">الكود (اختياري)</label>
                            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="MRB" />
                        </div>
                    </div>

                    <div className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">العنوان النصي</label>
                            <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="مثال: شارع صنعاء - جوار..." />
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">رابط خرائط جوجل</label>
                            <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." dir="ltr" />
                        </div>
                        <div className="flex gap-2">
                            {editingId && (
                                <Button onClick={handleCancelEdit} variant="outline" className="text-gray-500">
                                    <X className="h-4 w-4 ml-1" /> إلغاء
                                </Button>
                            )}
                            <Button onClick={handleAdd} className={`${editingId ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                                {editingId ? <Save className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                                {editingId ? "حفظ التعديلات" : "إضافة"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border rounded-md">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">الاسم</th>
                                <th className="px-4 py-3 font-medium text-gray-700">الكود</th>
                                <th className="px-4 py-3 font-medium text-gray-700">العنوان</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">تعديل</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {locations.map(loc => (
                                <tr key={loc.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{loc.name}</td>
                                    <td className="px-4 py-3 font-mono text-gray-500">{loc.code || "-"}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[200px]" title={loc.address || ""}>{loc.address || "-"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleEdit(loc)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors">
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggleActive(loc)} className={`px-2 py-1 rounded text-xs font-bold ${loc.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {loc.isActive ? "نشط" : "غير نشط"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && !loading && <tr><td colSpan={3} className="p-4 text-center text-gray-500">لا توجد مواقع</td></tr>}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function ServicesTab() {
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0, examChangeFee: 0, maxFreeChanges: 1 });
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/pricing/config");
            if (res.ok) setConfig(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleSave = async () => {
        try {
            await fetch("/api/pricing/config", {
                method: "PATCH",
                body: JSON.stringify(config),
            });
            alert("تم حفظ الإعدادات");
        } catch (e) { alert("حدث خطأ"); }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>أسعار الخدمات الأساسية</CardTitle>
                <CardDescription>تحديد تكلفة التسجيل الموحدة لجميع الوجهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">سعر التسجيل الموحد (شامل فتح الملف)</label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={config.registrationPrice}
                                onChange={e => setConfig({ ...config, registrationPrice: Number(e.target.value) })}
                                className="pl-12 text-lg font-semibold"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ر.ي</span>
                        </div>
                        <p className="text-xs text-gray-500">هذا السعر يطبق على جميع المتقدمين بغض النظر عن الوجهة.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white w-40">
                        <Save className="h-4 w-4 ml-2" /> حفظ التغييرات
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function TransportTab() {
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // New Route Form
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [oneWay, setOneWay] = useState("");
    const [roundTrip, setRoundTrip] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");

    const fetchData = async () => {
        const [locRes, routesRes] = await Promise.all([
            fetch("/api/locations"),
            fetch("/api/pricing/routes")
        ]);
        if (locRes.ok) setLocations(await locRes.json());
        if (routesRes.ok) setRoutes(await routesRes.json());
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddRoute = async () => {
        if (!fromId || !toId || !oneWay) return alert("يرجى تعبئة الحقول المطلوبة");
        try {
            const res = await fetch("/api/pricing/routes", {
                method: "POST",
                body: JSON.stringify({
                    fromId,
                    toId,
                    oneWayPrice: Number(oneWay),
                    roundTripPrice: Number(roundTrip) || 0,
                    departureTime,
                    arrivalTime
                }),
            });
            if (!res.ok) throw new Error(await res.text());

            setOneWay(""); setRoundTrip("");
            setDepartureTime(""); setArrivalTime("");
            fetchData();
        } catch (e: any) { alert("خطأ: " + (e.message || "فشل الإضافة")); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد؟")) return;
        await fetch(`/api/pricing/routes/${id}`, { method: "DELETE" });
        fetchData();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>إضافة مسار جديد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">من (المصدر)</label>
                        <Select onValueChange={setFromId} value={fromId}>
                            <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                            <SelectContent>
                                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">إلى (الوجهة)</label>
                        <Select onValueChange={setToId} value={toId}>
                            <SelectTrigger><SelectValue placeholder="اختر المركز" /></SelectTrigger>
                            <SelectContent>
                                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ذهاب</label>
                            <Input type="number" placeholder="0" value={oneWay} onChange={e => setOneWay(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ذهاب وعودة</label>
                            <Input type="number" placeholder="0" value={roundTrip} onChange={e => setRoundTrip(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">وقت الانطلاق</label>
                            <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">وقت الوصول التقريبي</label>
                            <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
                        </div>
                    </div>

                    <Button onClick={handleAddRoute} className="w-full mt-4">إضافة المسار</Button>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>مسارات النقل الحالية</CardTitle>
                    <CardDescription>قائمة بأسعار الرحلات المفعلة</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-gray-700">المسار</th>
                                    <th className="px-4 py-3 text-gray-700">التوقيت</th>
                                    <th className="px-4 py-3 text-gray-700">سعر ذهاب</th>
                                    <th className="px-4 py-3 text-gray-700">ذهاب وعودة</th>
                                    <th className="px-4 py-3 text-center">حذف</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {routes.map(route => (
                                    <tr key={route.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-blue-700">{route.from?.name}</span>
                                            <span className="mx-2 text-gray-400">←</span>
                                            <span className="font-semibold text-green-700">{route.to?.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {route.departureTime ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">انطلاق: {route.departureTime}</span>
                                                    {route.arrivalTime && <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-500">وصول: {route.arrivalTime}</span>}
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-4 py-3">{Number(route.oneWayPrice).toLocaleString()} ر.ي</td>
                                        <td className="px-4 py-3">{Number(route.roundTripPrice) > 0 ? `${Number(route.roundTripPrice).toLocaleString()} ر.ي` : "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleDelete(route.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {routes.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">لا توجد مسارات مضافة</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Update type definition
type CancellationPolicy = {
    id: string;
    name: string;
    category: string;
    hoursTrigger: number | null;
    condition: string | null;
    feeAmount: number;
    isActive: boolean;
};

// ... inside PoliciesTab component ...

function PoliciesTab() {
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0, examChangeFee: 0, maxFreeChanges: 1 });
    const [policies, setPolicies] = useState<CancellationPolicy[]>([]);

    // Initial State for New Policy
    const [newPolicy, setNewPolicy] = useState({
        name: "",
        category: "CANCELLATION",
        hoursTrigger: "24",
        condition: "LESS_THAN",
        feeAmount: 0
    });

    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const [resConfig, resPolicies] = await Promise.all([
                fetch("/api/pricing/config"),
                fetch("/api/pricing/policies")
            ]);

            if (resConfig.ok) setConfig(await resConfig.json());
            if (resPolicies.ok) setPolicies(await resPolicies.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleSaveConfig = async () => {
        await fetch("/api/pricing/config", {
            method: "PATCH",
            body: JSON.stringify(config),
        });
        alert("تم حفظ إعدادات التعديل");
    };

    const handleAddPolicy = async () => {
        if (!newPolicy.name) return;
        try {
            const res = await fetch("/api/pricing/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPolicy),
            });
            if (res.ok) {
                setNewPolicy({
                    name: "",
                    category: "CANCELLATION",
                    hoursTrigger: "24",
                    condition: "LESS_THAN",
                    feeAmount: 0
                });
                fetchConfig();
            }
        } catch (e) { alert("خطأ في إضافة السياسة"); }
    };

    const handleDeletePolicy = async (id: string) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) return;
        try {
            await fetch(`/api/pricing/policies/${id}`, { method: "DELETE" });
            fetchConfig();
        } catch (e) { alert("خطأ في الحذف"); }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case "CANCELLATION": return "إلغاء حجز";
            case "MODIFICATION": return "تعديل رحلة";
            case "NO_SHOW": return "فوات رحلة";
            case "ROUTE_CHANGE": return "تغيير وجهة";
            default: return cat;
        }
    };

    return (
        <div className="space-y-6">
            {/* Exam Reschedule Policy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-yellow-600" /> سياسة تعديل موعد الاختبار</CardTitle>
                    <CardDescription>التحكم في رسوم تغيير موعد الاختبار المجدول</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">عدد مرات التعديل المجاني</label>
                            <Input
                                type="number"
                                value={config.maxFreeChanges}
                                onChange={e => setConfig({ ...config, maxFreeChanges: Number(e.target.value) })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">رسوم التعديل الإضافي</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={config.examChangeFee}
                                    onChange={e => setConfig({ ...config, examChangeFee: Number(e.target.value) })}
                                    className="pl-12 bg-white font-bold text-red-600"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ر.ي</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveConfig} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            <Save className="h-4 w-4 ml-2" /> حفظ إعدادات التعديل
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Refund & Cancellation Policy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bus className="h-5 w-5 text-blue-600" /> سياسات التذاكر والمواصلات</CardTitle>
                    <CardDescription>إدارة رسوم إلغاء أو تعديل تذاكر النقل بناءً على التوقيت</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add New Policy Form */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 space-y-4">
                        <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2">إضافة سياسة جديدة</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">نوع الإجراء</label>
                                <Select value={newPolicy.category} onValueChange={v => setNewPolicy({ ...newPolicy, category: v })}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CANCELLATION">إلغاء حجز</SelectItem>
                                        <SelectItem value="MODIFICATION">تعديل رحلة</SelectItem>
                                        <SelectItem value="NO_SHOW">فوات رحلة (No Show)</SelectItem>
                                        <SelectItem value="ROUTE_CHANGE">تغيير وجهة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">الشرط الزمني (ساعات قبل الرحلة)</label>
                                <div className="flex gap-2">
                                    <Select value={newPolicy.condition} onValueChange={v => setNewPolicy({ ...newPolicy, condition: v })}>
                                        <SelectTrigger className="bg-white w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LESS_THAN">أقل من (&lt;)</SelectItem>
                                            <SelectItem value="GREATER_THAN">أكثر من (&gt;)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        value={newPolicy.hoursTrigger}
                                        onChange={e => setNewPolicy({ ...newPolicy, hoursTrigger: e.target.value })}
                                        className="bg-white flex-1"
                                        placeholder="ساعات"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">قيمة الغرامة</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={newPolicy.feeAmount}
                                        onChange={e => setNewPolicy({ ...newPolicy, feeAmount: Number(e.target.value) })}
                                        className="bg-white pl-12 font-bold"
                                        placeholder="0"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ر.ي</span>
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <label className="text-sm font-medium">اسم السياسة (توضيحي)</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newPolicy.name}
                                        onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                        className="bg-white"
                                        placeholder="مثال: إلغاء قبل موعد الرحلة ب 24 ساعة"
                                    />
                                    <Button onClick={handleAddPolicy} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                                        <Plus className="h-4 w-4 ml-2" /> إضافة
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policies List */}
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-700">السياسة</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">نوع الإجراء</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">الشرط</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">الغرامة</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 text-center">حذف</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {policies.map(policy => (
                                    <tr key={policy.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{policy.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                                                {getCategoryLabel(policy.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 ltr" dir="ltr">
                                            {policy.hoursTrigger ? (
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {policy.condition === "LESS_THAN" ? "<" : ">"} {policy.hoursTrigger}h
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-red-600">{Number(policy.feeAmount).toLocaleString()} ر.ي</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleDeletePolicy(policy.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {policies.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا توجد سياسات مضافة</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
