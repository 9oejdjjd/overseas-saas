"use client";

import { useState } from "react";
import { useMockExamPackages, MockPackage } from "@/hooks/pricing/useMockExamPackages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Pencil, Copy, Trash2, Crown, Star, Gem, Rocket, Gift, Check, X, Coins, Percent, ArrowLeftRight, Landmark, BadgeCheck, Car, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ICONS: Record<string, any> = { 
    crown: Crown, 
    star: Star, 
    diamond: Gem, 
    rocket: Rocket, 
    gift: Gift 
};

const EXAMS_ONLY_FEATURES = [
    "اختبارات تجريبية غير محدودة لجميع المهن",
    "أسئلة محدثة مطابقة تماماً للمهنة المطلوبة",
    "تقرير نجاح/رسوب فوري بالتفصيل والدرجات",
    "مراجعة إجابات وتوضيح مواضع الأخطاء",
    "مراجعة كاملة لجميع الأخطاء مع شروحات علمية",
    "تقرير أداء مفصل مرسل فورياً على الواتساب",
    "تقرير أداء مفصل فوري على الواتساب الخاص بك",
    "دعم فني أساسي عبر البريد الإلكتروني",
    "دعم فني مباشر وسريع عبر الواتساب",
    "دعم فني مباشر وسريع جداً عبر الواتساب على مدار الساعة",
    "ضمان النجاح (إعادة الاختبار التجريبي مجاناً)"
];

const REGISTRATION_FEATURES = [
    "إتمام إجراءات التسجيل كاملة في البوابة الرسمية",
    "تسجيل فوري ومكتمل 100% مع مراجعة دقيقة للمستندات",
    "حجز وتأكيد موعد الاختبار في أقرب مركز معتمد",
    "حجز الموعد الأسرع والأقرب جغرافياً لمركز إقامتك",
    "متابعة مستمرة للطلب حتى صدور الموعد والاعتماد",
    "دعم فني استباقي عبر الواتساب لحل أي عقبات تقنية",
    "ضمان اجتياز الاختبار الفعلي (إعادة حجز وتأهيل مجاني)"
];

const TRANSPORT_B2B_FEATURES = [
    "نقل وتأمين مواصلات لمركز الاختبار (ذهاب وعودة مشتركة)",
    "مواصلات VIP خاصة (ذهاباً وإياباً) من مكان إقامتك شاملة الضيافة",
    "مرافق شخصي معتمد من فريقنا لتسهيل كافة إجراءات المركز والدخول",
    "لوحة تحكم مركزية للشركات ومكاتب الاستقدام",
    "لوحة تحكم إشرافية متعددة الموظفين",
    "مدير حساب مخصص لمتابعة أداء مجموعات العمالة",
    "جدولة مواعيد موحدة وحسومات استثنائية للشركات"
];

