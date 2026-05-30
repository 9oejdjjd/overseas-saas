"use client";

import { useMockExamPackages, MockPackage } from "@/hooks/pricing/useMockExamPackages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Pencil, Copy, Trash2, Crown, Star, Gem, Rocket, Gift, Check, X, Coins, Percent, ArrowLeftRight, Landmark, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ICONS: Record<string, any> = { 
    crown: Crown, 
    star: Star, 
    diamond: Gem, 
    rocket: Rocket, 
    gift: Gift 
};

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
        currentPackage,
        isSaving,
        handleSaveConfig,
        handleSavePackage,
        handleDelete,
        handleDuplicate,
        handleToggle,
        openNew,
        openEdit,
        updateConfigField,
        updatePackageField,
        fetchData
    } = useMockExamPackages();

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
                    <div className="grid md:grid-cols-3 gap-6 items-center p-5 bg-white rounded-2xl border border-slate-200/80">
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
                        <Button 
                            onClick={openNew} 
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl"
                        >
                            <Plus className="h-4 w-4" /> إضافة باقة جديدة
                        </Button>
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
                                        const IconComponent = ICONS[pkg.icon] || Star;
                                        return (
                                            <TableRow key={pkg.id} className="hover:bg-slate-50/40 transition-colors group">
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110" 
                                                            style={{ backgroundColor: pkg.color || '#3B82F6' }}
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
                                                        <span className="font-black text-slate-800 text-sm">
                                                            {Number(pkg.examPrice).toLocaleString()} ر.ي
                                                        </span>
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
                            {currentPackage?.id ? 'تعديل تفاصيل باقة الاختبارات' : 'بناء باقة اختبارات تجريبية جديدة'}
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

                            {/* Appearance Options */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">تخصيص المظهر والشارات</h3>
                                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">أيقونة التمييز</label>
                                        <select 
                                            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none" 
                                            value={currentPackage.icon || 'star'} 
                                            onChange={e => updatePackageField("icon", e.target.value)}
                                        >
                                            <option value="star">⭐ نجمة (Star)</option>
                                            <option value="crown">👑 تاج ذهبي (Crown)</option>
                                            <option value="diamond">💎 ماسة زرقاء (Gem)</option>
                                            <option value="rocket">🚀 صاروخ ترويجي (Rocket)</option>
                                            <option value="gift">🎁 هدية مجانية (Gift)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">لون خلفية الأيقونة</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                className="h-10 w-10 p-1.5 rounded-xl border border-slate-200 cursor-pointer bg-white" 
                                                value={currentPackage.color || '#3B82F6'} 
                                                onChange={e => updatePackageField("color", e.target.value)} 
                                            />
                                            <Input 
                                                value={currentPackage.color || '#3B82F6'} 
                                                onChange={e => updatePackageField("color", e.target.value)} 
                                                dir="ltr" 
                                                className="rounded-xl border-slate-200 text-xs font-semibold [direction:ltr]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">شارة مميزة (Badge)</label>
                                        <Input 
                                            placeholder="مثال: الأكثر مبيعاً" 
                                            value={currentPackage.badge} 
                                            onChange={e => updatePackageField("badge", e.target.value)} 
                                            className="rounded-xl border-slate-200"
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

                                    {/* Free switch */}
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                        <Switch 
                                            checked={currentPackage.isFree} 
                                            onCheckedChange={c => updatePackageField("isFree", c)} 
                                            id="package-free"
                                        />
                                        <div className="space-y-0.5">
                                            <label htmlFor="package-free" className="text-xs font-black text-emerald-800 block cursor-pointer">
                                                اعتبار هذه الباقة باقة مجانية (Free Exam Package)
                                            </label>
                                            <span className="text-[10px] text-emerald-600 block">
                                                سيتم تصفير الرسوم تلقائياً للطلاب المشمولين بهدايا أو عروض خاصة.
                                            </span>
                                        </div>
                                    </div>

                                    {/* YER & SAR pricing inputs */}
                                    {!currentPackage.isFree && (
                                        <div className="grid grid-cols-2 gap-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-indigo-900">سعر الحزمة الرسمي (بالريال اليمني)</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" 
                                                        className="rounded-xl border-indigo-200 bg-white font-extrabold text-indigo-950 pl-14" 
                                                        value={currentPackage.examPrice} 
                                                        onChange={e => updatePackageField("examPrice", Number(e.target.value))} 
                                                    />
                                                    <span className="absolute left-4 top-2.5 text-xs font-bold text-indigo-400">ر.ي</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-emerald-900">سعر الحزمة الرسمي (بالريال السعودي)🇸🇦</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" 
                                                        className="rounded-xl border-emerald-200 bg-white font-extrabold text-emerald-950 pl-14" 
                                                        value={currentPackage.priceSAR} 
                                                        onChange={e => updatePackageField("priceSAR", Number(e.target.value))} 
                                                    />
                                                    <span className="absolute left-4 top-2.5 text-xs font-bold text-emerald-400">ر.س</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Result Page Rules */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-indigo-700 block border-r-2 border-indigo-500 pr-2">صلاحيات صفحة نتيجة الطالب (تخصيص الأمان)</h3>
                                <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Switch 
                                            checked={currentPackage.showResultScore} 
                                            onCheckedChange={c => updatePackageField("showResultScore", c)} 
                                            id="p-show-score"
                                        />
                                        <label htmlFor="p-show-score" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                            إظهار النسبة المئوية الاجمالية للنتيجة (مثل: حصلت على 85% في الامتحان)
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch 
                                            checked={currentPackage.showResultQuestions} 
                                            onCheckedChange={c => updatePackageField("showResultQuestions", c)} 
                                            id="p-show-questions"
                                        />
                                        <label htmlFor="p-show-questions" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                            إظهار تفاصيل الأسئلة المنجزة (الأسئلة الصحيحة والخاطئة مع الخيارات)
                                        </label>
                                    </div>
                                    {currentPackage.showResultQuestions && (
                                        <div className="flex items-center gap-3 pr-6 animate-in slide-in-from-top-2 duration-300">
                                            <Switch 
                                                checked={currentPackage.showResultCorrectAnswers} 
                                                onCheckedChange={c => updatePackageField("showResultCorrectAnswers", c)} 
                                                id="p-show-answers"
                                            />
                                            <label htmlFor="p-show-answers" className="text-xs font-semibold text-slate-500 cursor-pointer">
                                                إظهار الإجابة النموذجية وتصحيح الخطأ (مكافحة الغش وسرقة الأسئلة)
                                            </label>
                                        </div>
                                    )}
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
                                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-200/80">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={currentPackage.isFeatured} 
                                            onCheckedChange={c => updatePackageField("isFeatured", c)} 
                                            id="p-feat"
                                        />
                                        <label htmlFor="p-feat" className="text-xs font-black text-amber-600 cursor-pointer">
                                            إدراج شارة مميزة (Featured Package)
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
        </div>
    );
}
