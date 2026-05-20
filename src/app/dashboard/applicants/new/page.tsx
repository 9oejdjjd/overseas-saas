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
import { MapPin, Bus, User, FileText, Smartphone, Wallet, ArrowRight, Search, ShoppingCart, Beaker, Crown, Star, Gem, Rocket, Gift, Check, X as XIcon } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useToast } from "@/components/ui/simple-toast";
import { OCRUploader } from "@/components/applicants/OCRUploader";

const PKG_ICONS: Record<string, any> = { crown: Crown, star: Star, diamond: Gem, rocket: Rocket, gift: Gift };

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
    fromDestination?: { id: string; name: string };
    toDestination?: { id: string; name: string };
};

type ServiceConfig = {
    registrationPrice: number;
    mockExamSinglePrice?: number;
};

export default function NewApplicantPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Prefill from URL (visitor conversion)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const prefillName = searchParams?.get('name') || '';
    const prefillPhone = searchParams?.get('phone') || '';
    const isPrefill = searchParams?.get('prefill') === 'true';

    // Dual Mode: "register" = full registration, "sell" = quick package sale
    const [pageMode, setPageMode] = useState<"register" | "sell">("register");

    // Dynamic Data State
    const [locations, setLocations] = useState<Location[]>([]);
    const [config, setConfig] = useState<ServiceConfig>({ registrationPrice: 0 });
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Mock Exam Packages
    const [mockPackages, setMockPackages] = useState<any[]>([]);
    const [wantsMockExam, setWantsMockExam] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

    // Quick Sale Form
    const [quickSale, setQuickSale] = useState({ buyerName: "", profession: "", phone: "", whatsapp: "", packageId: "", saleType: "package" as "package" | "individual", examCount: 1, isPaid: false, paymentMethod: "CASH", paymentNote: "", discount: 0, amountPaid: 0 });
    const [qsDropdownOpen, setQsDropdownOpen] = useState(false);
    const [qsPromoCode, setQsPromoCode] = useState("");
    const [qsPromoMsg, setQsPromoMsg] = useState("");
    const [qsPromoErr, setQsPromoErr] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: prefillName,
        firstName: "",
        lastName: "",
        profession: "",
        dob: undefined as Date | undefined,
        phone: prefillPhone,
        whatsappNumber: prefillPhone,
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
                const [locRes, configRes, routesRes, profRes, pkgRes] = await Promise.all([
                    fetch("/api/locations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes"),
                    fetch("/api/mock/admin/professions"),
                    fetch("/api/pricing/mock-packages")
                ]);

                if (locRes.ok) setLocations(await locRes.json());
                if (configRes.ok) setConfig(await configRes.json());
                if (routesRes.ok) setRoutes(await routesRes.json());
                if (profRes.ok) setProfessions(await profRes.json());
                if (pkgRes.ok) setMockPackages((await pkgRes.json()).filter((p: any) => p.isActive));
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
            // Match by destination name since Location and TransportDestination are different tables
            const selectedLocation = locations.find(l => l.id === formData.locationId);
            const selectedFrom = locations.find(l => l.id === formData.transportFromId);

            if (selectedLocation && selectedFrom) {
                const route = routes.find(r =>
                    r.toDestination?.name === selectedLocation.name &&
                    r.fromDestination?.name === selectedFrom.name
                );

                if (route) {
                    transport = formData.transportType === "ROUND_TRIP"
                        ? Number(route.roundTripPrice)
                        : Number(route.oneWayPrice);
                }
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
                            const selectedLoc = locations.find(l => l.id === formData.locationId);
                            const selectedFromLoc = locations.find(l => l.id === formData.transportFromId);
                            if (selectedLoc && selectedFromLoc) {
                                const route = routes.find(r => r.toDestination?.name === selectedLoc.name && r.fromDestination?.name === selectedFromLoc.name);
                                if (route) {
                                    transport = formData.transportType === "ROUND_TRIP" ? Number(route.roundTripPrice) : Number(route.oneWayPrice);
                                }
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
                promoCode: promoCode || undefined, // Send promo code if exists
                visitorPurchaseId: searchParams?.get('purchaseId') || undefined // For converting visitors
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
                router.push("/dashboard/applicants");
            }, 1000);
        } catch (error: any) {
            toast("فشل التسجيل: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Quick Sale Handler
    const handleQuickSale = async () => {
        if (!quickSale.buyerName || !quickSale.phone) { toast("يرجى ملء الاسم ورقم الهاتف", "error"); return; }
        if (quickSale.saleType === "package" && !quickSale.packageId) { toast("يرجى اختيار باقة", "error"); return; }
        setLoading(true);
        try {
            const payload = { ...quickSale, saleType: quickSale.saleType, examCount: quickSale.examCount };
            const res = await fetch("/api/pricing/mock-packages/sell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await res.text());
            toast("تم البيع بنجاح ✓", "success");
            setQuickSale({ buyerName: "", profession: "", phone: "", whatsapp: "", packageId: "", saleType: "package", examCount: 1, isPaid: false, paymentMethod: "CASH", paymentNote: "", discount: 0, amountPaid: 0 });
            setTimeout(() => {
                router.push("/dashboard/applicants");
            }, 1000);
        } catch (e: any) { toast("فشل: " + e.message, "error"); } finally { setLoading(false); }
    };

    // Filter packages based on applicant selections
    const getFilteredPackages = () => {
        return mockPackages.filter(pkg => {
            if (pkg.includesTransport && !formData.hasTransportation) return false;
            if (pkg.includesRegistration && !formData.locationId) return false;
            return true;
        });
    };

    // Exam-only packages for quick sale
    const examOnlyPackages = mockPackages.filter(p => !p.includesRegistration && !p.includesTransport);

    if (initialLoading) return <div className="p-10 text-center">جاري تحميل البيانات...</div>;

    const currentYear = new Date().getFullYear();

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/applicants")}>
                    <ArrowRight className="h-6 w-6 text-gray-500" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {pageMode === "register" ? <User className="h-6 w-6 text-blue-600" /> : <ShoppingCart className="h-6 w-6 text-green-600" />}
                        {pageMode === "register" ? "تسجيل متقدم جديد" : "بيع باقة اختبارات"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{pageMode === "register" ? "البيانات الشخصية والمالية" : "بيع سريع لباقة اختبارات تجريبية لزائر"}</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <Button variant={pageMode === "register" ? "default" : "ghost"} onClick={() => setPageMode("register")} className="gap-2"><User className="h-4 w-4" /> تسجيل متقدم جديد</Button>
                <Button variant={pageMode === "sell" ? "default" : "ghost"} onClick={() => setPageMode("sell")} className="gap-2"><ShoppingCart className="h-4 w-4" /> بيع باقة اختبارات</Button>
            </div>

            {/* ===== QUICK SALE MODE ===== */}
            {pageMode === "sell" && (() => {
                const singlePrice = Number(config.mockExamSinglePrice ?? 0);
                const selectedPkg = examOnlyPackages.find(p => p.id === quickSale.packageId);
                const baseTotal = quickSale.saleType === "package" && selectedPkg ? Number(selectedPkg.examPrice) : singlePrice * quickSale.examCount;
                const qsTotal = Math.max(0, baseTotal - quickSale.discount);
                const qsRemaining = qsTotal - quickSale.amountPaid;
                return (
                <div className="space-y-6">
                    {/* Visitor Info */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-green-500" /> بيانات الزائر</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>الاسم الكامل *</Label><Input required value={quickSale.buyerName} onChange={e => setQuickSale({...quickSale, buyerName: e.target.value})} /></div>
                                <div className="space-y-2 relative">
                                    <Label>المهنة</Label>
                                    <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input value={quickSale.profession} onChange={e => { setQuickSale({...quickSale, profession: e.target.value}); setQsDropdownOpen(true); }} onFocus={() => setQsDropdownOpen(true)} onBlur={() => setTimeout(() => setQsDropdownOpen(false), 200)} className="pr-9 bg-white" placeholder="ابحث عن المهنة..." autoComplete="off" />
                                    </div>
                                    {qsDropdownOpen && (
                                        <div className="absolute top-full right-0 left-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {professions.filter(p => (p.name || "").includes(quickSale.profession || "")).map(p => (
                                                <div key={p.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0" onMouseDown={e => { e.preventDefault(); setQuickSale({...quickSale, profession: p.name}); setQsDropdownOpen(false); }}>{p.name}</div>
                                            ))}
                                            {professions.filter(p => (p.name || "").includes(quickSale.profession || "")).length === 0 && <div className="px-4 py-2 text-sm text-gray-500 text-center">اكتب المهنة أو ابحث</div>}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2"><Label>رقم الهاتف *</Label><Input required value={quickSale.phone} onChange={e => setQuickSale({...quickSale, phone: e.target.value})} className="dir-ltr" /></div>
                                <div className="space-y-2"><Label>رقم الواتساب</Label><Input value={quickSale.whatsapp} onChange={e => setQuickSale({...quickSale, whatsapp: e.target.value})} className="dir-ltr" /></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sale Type Toggle */}
                    <Card className="border-green-100">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Beaker className="h-5 w-5 text-green-600" /> نوع البيع</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                <Button type="button" variant={quickSale.saleType === "package" ? "default" : "ghost"} onClick={() => setQuickSale({...quickSale, saleType: "package", packageId: ""})} className="gap-2">📦 باقة</Button>
                                <Button type="button" variant={quickSale.saleType === "individual" ? "default" : "ghost"} onClick={() => setQuickSale({...quickSale, saleType: "individual", packageId: ""})} className="gap-2">🧪 اختبارات مفردة</Button>
                            </div>

                            {quickSale.saleType === "package" ? (
                                examOnlyPackages.length === 0 ? <p className="text-gray-500 text-center py-4">لا توجد باقات متاحة</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {examOnlyPackages.map(pkg => { const Icon = PKG_ICONS[pkg.icon] || Star; return (
                                            <div key={pkg.id} onClick={() => setQuickSale({...quickSale, packageId: pkg.id})} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${quickSale.packageId === pkg.id ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200'}`}>
                                                {pkg.isFeatured && <Badge className="absolute -top-2 right-3 bg-amber-500">مميزة</Badge>}
                                                <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{backgroundColor: pkg.color || '#3B82F6'}}><Icon className="h-4 w-4" /></div><span className="font-bold">{pkg.name}</span></div>
                                                <div className="text-sm text-gray-600 mb-2">{pkg.examCredits === -1 ? '∞ غير محدودة' : `${pkg.examCredits} اختبار`}</div>
                                                {pkg.badge && <Badge variant="outline" className="mb-2">{pkg.badge}</Badge>}
                                                <div className="text-xl font-black text-green-700">{Number(pkg.examPrice)} ر.ي</div>
                                            </div>
                                        );})}
                                    </div>
                                )
                            ) : (
                                <div className="bg-white p-4 rounded-lg border space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-1"><Label>عدد الاختبارات</Label><Input type="number" min={1} className="w-32" value={quickSale.examCount} onChange={e => setQuickSale({...quickSale, examCount: Math.max(1, Number(e.target.value))})} /></div>
                                        <div className="pt-5"><span className="text-gray-500">×</span></div>
                                        <div className="pt-5"><span className="font-bold">{singlePrice} ر.ي / اختبار</span></div>
                                        <div className="pt-5"><span className="text-gray-500">=</span></div>
                                        <div className="pt-5"><span className="text-xl font-black text-green-700">{singlePrice * quickSale.examCount} ر.ي</span></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    {(quickSale.packageId || quickSale.saleType === "individual") && (
                        <Card className="border-green-100 bg-green-50/20">
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-green-800"><Wallet className="h-5 w-5" /> الملخص المالي</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-white p-4 rounded-lg border border-dashed border-gray-300">
                                    <Label className="mb-2 block">كود خصم؟</Label>
                                    <div className="flex gap-2">
                                        <Input className="max-w-xs font-mono uppercase" placeholder="أدخل الكود" value={qsPromoCode} onChange={e => setQsPromoCode(e.target.value.toUpperCase())} />
                                        <Button type="button" variant="outline" onClick={async () => {
                                            if (!qsPromoCode) return;
                                            try {
                                                const res = await fetch("/api/vouchers?activeOnly=true&category=PUBLIC");
                                                if (res.ok) { const vs = await res.json(); const m = vs.find((v:any) => v.code === qsPromoCode);
                                                    if (m && !(m.expiryDate && new Date(m.expiryDate) < new Date()) && !(m.maxUses && m.usageCount >= m.maxUses)) { setQsPromoErr(false); setQsPromoMsg(`كود صحيح! خصم ${m.discountPercent}%`); setQuickSale(p => ({...p, discount: baseTotal * (m.discountPercent / 100)})); }
                                                    else { setQsPromoErr(true); setQsPromoMsg(m ? "منتهي الصلاحية" : "كود غير صحيح"); }
                                                }
                                            } catch { setQsPromoErr(true); setQsPromoMsg("خطأ في التحقق"); }
                                        }}>تطبيق</Button>
                                    </div>
                                    {qsPromoMsg && <p className={`text-xs mt-2 ${qsPromoErr ? 'text-red-500' : 'text-green-600 font-bold'}`}>{qsPromoMsg}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-2"><Label>السعر الأساسي</Label><div className="text-lg font-bold text-gray-700">{baseTotal.toLocaleString()} ر.ي</div></div>
                                    <div className="space-y-2"><Label>خصم خاص</Label><Input type="number" value={quickSale.discount} onChange={e => setQuickSale({...quickSale, discount: Number(e.target.value)})} className="bg-white border-green-200 text-red-600 font-bold" /></div>
                                    <div className="space-y-2"><Label className="text-green-700 font-bold">الإجمالي النهائي</Label><div className="text-2xl font-black text-green-700">{qsTotal.toLocaleString()} <span className="text-sm font-normal">ر.ي</span></div></div>
                                    <div className="space-y-2"><Label>المبلغ المدفوع</Label><Input type="number" value={quickSale.amountPaid} onChange={e => setQuickSale({...quickSale, amountPaid: Number(e.target.value)})} className="text-lg font-bold bg-white" /></div>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span>المتبقي: <span className={`${qsRemaining > 0 ? 'text-red-500' : 'text-green-500'} font-bold`}>{qsRemaining.toLocaleString()} ر.ي</span></span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3"><Checkbox id="qpaid" checked={quickSale.isPaid} onCheckedChange={c => setQuickSale({...quickSale, isPaid: c === true})} /><Label htmlFor="qpaid">تم الدفع</Label></div>
                                        <Select onValueChange={v => setQuickSale({...quickSale, paymentMethod: v})} value={quickSale.paymentMethod}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">نقد</SelectItem><SelectItem value="TRANSFER">تحويل</SelectItem><SelectItem value="OTHER">أخرى</SelectItem></SelectContent></Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="flex justify-end gap-4"><Button variant="ghost" onClick={() => router.back()}>إلغاء</Button><Button size="lg" disabled={loading || (quickSale.saleType === "package" && !quickSale.packageId)} onClick={handleQuickSale} className="px-8 bg-green-700 hover:bg-green-800 text-white">{loading ? "جاري المعالجة..." : "✓ تأكيد البيع"}</Button></div>
                </div>
            );})()}

            {/* ===== FULL REGISTRATION MODE ===== */}
            {pageMode === "register" && <form onSubmit={handleSubmit} className="space-y-6">

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
                            <div className="space-y-2 relative">
                                <Label>المهنة</Label>
                                <div className="relative">
                                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                        required 
                                        value={formData.profession} 
                                        onChange={e => {
                                            setFormData({ ...formData, profession: e.target.value });
                                            setDropdownOpen(true);
                                        }}
                                        onFocus={() => setDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                        className="pr-9 bg-white"
                                        placeholder="ابحث أو اكتب المهنة..."
                                        autoComplete="off"
                                    />
                                </div>
                                {dropdownOpen && (
                                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                        {professions.filter(p => (p.name || "").includes(formData.profession || "")).map(p => (
                                            <div 
                                                key={p.id} 
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                                onMouseDown={(e) => {
                                                    // use onMouseDown to fire before onBlur
                                                    e.preventDefault();
                                                    setFormData({ ...formData, profession: p.name });
                                                    setDropdownOpen(false);
                                                }}
                                            >
                                                {p.name}
                                            </div>
                                        ))}
                                        {professions.filter(p => (p.name || "").includes(formData.profession || "")).length === 0 && (
                                            <div className="px-4 py-2 text-sm text-gray-500 text-center">قم بكتابة المهنة أو ابحث عنها</div>
                                        )}
                                    </div>
                                )}
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
                                <div className="flex justify-between items-center">
                                    <Label>رقم الجواز</Label>
                                    <OCRUploader
                                        type="PASSPORT"
                                        onScanComplete={(data) => {
                                            const updates: any = {};
                                            if (data.passportNumber) updates.passportNumber = data.passportNumber;
                                            if (data.firstName) updates.firstName = data.firstName;
                                            if (data.lastName) updates.lastName = data.lastName;
                                            if (data.passportExpiry) updates.passportExpiry = new Date(data.passportExpiry);
                                            if (data.dob) updates.dob = new Date(data.dob);
                                            if (data.profession) updates.profession = data.profession;
                                            if (data.nationalId) updates.nationalId = data.nationalId;
                                            setFormData(prev => ({ ...prev, ...updates }));
                                        }}
                                        label="مسح"
                                        className="scale-90"
                                    />
                                </div>
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
                                <div className="flex justify-between items-center">
                                    <Label>رقم البطاقة الشخصية</Label>
                                    <OCRUploader
                                        type="NATIONAL_ID"
                                        onScanComplete={(data) => {
                                            if (data.nationalId) setFormData(prev => ({ ...prev, nationalId: data.nationalId }));
                                        }}
                                        label="مسح"
                                        className="scale-90"
                                    />
                                </div>
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

                {/* Mock Exam Packages Section */}
                <Card className="border-purple-100 bg-purple-50/20">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-purple-800"><Beaker className="h-5 w-5" /> الاختبارات التجريبية</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 pb-4 border-b"><Checkbox id="mockExam" checked={wantsMockExam} onCheckedChange={c => { setWantsMockExam(c === true); if (!c) setSelectedPackageId(null); }} /><Label htmlFor="mockExam" className="font-semibold cursor-pointer">طلب اختبارات تجريبية</Label></div>
                        {wantsMockExam && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {getFilteredPackages().length === 0 ? <p className="col-span-3 text-center text-gray-500 py-4">لا توجد باقات مناسبة لاختياراتك الحالية</p> : getFilteredPackages().map(pkg => {
                                    const Icon = PKG_ICONS[pkg.icon] || Star;
                                    let pkgTotal = Number(pkg.examPrice);
                                    if (pkg.includesRegistration) pkgTotal += Number(config.registrationPrice) - Number(pkg.registrationDiscount);
                                    if (pkg.includesTransport && calculated.transportPrice > 0) pkgTotal += calculated.transportPrice - Number(pkg.transportDiscount);
                                    return (
                                        <div key={pkg.id} onClick={() => setSelectedPackageId(pkg.id)} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${selectedPackageId === pkg.id ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200'}`}>
                                            {pkg.isFeatured && <Badge className="absolute -top-2 right-3 bg-amber-500">مميزة</Badge>}
                                            <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{backgroundColor: pkg.color || '#3B82F6'}}><Icon className="h-4 w-4" /></div><span className="font-bold">{pkg.name}</span></div>
                                            <div className="text-xs space-y-1 mb-3">
                                                <div>{pkg.examCredits === -1 ? '∞ غير محدود' : `${pkg.examCredits} اختبار`}</div>
                                                <div className="flex items-center gap-1">{pkg.includesRegistration ? <Check className="h-3 w-3 text-green-500"/> : <XIcon className="h-3 w-3 text-red-400"/>} التسجيل {pkg.includesRegistration && <span className="text-orange-600">(خصم {Number(pkg.registrationDiscount)})</span>}</div>
                                                <div className="flex items-center gap-1">{pkg.includesTransport ? <Check className="h-3 w-3 text-green-500"/> : <XIcon className="h-3 w-3 text-red-400"/>} المواصلات {pkg.includesTransport && <span className="text-purple-600">(خصم {Number(pkg.transportDiscount)})</span>}</div>
                                            </div>
                                            <div className="text-xl font-black text-purple-700">{pkgTotal.toLocaleString()} ر.ي</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

            </form>}
        </div>
    );
}
