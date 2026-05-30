"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, ShoppingCart, Beaker, Crown, Star, Gem, Rocket, Gift, Wallet, User } from "lucide-react";
import { useQuickSale } from "@/hooks/applicants/useQuickSale";

const PKG_ICONS: Record<string, any> = { crown: Crown, star: Star, diamond: Gem, rocket: Rocket, gift: Gift };

interface QuickSaleFormProps {
    hook: ReturnType<typeof useQuickSale>;
}

export function QuickSaleForm({ hook }: QuickSaleFormProps) {
    const {
        loading,
        professions,
        quickSale,
        setQuickSale,
        qsDropdownOpen,
        setQsDropdownOpen,
        qsPromoCode,
        setQsPromoCode,
        qsPromoMsg,
        qsPromoErr,
        examOnlyPackages,
        singlePrice,
        baseTotal,
        qsTotal,
        qsRemaining,
        handleApplyPromo,
        handleQuickSale,
        router
    } = hook;

    return (
        <div className="space-y-6">
            {/* Visitor Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-green-500" /> بيانات الزائر
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الاسم الكامل *</Label>
                            <Input
                                required
                                value={quickSale.buyerName}
                                onChange={e => setQuickSale({ ...quickSale, buyerName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <Label>المهنة</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    value={quickSale.profession}
                                    onChange={e => {
                                        setQuickSale({ ...quickSale, profession: e.target.value });
                                        setQsDropdownOpen(true);
                                    }}
                                    onFocus={() => setQsDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setQsDropdownOpen(false), 200)}
                                    className="pr-9 bg-white"
                                    placeholder="ابحث عن المهنة..."
                                    autoComplete="off"
                                />
                            </div>
                            {qsDropdownOpen && (
                                <div className="absolute top-full right-0 left-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {professions.filter(p => (p.name || "").includes(quickSale.profession || "")).map(p => (
                                        <div
                                            key={p.id}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                            onMouseDown={e => {
                                                e.preventDefault();
                                                setQuickSale({ ...quickSale, profession: p.name });
                                                setQsDropdownOpen(false);
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                    {professions.filter(p => (p.name || "").includes(quickSale.profession || "")).length === 0 && (
                                        <div className="px-4 py-2 text-sm text-gray-500 text-center">اكتب المهنة أو ابحث</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input
                                required
                                value={quickSale.phone}
                                onChange={e => setQuickSale({ ...quickSale, phone: e.target.value })}
                                className="dir-ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم الواتساب</Label>
                            <Input
                                value={quickSale.whatsapp}
                                onChange={e => setQuickSale({ ...quickSale, whatsapp: e.target.value })}
                                className="dir-ltr"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sale Type Toggle */}
            <Card className="border-green-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-green-600" /> نوع البيع
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                        <Button
                            type="button"
                            variant={quickSale.saleType === "package" ? "default" : "ghost"}
                            onClick={() => setQuickSale({ ...quickSale, saleType: "package", packageId: "" })}
                            className="gap-2"
                        >
                            📦 باقة
                        </Button>
                        <Button
                            type="button"
                            variant={quickSale.saleType === "individual" ? "default" : "ghost"}
                            onClick={() => setQuickSale({ ...quickSale, saleType: "individual", packageId: "" })}
                            className="gap-2"
                        >
                            🧪 اختبارات مفردة
                        </Button>
                    </div>

                    {quickSale.saleType === "package" ? (
                        examOnlyPackages.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">لا توجد باقات متاحة</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {examOnlyPackages.map(pkg => {
                                    const Icon = PKG_ICONS[pkg.icon] || Star;
                                    return (
                                        <div
                                            key={pkg.id}
                                            onClick={() => setQuickSale({ ...quickSale, packageId: pkg.id })}
                                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${quickSale.packageId === pkg.id ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200'}`}
                                        >
                                            {pkg.isFeatured && <Badge className="absolute -top-2 right-3 bg-amber-500">مميزة</Badge>}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: pkg.color || '#3B82F6' }}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold">{pkg.name}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {pkg.examCredits === -1 ? '∞ غير محدودة' : `${pkg.examCredits} اختبار`}
                                            </div>
                                            {pkg.badge && <Badge variant="outline" className="mb-2">{pkg.badge}</Badge>}
                                            <div className="text-xl font-black text-green-700">{Number(pkg.examPrice)} ر.ي</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="bg-white p-4 rounded-lg border space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                    <Label>عدد الاختبارات</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        className="w-32"
                                        value={quickSale.examCount}
                                        onChange={e => setQuickSale({ ...quickSale, examCount: Math.max(1, Number(e.target.value)) })}
                                    />
                                </div>
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
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                            <Wallet className="h-5 w-5" /> الملخص المالي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-white p-4 rounded-lg border border-dashed border-gray-300">
                            <Label className="mb-2 block">كود خصم؟</Label>
                            <div className="flex gap-2">
                                <Input
                                    className="max-w-xs font-mono uppercase"
                                    placeholder="أدخل الكود"
                                    value={qsPromoCode}
                                    onChange={e => setQsPromoCode(e.target.value.toUpperCase())}
                                />
                                <Button type="button" variant="outline" onClick={handleApplyPromo}>
                                    تطبيق
                                </Button>
                            </div>
                            {qsPromoMsg && (
                                <p className={`text-xs mt-2 ${qsPromoErr ? 'text-red-500' : 'text-green-600 font-bold'}`}>
                                    {qsPromoMsg}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label>السعر الأساسي</Label>
                                <div className="text-lg font-bold text-gray-700">{baseTotal.toLocaleString()} ر.ي</div>
                            </div>
                            <div className="space-y-2">
                                <Label>خصم خاص</Label>
                                <Input
                                    type="number"
                                    value={quickSale.discount}
                                    onChange={e => setQuickSale({ ...quickSale, discount: Number(e.target.value) })}
                                    className="bg-white border-green-200 text-red-600 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-green-700 font-bold">الإجمالي النهائي</Label>
                                <div className="text-2xl font-black text-green-700">
                                    {qsTotal.toLocaleString()} <span className="text-sm font-normal">ر.ي</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>المبلغ المدفوع</Label>
                                <Input
                                    type="number"
                                    value={quickSale.amountPaid}
                                    onChange={e => setQuickSale({ ...quickSale, amountPaid: Number(e.target.value) })}
                                    className="text-lg font-bold bg-white"
                                />
                            </div>
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center">
                            <span>المتبقي: <span className={`${qsRemaining > 0 ? 'text-red-500' : 'text-green-500'} font-bold`}>{qsRemaining.toLocaleString()} ر.ي</span></span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="qpaid"
                                        checked={quickSale.isPaid}
                                        onCheckedChange={c => setQuickSale({ ...quickSale, isPaid: c === true })}
                                    />
                                    <Label htmlFor="qpaid" className="cursor-pointer">تم الدفع</Label>
                                </div>
                                <Select
                                    onValueChange={v => setQuickSale({ ...quickSale, paymentMethod: v })}
                                    value={quickSale.paymentMethod}
                                >
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">نقد</SelectItem>
                                        <SelectItem value="TRANSFER">تحويل</SelectItem>
                                        <SelectItem value="OTHER">أخرى</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    إلغاء
                </Button>
                <Button
                    size="lg"
                    disabled={loading || (quickSale.saleType === "package" && !quickSale.packageId)}
                    onClick={handleQuickSale}
                    className="px-8 bg-green-700 hover:bg-green-800 text-white"
                >
                    {loading ? "جاري المعالجة..." : "✓ تأكيد البيع"}
                </Button>
            </div>
        </div>
    );
}
