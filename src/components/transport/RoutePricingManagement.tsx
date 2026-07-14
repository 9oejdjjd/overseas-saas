"use client";

import { Plus, Trash2, Edit, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRoutePricing } from "@/hooks/transport/useRoutePricing";

export function RoutePricingManagement() {
    const {
        routes,
        destinations,
        loading,
        showDialog,
        setShowDialog,
        formData,
        setFormData,
        handleSave,
        handleDelete,
        handleEdit,
        openCreate
    } = useRoutePricing();

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Elegant Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-emerald-50/50 to-teal-50/50 p-6 rounded-2xl border border-emerald-100/60 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-100">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">أسعار وتكاليف المسارات الافتراضية</h2>
                        <p className="text-sm text-slate-500 mt-0.5">تحديد أسعار بيع التذاكر الافتراضية للذهاب والعودة، وحساب التكاليف التشغيلية للمسارات</p>
                    </div>
                </div>
                <Button 
                    onClick={openCreate} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-5 w-5" />
                    إضافة تسعير مسار
                </Button>
            </div>

            {/* Price Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map(route => (
                    <Card key={route.id} className="hover:border-emerald-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden border-slate-150">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                                        <span>{route.fromDestination.name}</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                        <span>{route.toDestination.name}</span>
                                    </div>
                                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-blue-500 hover:bg-blue-50 h-7 w-7 rounded-md" 
                                            onClick={() => handleEdit(route)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-rose-500 hover:bg-rose-50 h-7 w-7 rounded-md" 
                                            onClick={() => handleDelete(route.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs hover:bg-emerald-50 transition-colors">
                                        <span className="font-extrabold text-emerald-800">سعر تذكرة (ذهاب)</span>
                                        <span className="font-black text-emerald-700 text-sm">{route.price} {route.currency === "SAR" ? "ر.س" : "ر.ي"}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs hover:bg-blue-50 transition-colors">
                                        <span className="font-extrabold text-blue-800">سعر تذكرة (عودة)</span>
                                        <span className="font-black text-blue-700 text-sm">{route.priceRoundTrip || "-"} {route.priceRoundTrip ? (route.currency === "SAR" ? "ر.س" : "ر.ي") : ""}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 border-dashed text-[11px] text-slate-500 font-medium">
                                <div>
                                    تكلفتنا (ذهاب): <span className="font-extrabold text-slate-700">{route.cost} {route.currency === "SAR" ? "ر.س" : "ر.ي"}</span>
                                </div>
                                <div className="border-r pr-2">
                                    تكلفتنا (عودة): <span className="font-extrabold text-slate-700">{route.costRoundTrip} {route.currency === "SAR" ? "ر.س" : "ر.ي"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog For Adding/Editing Route Pricing */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md rounded-3xl text-right" dir="rtl">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-extrabold text-slate-800">تعديل وتسعير مسار الرحلة</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-slate-700">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">من (المغادرة)</label>
                                <Select 
                                    value={formData.fromId} 
                                    onValueChange={v => setFormData({ ...formData, fromId: v })}
                                >
                                    <SelectTrigger className="rounded-lg h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} {d.nameEn ? `(${d.nameEn})` : ''}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">إلى (الوصول)</label>
                                <Select 
                                    value={formData.toId} 
                                    onValueChange={v => setFormData({ ...formData, toId: v })}
                                >
                                    <SelectTrigger className="rounded-lg h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} {d.nameEn ? `(${d.nameEn})` : ''}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">عملة التسعير</label>
                                <Select 
                                    value={formData.currency} 
                                    onValueChange={v => setFormData({ ...formData, currency: v })}
                                >
                                    <SelectTrigger className="rounded-lg h-9"><SelectValue placeholder="اختر العملة" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="YER">🇾🇪 ريال يمني (YER)</SelectItem>
                                        <SelectItem value="SAR">🇸🇦 ريال سعودي (SAR)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold text-emerald-700">سعر البيع (ذهاب) *</label>
                                <Input 
                                    type="number" 
                                    value={formData.price} 
                                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                                    placeholder="0.00" 
                                    className="rounded-lg h-9 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold text-blue-700">سعر البيع (ذهاب وعودة)</label>
                                <Input 
                                    type="number" 
                                    value={formData.priceRoundTrip} 
                                    onChange={e => setFormData({ ...formData, priceRoundTrip: e.target.value })} 
                                    placeholder="0.00" 
                                    className="rounded-lg h-9 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">التكلفة التشغيلية (ذهاب)</label>
                                <Input 
                                    type="number" 
                                    value={formData.cost} 
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })} 
                                    placeholder="0.00" 
                                    className="rounded-lg h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">التكلفة التشغيلية (عودة)</label>
                                <Input 
                                    type="number" 
                                    value={formData.costRoundTrip} 
                                    onChange={e => setFormData({ ...formData, costRoundTrip: e.target.value })} 
                                    placeholder="0.00" 
                                    className="rounded-lg h-9"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3">
                        <Button 
                            onClick={handleSave} 
                            disabled={loading} 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 font-bold transition-all"
                        >
                            تأكيد وحفظ أسعار المسار
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