export function MockExamPackages() {
    const {
        packages,
        stats,
        config,
        loading,
        isConfigEditing,
        setIsConfigEditing,
        isPackageModalOpen,
        setIsPackageModalOpen,
        isFreePackageModalOpen,
        setIsFreePackageModalOpen,
        currentPackage,
        isSaving,
        handleSaveConfig,
        handleSavePackage,
        handleDelete,
        handleDuplicate,
        handleToggle,
        openNewFree,
        openNewPaid,
        openEdit,
        updateConfigField,
        updatePackageField,
        updateAttemptConfig,
        fetchData
    } = useMockExamPackages();

    const handleFeatureTextChange = (idx: number, val: string) => {
        if (!currentPackage) return;
        const currentFeatures = Array.isArray(currentPackage.features) ? [...currentPackage.features] : [];
        const normalized = currentFeatures.map(f => typeof f === 'string' ? { text: f, isIncluded: true } : f);
        normalized[idx] = { ...normalized[idx], text: val };
        updatePackageField("features", normalized);
    };

    const handleFeatureToggle = (idx: number, isIncluded: boolean) => {
        if (!currentPackage) return;
        const currentFeatures = Array.isArray(currentPackage.features) ? [...currentPackage.features] : [];
        const normalized = currentFeatures.map(f => typeof f === 'string' ? { text: f, isIncluded: true } : f);
        normalized[idx] = { ...normalized[idx], isIncluded };
        updatePackageField("features", normalized);
    };

    const handleRemoveFeature = (idx: number) => {
        if (!currentPackage) return;
        const currentFeatures = Array.isArray(currentPackage.features) ? [...currentPackage.features] : [];
        currentFeatures.splice(idx, 1);
        updatePackageField("features", currentFeatures);
    };

    const addNewFeatureField = () => {
        if (!currentPackage) return;
        const currentFeatures = Array.isArray(currentPackage.features) ? [...currentPackage.features] : [];
        const normalized = currentFeatures.map(f => typeof f === 'string' ? { text: f, isIncluded: true } : f);
        updatePackageField("features", [...normalized, { text: "", isIncluded: true }]);
    };

    const handleAddSuggestedFeature = (f: string) => {
        if (!currentPackage) return;
        const currentFeatures = Array.isArray(currentPackage.features) ? [...currentPackage.features] : [];
        const normalized = currentFeatures.map(f => typeof f === 'string' ? { text: f, isIncluded: true } : f);
        if (!normalized.some(feat => feat.text === f)) {
            updatePackageField("features", [...normalized, { text: f, isIncluded: true }]);
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-muted-foreground text-sm animate-pulse font-medium">جاري جلب إحصائيات وباقات الاختبارات...</p>
            </div>
        );
    }

    const regPrice = config.registrationPrice;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            
            {/* Elegant Statistics Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Available Packages */}
                <Card className="border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">الباقات المتاحة</span>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalPackages}</span>
                        </div>
                        <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Star className="h-5 w-5" />
                        </span>
                    </CardContent>
                </Card>

                {/* Total Purchases */}
                <Card className="border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">إجمالي الاشتراكات</span>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalPurchases}</span>
                        </div>
                        <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <BadgeCheck className="h-5 w-5" />
                        </span>
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card className="border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">إجمالي الإيرادات</span>
                            <span className="text-2xl font-black text-emerald-600 tracking-tight">{stats.totalRevenue.toLocaleString()} ر.ي</span>
                        </div>
                        <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Landmark className="h-5 w-5" />
                        </span>
                    </CardContent>
                </Card>

                {/* Credits Sold */}
                <Card className="border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">اختبارات مُباعة</span>
                            <span className="text-2xl font-black text-amber-600 tracking-tight">{stats.totalCreditsSold}</span>
                        </div>
                        <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Coins className="h-5 w-5" />
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* General Price Config */}
            <Card className="border-slate-200/80 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100/50 relative overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-white shadow-sm rounded border border-slate-200 text-slate-600">
                                    <Settings className="h-4 w-4" />
                                </span>
                                إعدادات التسعير والتحكم العام
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                التحكم بسعر الاختبار التجريبي المفرد بدون باقة وحالة تفعيل بيع الحزم
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {!isConfigEditing ? (
                                <Button 
                                    onClick={() => setIsConfigEditing(true)} 
                                    variant="outline" 
                                    size="sm"
                                    className="gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> تعديل الإعدادات
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        onClick={() => { setIsConfigEditing(false); fetchData(); }} 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-slate-500 hover:bg-slate-100 transition-all"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button 
                                        onClick={handleSaveConfig} 
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all shadow-sm shadow-indigo-100"
                                    >
                                        <Check className="h-3.5 w-3.5" /> حفظ الإعدادات
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-2 pb-5">
                    <div className="grid md:grid-cols-4 gap-6 items-center p-5 bg-white rounded-2xl border border-slate-200/80">
                        {/* Single Mock price */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 block">سعر الاختبار التجريبي المفرد (بدون باقة)</label>
                            <div className="relative max-w-xs">
                                <Input 
                                    type="number" 
                                    value={config.mockExamSinglePrice} 
                                    disabled={!isConfigEditing} 
                                    onChange={e => updateConfigField("mockExamSinglePrice", Number(e.target.value))}
                                    className={cn(
                                        "pl-14 text-left font-black text-slate-800 rounded-xl transition-all shadow-inner",
                                        isConfigEditing 
                                            ? "border-indigo-300 focus-visible:ring-indigo-500 bg-white" 
                                            : "border-transparent bg-slate-100 cursor-not-allowed select-none"
                                    )}
                                    lang="en"
                                />
                                <span className="absolute left-4 top-2.5 text-xs font-bold text-slate-400">ر.ي</span>
                            </div>
                        </div>

                        {/* Agent Single Mock price */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 block">سعر الاختبار المفرد للوكلاء</label>
                            <div className="relative max-w-xs">
                                <Input 
                                    type="number" 
                                    value={config.agentMockExamSinglePrice} 
                                    disabled={!isConfigEditing} 
                                    onChange={e => updateConfigField("agentMockExamSinglePrice", Number(e.target.value))}
                                    className={cn(
                                        "pl-14 text-left font-black text-slate-800 rounded-xl transition-all shadow-inner",
                                        isConfigEditing 
                                            ? "border-indigo-300 focus-visible:ring-indigo-500 bg-white" 
                                            : "border-transparent bg-slate-100 cursor-not-allowed select-none"
                                    )}
                                    lang="en"
                                />
                                <span className="absolute left-4 top-2.5 text-xs font-bold text-slate-400">ر.ي</span>
                            </div>
                        </div>

                        {/* Packages Enabled switch */}
                        <div className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100 max-w-xs md:col-span-2">
                            <Switch 
                                checked={config.mockExamPackagesEnabled} 
                                disabled={!isConfigEditing} 
                                onCheckedChange={c => updateConfigField("mockExamPackagesEnabled", c)} 
                                id="packages-enabled"
                            />
                            <div className="space-y-0.5">
                                <label htmlFor="packages-enabled" className="text-xs font-bold text-slate-700 block cursor-pointer">
                                    تفعيل نظام باقات الاختبارات
                                </label>
                                <span className="text-[10px] text-slate-400 block">
                                    عند الإغلاق، سيُمنع الطلاب من شراء باقات العروض.
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Packages Table & List */}
            <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-bold text-slate-800">باقات وباقات الاختبارات المتاحة</CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                تخصيص وتوزيع الباقات الحالية، وإعداد درجات وامتيازات المبيعات
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={openNewFree} 
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 rounded-xl"
                            >
                                <Plus className="h-4 w-4" /> إضافة باقة مجانية
                            </Button>
                            <Button 
                                onClick={openNewPaid} 
                                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl"
                            >
                                <Plus className="h-4 w-4" /> إضافة باقة مدفوعة
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full text-right text-sm">
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">الباقة والمسمى</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">رصيد الاختبارات</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">ملحقات الباقة</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">السعر الرسمي</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">الخصومات الممنوحة</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs">الحالة</TableHead>
                                    <TableHead className="px-5 py-4 font-bold text-slate-600 text-xs text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {packages.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                                            لا توجد باقات اختبارات تجريبية مسجلة حالياً.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    packages.map(pkg => {
                                        const themeColor = pkg.color || '#16539a';
                                        const isBlueTheme = themeColor === '#16539a';
                                        const IconComponent = pkg.includesTransport 
                                            ? Car 
                                            : (pkg.includesRegistration 
                                                ? Award 
                                                : (isBlueTheme ? Crown : Star));
                                        return (
                                            <TableRow key={pkg.id} className="hover:bg-slate-50/40 transition-colors group">
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110" 
                                                            style={{ backgroundColor: themeColor }}
                                                        >
                                                            <IconComponent className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                                {pkg.name}
                                                                {pkg.isFeatured && (
                                                                    <Badge className="bg-amber-100 border-amber-200 text-amber-800 text-[9px] font-bold rounded-full gap-0.5 px-2">
                                                                        <Crown className="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
                                                                        مميزة
                                                                    </Badge>
                                                                )}
                                                                {pkg.isFree && (
                                                                    <Badge className="bg-emerald-50 border-emerald-200 text-emerald-800 text-[9px] font-bold rounded-full">
                                                                        مجانية
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {pkg.badge && (
                                                                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold block w-fit">
                                                                    {pkg.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <span className="font-black text-slate-700 text-base">
                                                        {pkg.examCredits === -1 ? '∞' : pkg.examCredits}
                                                    </span>
                                                    <span className="text-slate-400 text-xs block mt-0.5">اختبار تجريبي</span>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            {pkg.includesRegistration ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-500 bg-emerald-50 border border-emerald-200 rounded p-0.5" />
                                                            ) : (
                                                                <X className="h-3.5 w-3.5 text-rose-400 bg-rose-50 border border-rose-100 rounded p-0.5" />
                                                            )} 
                                                            رسوم فتح الملف والتسجيل
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            {pkg.includesTransport ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-500 bg-emerald-50 border border-emerald-200 rounded p-0.5" />
                                                            ) : (
                                                                <X className="h-3.5 w-3.5 text-rose-400 bg-rose-50 border border-rose-100 rounded p-0.5" />
                                                            )} 
                                                            تذاكر خدمات النقل
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="space-y-0.5">
                                                        <span className="font-black text-slate-800 text-sm block">
                                                            {Number(pkg.examPrice).toLocaleString()} ر.ي (عام)
                                                        </span>
                                                        {!pkg.isFree && (
                                                            <span className="font-bold text-indigo-600 text-xs block">
                                                                {Number(pkg.agentPrice || 0).toLocaleString()} ر.ي (وكلاء)
                                                            </span>
                                                        )}
                                                        {pkg.priceSAR > 0 && (
                                                            <span className="text-[10px] text-emerald-600 font-bold block">
                                                                🇸🇦 {Number(pkg.priceSAR).toLocaleString()} ر.س
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="text-[10px] space-y-1">
                                                        {pkg.includesRegistration && (
                                                            <div className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded w-fit border border-orange-100">
                                                                خصم التسجيل: -{Number(pkg.registrationDiscount).toLocaleString()} ر.ي
                                                            </div>
                                                        )}
                                                        {pkg.includesTransport && (
                                                            <div className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded w-fit border border-indigo-100">
                                                                خصم النقل: -{Number(pkg.transportDiscount).toLocaleString()} ر.ي
                                                            </div>
                                                        )}
                                                        {!pkg.includesRegistration && !pkg.includesTransport && (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <Switch 
                                                        checked={pkg.isActive} 
                                                        onCheckedChange={() => handleToggle(pkg)} 
                                                    />
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            onClick={() => openEdit(pkg)}
                                                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg h-8 w-8 transition-colors"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            onClick={() => handleDuplicate(pkg.id!)}
                                                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg h-8 w-8 transition-colors"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-8 w-8 transition-colors"
                                                            onClick={() => handleDelete(pkg.id!)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Package Form Dialog */}
            <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                                <Star className="h-5 w-5" />
                            </span>
                            {currentPackage?.id ? 'تعديل تفاصيل باقة الاختبارات المدفوعة' : 'بناء باقة اختبارات مدفوعة جديدة'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            تحديد مكونات العرض، الأسعار بالعملتين، ومزايا الطالب في صفحة النتيجة
                        </DialogDescription>
                    </DialogHeader>

                    {currentPackage && (
                        <div className="space-y-6 py-4">
                            
                            {/* Basic Info Row */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">البيانات التعريفية الأساسية</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">اسم الباقة (بالعربية)</label>
                                        <Input 
                                            value={currentPackage.name} 
                                            onChange={e => updatePackageField("name", e.target.value)} 
                                            className="rounded-xl border-slate-200"
                                            placeholder="مثال: الباقة الفضية المتقدمة"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">اسم الباقة (بالإنجليزية)</label>
                                        <Input 
                                            value={currentPackage.nameEn} 
                                            onChange={e => updatePackageField("nameEn", e.target.value)} 
                                            dir="ltr" 
                                            className="rounded-xl border-slate-200 text-left"
                                            placeholder="e.g. Advanced Silver Package"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-slate-600">وصف وشرح الحزمة الترويجي</label>
                                        <Input 
                                            value={currentPackage.description} 
                                            onChange={e => updatePackageField("description", e.target.value)} 
                                            className="rounded-xl border-slate-200"
                                            placeholder="توضيح موجز يظهر للمتقدم مثل: تمنحك فرصة ممتازة لمراجعة المنهج"
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Exams & Validity configs */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">رصيد الاختبارات وقيمتها المالية</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">عدد المحاولات بالباقة (-1 = غير محدود)</label>
                                            <Input 
                                                type="number" 
                                                value={currentPackage.examCredits} 
                                                onChange={e => updatePackageField("examCredits", Number(e.target.value))} 
                                                className="rounded-xl border-slate-200 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">صلاحية الباقة بالدرجات (يوم)</label>
                                            <Input 
                                                type="number" 
                                                placeholder="اتركه فارغاً لصلاحية أبدية" 
                                                value={currentPackage.validityDays || ''} 
                                                onChange={e => updatePackageField("validityDays", e.target.value ? Number(e.target.value) : null)} 
                                                className="rounded-xl border-slate-200 font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* YER, Agent & SAR pricing inputs */}
                                    <div className="grid grid-cols-3 gap-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-900">سعر الحزمة الرسمي (بالريال اليمني)</label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    className="rounded-xl border-indigo-200 bg-white font-extrabold text-indigo-950 pl-14 text-xs h-9" 
                                                    value={currentPackage.examPrice} 
                                                    onChange={e => updatePackageField("examPrice", Number(e.target.value))} 
                                                />
                                                <span className="absolute left-4 top-2.5 text-xs font-bold text-indigo-400">ر.ي</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-purple-900">سعر الحزمة للوكلاء (بالريال اليمني)</label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    className="rounded-xl border-purple-200 bg-white font-extrabold text-purple-950 pl-14 text-xs h-9" 
                                                    value={currentPackage.agentPrice || 0} 
                                                    onChange={e => updatePackageField("agentPrice", Number(e.target.value))} 
                                                />
                                                <span className="absolute left-4 top-2.5 text-xs font-bold text-purple-400">ر.ي</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-emerald-900">سعر الحزمة الرسمي (بالريال السعودي)🇸🇦</label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    className="rounded-xl border-emerald-200 bg-white font-extrabold text-emerald-950 pl-14 text-xs h-9" 
                                                    value={currentPackage.priceSAR} 
                                                    onChange={e => updatePackageField("priceSAR", Number(e.target.value))} 
                                                />
                                                <span className="absolute left-4 top-2.5 text-xs font-bold text-emerald-400">ر.س</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Allowed Question Types Control */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">أنواع الأسئلة المتاحة في الباقة</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4">
                                    <p className="text-[10px] text-slate-500">حدد أنواع الأسئلة التي تود لطلاب هذه الباقة التدرب عليها. يجب اختيار نوع واحد على الأقل.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: "MCQ", label: "اختيار من متعدد (MCQ)" },
                                            { key: "TRUE_FALSE", label: "صح وخطأ (True/False)" },
                                            { key: "FILL_BLANK", label: "إكمال الفراغات (Fill Blank)" },
                                            { key: "IMAGE", label: "أسئلة تحتوي على صور" }
                                        ].map(typeItem => {
                                            const allowedTypes = (currentPackage.allowedQuestionTypes || "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE")
                                                .split(",")
                                                .map((t: string) => t.trim())
                                                .filter(Boolean);
                                            const isChecked = allowedTypes.includes(typeItem.key);

                                            return (
                                                <div key={typeItem.key} className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <Switch 
                                                        checked={isChecked}
                                                        onCheckedChange={() => {
                                                            let updatedTypes;
                                                            if (isChecked) {
                                                                if (allowedTypes.length === 1) return;
                                                                updatedTypes = allowedTypes.filter(t => t !== typeItem.key);
                                                            } else {
                                                                updatedTypes = [...allowedTypes, typeItem.key];
                                                            }
                                                            updatePackageField("allowedQuestionTypes", updatedTypes.join(","));
                                                        }}
                                                        id={`type-${typeItem.key}`}
                                                    />
                                                    <label htmlFor={`type-${typeItem.key}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                                                        {typeItem.label}
                                                     </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Features Checklist */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">ميزات الحزمة المشمولة (Checklist Features)</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl space-y-6 max-h-[360px] overflow-y-auto bg-slate-50/30">
                                    
                                    {/* Current Features List */}
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-700">الميزات المضافة حالياً للباقة ({Array.isArray(currentPackage.features) ? currentPackage.features.length : 0})</h4>
                                            <Button
                                                type="button"
                                                onClick={addNewFeatureField}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-[10px] rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
                                            >
                                                <Plus className="h-3 w-3" /> إضافة ميزة يدوية
                                            </Button>
                                        </div>
                                        {(!Array.isArray(currentPackage.features) || currentPackage.features.length === 0) ? (
                                            <p className="text-[10px] text-slate-400 py-3 text-center bg-white border border-slate-100 rounded-xl border-dashed">
                                                لا توجد ميزات مضافة لهذه الباقة حالياً. اختر من المقترحات أدناه أو أضف ميزة يدوياً.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {(currentPackage.features as any[]).map((f: any, idx: number) => {
                                                    const featText = typeof f === 'string' ? f : (f.text || "");
                                                    const isIncluded = typeof f === 'string' ? true : (f.isIncluded !== false);
                                                    return (
                                                    <div key={idx} className="flex gap-2 items-center bg-white p-1.5 rounded-xl border border-slate-150 shadow-sm animate-in fade-in duration-200">
                                                        <Switch
                                                            checked={isIncluded}
                                                            onCheckedChange={(c) => handleFeatureToggle(idx, c)}
                                                            className={isIncluded ? "data-[state=checked]:bg-emerald-500" : "data-[state=unchecked]:bg-rose-500"}
                                                        />
                                                        <Input
                                                            value={featText}
                                                            onChange={e => handleFeatureTextChange(idx, e.target.value)}
                                                            placeholder="اكتب الميزة هنا..."
                                                            className="h-8 text-xs flex-1 rounded-lg border-slate-150 focus-visible:ring-indigo-500 font-medium"
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleRemoveFeature(idx)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )})}
                                            </div>
                                        )}
                                    </div>

                                    {/* Predefined Features Suggestions */}
                                    <div className="space-y-3 pt-3 border-t border-slate-200/50">
                                        <div className="space-y-0.5 text-right" dir="rtl">
                                            <h4 className="text-[11px] font-black text-indigo-700">اقتراحات ميزات سريعة (اضغط للإضافة)</h4>
                                            <p className="text-[9px] text-slate-400">انقر على الميزة لإضافتها مباشرة إلى قائمة الميزات أعلاه وتعديلها</p>
                                        </div>

                                        {/* Exams suggested features */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black text-slate-400 block text-right">اختبارات المحاكاة والاستعداد:</span>
                                            <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                                                {EXAMS_ONLY_FEATURES.map(f => {
                                                    const currentFeatures = Array.isArray(currentPackage.features) ? (currentPackage.features as any[]).map(x => typeof x === 'string' ? x : x.text) : [];
                                                    const alreadyAdded = currentFeatures.includes(f);
                                                    return (
                                                        <button
                                                            key={f}
                                                            type="button"
                                                            onClick={() => handleAddSuggestedFeature(f)}
                                                            disabled={alreadyAdded}
                                                            className={cn(
                                                                "px-2 py-1 rounded-lg border text-[9px] font-semibold text-right transition-all",
                                                                alreadyAdded
                                                                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                                                                    : "bg-white border-slate-200 text-slate-655 hover:bg-indigo-50/30 hover:border-indigo-200 hover:text-indigo-950"
                                                            )}
                                                        >
                                                            + {f}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Registration suggested features */}
                                        {currentPackage.includesRegistration && (
                                            <div className="space-y-1.5 pt-1.5 border-t border-slate-200/30">
                                                <span className="text-[10px] font-black text-orange-600 block text-right">التسجيل الرسمي وحجز الموعد:</span>
                                                <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                                                    {REGISTRATION_FEATURES.map(f => {
                                                        const currentFeatures = Array.isArray(currentPackage.features) ? (currentPackage.features as any[]).map(x => typeof x === 'string' ? x : x.text) : [];
                                                        const alreadyAdded = currentFeatures.includes(f);
                                                        return (
                                                            <button
                                                                key={f}
                                                                type="button"
                                                                onClick={() => handleAddSuggestedFeature(f)}
                                                                disabled={alreadyAdded}
                                                                className={cn(
                                                                    "px-2 py-1 rounded-lg border text-[9px] font-semibold text-right transition-all",
                                                                    alreadyAdded
                                                                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                                                                        : "bg-white border-slate-200 text-slate-655 hover:bg-orange-50/20 hover:border-orange-200 hover:text-orange-950"
                                                                )}
                                                            >
                                                                + {f}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Transport suggested features */}
                                        {currentPackage.includesTransport && (
                                            <div className="space-y-1.5 pt-1.5 border-t border-slate-200/30">
                                                <span className="text-[10px] font-black text-purple-600 block text-right">النقل والمواصلات VIP:</span>
                                                <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                                                    {TRANSPORT_B2B_FEATURES.map(f => {
                                                        const currentFeatures = Array.isArray(currentPackage.features) ? (currentPackage.features as any[]).map(x => typeof x === 'string' ? x : x.text) : [];
                                                        const alreadyAdded = currentFeatures.includes(f);
                                                        return (
                                                            <button
                                                                key={f}
                                                                type="button"
                                                                onClick={() => handleAddSuggestedFeature(f)}
                                                                disabled={alreadyAdded}
                                                                className={cn(
                                                                    "px-2 py-1 rounded-lg border text-[9px] font-semibold text-right transition-all",
                                                                    alreadyAdded
                                                                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                                                                        : "bg-white border-slate-200 text-slate-655 hover:bg-purple-50/20 hover:border-purple-200 hover:text-purple-950"
                                                                )}
                                                            >
                                                                + {f}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Registration Inclusion & discount */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">دمج التسجيل وفتح الملف</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Switch 
                                            checked={currentPackage.includesRegistration} 
                                            onCheckedChange={c => updatePackageField("includesRegistration", c)} 
                                            id="p-inc-reg"
                                        />
                                        <label htmlFor="p-inc-reg" className="text-xs font-black text-slate-800 cursor-pointer">
                                            الحزمة تشمل وتغطي رسوم التسجيل للمشتركين الجدد
                                        </label>
                                    </div>
                                    {currentPackage.includesRegistration && (
                                        <div className="grid grid-cols-3 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100 animate-in fade-in duration-300 items-center">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 block">رسوم التسجيل الحالية</span>
                                                <span className="text-sm font-extrabold text-slate-700 block">{regPrice.toLocaleString()} ر.ي</span>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-orange-800 block">خصم التسجيل الممنوح</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" 
                                                        className="rounded-lg border-orange-200 h-8 font-bold pr-2 bg-white pl-10" 
                                                        value={currentPackage.registrationDiscount} 
                                                        onChange={e => updatePackageField("registrationDiscount", Number(e.target.value))} 
                                                    />
                                                    <span className="absolute left-2 top-1.5 text-[10px] font-bold text-orange-400">ر.ي</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 block">رسوم التسجيل الصافية</span>
                                                <span className="text-sm font-extrabold text-emerald-600 block">
                                                    {Math.max(0, regPrice - Number(currentPackage.registrationDiscount || 0)).toLocaleString()} ر.ي ✨
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transport Inclusion & discount */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">دمج وحجز النقل والمواصلات</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Switch 
                                            checked={currentPackage.includesTransport} 
                                            onCheckedChange={c => updatePackageField("includesTransport", c)} 
                                            id="p-inc-trans"
                                        />
                                        <label htmlFor="p-inc-trans" className="text-xs font-black text-slate-800 cursor-pointer">
                                            الحزمة تشمل تذاكر خدمات النقل التابعة للمركز
                                        </label>
                                    </div>
                                    {currentPackage.includesTransport && (
                                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 animate-in fade-in duration-300 space-y-4">
                                            <div className="flex gap-4 items-center">
                                                <label className="text-xs font-bold text-purple-900">نوع تذكرة النقل المتاحة بالباقة:</label>
                                                <select 
                                                    className="h-8 rounded-lg border border-purple-200 px-3 text-xs bg-white focus:outline-none font-bold text-purple-950" 
                                                    value={currentPackage.transportType || 'ONE_WAY'} 
                                                    onChange={e => updatePackageField("transportType", e.target.value)}
                                                >
                                                    <option value="ONE_WAY">ذهاب فقط (One Way Ticket)</option>
                                                    <option value="ROUND_TRIP">ذهاب وعودة (Round Trip Ticket)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-purple-800 block">قيمة الخصم النقدي على المواصلات</label>
                                                <div className="relative max-w-xs">
                                                    <Input 
                                                        type="number" 
                                                        className="rounded-lg border-purple-200 h-8 font-bold bg-white pl-10" 
                                                        value={currentPackage.transportDiscount} 
                                                        onChange={e => updatePackageField("transportDiscount", Number(e.target.value))} 
                                                    />
                                                    <span className="absolute left-2 top-1.5 text-[10px] font-bold text-purple-400">ر.ي</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                    <Percent className="h-4 w-4 text-emerald-500" />
                                    موجز هيكل الرسوم والأسعار النهائي
                                </h4>
                                <div className="space-y-1 text-xs text-slate-600">
                                    <div className="flex justify-between">
                                        <span>قيمة اختبارات المحاكاة:</span>
                                        <span className="font-bold text-slate-800">{Number(currentPackage.examPrice || 0).toLocaleString()} ر.ي</span>
                                    </div>
                                    {currentPackage.includesRegistration && (
                                        <div className="flex justify-between text-orange-600 font-medium">
                                            <span>خصم التسجيل المطبق:</span>
                                            <span>-{Number(currentPackage.registrationDiscount || 0).toLocaleString()} ر.ي</span>
                                        </div>
                                    )}
                                    {currentPackage.includesTransport && (
                                        <div className="flex justify-between text-purple-600 font-medium">
                                            <span>خصم حجز النقل المطبق:</span>
                                            <span>-{Number(currentPackage.transportDiscount || 0).toLocaleString()} ر.ي</span>
                                        </div>
                                    )}
                                </div>
                                    {/* Optional promotional original price (strike-through) */}
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 text-right" dir="rtl">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 block">السعر الأصلي قبل الخصم (للتسويق - ريال يمني - اختياري)</label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    placeholder="اتركه فارغاً لعدم إظهار خصم"
                                                    className="rounded-lg border-slate-200 h-8 font-bold bg-white pl-10 text-xs" 
                                                    value={currentPackage.actualCost || ""} 
                                                    onChange={e => updatePackageField("actualCost", e.target.value ? Number(e.target.value) : 0)} 
                                                />
                                                <span className="absolute left-2 top-1.5 text-[10px] font-bold text-slate-400">ر.ي</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-200/80">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                checked={currentPackage.isFeatured} 
                                                onCheckedChange={c => updatePackageField("isFeatured", c)} 
                                                id="p-feat"
                                            />
                                            <label htmlFor="p-feat" className="text-xs font-black text-amber-600 cursor-pointer">
                                                إدراج شارة مميزة وتلوين كرت الباقة
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-600">ترتيب العرض:</label>
                                            <Input 
                                                type="number" 
                                                className="w-16 h-8 rounded-lg font-bold text-center" 
                                                value={currentPackage.sortOrder} 
                                                onChange={e => updatePackageField("sortOrder", Number(e.target.value))} 
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Branding Colors & Badge Text (Visible ONLY if isFeatured is true) */}
                                    {currentPackage.isFeatured && (
                                        <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50/20 border border-amber-100 rounded-xl mt-3 animate-in slide-in-from-top-2 duration-300 text-right" dir="rtl">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-600 block">ثيم تلوين كرت الباقة *</label>
                                                <select 
                                                    className="flex h-8 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none" 
                                                    value={currentPackage.color || '#16539a'} 
                                                    onChange={e => updatePackageField("color", e.target.value)}
                                                >
                                                    <option value="#16539a">🔵 أزرق الهوية البصرية الرسمية (Accreditation Blue)</option>
                                                    <option value="#5c9e45">🟢 أخضر الهوية البصرية الرسمية (Accreditation Green)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-600 block">نص الشارة المميزة *</label>
                                                <Input 
                                                    placeholder="مثال: الأكثر مبيعاً" 
                                                    value={currentPackage.badge} 
                                                    onChange={e => updatePackageField("badge", e.target.value)} 
                                                    className="rounded-lg border-slate-200 h-8 text-xs font-bold bg-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsPackageModalOpen(false)}
                            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                            إلغاء
                        </Button>
                        <Button 
                            onClick={handleSavePackage} 
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                        >
                            {isSaving ? "جاري الحفظ..." : "حفظ الباقة والمزامنة"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Free Package Form Dialog */}
            <Dialog open={isFreePackageModalOpen} onOpenChange={setIsFreePackageModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 text-right" dir="rtl">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                <Gift className="h-5 w-5" />
                            </span>
                            {currentPackage?.id ? 'تعديل باقة الاختبارات المجانية' : 'إنشاء باقة اختبارات مجانية جديدة'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            تخصيص الخصائص الأساسية للباقة المجانية والتحكم المتقدم بكل محاولة اختبار
                        </DialogDescription>
                    </DialogHeader>

                    {currentPackage && (
                        <div className="space-y-6 py-4">
                            
                            {/* Basic Info Row */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-700 block border-r-2 border-emerald-500 pr-2">البيانات التعريفية الأساسية</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">اسم الباقة (بالعربية)</label>
                                        <Input 
                                            value={currentPackage.name} 
                                            onChange={e => updatePackageField("name", e.target.value)} 
                                            className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="مثال: باقة التجربة المجانية"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">اسم الباقة (بالإنجليزية)</label>
                                        <Input 
                                            value={currentPackage.nameEn || ""} 
                                            onChange={e => updatePackageField("nameEn", e.target.value)} 
                                            dir="ltr" 
                                            className="rounded-xl border-slate-200 text-left focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="e.g. Free Trial Package"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-slate-600">وصف وشرح الحزمة الترويجي</label>
                                        <Input 
                                            value={currentPackage.description || ""} 
                                            onChange={e => updatePackageField("description", e.target.value)} 
                                            className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="توضيح موجز يظهر للمتقدم مثل: تمنحك إمكانية تجربة نمط الاختبارات مجاناً"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Attempts & Validity */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-700 block border-r-2 border-emerald-500 pr-2">رصيد الاختبارات والصلاحية</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/35">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">عدد المحاولات المجانية</label>
                                            <Input 
                                                type="number" 
                                                min="1"
                                                value={currentPackage.examCredits} 
                                                onChange={e => updatePackageField("examCredits", Math.max(1, Number(e.target.value)))} 
                                                className="rounded-xl border-slate-200 font-bold focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">عدد أسئلة الاختبار</label>
                                            <Input 
                                                type="number" 
                                                min="1"
                                                placeholder="الافتراضي للمهنة"
                                                value={currentPackage.examQuestionsCount || ''} 
                                                onChange={e => updatePackageField("examQuestionsCount", e.target.value ? Number(e.target.value) : null)} 
                                                className="rounded-xl border-slate-200 font-bold focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">صلاحية الباقة (بالأيام)</label>
                                            <Input 
                                                type="number" 
                                                placeholder="اتركه فارغاً لصلاحية أبدية" 
                                                value={currentPackage.validityDays || ''} 
                                                onChange={e => updatePackageField("validityDays", e.target.value ? Number(e.target.value) : null)} 
                                                className="rounded-xl border-slate-200 font-semibold focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced per-attempt configuration */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-700 block border-r-2 border-emerald-500 pr-2">التحكم المتقدم بكل محاولة</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-4">
                                    <p className="text-[10px] text-slate-500">
                                        يمكنك تحديد الإعدادات المستقلة لكل محاولة اختبار بشكل منفصل (أنواع الأسئلة وصلاحيات عرض النتيجة).
                                    </p>
                                    <div className="overflow-x-auto rounded-xl border border-slate-150">
                                        <Table className="w-full text-right text-xs">
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="font-bold text-slate-700 text-right w-[15%]">المحاولة</TableHead>
                                                    <TableHead className="font-bold text-slate-700 text-right w-[45%]">أنواع الأسئلة المسموحة</TableHead>
                                                    <TableHead className="font-bold text-slate-700 text-right w-[40%]">صلاحيات النتيجة</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-slate-150">
                                                {currentPackage.attemptsConfig?.map((item) => {
                                                    const allowedTypes = (item.allowedQuestionTypes || "").split(",").map(t => t.trim()).filter(Boolean);
                                                    return (
                                                        <TableRow key={item.attempt} className="hover:bg-slate-50/50">
                                                            <TableCell className="font-bold text-slate-800">
                                                                المحاولة {item.attempt}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {[
                                                                        { key: "MCQ", label: "MCQ" },
                                                                        { key: "TRUE_FALSE", label: "صح/خطأ" },
                                                                        { key: "FILL_BLANK", label: "فراغات" },
                                                                        { key: "IMAGE", label: "صور" }
                                                                    ].map(qType => {
                                                                        const isChecked = allowedTypes.includes(qType.key);
                                                                        return (
                                                                            <label key={qType.key} className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => {
                                                                                        let newTypes;
                                                                                        if (isChecked) {
                                                                                            if (allowedTypes.length === 1) return;
                                                                                            newTypes = allowedTypes.filter(t => t !== qType.key);
                                                                                        } else {
                                                                                            newTypes = [...allowedTypes, qType.key];
                                                                                        }
                                                                                        updateAttemptConfig(item.attempt, "allowedQuestionTypes", newTypes.join(","));
                                                                                    }}
                                                                                    className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                                                                />
                                                                                <span className="text-[10px] text-slate-700 font-semibold">{qType.label}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={item.showResultScore}
                                                                            onCheckedChange={val => updateAttemptConfig(item.attempt, "showResultScore", val)}
                                                                            className="scale-75 origin-right"
                                                                        />
                                                                        <span className="text-[10px] text-slate-600 font-medium">عرض النسبة</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={item.showResultQuestions}
                                                                            onCheckedChange={val => updateAttemptConfig(item.attempt, "showResultQuestions", val)}
                                                                            className="scale-75 origin-right"
                                                                        />
                                                                        <span className="text-[10px] text-slate-600 font-medium">عرض تفاصيل الأسئلة</span>
                                                                    </div>
                                                                    {item.showResultQuestions && (
                                                                        <div className="flex items-center gap-2 pr-4">
                                                                            <Switch
                                                                                checked={item.showResultCorrectAnswers}
                                                                                onCheckedChange={val => updateAttemptConfig(item.attempt, "showResultCorrectAnswers", val)}
                                                                                className="scale-75 origin-right"
                                                                            />
                                                                            <span className="text-[10px] text-slate-500 font-medium">عرض الإجابة الصحيحة</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>

                            {/* Extra Settings */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-700 block border-r-2 border-emerald-500 pr-2">خيارات إضافية</h3>
                                <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                checked={currentPackage.isActive} 
                                                onCheckedChange={c => updatePackageField("isActive", c)} 
                                                id="free-active"
                                            />
                                            <label htmlFor="free-active" className="text-xs font-black text-slate-700 cursor-pointer">
                                                تفعيل الباقة فورياً للطلاب
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-600">ترتيب العرض:</label>
                                            <Input 
                                                type="number" 
                                                className="w-16 h-8 rounded-lg font-bold text-center focus:border-emerald-500 focus:ring-emerald-500" 
                                                value={currentPackage.sortOrder} 
                                                onChange={e => updatePackageField("sortOrder", Number(e.target.value))} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsFreePackageModalOpen(false)}
                            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                            إلغاء
                        </Button>
                        <Button 
                            onClick={handleSavePackage} 
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-100"
                        >
                            {isSaving ? "جاري الحفظ..." : "حفظ الباقة والمزامنة"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
