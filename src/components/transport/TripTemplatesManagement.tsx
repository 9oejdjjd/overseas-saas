"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Settings, Users, Bus, Zap } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useTripTemplates } from "@/hooks/transport/useTripTemplates";

export function TripTemplatesManagement() {
    const {
        templates,
        routes,
        drivers,
        vehicles,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        formData,
        generateTrips,
        openCreate,
        openEdit,
        deleteTemplate,
        handleSave,
        updateForm,
        translateRule
    } = useTripTemplates();

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Header controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-gradient-to-r from-amber-50/50 to-indigo-50/30 p-6 rounded-2xl border border-amber-100/60 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-100">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">قوالب الجدولة التلقائية للرحلات</h2>
                        <p className="text-sm text-slate-500 mt-0.5">صياغة وتوليد الرحلات اليومية أو الأسبوعية تلقائياً للمستقبل دون الحاجة لإدخالها يدوياً</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                    <Button 
                        onClick={generateTrips} 
                        disabled={loading} 
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex-1 sm:flex-initial"
                    >
                        <Zap className="h-4 w-4 ml-1 animate-bounce" />
                        توليد الرحلات تلقائياً (14 يوماً)
                    </Button>
                    <Button 
                        onClick={openCreate} 
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex-1 sm:flex-initial"
                    >
                        <Plus className="h-5 w-5" />
                        إضافة قالب جديد
                    </Button>
                </div>
            </div>

            {/* List Templates Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-450 border border-slate-100 rounded-2xl bg-white shadow-sm font-medium">جاري تحميل قوالب الجدولة...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-slate-100 border-dashed rounded-2xl bg-white shadow-sm text-sm">
                    لا توجد قوالب جدولة حالياً. قم بإضافة قالب لتوليد الرحلات تلقائياً.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmp => (
                        <div key={tmp.id} className="border border-slate-150 rounded-2xl bg-white shadow-sm p-5 relative hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-800 mb-1">{tmp.name || tmp.route.name}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-100/50">
                                            {translateRule(tmp.recurrenceRule)}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => openEdit(tmp)} 
                                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-md"
                                        >
                                            <Settings className="h-4 w-4"/>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => deleteTemplate(tmp.id)} 
                                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-md"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2.5 text-xs mt-4 text-slate-600 border-t pt-3">
                                    <p className="flex justify-between">
                                        <span className="font-bold text-slate-500">مسار الحافلة:</span> 
                                        <span className="text-slate-700 font-extrabold">{tmp.route.name}</span>
                                    </p>
                                    <p className="flex justify-between items-center">
                                        <span className="font-bold text-slate-500">وقت المغادرة:</span> 
                                        <span className="text-base font-black text-indigo-700 dir-ltr inline-block">{tmp.departureTime}</span>
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-dashed border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-50 p-2 rounded-xl">
                                            <Users className="h-4 w-4 text-indigo-500"/> 
                                            <span>{tmp.defaultCapacity} مقعد</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-50 p-2 rounded-xl">
                                            <Bus className="h-4 w-4 text-indigo-500"/> 
                                            <span>{tmp.busClass === 'STANDARD' ? 'عادي' : 'VIP'}</span>
                                        </div>
                                    </div>

                                    {(tmp.defaultDriver || tmp.defaultVehicle) && (
                                        <div className="mt-3 pt-3 border-t border-slate-100/60 text-[10px] text-slate-500 space-y-1 bg-slate-50/30 p-2.5 rounded-xl font-medium">
                                            {tmp.defaultDriver && <p>الكابتن الافتراضي: {tmp.defaultDriver.name}</p>}
                                            {tmp.defaultVehicle && <p>المركبة الافتراضية: {tmp.defaultVehicle.plateNumber} ({tmp.defaultVehicle.model})</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Creation and Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full overflow-y-auto rounded-r-3xl text-right">
                    <SheetHeader className="border-b pb-4 mb-6">
                        <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-600" />
                            {editMode ? "تعديل قالب الجدولة" : "إضافة قالب جدولة جديد"}
                        </SheetTitle>
                        <SheetDescription className="text-sm text-slate-500">
                            سيتم استخدام هذا القالب كمرجع زمني لتوليد الرحلات تلقائياً للتواريخ المستقبلية.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5 py-2 text-slate-700">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">اسم القالب التعريفي (اختياري)</label>
                            <Input 
                                value={formData.name} 
                                onChange={e => updateForm('name', e.target.value)} 
                                placeholder="مثال: رحلة صباحية - حافلة VIP" 
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">خط السير الأساسي لقالب الجدولة *</label>
                            <Select value={formData.routeId} onValueChange={v => updateForm('routeId', v)}>
                                <SelectTrigger className="border-slate-200 rounded-lg">
                                    <SelectValue placeholder="اختر الخط الأساسي..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">قاعدة تكرار التوليد *</label>
                                <Select value={formData.recurrenceRule} onValueChange={v => updateForm('recurrenceRule', v)}>
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">يومياً</SelectItem>
                                        <SelectItem value="WEEKDAYS">أيام العمل</SelectItem>
                                        <SelectItem value="WEEKENDS">عطلة نهاية الأسبوع</SelectItem>
                                        <SelectItem value="WEEKLY_FRI">كل جمعة فقط</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">وقت المغادرة للمسار *</label>
                                <Input type="time" value={formData.departureTime} onChange={e => updateForm('departureTime', e.target.value)} className="rounded-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">تاريخ بدء تفعيل القالب مغادرة *</label>
                                <Input type="date" value={formData.startDate} onChange={e => updateForm('startDate', e.target.value)} className="rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">تاريخ انتهاء القالب (اختياري)</label>
                                <Input type="date" value={formData.endDate} onChange={e => updateForm('endDate', e.target.value)} className="rounded-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">المركبة الافتراضية للرحلة</label>
                                <Select value={formData.defaultVehicleId} onValueChange={v => updateForm('defaultVehicleId', v)}>
                                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="بدون تحديد" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- بدون تحديد حافلة --</SelectItem>
                                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.model} ({v.plateNumber})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">كابتن الحافلة الافتراضي</label>
                                <Select value={formData.defaultDriverId} onValueChange={v => updateForm('defaultDriverId', v)}>
                                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="بدون تحديد" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- بدون تحديد سائق --</SelectItem>
                                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">السعة الافتراضية للركاب</label>
                                <Input type="number" min={1} value={formData.defaultCapacity} onChange={e => updateForm('defaultCapacity', parseInt(e.target.value) || 50)} className="rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">درجة الخدمة التشغيلية</label>
                                <Select value={formData.busClass} onValueChange={v => updateForm('busClass', v)}>
                                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">حافلة عادية (Standard)</SelectItem>
                                        <SelectItem value="VIP">حافلة ممتازة (VIP)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>

                    <SheetFooter className="border-t pt-4 mt-6">
                        <Button 
                            onClick={handleSave} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-bold transition-all hover:scale-[1.01]"
                        >
                            {editMode ? "حفظ التعديلات الطارئة بالقالب" : "تأكيد وإنشاء القالب"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
