"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Bus, User, FileText, Smartphone, Wallet, Search, Check, X as XIcon, Crown, Star, Gem, Rocket, Gift, Beaker } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { OCRUploader } from "@/components/applicants/OCRUploader";
import { useFullRegistration } from "@/hooks/applicants/useFullRegistration";
import { useState } from "react";

const PKG_ICONS: Record<string, any> = { crown: Crown, star: Star, diamond: Gem, rocket: Rocket, gift: Gift };

interface FullRegistrationFormProps {
    hook: ReturnType<typeof useFullRegistration>;
}

export function FullRegistrationForm({ hook }: FullRegistrationFormProps) {
    const {
        loading,
        locations,
        transportDestinations,
        config,
        professions,
        formData,
        setFormData,
        calculated,
        promoCode,
        setPromoCode,
        validatingPromo,
        promoMessage,
        promoError,
        wantsMockExam,
        setWantsMockExam,
        mockExamType,
        setMockExamType,
        mockExamCount,
        setMockExamCount,
        selectedPackageId,
        setSelectedPackageId,
        handleCheckPromo,
        handleSubmit,
        getFilteredPackages,
        router
    } = hook;

    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
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
                            <Input
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="الاسم رباعي كما في الجواز"
                            />
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
                            <Input
                                required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="dir-ltr font-mono"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>اللقب (English)</Label>
                            <Input
                                required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="dir-ltr font-mono"
                                placeholder="Last Name"
                            />
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
                            <Input
                                required
                                value={formData.passportNumber}
                                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                                className="dir-ltr font-mono uppercase bg-white"
                                placeholder="P0000000"
                            />
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
                            <Input
                                value={formData.nationalId}
                                onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                                className="bg-white"
                                placeholder="رقم الهوية الوطنية"
                            />
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
                            <Label className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> معلومات الاتصال والبريد</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="dir-ltr"
                                    placeholder="تلفون"
                                />
                                <Input
                                    required
                                    value={formData.whatsappNumber}
                                    onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    className="dir-ltr"
                                    placeholder="واتساب"
                                />
                                <Input
                                    value={formData.notificationEmail || ""}
                                    onChange={e => setFormData({ ...formData, notificationEmail: e.target.value })}
                                    className="dir-ltr text-left"
                                    placeholder="بريد الإشعارات (اختياري)"
                                    type="email"
                                />
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
                                            {transportDestinations.filter((d: any) => d.isActive !== false).map(dest => (
                                                <SelectItem key={dest.id} value={dest.id}>
                                                    {dest.name} {dest.nameAr ? `(${dest.nameAr})` : ''} {dest.nameEn ? `(${dest.nameEn})` : ''}
                                                </SelectItem>
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
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                        <Beaker className="h-5 w-5" /> الاختبارات التجريبية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Checkbox
                            id="mockExam"
                            checked={wantsMockExam}
                            onCheckedChange={c => {
                                setWantsMockExam(c === true);
                                if (!c) setSelectedPackageId(null);
                            }}
                        />
                        <Label htmlFor="mockExam" className="font-semibold cursor-pointer">طلب اختبارات تجريبية</Label>
                    </div>
                    {wantsMockExam && (
                        <div className="mt-4 space-y-4">
                            <div className="flex gap-2 p-1 bg-white/50 rounded-lg w-fit border border-purple-100">
                                <Button
                                    type="button"
                                    variant={mockExamType === "package" ? "default" : "ghost"}
                                    onClick={() => { setMockExamType("package"); setSelectedPackageId(null); }}
                                    className="gap-2 text-xs h-8"
                                >
                                    📦 باقة
                                </Button>
                                <Button
                                    type="button"
                                    variant={mockExamType === "individual" ? "default" : "ghost"}
                                    onClick={() => { setMockExamType("individual"); setSelectedPackageId(null); }}
                                    className="gap-2 text-xs h-8"
                                >
                                    🧪 اختبارات مفردة
                                </Button>
                            </div>

                            {mockExamType === "package" ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {getFilteredPackages().length === 0 ? (
                                        <p className="col-span-3 text-center text-gray-500 py-4">لا توجد باقات مناسبة لاختياراتك الحالية</p>
                                    ) : (
                                        getFilteredPackages().map(pkg => {
                                            const Icon = PKG_ICONS[pkg.icon] || Star;
                                            let pkgTotal = Number(pkg.price);
                                            if (pkg.includesRegistration) pkgTotal += Number(config.registrationPrice) - Number(pkg.registrationDiscount);
                                            if (pkg.includesTransport && calculated.transportPrice > 0) pkgTotal += calculated.transportPrice - Number(pkg.transportDiscount);
                                            
                                            const isSelected = selectedPackageId === pkg.id;
                                            const isGreen = pkg.color === "#5c9e45";
                                            const isBlue = pkg.color === "#16539a";
                                            const isPkgGreen = isGreen || (!isBlue && pkg.isFeatured);
                                            
                                            const cardStyleClass = isSelected
                                                ? isPkgGreen
                                                    ? 'border-emerald-500 bg-emerald-50/60 shadow-md'
                                                    : 'border-blue-600 bg-blue-50/60 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-gray-300';
                                                
                                            return (
                                                <div
                                                    key={pkg.id}
                                                    onClick={() => setSelectedPackageId(pkg.id)}
                                                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${cardStyleClass}`}
                                                >
                                                    {pkg.isFeatured && <Badge className="absolute -top-2 right-3 bg-amber-500">مميزة</Badge>}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                                            style={{ backgroundColor: pkg.color || '#3B82F6' }}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-bold">{pkg.name}</span>
                                                    </div>
                                                    <div className="text-xs space-y-1 mb-3">
                                                        <div>{pkg.examCredits === -1 ? '∞ غير محدود' : `${pkg.examCredits} اختبار`}</div>
                                                        <div className="flex items-center gap-1">
                                                            {pkg.includesRegistration ? <Check className="h-3 w-3 text-green-500" /> : <XIcon className="h-3 w-3 text-red-400" />}
                                                            التسجيل {pkg.includesRegistration && <span className="text-orange-600">(خصم {Number(pkg.registrationDiscount)})</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {pkg.includesTransport ? <Check className="h-3 w-3 text-green-500" /> : <XIcon className="h-3 w-3 text-red-400" />}
                                                            المواصلات {pkg.includesTransport && <span className="text-purple-600">(خصم {Number(pkg.transportDiscount)})</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-xl font-black text-purple-700">{pkgTotal.toLocaleString()} ر.ي</div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-3 w-full md:max-w-md">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <Label>عدد الاختبارات المطلوبة</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="w-32 bg-purple-50/30"
                                                value={mockExamCount}
                                                onChange={e => setMockExamCount(Math.max(1, Number(e.target.value)))}
                                            />
                                        </div>
                                        <div className="flex flex-col items-end pt-4">
                                            <span className="text-sm text-gray-500">{config.mockExamSinglePrice} ر.ي × {mockExamCount}</span>
                                            <span className="text-2xl font-black text-purple-700">{(Number(config.mockExamSinglePrice) * mockExamCount).toLocaleString()} ر.ي</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="space-y-2">
                            <Label>سعر التسجيل الأساسي</Label>
                            <div className="text-lg font-bold text-gray-700">{calculated.basePrice.toLocaleString()} ر.ي</div>
                        </div>
                        <div className="space-y-2">
                            <Label>سعر المواصلات</Label>
                            <div className="text-lg font-bold text-gray-700">{calculated.transportPrice.toLocaleString()} ر.ي</div>
                        </div>
                        <div className="space-y-2">
                            <Label>سعر الاختبارات التجريبية</Label>
                            <div className="text-lg font-bold text-purple-700">{(calculated.mockExamPrice || 0).toLocaleString()} ر.ي</div>
                        </div>
                        <div className="space-y-2">
                            <Label>خصم خاص</Label>
                            <Input
                                type="number"
                                value={formData.discount}
                                onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                placeholder="0"
                                className="bg-white border-green-200 text-red-600 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-green-700 font-bold">الإجمالي النهائي</Label>
                            <div className="text-2xl font-black text-green-700">
                                {calculated.total.toLocaleString()} <span className="text-sm font-normal">ر.ي</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label>المبلغ المدفوع مقدماً</Label>
                            <Input
                                type="number"
                                value={formData.amountPaid}
                                onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                                placeholder="0"
                                className="text-lg font-bold bg-white"
                            />
                        </div>
                        <div className="text-left text-lg">
                            المتبقي: <span className={`${calculated.remaining > 0 ? "text-red-500" : "text-green-500"} font-bold`}>{calculated.remaining.toLocaleString()} ر.ي</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>إلغاء</Button>
                <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="px-8 bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
                >
                    {loading ? "جاري المعالجة..." : "حفظ التسجيل"}
                </Button>
            </div>
        </form>
    );
}
