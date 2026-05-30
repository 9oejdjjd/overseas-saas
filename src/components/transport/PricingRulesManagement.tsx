"use client";

import { Plus, Trash2, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { usePricingRules, PricingPassengerType, PricingTripType, PricingBusClass, PricingActionType } from "@/hooks/transport/usePricingRules";

export function PricingRulesManagement() {
    const {
        rules,
        destinations,
        loading,
        showDialog,
        setShowDialog,
        formData,
        setFormData,
        handleCreate,
        handleDelete,
        getDestinationName,
        translateAction,
        openCreate
    } = usePricingRules();

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100/60 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">قواعد وتخفيضات الأسعار الديناميكية</h2>
                        <p className="text-sm text-slate-500 mt-0.5">صياغة قواعد الخصم أو الزيادة التلقائية بناءً على تصنيف الراكب أو نوع السفر أو فئة الباص</p>
                    </div>
                </div>
                <Button 
                    onClick={openCreate} 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-5 w-5" />
                    إضافة قاعدة جديدة
                </Button>
            </div>

            {/* List Pricing Rules */}
            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="hover:border-blue-300 transition-all duration-300 rounded-2xl overflow-hidden border-slate-150">
                        <CardContent className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={rule.priority > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}>
                                        الأولوية: {rule.priority}
                                    </Badge>
                                    <span className="font-extrabold text-base text-slate-800">{rule.name}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap gap-2.5 items-center">
                                    <span className="font-bold">المسار:</span>
                                    <span className="text-slate-700 font-extrabold">{getDestinationName(rule.routeFromId)}</span>
                                    <ArrowRight className="h-3 w-3 text-slate-450" />
                                    <span className="text-slate-700 font-extrabold">{getDestinationName(rule.routeToId)}</span>
                                    
                                    {rule.passengerType && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-100 text-[10px] font-bold">
                                            {rule.passengerType === 'ADULT' ? 'بالغ' : rule.passengerType === 'CHILD' ? 'طفل' : 'رضيع'}
                                        </Badge>
                                    )}
                                    {rule.tripType && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[10px] font-bold">
                                            {rule.tripType === 'ROUND_TRIP' ? 'ذهاب وعودة' : 'ذهاب فقط'}
                                        </Badge>
                                    )}
                                    {rule.busClass && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold">
                                            {rule.busClass === 'STANDARD' ? 'عادي' : 'VIP'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 border-dashed">
                                <div className="font-black text-emerald-700 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-150 text-xs">
                                    {translateAction(rule.actionType, Number(rule.amount))}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9" 
                                    onClick={() => handleDelete(rule.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {rules.length === 0 && (
                    <div className="text-center py-16 text-slate-400 border border-slate-100 border-dashed rounded-2xl bg-white shadow-sm text-sm">
                        لا توجد قواعد تسعير ديناميكية مضافة حالياً.
                    </div>
                )}
            </div>

            {/* Creation Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl rounded-3xl text-right" dir="rtl">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-extrabold text-slate-800">إضافة قاعدة تسعير وتخفيض جديدة</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-slate-700">
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-slate-600">اسم وقالب القاعدة *</label>
                            <Input 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                placeholder="مثلاً: خصم الأطفال لرحلات صيف 2026" 
                                className="rounded-lg focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">الأولوية للتطبيق (0 = افتراضي، 1+ = قواعد إضافية)</label>
                            <Input 
                                type="number" 
                                value={formData.priority} 
                                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} 
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">نوع الإجراء المطبق *</label>
                            <Select 
                                value={formData.actionType} 
                                onValueChange={(v: PricingActionType) => setFormData({ ...formData, actionType: v })}
                            >
                                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED_PRICE">سعر أساسي ثابت (FIXED_PRICE)</SelectItem>
                                    <SelectItem value="PERCENTAGE_DISCOUNT">خصم مئوي % (PERCENTAGE_DISCOUNT)</SelectItem>
                                    <SelectItem value="PERCENTAGE_MARKUP">زيادة مئوية % (PERCENTAGE_MARKUP)</SelectItem>
                                    <SelectItem value="FIXED_DISCOUNT">خصم مبلغ ثابت (ريال)</SelectItem>
                                    <SelectItem value="FIXED_MARKUP">زيادة مبلغ ثابت (ريال)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">القيمة المالية (المبلغ أو النسبة) *</label>
                            <Input 
                                type="number" 
                                value={formData.amount} 
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                                className="rounded-lg font-bold text-slate-800"
                            />
                        </div>

                        <div className="sm:col-span-2 border-t border-slate-100 pt-3 mt-2">
                            <h3 className="font-extrabold text-xs text-slate-500">الشروط ونطاق تطبيق القاعدة</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">من (مدينة المغادرة)</label>
                            <Select value={formData.routeFromId} onValueChange={v => setFormData({ ...formData, routeFromId: v })}>
                                <SelectTrigger className="rounded-lg"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل (جميع المحطات)</SelectItem>
                                    {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">إلى (مدينة الوصول)</label>
                            <Select value={formData.routeToId} onValueChange={v => setFormData({ ...formData, routeToId: v })}>
                                <SelectTrigger className="rounded-lg"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل (جميع المحطات)</SelectItem>
                                    {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">نوع وتصنيف المسافر</label>
                            <Select 
                                value={formData.passengerType} 
                                onValueChange={(v: PricingPassengerType) => setFormData({ ...formData, passengerType: v })}
                            >
                                <SelectTrigger className="rounded-lg"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل (جميع الفئات)</SelectItem>
                                    <SelectItem value="ADULT">بالغ (Adult)</SelectItem>
                                    <SelectItem value="CHILD">طفل (Child)</SelectItem>
                                    <SelectItem value="INFANT">رضيع (Infant)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">نوع تذكرة الطيران/الحافلة</label>
                            <Select 
                                value={formData.tripType} 
                                onValueChange={(v: PricingTripType) => setFormData({ ...formData, tripType: v })}
                            >
                                <SelectTrigger className="rounded-lg"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل (ذهاب وعودة)</SelectItem>
                                    <SelectItem value="ONE_WAY">ذهاب فقط (ONE_WAY)</SelectItem>
                                    <SelectItem value="ROUND_TRIP">ذهاب وعودة (ROUND_TRIP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">درجة وفئة الحافلة</label>
                            <Select 
                                value={formData.busClass} 
                                onValueChange={(v: PricingBusClass) => setFormData({ ...formData, busClass: v })}
                            >
                                <SelectTrigger className="rounded-lg"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">الكل (عادي وممتاز)</SelectItem>
                                    <SelectItem value="STANDARD">حافلة عادية (Standard)</SelectItem>
                                    <SelectItem value="VIP">حافلة ممتازة (VIP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3">
                        <Button 
                            onClick={handleCreate} 
                            disabled={loading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold transition-all"
                        >
                            تأكيد وحفظ القاعدة الديناميكية
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
