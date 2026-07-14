"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, CheckCircle2, Clock, XCircle, Search, RefreshCw, Eye, AlertCircle, Phone, ArrowLeft, ExternalLink, Send } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Purchase {
    id: string;
    phone: string;
    buyerName: string | null;
    totalCredits: number;
    usedCredits: number;
    amount: number;
    currency: string;
    isPaid: boolean;
    paymentMethod: string | null;
    paymentNote: string | null;
    status: "PENDING" | "AWAITING_VERIFICATION" | "UNDER_REVIEW" | "PAID" | "REJECTED" | "EXPIRED" | "CANCELLED" | "REFUNDED";
    transactionRef: string | null;
    proofAttachment: string | null;
    rejectedReason: string | null;
    createdAt: string;
    package: {
        name: string;
        nameEn: string | null;
        examCredits: number;
    } | null;
    reviewedBy: {
        name: string;
        role: string;
    } | null;
    profession: string | null;
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-gray-100 rounded-2xl shadow-sm w-full animate-in fade-in-50">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-gray-500 text-sm max-w-md">
                ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم المالي. يرجى مراجعة الإدارة للحصول على الصلاحيات المطلوبة.
            </p>
        </div>
    );
}

export default function PaymentsDashboard() {
    const { data: session, status } = useSession();
    
    // Payments list and loading
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // UI Helpers
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("under_review");
    
    // Lightbox modal for Sand/Screenshot
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
    
    // Rejection Modal states
    const [rejectingPurchaseId, setRejectingPurchaseId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const [activatingPurchase, setActivatingPurchase] = useState<Purchase | null>(null);
    const [isDeclarationChecked, setIsDeclarationChecked] = useState(false);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payments");
            if (res.ok) {
                const data = await res.json();
                setPurchases(data);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchPurchases();
        }
    }, [session]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Role verification
    if (!session || !["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT"].includes(session.user.role)) {
        return <AccessDenied />;
    }

    // Action handlers (Approve / Reject - fully implemented in Step 9)
    const handleApprovePayment = async (purchaseId: string) => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/payments/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseId,
                    action: "APPROVE"
                })
            });

            if (res.ok) {
                setActivatingPurchase(null);
                fetchPurchases();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "حدث خطأ أثناء تفعيل الطلب");
            }
        } catch (error) {
            console.error("Error approving payment:", error);
            alert("فشل الاتصال بالخادم");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            alert("يرجى كتابة سبب الرفض");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch("/api/payments/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseId: rejectingPurchaseId,
                    action: "REJECT",
                    reason: rejectionReason.trim()
                })
            });

            if (res.ok) {
                setRejectingPurchaseId(null);
                setRejectionReason("");
                fetchPurchases();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "حدث خطأ أثناء رفض الطلب");
            }
        } catch (error) {
            console.error("Error rejecting payment:", error);
            alert("فشل الاتصال بالخادم");
        } finally {
            setActionLoading(false);
        }
    };

    // Filters based on search and tab selection
    const filteredPurchases = purchases.filter((purchase) => {
        // Search filter
        const matchSearch = 
            purchase.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.phone.includes(searchTerm) ||
            purchase.transactionRef?.includes(searchTerm) ||
            purchase.package?.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchSearch) return false;

        // Tab filter
        if (activeTab === "under_review") {
            return ["UNDER_REVIEW", "PENDING"].includes(purchase.status);
        }
        if (activeTab === "awaiting_verification") {
            return purchase.status === "AWAITING_VERIFICATION";
        }
        if (activeTab === "paid") {
            return purchase.status === "PAID";
        }
        return true; // "all" tab
    });

    // Counts for stats
    const underReviewCount = purchases.filter(p => ["UNDER_REVIEW", "PENDING"].includes(p.status)).length;
    const awaitingSmsCount = purchases.filter(p => p.status === "AWAITING_VERIFICATION").length;
    const paidCount = purchases.filter(p => p.status === "PAID").length;

    const getStatusBadge = (statusValue: string) => {
        switch (statusValue) {
            case "PAID":
                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-bold">مدفوع ومفعل</span>;
            case "UNDER_REVIEW":
                return <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl text-[10px] font-bold animate-pulse">قيد المراجعة</span>;
            case "AWAITING_VERIFICATION":
                return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-xl text-[10px] font-bold">بانتظار SMS</span>;
            case "REJECTED":
                return <span className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-xl text-[10px] font-bold">مرفوض</span>;
            default:
                return <span className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-xl text-[10px] font-bold">معلق</span>;
        }
    };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto text-right" dir="rtl">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">إدارة مراجعة وتفعيل الاشتراكات</h1>
                    <p className="text-slate-500 text-xs">مراجعة التحويلات المالية يدوياً ومتابعة طوابير الدفع الآلي لليمن</p>
                </div>
                <Button 
                    onClick={fetchPurchases} 
                    variant="outline" 
                    className="rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 h-10 w-fit self-end"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> تحديث البيانات
                </Button>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 block">بانتظار المراجعة (يدوي)</span>
                            <span className="text-3xl font-black text-blue-600">{underReviewCount}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 block">بانتظار التحقق (آلي SMS)</span>
                            <span className="text-3xl font-black text-amber-500">{awaitingSmsCount}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <Send className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 block">إجمالي الاشتراكات المفعلة</span>
                            <span className="text-3xl font-black text-emerald-600">{paidCount}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 block">إجمالي الإيرادات المحصلة</span>
                            <div className="text-sm font-black text-slate-800 space-y-0.5">
                                <div>YER: {purchases.filter(p => p.status === "PAID" && p.currency === "YER").reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</div>
                                <div className="text-[10px] text-emerald-600">SAR: {purchases.filter(p => p.status === "PAID" && p.currency === "SAR").reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                            <span>💸</span>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* List and Tabs Filter */}
            <div className="bg-white border border-slate-200/80 rounded-[2.2rem] shadow-sm p-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full sm:w-fit">
                        <TabsList className="bg-slate-100 p-1 rounded-2xl flex gap-1 w-full sm:w-fit">
                            <TabsTrigger value="under_review" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5">
                                قيد المراجعة اليدوية
                                <span className="bg-blue-600 text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-bold">{underReviewCount}</span>
                            </TabsTrigger>
                            <TabsTrigger value="awaiting_verification" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5">
                                طابور SMS الآلي
                                <span className="bg-amber-500 text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-bold">{awaitingSmsCount}</span>
                            </TabsTrigger>
                            <TabsTrigger value="paid" className="rounded-xl text-xs font-bold px-4 py-2">المفعلة بنجاح</TabsTrigger>
                            <TabsTrigger value="all" className="rounded-xl text-xs font-bold px-4 py-2">جميع العمليات</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-80">
                        <Input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ابحث بالاسم، الهاتف، أو الباقة..."
                            className="rounded-xl border-slate-200 h-10 text-xs pr-9 bg-white"
                        />
                        <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    </div>

                </div>

                {/* Table View */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                            <thead className="bg-slate-50/70 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5 font-bold text-slate-700">المشترك</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700">الباقة المطلوبة</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">المبلغ المستحق</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">طريقة الدفع</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">الرقم المرجع / الحوالة</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">الإثبات (السند)</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">الحالة</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">التاريخ</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center no-print">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                                            جاري تحميل بيانات العمليات...
                                        </td>
                                    </tr>
                                ) : filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">لا توجد عمليات تطابق البحث حالياً.</td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-blue-50/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 text-sm">{purchase.buyerName || "غير محدد"}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" dir="ltr">
                                                    <span>{purchase.phone}</span>
                                                    <Phone size={10} className="text-slate-400" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                {purchase.package?.name || "باقة مخصصة"}
                                                {purchase.profession && <span className="block text-[10px] text-slate-450 mt-0.5">التخصص: {purchase.profession}</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">
                                                {Number(purchase.amount).toLocaleString()} {purchase.currency === "SAR" ? "ر.س" : "ر.ي"}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-500 font-semibold">
                                                {purchase.paymentMethod === "AUTO_SMS_WALLET" ? "آلي SMS" : "تحويل يدوي"}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">
                                                {purchase.transactionRef || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {purchase.proofAttachment ? (
                                                    <button 
                                                        onClick={() => setSelectedProofUrl(purchase.proofAttachment)}
                                                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-[#16539a] text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors"
                                                    >
                                                        <Eye size={12} />
                                                        <span>عرض السند</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-350">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(purchase.status)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-400 font-medium">
                                                {format(new Date(purchase.createdAt), "dd MMM yyyy - hh:mm a", { locale: ar })}
                                            </td>
                                            <td className="px-6 py-4 text-center no-print">
                                                {["UNDER_REVIEW", "AWAITING_VERIFICATION", "PENDING"].includes(purchase.status) ? (
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <Button
                                                            onClick={() => {
                                                                setActivatingPurchase(purchase);
                                                                setIsDeclarationChecked(false);
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 h-8 text-[10px] font-bold"
                                                            disabled={actionLoading}
                                                        >
                                                            تنشيط
                                                        </Button>
                                                        <Button
                                                            onClick={() => setRejectingPurchaseId(purchase.id)}
                                                            variant="outline"
                                                            className="border-rose-100 hover:bg-rose-50 text-rose-500 rounded-xl px-3 h-8 text-[10px] font-bold"
                                                            disabled={actionLoading}
                                                        >
                                                            رفض
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-semibold">
                                                        {purchase.reviewedBy ? `بواسطة ${purchase.reviewedBy.name}` : "-"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* LIGHTBOX MODAL FOR IMAGES */}
            {selectedProofUrl && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col justify-between text-right animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">معاينة سند إشعار التحويل</span>
                            <button 
                                onClick={() => setSelectedProofUrl(null)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-y-auto">
                            <img 
                                src={selectedProofUrl} 
                                alt="سند التحويل" 
                                className="max-w-full max-h-full object-contain rounded-xl border border-slate-200/50 shadow" 
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                            <a 
                                href={selectedProofUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                            >
                                <ExternalLink size={12} />
                                فتح في علامة تبويب جديدة
                            </a>
                            <Button 
                                onClick={() => setSelectedProofUrl(null)}
                                className="rounded-xl px-5 h-9 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
                            >
                                إغلاق المعاينة
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION MODAL */}
            {rejectingPurchaseId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden max-w-md w-full text-right animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">رفض طلب تفعيل الاشتراك</span>
                            <button 
                                onClick={() => setRejectingPurchaseId(null)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-655">يرجى كتابة سبب الرفض بالتفصيل (سيظهر للعميل) *</label>
                                <textarea 
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    placeholder="مثال: صورة سند التحويل غير واضحة، أو رقم العملية المرجع خاطئ..."
                                    className="w-full rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none p-3 text-xs min-h-[90px]"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                                <Button 
                                    type="button" 
                                    onClick={() => setRejectingPurchaseId(null)}
                                    variant="outline"
                                    className="rounded-xl px-5 text-xs font-bold border-slate-200"
                                    disabled={actionLoading}
                                >
                                    إلغاء
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="rounded-xl px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                                    disabled={actionLoading}
                                >
                                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />}
                                    تأكيد الرفض يدوياً
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ACTIVATION MODAL */}
            <Dialog open={activatingPurchase !== null} onOpenChange={(open) => { if(!open) setActivatingPurchase(null); }}>
                <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-[2rem] p-6 text-right" dir="rtl">
                    <DialogHeader className="border-b border-slate-150 pb-3 flex items-center justify-between">
                        <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                <CheckCircle2 className="h-5 w-5" />
                            </span>
                            تنشيط وتفعيل باقة الاشتراك
                        </DialogTitle>
                    </DialogHeader>

                    {activatingPurchase && (
                        <div className="space-y-4 py-3">
                            {/* Summary Table of details */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5 space-y-2.5">
                                <div className="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">اسم المشترك:</span>
                                    <span className="text-xs font-bold text-slate-800">{activatingPurchase.buyerName || "غير محدد"}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">الباقة المطلوبة:</span>
                                    <span className="text-xs font-bold text-indigo-700">{activatingPurchase.package?.name || "باقة مخصصة"}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">المبلغ المستحق للتحصيل:</span>
                                    <span className="text-sm font-black text-slate-800">{Number(activatingPurchase.amount).toLocaleString()} {activatingPurchase.currency === "SAR" ? "ر.س" : "ر.ي"}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">المحفظة المحددة للدفع:</span>
                                    <span className="text-xs font-black text-emerald-600">{activatingPurchase.paymentMethod || "تحويل يدوي"}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">رقم العملية (النظام):</span>
                                    <span className="text-xs font-mono font-bold text-slate-655">{activatingPurchase.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] text-slate-400 font-bold">رقم الحوالة المرجعي (العميل):</span>
                                    <span className="text-xs font-mono font-black text-slate-800 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{activatingPurchase.transactionRef || "لا يوجد"}</span>
                                </div>
                            </div>

                            {/* Image Attachment (Receipt) Thumbnail */}
                            {activatingPurchase.proofAttachment && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 block">سند التحويل المالي المرفق:</span>
                                    <div className="relative group overflow-hidden border border-slate-200 rounded-xl h-36 bg-slate-100 flex items-center justify-center">
                                        <img 
                                            src={activatingPurchase.proofAttachment} 
                                            alt="سند التحويل" 
                                            className="h-full w-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                            onClick={() => setSelectedProofUrl(activatingPurchase.proofAttachment)}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="bg-white/90 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow flex items-center gap-1">
                                                <Eye className="h-3 w-3" /> تكبير الصورة
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Declaration Checkbox */}
                            <label className="flex items-start gap-2.5 p-3.5 border border-dashed border-emerald-250 bg-emerald-50/20 rounded-2xl cursor-pointer select-none transition-all hover:bg-emerald-50/30">
                                <input
                                    type="checkbox"
                                    checked={isDeclarationChecked}
                                    onChange={(e) => setIsDeclarationChecked(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-slate-655 leading-relaxed">
                                    أقر بصفتي مراجعاً مالياً معتمداً أنني قمت بمطابقة إشعار الدفع والتحقق من حساب المحفظة المالي وأؤكد تحصيل مبلغ <span className="text-emerald-700 font-extrabold">{Number(activatingPurchase.amount).toLocaleString()} {activatingPurchase.currency === "SAR" ? "ر.س" : "ر.ي"}</span> بنجاح.
                                </span>
                            </label>
                        </div>
                    )}

                    <DialogFooter className="border-t border-slate-150 pt-3 flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setActivatingPurchase(null)}
                            className="rounded-xl border-slate-250 text-slate-500 hover:bg-slate-50 flex-1"
                        >
                            إلغاء
                        </Button>
                        <Button 
                            onClick={() => activatingPurchase && handleApprovePayment(activatingPurchase.id)} 
                            disabled={!isDeclarationChecked || actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex-1 shadow-sm flex items-center justify-center gap-1.5"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    جاري التفعيل...
                                </>
                            ) : (
                                "تأكيد وتنشيط الباقة"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
