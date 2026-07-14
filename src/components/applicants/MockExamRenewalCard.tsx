"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beaker, RefreshCw, Crown, Star, Gem, Rocket, Gift, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";

const PKG_ICONS: Record<string, any> = { crown: Crown, star: Star, diamond: Gem, rocket: Rocket, gift: Gift };

interface MockExamRenewalCardProps {
    phone: string;
    buyerName?: string;
    applicantId?: string;
    currentPurchase?: {
        id: string;
        packageId?: string | null;
        packageName?: string | null;
        totalCredits: number;
        usedCredits: number;
        status: string;
        expiresAt?: string | null;
    } | null;
    onUpdate: () => void;
}

export function MockExamRenewalCard({ phone, buyerName, applicantId, currentPurchase, onUpdate }: MockExamRenewalCardProps) {
    const { toast } = useToast();
    const [packages, setPackages] = useState<any[]>([]);
    const [config, setConfig] = useState<any>({ mockExamSinglePrice: 0 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [saleType, setSaleType] = useState<"package" | "individual">("package");
    const [selectedPkgId, setSelectedPkgId] = useState("");
    const [examCount, setExamCount] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pkgRes, cfgRes] = await Promise.all([
                    fetch("/api/pricing/mock-packages"),
                    fetch("/api/pricing/config")
                ]);
                if (pkgRes.ok) setPackages((await pkgRes.json()).filter((p: any) => p.isActive && !p.includesRegistration && !p.includesTransport));
                if (cfgRes.ok) setConfig(await cfgRes.json());
            } catch { /* ignore */ }
            setLoading(false);
        };
        fetchData();
    }, []);

    const singlePrice = Number(config.mockExamSinglePrice ?? 0);
    const selectedPkg = packages.find(p => p.id === selectedPkgId);
    const baseTotal = saleType === "package" && selectedPkg ? Number(selectedPkg.examPrice) : singlePrice * examCount;
    const total = Math.max(0, baseTotal - discount);
    const remaining = total - amountPaid;

    const mp = currentPurchase;
    const creditsRemaining = mp ? (mp.totalCredits === -1 ? -1 : mp.totalCredits - mp.usedCredits) : 0;
    const isExpired = mp?.expiresAt && new Date(mp.expiresAt) < new Date();

    const handleRenew = async () => {
        setSaving(true);
        try {
            const payload = {
                buyerName: buyerName || "مشترك",
                phone,
                packageId: saleType === "package" ? selectedPkgId : "",
                saleType,
                examCount,
                isPaid,
                paymentMethod,
                discount,
                amountPaid,
                paymentNote: `تجديد${applicantId ? ' - متقدم' : ' - زائر'}`,
                applicantId
            };
            const res = await fetch("/api/pricing/mock-packages/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(await res.text());
            toast("تم تجديد الباقة بنجاح ✓", "success");
            onUpdate();
            setSelectedPkgId(""); setExamCount(1); setDiscount(0); setAmountPaid(0); setIsPaid(false);
        } catch (e: any) {
            toast("فشل: " + e.message, "error");
        } finally { setSaving(false); }
    };

    const handleCancelPackage = async () => {
        if (!mp) return;
        if (!window.confirm("هل أنت متأكد من تعطيل هذه الباقة؟ سيتم إرجاع بقية قيمة محاولات الباقة وحسابها برمجياً مع مراجعة التسجيل والمواصلات في حال كانت مدرجة.")) return;
        
        setSaving(true);
        try {
            const res = await fetch("/api/pricing/mock-packages/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purchaseId: mp.id })
            });
            const data = await res.json();
            if (!res.ok) {
                toast("فشل تعطيل الباقة: " + (data.error || "خطأ غير معروف"), "error");
                return;
            }
            let successMsg = `تم تعطيل الباقة بنجاح ✓ | مسترجع: ${data.totalRefund?.toLocaleString() || 0} ر.ي`;
            if (data.cashRefund > 0) {
                successMsg += ` | نقداً: ${data.cashRefund.toLocaleString()} ر.ي`;
            }
            if (data.debtWaiver > 0) {
                successMsg += ` | إعفاء: ${data.debtWaiver.toLocaleString()} ر.ي`;
            }
            toast(successMsg, "success");
            onUpdate();
        } catch (e: any) {
            toast("فشل الاتصال: " + e.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-4 text-sm text-gray-500">جاري التحميل...</div>;

    return (
        <div className="space-y-4">
            {/* Current Status */}
            {mp && (
                <Card className={`border-2 ${isExpired ? 'border-red-200 bg-red-50/30' : creditsRemaining === 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-purple-200 bg-purple-50/30'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-sm flex items-center gap-2">
                                    <Beaker className="h-4 w-4 text-purple-600" />
                                    {mp.packageName || "اختبارات مفردة"}
                                </h4>
                                <div className="text-xs text-gray-500 mt-1">
                                    المستخدم: {mp.usedCredits} / {mp.totalCredits === -1 ? '∞' : mp.totalCredits}
                                </div>
                            </div>
                            <div className="text-left">
                                <div className={`text-2xl font-black ${creditsRemaining === 0 ? 'text-red-600' : 'text-purple-700'}`}>
                                    {creditsRemaining === -1 ? '∞' : creditsRemaining}
                                </div>
                                <div className="text-[10px] text-gray-500">متبقي</div>
                            </div>
                        </div>
                        {mp.totalCredits > 0 && (
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                                <div className={`h-full rounded-full ${creditsRemaining === 0 ? 'bg-red-400' : 'bg-purple-500'}`}
                                    style={{ width: `${Math.min(100, (mp.usedCredits / mp.totalCredits) * 100)}%` }} />
                            </div>
                        )}
                        {isExpired && <Badge variant="destructive" className="mt-2 text-xs">منتهية الصلاحية</Badge>}
                        {mp.expiresAt && !isExpired && <p className="text-[10px] text-gray-400 mt-1">تنتهي: {new Date(mp.expiresAt).toLocaleDateString('en-GB')}</p>}
                        {mp.status !== "CANCELLED" && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 text-xs font-semibold"
                                onClick={handleCancelPackage}
                                disabled={saving}
                            >
                                تعطيل الباقة واسترجاع الرسوم
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Renewal Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4 text-green-600" /> تجديد / شراء اختبارات إضافية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                        <Button type="button" size="sm" variant={saleType === "package" ? "default" : "ghost"} onClick={() => { setSaleType("package"); setSelectedPkgId(""); }}>📦 باقة</Button>
                        <Button type="button" size="sm" variant={saleType === "individual" ? "default" : "ghost"} onClick={() => { setSaleType("individual"); setSelectedPkgId(""); }}>🧪 مفرد</Button>
                    </div>

                    {saleType === "package" ? (
                        packages.length === 0 ? <p className="text-sm text-gray-500 text-center py-2">لا توجد باقات</p> : (
                            <div className="grid grid-cols-2 gap-2">
                                {packages.map(pkg => {
                                    return (
                                        <div 
                                            key={pkg.id} 
                                            onClick={() => setSelectedPkgId(pkg.id)} 
                                            className={`cursor-pointer rounded-lg border p-3 transition-all text-sm hover:bg-gray-50/50 ${selectedPkgId === pkg.id ? 'border-gray-900 bg-gray-50/80 shadow-sm' : 'border-gray-200 bg-white'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-xs text-gray-900">{pkg.name}</span>
                                                {selectedPkgId === pkg.id ? (
                                                    <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.2 rounded font-medium">✓ محدد</span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium">تحديد</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">{pkg.examCredits === -1 ? '∞' : pkg.examCredits} اختبار</div>
                                            <div className="font-black text-gray-900 mt-1">{Number(pkg.examPrice).toLocaleString()} ر.ي</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                            <div className="space-y-1"><Label className="text-xs">العدد</Label><Input type="number" min={1} className="w-20 h-8" value={examCount} onChange={e => setExamCount(Math.max(1, Number(e.target.value)))} /></div>
                            <span className="text-gray-400 pt-4">×</span>
                            <span className="font-bold pt-4 text-sm">{singlePrice} ر.ي</span>
                            <span className="text-gray-400 pt-4">=</span>
                            <span className="font-black text-green-700 pt-4">{singlePrice * examCount} ر.ي</span>
                        </div>
                    )}

                    {/* Financial Summary */}
                    {(selectedPkgId || saleType === "individual") && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                                <div><Label className="text-[10px]">الأساسي</Label><div className="font-bold text-sm">{baseTotal} ر.ي</div></div>
                                <div><Label className="text-[10px]">خصم</Label><Input type="number" className="h-7 text-xs text-red-600" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                                <div><Label className="text-[10px] text-green-700 font-bold">الإجمالي</Label><div className="font-black text-lg text-green-700">{total}</div></div>
                                <div><Label className="text-[10px]">المدفوع</Label><Input type="number" className="h-7 text-xs font-bold" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} /></div>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="text-xs">المتبقي: <span className={`font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>{remaining} ر.ي</span></span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1"><Checkbox id="rpaid" checked={isPaid} onCheckedChange={c => setIsPaid(c === true)} /><Label htmlFor="rpaid" className="text-xs">تم الدفع</Label></div>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">نقد</SelectItem><SelectItem value="TRANSFER">تحويل</SelectItem></SelectContent></Select>
                                </div>
                            </div>
                            <Button className="w-full bg-green-700 hover:bg-green-800" onClick={handleRenew} disabled={saving || (saleType === "package" && !selectedPkgId)}>
                                {saving ? "جاري المعالجة..." : "✓ تأكيد التجديد"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
