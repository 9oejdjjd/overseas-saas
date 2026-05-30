"use client";

import { Voucher, LocationDropdown } from "@/hooks/pricing/useVouchersManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, User, FileText, CheckCircle, ShieldAlert, X, Calendar, Landmark, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

type PersonalVouchersProps = {
    vouchers: Voucher[];
    locations: LocationDropdown[];
    personalSearchTerm: string;
    setPersonalSearchTerm: (term: string) => void;
    foundApplicants: any[];
    selectedApplicant: any | null;
    setSelectedApplicant: (applicant: any | null) => void;
    personalVoucherType: string;
    setPersonalVoucherType: (type: string) => void;
    personalNotes: string;
    setPersonalNotes: (notes: string) => void;
    personalDiscount: string;
    setPersonalDiscount: (discount: string) => void;
    personalLocationId: string;
    setPersonalLocationId: (locationId: string) => void;
    handlePersonalSearch: (term: string) => Promise<void>;
    handleCreatePersonalVoucher: () => Promise<void>;
    creating: boolean;
};

export function PersonalVouchers({
    vouchers,
    locations,
    personalSearchTerm,
    setPersonalSearchTerm,
    foundApplicants,
    selectedApplicant,
    setSelectedApplicant,
    personalVoucherType,
    setPersonalVoucherType,
    personalNotes,
    setPersonalNotes,
    personalDiscount,
    setPersonalDiscount,
    personalLocationId,
    setPersonalLocationId,
    handlePersonalSearch,
    handleCreatePersonalVoucher,
    creating
}: PersonalVouchersProps) {
    
    const personalVouchers = vouchers.filter(v => v.category === "PERSONAL");

    return (
        <div className="space-y-8">
            {/* Issuing Form */}
            <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Plus className="h-4 w-4" />
                        </span>
                        إصدار قسيمة خدمة شخصية معتمدة
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                        منح إعفاء كامل أو جزئي لرسوم التسجيل أو الاختبارات أو النقل لمتقدم معين بالتنسيق الإداري
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Search and Autocomplete Field */}
                        <div className="space-y-2 relative">
                            <Label className="text-xs font-bold text-slate-700">البحث عن متقدم (الاسم الكامل، رقم الجواز أو رقم الملف)</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="ابدأ بكتابة اسم المتقدم أو الكود..."
                                    value={personalSearchTerm}
                                    onChange={(e) => handlePersonalSearch(e.target.value)}
                                    className="pr-9 rounded-xl border-slate-200 h-10 text-xs"
                                    disabled={!!selectedApplicant}
                                />
                                {personalSearchTerm && !selectedApplicant && foundApplicants.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto divide-y divide-slate-100">
                                        {foundApplicants.map((app) => (
                                            <div
                                                key={app.id}
                                                className="p-3 hover:bg-slate-50 cursor-pointer text-xs transition-colors flex justify-between items-center"
                                                onClick={() => {
                                                    setSelectedApplicant(app);
                                                    setPersonalSearchTerm(app.fullName);
                                                }}
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-slate-800">{app.fullName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">رمز: {app.applicantCode || "-"} | جواز: {app.passportNumber || "-"}</div>
                                                </div>
                                                <Badge className="bg-indigo-50 border-indigo-100 text-indigo-700 text-[9px] font-bold">متاح</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Applicant Card */}
                            {selectedApplicant && (
                                <div className="text-xs bg-emerald-50/50 text-emerald-800 p-3 rounded-xl border border-emerald-100/60 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <span>تم تحديد: <b>{selectedApplicant.fullName}</b> ({selectedApplicant.passportNumber})</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedApplicant(null)} 
                                        className="h-6 w-6 p-0 text-emerald-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Select Coupon Type */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">نوع القسيمة والامتياز الممنوح</Label>
                            <Select value={personalVoucherType} onValueChange={setPersonalVoucherType}>
                                <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs font-semibold text-slate-700 text-right">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="EXAM">قسيمة اختبار تجريبي (أول مرة / إعادة محاولة)</SelectItem>
                                    <SelectItem value="TRANSPORT_ONEWAY">تذكرة نقل بري (ذهاب فقط)</SelectItem>
                                    <SelectItem value="TRANSPORT_ROUNDTRIP">تذكرة نقل بري (ذهاب وعودة)</SelectItem>
                                    <SelectItem value="FULL_PROGRAM">برنامج شامل (تسجيل + اختبار + مواصلات)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Discount Percent */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">نسبة التخفيض المعتمدة</Label>
                            <div className="relative max-w-xs">
                                <Input
                                    type="number"
                                    min="1" max="100"
                                    value={personalDiscount}
                                    onChange={(e) => setPersonalDiscount(e.target.value)}
                                    placeholder="100"
                                    className="rounded-xl border-slate-200 pl-8 font-black text-left text-indigo-700"
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                            </div>
                        </div>

                        {/* Location specify dropdown */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">تخصيص مركز اختبار (اختياري)</Label>
                            <Select value={personalLocationId} onValueChange={setPersonalLocationId}>
                                <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs text-slate-700 text-right">
                                    <SelectValue placeholder="صالح لأي مركز" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="ALL">صالح لأي مركز ومحافظة</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-xs font-bold text-slate-700">ملاحظات وسبب المنح الإداري</Label>
                            <Textarea
                                className="h-20 rounded-xl border-slate-200 text-xs"
                                placeholder="توضيح المستندات أو سبب المنح (مثال: بموجب التوجيهات الرسمية لدفعة مايو...)"
                                value={personalNotes}
                                onChange={(e) => setPersonalNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                        <Button 
                            onClick={handleCreatePersonalVoucher} 
                            disabled={!selectedApplicant || creating} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 text-xs px-6 gap-2 shadow-md shadow-indigo-100"
                        >
                            {creating ? "جاري إصدار القسيمة..." : "إصدار وتفعيل القسيمة للشخص"} 
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Issued Personal Vouchers Table */}
            <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/20">
                    <CardTitle className="text-sm font-bold text-slate-800">سجل القسائم الشخصية المصدرة</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                        القسائم والامتيازات النشطة والمستخدمة المرتبطة مباشرة بمتقدمين محددين بالاسم
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50/50 text-slate-650 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-xs">اسم المتقدم وتفاصيله</th>
                                    <th className="px-6 py-4 font-bold text-xs">نوع الامتياز</th>
                                    <th className="px-6 py-4 font-bold text-xs text-left ltr">نسبة الخصم</th>
                                    <th className="px-6 py-4 font-bold text-xs text-center">حالة القسيمة</th>
                                    <th className="px-6 py-4 font-bold text-xs">تاريخ الإصدار</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                                {personalVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                                            لا توجد قسائم شخصية صادرة حتى الآن.
                                        </td>
                                    </tr>
                                ) : (
                                    personalVouchers.map((v) => (
                                        <tr key={v.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    <span className="p-1 bg-slate-100 text-slate-500 rounded">
                                                        <User className="h-3.5 w-3.5" />
                                                    </span>
                                                    {v.applicant?.fullName || "-"}
                                                </div>
                                                <span className="text-[10px] text-slate-400 block mt-0.5 mr-6 font-mono">
                                                    كود: {v.applicant?.applicantCode || "-"} | جواز: {v.applicant?.passportNumber || "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                {v.type === "FULL_PROGRAM" ? (
                                                    <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                                        برنامج شامل كامل
                                                    </span>
                                                ) : v.type === "EXAM" ? (
                                                    <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                                        اختبار تجريبي
                                                    </span>
                                                ) : v.type === "TRANSPORT_ONEWAY" ? (
                                                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                                        تذكرة نقل (اتجاه واحد)
                                                    </span>
                                                ) : v.type === "TRANSPORT_ROUNDTRIP" ? (
                                                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                                        تذكرة نقل (ذهاب وعودة)
                                                    </span>
                                                ) : (
                                                    v.type
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-extrabold text-indigo-600 text-left ltr">
                                                {v.discountPercent}%
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge 
                                                    variant={v.isUsed ? "secondary" : "outline"} 
                                                    className={cn(
                                                        "font-bold text-[10px] rounded-full px-2.5 py-0.5",
                                                        v.isUsed 
                                                            ? "bg-slate-100 border-slate-200 text-slate-400" 
                                                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                    )}
                                                >
                                                    {v.isUsed ? "مستنفذة / منتهية" : "جاهزة للاستعمال"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(v.createdAt).toLocaleDateString('ar-EG')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
