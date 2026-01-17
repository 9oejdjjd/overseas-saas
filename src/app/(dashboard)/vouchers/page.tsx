"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Ticket,
    Search,
    Plus,
    Tag,
    History,
    RefreshCw,
    CheckCircle2,
    X,
    User,
    Calendar,
    Copy
} from "lucide-react";

export default function VouchersPage() {
    const [stats, setStats] = useState({ active: 0, used: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]); // New: for dropdown

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: "",
        discountPercent: 10,
        maxUses: 100,
        expiryDate: "",
        notes: ""
    });

    // Personal Voucher State
    const [personalSearchTerm, setPersonalSearchTerm] = useState("");
    const [foundApplicants, setFoundApplicants] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
    const [personalVoucherType, setPersonalVoucherType] = useState("EXAM_RETAKE");
    const [personalNotes, setPersonalNotes] = useState("");
    const [personalDiscount, setPersonalDiscount] = useState("100");
    const [personalLocationId, setPersonalLocationId] = useState("");

    const [creating, setCreating] = useState(false);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/vouchers');
            if (res.ok) {
                const data = await res.json();
                setVouchers(data);

                // Calculate Stats
                const active = data.filter((v: any) => !v.isUsed).length;
                const used = data.filter((v: any) => v.isUsed).length;
                const totalComp = data
                    .filter((v: any) => v.category === "COMPENSATION")
                    .reduce((sum: number, v: any) => sum + (v.amount || 0), 0);

                setStats({ active, used, totalAmount: totalComp });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/locations');
            if (res.ok) setLocations(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchVouchers();
        fetchLocations();
    }, []);

    const handleCreateVoucher = async () => {
        try {
            setCreating(true);
            const res = await fetch('/api/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: "PUBLIC",
                    type: "EXAM", // Default underlying type
                    code: newVoucher.code,
                    discountPercent: Number(newVoucher.discountPercent),
                    maxUses: Number(newVoucher.maxUses),
                    expiryDate: newVoucher.expiryDate ? new Date(newVoucher.expiryDate).toISOString() : null,
                    notes: newVoucher.notes
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewVoucher({ code: "", discountPercent: 10, maxUses: 100, expiryDate: "", notes: "" });
                fetchVouchers();
            } else {
                alert("Failed to create voucher");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating voucher");
        } finally {
            setCreating(false);
        }
    };

    const generateRandomCode = () => {
        const code = "PROMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        setNewVoucher({ ...newVoucher, code });
    };

    // Personal Voucher Logic
    const handlePersonalSearch = async (term: string) => {
        setPersonalSearchTerm(term);
        if (term.length < 3) return;
        try {
            const res = await fetch(`/api/applicants?search=${term}`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.applicants || []);
                setFoundApplicants(list);
            }
        } catch (e) { console.error(e); }
    };

    const handleCreatePersonalVoucher = async () => {
        if (!selectedApplicant) return alert("اختر متقدم");
        try {
            setCreating(true);
            const res = await fetch("/api/vouchers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "PERSONAL", // Explicitly set category
                    applicantId: selectedApplicant.id,
                    type: personalVoucherType,
                    notes: personalNotes,
                    discountPercent: parseFloat(personalDiscount) || 100,
                    locationId: personalLocationId === "ALL" ? null : (personalLocationId || null)
                })
            });
            if (res.ok) {
                alert("تم إنشاء القسيمة");
                setSelectedApplicant(null);
                setPersonalSearchTerm("");
                setPersonalNotes("");
                setPersonalDiscount("100");
                setPersonalLocationId("");
                fetchVouchers();
            } else {
                alert("خطأ في الإنشاء");
            }
        } catch (e) { alert("خطأ"); } finally { setCreating(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">نظام القسائم المتقدم</h1>
                    <p className="text-gray-500 mt-1">إدارة القسائم الشخصية، الأكواد العامة، والتعويضات التلقائية.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={fetchVouchers} variant="outline" size="icon">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">القسائم النشطة</CardTitle>
                        <Ticket className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">قسيمة جاهزة للاستخدام</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">تم استخدامها</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.used}</div>
                        <p className="text-xs text-muted-foreground">قسيمة تم صرفها</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">قيمة التعويضات</CardTitle>
                        <History className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()} ر.ي</div>
                        <p className="text-xs text-muted-foreground">إجمالي رصيد التعويضات</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="public" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-8">
                    <TabsTrigger value="public" className="gap-2"><Tag className="h-4 w-4" /> الأكواد العامة</TabsTrigger>
                    <TabsTrigger value="personal" className="gap-2"><User className="h-4 w-4" /> القسائم الشخصية</TabsTrigger>
                    <TabsTrigger value="compensation" className="gap-2"><RefreshCw className="h-4 w-4" /> التعويضات</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                    {/* Create Personal Voucher Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>إصدار قسيمة جديدة</CardTitle>
                            <CardDescription>إنشاء قسيمة خدمة مجانية (إعادة اختبار أو نقل) لمتقدم محدد.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>البحث عن متقدم (الاسم أو رقم الجواز)</Label>
                                    <div className="relative">
                                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="ابحث..."
                                            value={personalSearchTerm}
                                            onChange={(e) => handlePersonalSearch(e.target.value)}
                                            className="pr-9"
                                        />
                                        {personalSearchTerm && !selectedApplicant && foundApplicants.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                                {foundApplicants.map((app: any) => (
                                                    <div
                                                        key={app.id}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                        onClick={() => {
                                                            setSelectedApplicant(app);
                                                            setPersonalSearchTerm(app.fullName);
                                                            setFoundApplicants([]);
                                                        }}
                                                    >
                                                        <div className="font-bold">{app.fullName}</div>
                                                        <div className="text-xs text-gray-500">{app.passportNumber} - {app.applicantCode}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedApplicant && (
                                        <div className="text-sm bg-green-50 text-green-700 p-2 rounded border border-green-200 flex justify-between items-center">
                                            <span>تم تحديد: {selectedApplicant.fullName}</span>
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedApplicant(null); setPersonalSearchTerm(""); }} className="h-6 w-6 p-0 text-green-700 hover:text-green-800"><X className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>نوع القسيمة</Label>
                                    <Select value={personalVoucherType} onValueChange={setPersonalVoucherType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EXAM">قسيمة اختبار (أول مرة / إعادة)</SelectItem>
                                            <SelectItem value="TRANSPORT_ONEWAY">نقل ذهاب (فقط)</SelectItem>
                                            <SelectItem value="TRANSPORT_ROUNDTRIP">نقل ذهاب وعودة</SelectItem>
                                            <SelectItem value="FULL_PROGRAM">قسيمة شاملة (تسجيل + اختبار + نقل)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>نسبة الخصم (%)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="1" max="100"
                                            value={personalDiscount}
                                            onChange={(e) => setPersonalDiscount(e.target.value)}
                                            placeholder="100"
                                        />
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>تحديد مركز (اختياري - للقسيمة الشاملة)</Label>
                                    <Select value={personalLocationId} onValueChange={setPersonalLocationId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="أي مركز" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">أي مركز</SelectItem>
                                            {locations.map((loc: any) => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label>ملاحظات (اختياري)</Label>
                                    <Textarea
                                        className="h-20"
                                        placeholder="سبب المنح (مثال: توجيه من الإدارة...)"
                                        value={personalNotes}
                                        onChange={(e) => setPersonalNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t flex justify-end">
                                <Button onClick={handleCreatePersonalVoucher} disabled={!selectedApplicant || creating} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {creating ? "جاري الإنشاء..." : "إصدار القسيمة"} <Plus className="h-4 w-4 mr-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>سجل القسائم الشخصية (Linked Vouchers)</CardTitle>
                            <CardDescription>القسائم المرتبطة بمتقدم محدد.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50/50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">المتقدم</th>
                                            <th className="px-6 py-3 font-medium">النوع</th>
                                            <th className="px-6 py-3 font-medium">الخصم</th>
                                            <th className="px-6 py-3 font-medium">الحالة</th>
                                            <th className="px-6 py-3 font-medium">التاريخ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {vouchers.filter((v: any) => v.category === "PERSONAL").length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا توجد قسائم شخصية</td></tr>
                                        ) : (
                                            vouchers.filter((v: any) => v.category === "PERSONAL").map((v: any) => (
                                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{v.applicant?.fullName || "-"}</td>
                                                    <td className="px-6 py-4 text-blue-600">{
                                                        v.type === "FULL_PROGRAM" ? "برنامج شامل" :
                                                            v.type === "EXAM" ? "إعادة اختبار" : v.type
                                                    }</td>
                                                    <td className="px-6 py-4">{v.discountPercent}%</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={v.isUsed ? "secondary" : "outline"} className={v.isUsed ? "bg-gray-100" : "text-green-600 bg-green-50 border-green-200"}>
                                                            {v.isUsed ? "منتهي" : "نشط"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">{new Date(v.createdAt).toLocaleDateString('ar-EG')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="public" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="relative w-64">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input placeholder="بحث عن كود..." className="pr-9 h-9 text-xs" />
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء كود جديد
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>الأكواد العامة (Promo Codes)</CardTitle>
                            <CardDescription>أكواد خصم للتسويق والمسجلين الجدد.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {vouchers.filter((v: any) => v.category === "PUBLIC").length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        <Tag className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium">لا توجد أكواد عامة</h3>
                                    <p className="text-gray-500 text-center max-w-sm">
                                        يمكنك إنشاء أكواد خصم (مثلاً PROMO2025) ليستخدمها المتقدمون الجدد عند التسجيل.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50/50 text-gray-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">الكود</th>
                                                <th className="px-6 py-3 font-medium">الخصم</th>
                                                <th className="px-6 py-3 font-medium">الاستخدام</th>
                                                <th className="px-6 py-3 font-medium">الحالة</th>
                                                <th className="px-6 py-3 font-medium">تاريخ الانتهاء</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {vouchers.filter((v: any) => v.category === "PUBLIC").map((v: any) => (
                                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold font-mono text-blue-600 flex items-center gap-2">
                                                        {v.code}
                                                        <Copy className="h-3 w-3 text-gray-400 cursor-pointer hover:text-blue-500" />
                                                    </td>
                                                    <td className="px-6 py-4">{v.discountPercent}%</td>
                                                    <td className="px-6 py-4">{v.usageCount || 0} / {v.maxUses || '∞'}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={v.isUsed ? "secondary" : "outline"} className={v.isUsed ? "bg-gray-100" : "text-green-600 bg-green-50 border-green-200"}>
                                                            {v.isUsed ? "منتهي" : "نشط"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('ar-EG') : 'مدى الحياة'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compensation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>التعويضات التلقائية (Compensation)</CardTitle>
                            <CardDescription>قسائم تم إنشاؤها تلقائياً عند إلغاء الحجوزات أو التذاكر.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {vouchers.filter((v: any) => v.category === "COMPENSATION").length === 0 ? (
                                <p className="text-center py-8 text-gray-500">لا توجد تعويضات حالياً</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50/50 text-gray-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">المتقدم</th>
                                                <th className="px-6 py-3 font-medium">قيمة التعويض</th>
                                                <th className="px-6 py-3 font-medium">الرصيد المتبقي</th>
                                                <th className="px-6 py-3 font-medium">السبب</th>
                                                <th className="px-6 py-3 font-medium">التاريخ</th>
                                                <th className="px-6 py-3 font-medium">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {vouchers.filter((v: any) => v.category === "COMPENSATION").map((v: any) => (
                                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{v.applicant?.fullName || "غير معروف"}</td>
                                                    <td className="px-6 py-4 text-orange-600 font-bold">{Number(v.amount).toLocaleString()} ر.ي</td>
                                                    <td className="px-6 py-4">{Number(v.balance || v.amount).toLocaleString()} ر.ي</td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate" title={v.notes}>
                                                        {v.notes ? v.notes.split('[META')[0] : 'إلغاء تذكرة'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">{new Date(v.createdAt).toLocaleDateString('ar-EG')}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={v.isUsed ? "secondary" : "outline"} className={v.isUsed ? "bg-gray-100" : "text-green-600 bg-green-50 border-green-200"}>
                                                            {v.isUsed ? "مستخدم بالكامل" : "متوفر"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Dialog */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
                        <DialogDescription>سيتم إنشاء كود خصم عام يمكن استخدامه من قبل المتقدمين الجدد.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>كود الخصم</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newVoucher.code}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value })}
                                    placeholder="مثلاً PROMO2025"
                                />
                                <Button variant="outline" onClick={generateRandomCode}>توليد</Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>نسبة الخصم (%)</Label>
                                <Input
                                    type="number"
                                    value={newVoucher.discountPercent}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, discountPercent: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>الحد الأقصى (عدد مرات)</Label>
                                <Input
                                    type="number"
                                    value={newVoucher.maxUses}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, maxUses: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>تاريخ الانتهاء (اختياري)</Label>
                            <Input
                                type="date"
                                value={newVoucher.expiryDate}
                                onChange={(e) => setNewVoucher({ ...newVoucher, expiryDate: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={newVoucher.notes}
                                onChange={(e) => setNewVoucher({ ...newVoucher, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
                        <Button onClick={handleCreateVoucher} disabled={creating}>
                            {creating ? "جاري الإنشاء..." : "إنشاء الكود"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
