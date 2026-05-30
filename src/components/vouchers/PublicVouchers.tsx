"use client";

import { useState } from "react";
import { Voucher } from "@/hooks/pricing/useVouchersManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Tag, Copy, Check, Search, Calendar, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";
import { cn } from "@/lib/utils";

type PublicVouchersProps = {
    vouchers: Voucher[];
    showCreateModal: boolean;
    setShowCreateModal: (show: boolean) => void;
    newVoucher: any;
    updateNewVoucherField: (field: string, value: any) => void;
    handleCreateVoucher: () => Promise<void>;
    generateRandomCode: () => void;
    creating: boolean;
};

export function PublicVouchers({
    vouchers,
    showCreateModal,
    setShowCreateModal,
    newVoucher,
    updateNewVoucherField,
    handleCreateVoucher,
    generateRandomCode,
    creating
}: PublicVouchersProps) {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast(`تم نسخ الكود الترويجي "${code}" بنجاح`, "success");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const publicVouchers = vouchers.filter(v => 
        v.category === "PUBLIC" && 
        v.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Filter and Add New Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="البحث عن كود خصم نشط..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 h-10 rounded-xl text-xs border-slate-200 focus-visible:ring-indigo-500" 
                    />
                </div>
                <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 shadow-md shadow-indigo-100 gap-2 text-xs"
                >
                    <Plus className="h-4 w-4" />
                    إنشاء كود ترويجي جديد
                </Button>
            </div>

            {/* Grid of Digital Coupons */}
            {publicVouchers.length === 0 ? (
                <Card className="border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-bounce">
                            <Tag className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">لا توجد أكواد ترويجية نشطة</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            قم بإنشاء كود خصم عام مثل (WELCOME20) ليستخدمه المتقدمون الجدد في التسجيل والحصول على أسعار مخفضة فورية.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => setShowCreateModal(true)}
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl mt-2 text-xs font-bold"
                        >
                            توليد أول كود خصم الآن
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publicVouchers.map((v) => {
                        const isExpired = v.expiryDate ? new Date(v.expiryDate) < new Date() : false;
                        const isLimitReached = v.maxUses && v.usageCount ? v.usageCount >= v.maxUses : false;
                        const isVoucherActive = !v.isUsed && !isExpired && !isLimitReached;

                        return (
                            <div 
                                key={v.id} 
                                className="relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col justify-between"
                            >
                                {/* Coupon Scissor Notch Style */}
                                <div className="absolute top-1/2 -translate-y-1/2 -right-3 h-6 w-6 rounded-full bg-slate-50 border-l border-slate-200 z-10 hidden md:block" />
                                <div className="absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full bg-slate-50 border-r border-slate-200 z-10 hidden md:block" />
                                
                                {/* Dashed cut line */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 border-t border-dashed border-slate-100 z-0 pointer-events-none hidden md:block" />

                                {/* Upper Part of the Ticket */}
                                <div className="p-5 relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">كود خصم عام للتسويق</span>
                                            <h4 className="font-extrabold text-indigo-600 text-lg tracking-wider font-mono">{v.code}</h4>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-2xl font-black text-emerald-600 tracking-tight">{v.discountPercent}%</span>
                                            <span className="text-[10px] font-bold text-emerald-500 block">خصم مباشر</span>
                                        </div>
                                    </div>

                                    {v.notes && (
                                        <p className="text-slate-500 text-xs leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            {v.notes}
                                        </p>
                                    )}
                                </div>

                                {/* Bottom Part of the Ticket */}
                                <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 relative z-10 flex items-center justify-between text-xs">
                                    <div className="space-y-1.5 text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                            <span>الاستخدام: <b>{v.usageCount || 0}</b> / {v.maxUses || "∞"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            <span>ينتهي: {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('ar-EG') : "صلاحية أبدية"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Badge 
                                            variant="outline"
                                            className={cn(
                                                "font-bold text-[10px] px-2 py-0.5 rounded-full",
                                                isVoucherActive 
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                            )}
                                        >
                                            {isVoucherActive ? "نشط وصالح" : isExpired ? "منتهي الصلاحية" : isLimitReached ? "اكتملت المحاولات" : "معطل"}
                                        </Badge>

                                        <Button 
                                            size="sm"
                                            onClick={() => handleCopy(v.code, v.id)}
                                            variant="outline"
                                            className="h-8 rounded-lg text-[10px] font-bold border-indigo-100 text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm flex items-center gap-1"
                                        >
                                            {copiedId === v.id ? (
                                                <>
                                                    <Check className="h-3 w-3 text-emerald-600" />
                                                    تم النسخ
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3" />
                                                    نسخ الكود
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Promo Code Dialog */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                                <Tag className="h-5 w-5" />
                            </span>
                            إنشاء كود خصم ترويجي جديد
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            توليد كود ترويجي عام لخدمات وأسعار التسجيل للاستخدام المتعدد
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Promo Code Input */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">كود الخصم (أحرف إنجليزية وأرقام)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newVoucher.code}
                                    onChange={(e) => updateNewVoucherField("code", e.target.value)}
                                    placeholder="مثلاً: PROMO2025"
                                    className="rounded-xl border-slate-200 font-extrabold tracking-wider text-left [direction:ltr]"
                                />
                                <Button 
                                    variant="outline" 
                                    onClick={generateRandomCode}
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl"
                                >
                                    توليد عشوائي
                                </Button>
                            </div>
                        </div>

                        {/* Discount and Limit Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">نسبة الخصم المئوية</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="1" max="100"
                                        value={newVoucher.discountPercent}
                                        onChange={(e) => updateNewVoucherField("discountPercent", Number(e.target.value))}
                                        className="rounded-xl border-slate-200 text-left pl-8 font-bold"
                                    />
                                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-black">%</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">سقف عدد مرات الاستخدام</Label>
                                <Input
                                    type="number"
                                    value={newVoucher.maxUses}
                                    onChange={(e) => updateNewVoucherField("maxUses", Number(e.target.value))}
                                    className="rounded-xl border-slate-200 font-bold"
                                />
                            </div>
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">تاريخ انتهاء الصلاحية (اختياري)</Label>
                            <Input
                                type="date"
                                value={newVoucher.expiryDate}
                                onChange={(e) => updateNewVoucherField("expiryDate", e.target.value)}
                                className="rounded-xl border-slate-200 text-right"
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">ملاحظات توضيحية</Label>
                            <Textarea
                                value={newVoucher.notes}
                                onChange={(e) => updateNewVoucherField("notes", e.target.value)}
                                placeholder="مثال: مخصص لطلبات التسجيل في معرض التعليم الفني"
                                className="rounded-xl border-slate-200 h-20 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowCreateModal(false)}
                            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
                        >
                            إلغاء
                        </Button>
                        <Button 
                            onClick={handleCreateVoucher} 
                            disabled={creating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                        >
                            {creating ? "جاري الإنشاء..." : "إنشاء وتفعيل الكود"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
