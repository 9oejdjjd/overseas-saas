
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/simple-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

type RouteDefault = {
    id: string;
    fromDestinationId: string;
    toDestinationId: string;
    price: number;
    priceRoundTrip: number | null;
    cost: number;
    costRoundTrip: number;
    fromDestination: { name: string };
    toDestination: { name: string };
};

export function RoutePricingManagement() {
    const { toast } = useToast();
    const [routes, setRoutes] = useState<RouteDefault[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fromId: "",
        toId: "",
        price: "",
        priceRoundTrip: "",
        cost: "",
        costRoundTrip: "",
    });

    useEffect(() => {
        fetchRoutes();
        fetchDestinations();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await fetch("/api/transport/route-defaults");
            if (res.ok) setRoutes(await res.json());
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

    const handleSave = async () => {
        if (!formData.fromId || !formData.toId || !formData.price) {
            return toast("يرجى تعبئة الحقول الأساسية (من، إلى، السعر)", "error");
        }

        setLoading(true);
        try {
            const res = await fetch("/api/transport/route-defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast("تم حفظ المسار والسعر", "success");
                setShowDialog(false);
                fetchRoutes();
                setFormData({
                    fromId: "",
                    toId: "",
                    price: "",
                    priceRoundTrip: "",
                    cost: "",
                    costRoundTrip: "",
                });
            } else {
                toast("حدث خطأ أثناء الحفظ", "error");
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
            await fetch(`/api/transport/route-defaults?id=${id}`, { method: "DELETE" });
            toast("تم الحذف", "success");
            fetchRoutes();
        } catch (e) {
            toast("خطأ في الحذف", "error");
        }
    };

    const handleEdit = (route: RouteDefault) => {
        setFormData({
            fromId: route.fromDestinationId,
            toId: route.toDestinationId,
            price: route.price.toString(),
            priceRoundTrip: route.priceRoundTrip ? route.priceRoundTrip.toString() : "",
            cost: route.cost ? route.cost.toString() : "",
            costRoundTrip: route.costRoundTrip ? route.costRoundTrip.toString() : "",
        });
        setShowDialog(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">أسعار وتكاليف المسارات</h2>
                <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600">
                    <Plus className="h-4 w-4" /> إضافة مسار
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map(route => (
                    <Card key={route.id} className="hover:border-blue-300 transition-all">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="font-bold text-lg flex items-center gap-2">
                                    {route.fromDestination.name}
                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                    {route.toDestination.name}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50 h-8 w-8" onClick={() => handleEdit(route)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(route.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100">
                                    <span className="text-xs font-bold text-green-800">سعر البيع (ذهاب)</span>
                                    <span className="font-bold text-green-700">{route.price} ريال</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                                    <span className="text-xs font-bold text-blue-800">سعر البيع (عودة)</span>
                                    <span className="font-bold text-blue-700">{route.priceRoundTrip || "-"} ريال</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                                    <div className="text-xs text-gray-500">
                                        التكلفة (ذهاب): <span className="font-bold text-gray-700">{route.cost}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        التكلفة (عودة): <span className="font-bold text-gray-700">{route.costRoundTrip}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>إضافة / تعديل تسعير مسار</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">من (المغادرة)</label>
                                <Select value={formData.fromId} onValueChange={v => setFormData({ ...formData, fromId: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">إلى (الوصول)</label>
                                <Select value={formData.toId} onValueChange={v => setFormData({ ...formData, toId: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-green-700">سعر البيع (ذهاب)</label>
                                <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-blue-700">سعر البيع (ذهاب وعودة)</label>
                                <Input type="number" value={formData.priceRoundTrip} onChange={e => setFormData({ ...formData, priceRoundTrip: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">التكلفة (ذهاب)</label>
                                <Input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">التكلفة (ذهاب وعودة)</label>
                                <Input type="number" value={formData.costRoundTrip} onChange={e => setFormData({ ...formData, costRoundTrip: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600">حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
