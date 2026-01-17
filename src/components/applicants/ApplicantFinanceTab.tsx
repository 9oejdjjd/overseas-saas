"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Wallet, Truck, Plus, CheckCircle } from "lucide-react";
import { ExtendedApplicant, Transaction } from "@/types/applicant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ApplicantFinanceTabProps {
    applicant: ExtendedApplicant;
    transactions: Transaction[];
    pricingPackages: any[];
    transportRoute: any;
    onUpdate: () => void;
}

export function ApplicantFinanceTab({ applicant, transactions, pricingPackages, transportRoute, onUpdate }: ApplicantFinanceTabProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        setupExamLocation: applicant.examLocation || "TAIZ",
        setupHasTransportation: applicant.hasTransportation || false,
        paymentAmount: 0,
        paymentNotes: "",
    });

    // Helper to find the best matching package
    const getSelectedPackage = () => {
        if (pricingPackages.length === 0) return null;

        let pkg = pricingPackages.find(p =>
            p.location === formData.setupExamLocation &&
            (formData.setupHasTransportation
                ? (p.name.includes('الكاملة') || p.name.includes('شامل') || p.name.includes('مواصلات'))
                : (p.name.includes('فقط') || p.name.includes('اختبار') || !p.name.includes('مواصلات')))
        );

        if (!pkg) {
            pkg = pricingPackages.find(p =>
                !p.location &&
                (formData.setupHasTransportation
                    ? (p.name.includes('الكاملة') || p.name.includes('شامل'))
                    : (p.name.includes('فقط') || p.name.includes('اختبار')))
            );
        }
        return pkg;
    };

    const selectedPackage = getSelectedPackage();
    const estimatedTotal = selectedPackage ? Number(selectedPackage.price) : 0;
    const isServicesConfigured = Number(applicant.totalAmount) > 0 || applicant.status === 'SERVICES_CONFIGURED';

    const handleConfigureServices = async () => {
        setLoading(true);
        try {
            if (!selectedPackage) {
                alert("عذراً، لم يتم العثور على باقة أسعار مطابقة لهذه الخيارات.");
                setLoading(false);
                return;
            }

            const totalAmount = estimatedTotal;
            const currentPaid = Number(applicant.amountPaid) || 0;
            const remainingBalance = totalAmount - currentPaid;

            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examLocation: formData.setupExamLocation,
                    hasTransportation: formData.setupHasTransportation,
                    totalAmount: totalAmount,
                    remainingBalance: remainingBalance,
                    updateStatus: true,
                    status: "SERVICES_CONFIGURED"
                }),
            });

            if (res.ok) {
                onUpdate();
                alert("تم تحديث الخدمات واحتساب الرسوم بنجاح! 💰");
            }
        } catch (error) {
            alert("خطأ في تحديث الخدمات");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (formData.paymentAmount <= 0) {
            alert("المبلغ يجب أن يكون أكبر من صفر");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    amount: formData.paymentAmount,
                    notes: formData.paymentNotes,
                }),
            });

            if (res.ok) {
                onUpdate();
                setFormData({ ...formData, paymentAmount: 0, paymentNotes: "" });
                alert("تم إضافة الدفعة بنجاح");
            }
        } catch (error) {
            alert("خطأ في إضافة الدفعة");
        } finally {
            setLoading(false);
        }
    };

    const handleTransportationToggle = async (hasTransport: boolean) => {
        if (applicant.hasTransportation === hasTransport) return;

        const confirmed = confirm(
            hasTransport
                ? "هل تريد إضافة خدمة النقل؟ سيتم إضافة التكلفة للرصيد."
                : "هل تريد إزالة خدمة النقل؟ سيتم خصم التكلفة من الرصيد."
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            let transportCost = 25000; // Fallback

            if (transportRoute) {
                const type = applicant.transportType || 'ONE_WAY';
                if (type === 'ROUND_TRIP') {
                    transportCost = Number(transportRoute.roundTripPrice) || 0;
                } else {
                    transportCost = Number(transportRoute.oneWayPrice) || 0;
                }
            } else if (pricingPackages.length > 0) {
                const pkgWith = pricingPackages.find(p => p.location === applicant.examLocation && (p.name.includes('شامل') || p.name.includes('مواصلات')));
                const pkgWithout = pricingPackages.find(p => p.location === applicant.examLocation && (!p.name.includes('شامل') && !p.name.includes('مواصلات')));
                if (pkgWith && pkgWithout) {
                    transportCost = Number(pkgWith.price) - Number(pkgWithout.price);
                }
            }

            const finalAmountChange = hasTransport ? transportCost : -transportCost;

            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hasTransportation: hasTransport,
                    totalAmount: Number(applicant.totalAmount) + finalAmountChange,
                    remainingBalance: Number(applicant.remainingBalance) + finalAmountChange,
                }),
            });

            if (res.ok) {
                onUpdate();
                alert(`تم ${hasTransport ? 'إضافة' : 'إزالة'} خدمة النقل!`);
            }
        } catch (error) {
            alert("خطأ في التحديث");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Left Column: Summary & Payments */}
            <div className="space-y-6">
                <Card className="bg-gradient-to-br from-white to-gray-50 border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                            <Wallet className="h-5 w-5 text-blue-600" />
                            الملخص المالي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">إجمالي الخدمات المطلوبة</p>
                                <p className="text-xl font-bold text-gray-900">{Number(applicant.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.ي</span></p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">المدفوع</p>
                                <p className="text-xl font-bold text-green-600">{Number(applicant.amountPaid).toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.ي</span></p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border ${Number(applicant.remainingBalance) > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">المتبقي (عليه)</span>
                                <span className={`text-2xl font-bold ${Number(applicant.remainingBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {Number(applicant.remainingBalance).toLocaleString()} <span className="text-sm">ر.ي</span>
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Payment */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md font-medium">تسجيل دفعة جديدة</CardTitle>
                        <p className="text-xs text-gray-500">سند قبض للمتقدم</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="relative">
                            <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                placeholder="المبلغ (ر.ي)"
                                className="pr-9"
                                value={formData.paymentAmount || ''}
                                onChange={(e) => setFormData({ ...formData, paymentAmount: Number(e.target.value) })}
                            />
                        </div>
                        <Input
                            placeholder="ملاحظات السند (اختياري)"
                            value={formData.paymentNotes}
                            onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                        />
                        <Button
                            onClick={handleAddPayment}
                            disabled={loading || formData.paymentAmount <= 0}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? "جاري الحفظ..." : "حفظ الدفعة"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Service Config (If not configured) */}
                {!isServicesConfigured && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-800 text-sm">إعداد الخدمات لأول مرة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>موقع الاختبار</Label>
                                <Select
                                    value={formData.setupExamLocation}
                                    onValueChange={(val) => setFormData({ ...formData, setupExamLocation: val })}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="اختر الموقع" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TAIZ">تعز</SelectItem>
                                        <SelectItem value="ADEN">عدن</SelectItem>
                                        <SelectItem value="HADRAMOUT">حضرموت</SelectItem>
                                        <SelectItem value="SANA">صنعاء</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                    <Label>شامل المواصلات؟</Label>
                                </div>
                                <Switch
                                    checked={formData.setupHasTransportation}
                                    onCheckedChange={(checked) => setFormData({ ...formData, setupHasTransportation: checked })}
                                />
                            </div>

                            <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-500">الباقة المقترحة:</p>
                                <p className="font-bold text-sm">{selectedPackage?.name || 'غير محدد'}</p>
                                <p className="text-lg font-bold text-blue-600">{estimatedTotal.toLocaleString()} ر.ي</p>
                            </div>

                            <Button onClick={handleConfigureServices} disabled={loading} className="w-full">
                                اعتماد الخدمات والرسوم
                            </Button>
                        </CardContent>
                    </Card>
                )}
                {/* Service Toggles (After configured) */}
                {isServicesConfigured && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            حالة خدمة النقل
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${applicant.hasTransportation ? 'text-green-600' : 'text-gray-500'}`}>
                                {applicant.hasTransportation ? 'مفعل' : 'غبر مفعل'}
                            </span>
                            <Switch
                                checked={applicant.hasTransportation}
                                onCheckedChange={handleTransportationToggle}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}


            </div>

            {/* Right Column: Transaction History */}
            <div className="bg-gray-50 rounded-xl p-4 border h-full overflow-hidden flex flex-col">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    سجل العمليات المالية
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            لا توجد عمليات مالية مسجلة
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-800">{Number(tx.amount).toLocaleString()} ر.ي</p>
                                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="text-left">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] rounded-full border border-green-100">
                                        سند قبض
                                    </span>
                                    {tx.notes && <p className="text-[10px] text-gray-400 mt-1 max-w-[150px] truncate">{tx.notes}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

