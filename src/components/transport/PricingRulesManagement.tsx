
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Save, X, AlertCircle, Percent, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/simple-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// Types matching Prisma Enum
type PricingPassengerType = "ADULT" | "CHILD" | "INFANT" | "ALL" | "";
type PricingTripType = "ONE_WAY" | "ROUND_TRIP" | "MULTI_CITY" | "ALL" | "";
type PricingBusClass = "STANDARD" | "VIP" | "ALL" | "";
type PricingActionType = "FIXED_PRICE" | "PERCENTAGE_DISCOUNT" | "PERCENTAGE_MARKUP" | "FIXED_DISCOUNT" | "FIXED_MARKUP";

interface PricingRule {
    id: string;
    name: string;
    priority: number;
    isActive: boolean;
    routeFromId: string | null;
    routeToId: string | null;
    passengerType: string | null;
    tripType: string | null;
    busClass: string | null;
    actionType: string;
    amount: number;
}

export function PricingRulesManagement() {
    const { toast } = useToast();
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        priority: 0,
        routeFromId: "ALL",
        routeToId: "ALL",
        passengerType: "ALL" as PricingPassengerType,
        tripType: "ALL" as PricingTripType,
        busClass: "ALL" as PricingBusClass,
        actionType: "FIXED_PRICE" as PricingActionType,
        amount: 0,
    });

    useEffect(() => {
        fetchRules();
        fetchDestinations();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch("/api/transport/pricing-rules");
            if (res.ok) setRules(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDestinations = async () => {
        try {
            const res = await fetch("/api/transport/destinations");
            if (res.ok) setDestinations(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        if (!formData.name) return toast("اسم القاعدة مطلوب", "error");

        setLoading(true);
        try {
            const payload = {
                ...formData,
                routeFromId: formData.routeFromId === "ALL" ? null : formData.routeFromId,
                routeToId: formData.routeToId === "ALL" ? null : formData.routeToId,
                passengerType: formData.passengerType === "ALL" ? null : (formData.passengerType || null),
                tripType: formData.tripType === "ALL" ? null : (formData.tripType || null),
                busClass: formData.busClass === "ALL" ? null : (formData.busClass || null),
            };

            const res = await fetch("/api/transport/pricing-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast("تم إضافة قاعدة التسعير", "success");
                setShowDialog(false);
                fetchRules();
                // Reset form
                setFormData({
                    name: "",
                    priority: 0,
                    routeFromId: "ALL",
                    routeToId: "ALL",
                    passengerType: "ALL",
                    tripType: "ALL",
                    busClass: "ALL",
                    actionType: "FIXED_PRICE",
                    amount: 0,
                });
            } else {
                toast("حدث خطأ", "error");
            }
        } catch (e) {
            toast("حدث خطأ", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) return;
        try {
            await fetch(`/api/transport/pricing-rules?id=${id}`, { method: "DELETE" });
            toast("تم الحذف", "success");
            fetchRules();
        } catch (e) {
            toast("خطأ في الحذف", "error");
        }
    };

    const getDestinationName = (id: string | null) => {
        if (!id) return "الكل";
        return destinations.find(d => d.id === id)?.name || id;
    };

    const translateAction = (type: string, amount: number) => {
        switch (type) {
            case "FIXED_PRICE": return `سعر ثابت: ${amount}`;
            case "PERCENTAGE_DISCOUNT": return `خصم: ${amount}%`;
            case "PERCENTAGE_MARKUP": return `زيادة: ${amount}%`;
            case "FIXED_DISCOUNT": return `خصم: ${amount} ريال`;
            case "FIXED_MARKUP": return `زيادة: ${amount} ريال`;
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">قواعد التسعير</h2>
                <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600">
                    <Plus className="h-4 w-4" /> إضافة قاعدة
                </Button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="hover:border-blue-300">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={(rule.priority > 0) ? "default" : "secondary"}>
                                        الأولوية: {rule.priority}
                                    </Badge>
                                    <span className="font-bold text-lg">{rule.name}</span>
                                </div>
                                <div className="text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                                    <span>المسار: {getDestinationName(rule.routeFromId)} <ArrowRight className="inline h-3 w-3" /> {getDestinationName(rule.routeToId)}</span>
                                    {rule.passengerType && <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{rule.passengerType}</Badge>}
                                    {rule.tripType && <Badge variant="outline" className="bg-purple-50 text-purple-700">{rule.tripType === 'ROUND_TRIP' ? 'ذهاب وعودة' : 'ذهاب فقط'}</Badge>}
                                    {rule.busClass && <Badge variant="outline" className="bg-indigo-50 text-indigo-700">{rule.busClass}</Badge>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
                                    {translateAction(rule.actionType, Number(rule.amount))}
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(rule.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>إضافة قاعدة تسعير جديدة</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2">
                            <label className="text-sm font-bold">اسم القاعدة</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثلاً: خصم الأطفال" />
                        </div>

                        <div>
                            <label className="text-sm font-bold">الأولوية (0 = أساسي، 1+ = تعديل)</label>
                            <Input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold">نوع الإجراء</label>
                            <Select value={formData.actionType} onValueChange={(v: PricingActionType) => setFormData({ ...formData, actionType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED_PRICE">سعر ثابت (أساسي)</SelectItem>
                                    <SelectItem value="PERCENTAGE_DISCOUNT">خصم نسبة %</SelectItem>
                                    <SelectItem value="PERCENTAGE_MARKUP">زيادة نسبة %</SelectItem>
                                    <SelectItem value="FIXED_DISCOUNT">خصم مبلغ ثابت</SelectItem>
                                    <SelectItem value="FIXED_MARKUP">زيادة مبلغ ثابت</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-bold">القيمة (المبلغ أو النسبة)</label>
                            <Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                        </div>

                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h3 className="font-bold mb-2 text-gray-500">الشروط والنطاق</h3>
                        </div>

                        <div>
                            <label className="text-sm font-medium">من (المغادرة)</label>
                            <Select value={formData.routeFromId} onValueChange={v => setFormData({ ...formData, routeFromId: v })}>
                                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل</SelectItem>
                                    {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">إلى (الوصول)</label>
                            <Select value={formData.routeToId} onValueChange={v => setFormData({ ...formData, routeToId: v })}>
                                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل</SelectItem>
                                    {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">نوع الراكب</label>
                            <Select value={formData.passengerType} onValueChange={(v: PricingPassengerType) => setFormData({ ...formData, passengerType: v })}>
                                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل</SelectItem>
                                    <SelectItem value="ADULT">بالغ (Adult)</SelectItem>
                                    <SelectItem value="CHILD">طفل (Child)</SelectItem>
                                    <SelectItem value="INFANT">رضيع (Infant)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">نوع الرحلة</label>
                            <Select value={formData.tripType} onValueChange={(v: PricingTripType) => setFormData({ ...formData, tripType: v })}>
                                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل</SelectItem>
                                    <SelectItem value="ONE_WAY">ذهاب فقط</SelectItem>
                                    <SelectItem value="ROUND_TRIP">ذهاب وعودة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">فئة الباص</label>
                            <Select value={formData.busClass} onValueChange={(v: PricingBusClass) => setFormData({ ...formData, busClass: v })}>
                                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل</SelectItem>
                                    <SelectItem value="STANDARD">عادي</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={loading} className="bg-blue-600">حفظ القاعدة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
