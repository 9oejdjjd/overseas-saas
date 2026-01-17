"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Bus, User, FileText, Smartphone, Wallet, ArrowRight } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useToast } from "@/components/ui/simple-toast";

// Types corresponding to our API responses
type Location = {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
};

type TransportRoute = {
    id: string;
    fromId: string;
    toId: string;
    oneWayPrice: number;
    roundTripPrice: number;
    isActive: boolean;
};

type ServiceConfig = {
    registrationPrice: number;
};

export default function NewApplicantPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Dynamic Data State
    const [locations, setLocations] = useState<Location[]>([]);
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0 });
    const [routes, setRoutes] = useState<TransportRoute[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        firstName: "",
        lastName: "",
        profession: "",
        dob: undefined as Date | undefined,
        phone: "",
        whatsappNumber: "",
        passportNumber: "",
        passportExpiry: undefined as Date | undefined,
        nationalId: "",
        gender: "MALE",

        // Service Details
        locationId: "",
        hasTransportation: false,
        transportFromId: "",
        transportType: "ONE_WAY",

        // Financials
        discount: 0,
        amountPaid: 0,
    });

    // Calculated Prices
    const [calculated, setCalculated] = useState({
        basePrice: 0,
        transportPrice: 0,
        total: 0,
        remaining: 0
    });

    // Promo Code State
    const [promoCode, setPromoCode] = useState("");
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [promoMessage, setPromoMessage] = useState("");
    const [promoError, setPromoError] = useState(false);

    // 1. Fetch Initial Data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [locRes, configRes, routesRes] = await Promise.all([
                    fetch("/api/locations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes")
                ]);

                if (locRes.ok) setLocations(await locRes.json());
                if (configRes.ok) setConfig(await configRes.json());
                if (routesRes.ok) setRoutes(await routesRes.json());
            } catch (e) {
                console.error("Failed to fetch initial data", e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchAll();
    }, []);

    // 2. Calculate Totals Logic
    useEffect(() => {
        let base = Number(config.registrationPrice);
        let transport = 0;

        if (formData.hasTransportation && formData.locationId && formData.transportFromId) {
            // Find matching route
            const route = routes.find(r =>
                r.toId === formData.locationId &&
                r.fromId === formData.transportFromId
            );

            if (route) {
                transport = formData.transportType === "ROUND_TRIP"
                    ? Number(route.roundTripPrice)
                    : Number(route.oneWayPrice);
            }
        }

        const total = base + transport - Number(formData.discount);
        const remaining = total - Number(formData.amountPaid);

        setCalculated({
            basePrice: base,
            transportPrice: transport,
            total,
            remaining
        });
    }, [formData, config, routes]);

    const handleCheckPromo = async () => {
        if (!promoCode) return;
        setValidatingPromo(true);
        setPromoMessage("");
        setPromoError(false);

        try {
            // Fetch active public vouchers
            // We use client-side check for UX feedback. Server does final validation.
            const res = await fetch("/api/vouchers?activeOnly=true&category=PUBLIC");
            if (res.ok) {
                const vouchers = await res.json();
                const matched = vouchers.find((v: any) => v.code === promoCode);

                if (matched) {
                    // Check expiry locally for feedback
                    let expired = false;
                    if (matched.expiryDate) {
                        if (new Date(matched.expiryDate) < new Date()) expired = true;
                    }
                    if (matched.maxUses && matched.usageCount >= matched.maxUses) expired = true;

                    if (expired) {
                        setPromoError(true);
                        setPromoMessage("هذا الكود منتهي الصلاحية أو تم استخدامه بالكامل");
                    } else {
                        // Valid
                        setPromoMessage(`كود صحيح! خصم ${matched.discountPercent}%`);

                        // Apply Discount
                        const currentBase = Number(config.registrationPrice);
                        // Transport? Promo applies to entire initial fee?
                        // Usually yes.
                        // Calculate expected transport
                        let transport = 0;
                        if (formData.hasTransportation && formData.locationId && formData.transportFromId) {
                            const route = routes.find(r => r.toId === formData.locationId && r.fromId === formData.transportFromId);
                            if (route) {
                                transport = formData.transportType === "ROUND_TRIP" ? Number(route.roundTripPrice) : Number(route.oneWayPrice);
                            }
                        }
                        const gross = currentBase + transport;
                        const discountVal = gross * (matched.discountPercent / 100);

                        setFormData(prev => ({ ...prev, discount: discountVal }));
                    }
                } else {
                    setPromoError(true);
                    setPromoMessage("الكود غير صحيح");
                }
            } else {
                setPromoError(true);
                setPromoMessage("حدث خطأ أثناء التحقق");
            }
        } catch (e) {
            console.error(e);
            setPromoError(true);
            setPromoMessage("فشل الاتصال");
        } finally {
            setValidatingPromo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare payload
            const payload = {
                ...formData,
                dob: formData.dob ? formData.dob.toISOString() : null,
                passportExpiry: formData.passportExpiry ? formData.passportExpiry.toISOString() : null,
                totalAmount: calculated.total,
                remainingBalance: calculated.remaining,
                promoCode: promoCode || undefined // Send promo code if exists
            };

            const res = await fetch("/api/applicants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            toast("تم تسجيل المتقدم بنجاح", "success");

            // Short delay to show toast before redirect
            setTimeout(() => {
                router.push("/applicants");
            }, 1000);
        } catch (error: any) {
            toast("فشل التسجيل: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-10 text-center">جاري تحميل البيانات...</div>;

    const currentYear = new Date().getFullYear();

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/applicants")}>
                    <ArrowRight className="h-6 w-6 text-gray-500" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-blue-600" />
                        تسجيل متقدم جديد
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">البيانات الشخصية والمالية وفقاً للهيكلية الجديدة</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                            <FileText className="h-5 w-5 text-blue-500" />
                            البيانات الشخصية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Name Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>الاسم الكامل (عربي)</Label>
                                <Input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="الاسم رباعي كما في الجواز" />
                            </div>
                            <div className="space-y-2">
                                <Label>المهنة</Label>
                                <Input required value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} placeholder="طبيب، مهندس..." />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>الاسم الأول (English)</Label>
                                <Input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="dir-ltr font-mono" placeholder="First Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>اللقب (English)</Label>
                                <Input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="dir-ltr font-mono" placeholder="Last Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>تاريخ الميلاد</Label>
                                <CustomDatePicker
                                    value={formData.dob}
                                    onChange={(date) => setFormData({ ...formData, dob: date })}
                                />
                            </div>
                        </div>

                        {/* ID & Passport Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="space-y-2">
                                <Label>رقم الجواز</Label>
                                <Input required value={formData.passportNumber} onChange={e => setFormData({ ...formData, passportNumber: e.target.value })} className="dir-ltr font-mono uppercase bg-white" placeholder="P0000000" />
                            </div>
                            <div className="space-y-2">
                                <Label>تاريخ انتهاء الجواز</Label>
                                <CustomDatePicker
                                    value={formData.passportExpiry}
                                    onChange={(date) => setFormData({ ...formData, passportExpiry: date })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم البطاقة الشخصية</Label>
                                <Input value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })} className="bg-white" placeholder="رقم الهوية الوطنية" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>الجنس</Label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 cursor-pointer border p-3 rounded-lg flex-1 justify-center transition-all ${formData.gender === "MALE" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-white hover:bg-gray-50 border-gray-200"}`}>
                                        <input type="radio" name="gender" value="MALE" checked={formData.gender === "MALE"} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                                        <div className={`p-1 rounded-full ${formData.gender === "MALE" ? "bg-blue-200" : "bg-gray-100"}`}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">ذكر</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer border p-3 rounded-lg flex-1 justify-center transition-all ${formData.gender === "FEMALE" ? "bg-pink-50 border-pink-500 text-pink-700 shadow-sm" : "bg-white hover:bg-gray-50 border-gray-200"}`}>
                                        <input type="radio" name="gender" value="FEMALE" checked={formData.gender === "FEMALE"} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                                        <div className={`p-1 rounded-full ${formData.gender === "FEMALE" ? "bg-pink-200" : "bg-gray-100"}`}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">أنثى</span>
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> أرقام التواصل</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="dir-ltr" placeholder="تلفون" />
                                    <Input required value={formData.whatsappNumber} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} className="dir-ltr" placeholder="واتساب" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Service & Location Details */}
                <Card className="border-blue-100 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                            <MapPin className="h-5 w-5" /> تفاصيل الحجز والموقع
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">مركز الاختبار المطلوب</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, locationId: val })} value={formData.locationId}>
                                    <SelectTrigger className="h-12 text-lg bg-white">
                                        <SelectValue placeholder="اختر المدينة..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.filter(l => l.isActive).map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Transport Section */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Checkbox
                                    id="transport"
                                    checked={formData.hasTransportation}
                                    onCheckedChange={(c) => setFormData({ ...formData, hasTransportation: c === true })}
                                />
                                <Label htmlFor="transport" className="font-semibold cursor-pointer select-none flex items-center gap-2">
                                    <Bus className="w-4 h-4 text-gray-500" />
                                    طلب خدمة مواصلات
                                </Label>
                            </div>

                            {formData.hasTransportation && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>من (مدينة الانطلاق)</Label>
                                        <Select onValueChange={(val) => setFormData({ ...formData, transportFromId: val })} value={formData.transportFromId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر مدينة الانطلاق" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.filter(l => l.id !== formData.locationId && l.isActive).map(loc => (
                                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>نوع الرحلة</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={formData.transportType === "ONE_WAY" ? "default" : "outline"}
                                                onClick={() => setFormData({ ...formData, transportType: "ONE_WAY" })}
                                                className="flex-1 text-xs"
                                            >
                                                ذهاب فقط
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={formData.transportType === "ROUND_TRIP" ? "default" : "outline"}
                                                onClick={() => setFormData({ ...formData, transportType: "ROUND_TRIP" })}
                                                className="flex-1 text-xs"
                                            >
                                                ذهاب وعودة
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-center pb-2">
                                        {calculated.transportPrice > 0 ? (
                                            <Badge variant="secondary" className="text-lg px-4 py-1.5 bg-green-100 text-green-800 border-green-200">
                                                +{calculated.transportPrice.toLocaleString()} ر.ي
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-gray-400">حدد المسار لعرض السعر</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Financial Summary */}
                <Card className="border-green-100 bg-green-50/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                            <Wallet className="h-5 w-5" /> الملخص المالي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Promo Code Section */}
                        <div className="bg-white p-4 rounded-lg border border-dashed border-gray-300">
                            <Label className="mb-2 block">هل لديك كود خصم؟</Label>
                            <div className="flex gap-2">
                                <Input
                                    className="max-w-xs font-mono uppercase"
                                    placeholder="أدخل الكود هنا"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                />
                                <Button type="button" variant="outline" onClick={handleCheckPromo} disabled={validatingPromo}>
                                    {validatingPromo ? "جاري التحقق..." : "تطبيق الخصم"}
                                </Button>
                            </div>
                            {promoMessage && (
                                <p className={`text-xs mt-2 ${promoError ? "text-red-500" : "text-green-600 font-bold"}`}>
                                    {promoMessage}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label>سعر التسجيل الأساسي</Label>
                                <div className="text-lg font-bold text-gray-700">{calculated.basePrice.toLocaleString()} ر.ي</div>
                            </div>
                            <div className="space-y-2">
                                <Label>سعر المواصلات</Label>
                                <div className="text-lg font-bold text-gray-700">{calculated.transportPrice.toLocaleString()} ر.ي</div>
                            </div>
                            <div className="space-y-2">
                                <Label>خصم خاص</Label>
                                <Input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })} placeholder="0" className="bg-white border-green-200 text-red-600 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-green-700 font-bold">الإجمالي النهائي</Label>
                                <div className="text-2xl font-black text-green-700">{calculated.total.toLocaleString()} <span className="text-sm font-normal">ر.ي</span></div>
                            </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <Label>المبلغ المدفوع مقدماً</Label>
                                <Input type="number" value={formData.amountPaid} onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })} placeholder="0" className="text-lg font-bold bg-white" />
                            </div>
                            <div className="text-left text-lg">
                                المتبقي: <span className={`${calculated.remaining > 0 ? "text-red-500" : "text-green-500"} font-bold`}>{calculated.remaining.toLocaleString()} ر.ي</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>إلغاء</Button>
                    <Button type="submit" size="lg" disabled={loading} className="px-8 bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20">
                        {loading ? "جاري المعالجة..." : "حفظ التسجيل"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
