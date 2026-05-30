"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Repeat, Plus, Trash2, Bus } from "lucide-react";
import { TripsDataTable } from "./table/TripsDataTable";
import { columns } from "./table/columns";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useScheduleManagement } from "@/hooks/transport/useScheduleManagement";

export function ScheduleManagement() {
    const {
        trips,
        destinations,
        templates,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        fromId,
        setFromId,
        toId,
        setToId,
        templateId,
        setTemplateId,
        date,
        setDate,
        time,
        setTime,
        arrivalDate,
        setArrivalDate,
        arrivalTime,
        setArrivalTime,
        capacity,
        setCapacity,
        daysToRepeat,
        setDaysToRepeat,
        busNumber,
        setBusNumber,
        driverName,
        setDriverName,
        status,
        setStatus,
        stops,
        handleAddStop,
        handleUpdateStop,
        handleRemoveStop,
        handleSave,
        openCreate,
    } = useScheduleManagement();

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Elegant Premium Glassmorphic Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-blue-50/60 to-indigo-50/60 backdrop-blur-md p-6 rounded-2xl border border-blue-100 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-200 animate-in zoom-in duration-300">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">مخطط وجدول الرحلات</h2>
                        <p className="text-sm text-slate-500 mt-0.5">شاشة متابعة وتسيير الرحلات اليومية والاستثنائية</p>
                    </div>
                </div>
                <Button 
                    onClick={openCreate} 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="h-5 w-5" />
                    إضافة رحلة استثنائية
                </Button>
            </div>

            {/* Trips List Table */}
            <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
                <TripsDataTable
                    columns={columns}
                    data={trips}
                    loading={loading}
                    onFiltersChange={() => { }}
                />
            </div>

            {/* Scheduling Sheet Sidebar */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full overflow-y-auto border-r border-slate-100 rounded-r-3xl text-right">
                    <SheetHeader className="border-b pb-4 mb-6">
                        <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Bus className="h-5 w-5 text-blue-600" />
                            {editMode ? "تعديل بيانات الرحلة" : "جدولة رحلة جديدة"}
                        </SheetTitle>
                        <SheetDescription className="text-sm text-slate-500">
                            {editMode ? "قم بتعديل بيانات الرحلة والمحطات المحددة" : "قم بتعبئة الحقول لتوليد وجدولة رحلة جديدة بنجاح"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-2">
                        {/* Saved Templates Selection */}
                        {!editMode && (
                            <div className="space-y-2 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/60">
                                <label className="text-xs font-bold text-slate-700 block mb-1">اختر قالب الجدولة (توليد تلقائي)</label>
                                <Select value={templateId} onValueChange={setTemplateId}>
                                    <SelectTrigger className="bg-white rounded-lg border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="اختر قالباً لملء البيانات..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(rt => (
                                            <SelectItem key={rt.id} value={rt.id}>
                                                {rt.name || rt.route.name} ({rt.departureTime}) - {rt.busClass}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Main Route */}
                        {(editMode || !templateId) && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">مدينة الانطلاق *</label>
                                    <Select value={fromId} onValueChange={setFromId} disabled={editMode}>
                                        <SelectTrigger className="rounded-lg border-slate-200">
                                            <SelectValue placeholder="مدينة الانطلاق" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">الوجهة النهائية *</label>
                                    <Select value={toId} onValueChange={setToId} disabled={editMode}>
                                        <SelectTrigger className="rounded-lg border-slate-200">
                                            <SelectValue placeholder="مدينة الوصول" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">تاريخ المغادرة *</label>
                                <Input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">{templateId ? "وقت المغادرة (اختياري)" : "وقت المغادرة *"}</label>
                                <Input 
                                    type="time" 
                                    value={time} 
                                    onChange={e => setTime(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">تاريخ الوصول المتوقع</label>
                                <Input 
                                    type="date" 
                                    value={arrivalDate} 
                                    onChange={e => setArrivalDate(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">وقت الوصول المتوقع</label>
                                <Input 
                                    type="time" 
                                    value={arrivalTime} 
                                    onChange={e => setArrivalTime(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">عدد مقاعد الباص الافتراضية</label>
                                <Input 
                                    type="number" 
                                    value={capacity} 
                                    onChange={e => setCapacity(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                        </div>

                        {/* Stops Section */}
                        {(editMode || !templateId) && (
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-extrabold text-slate-700">المحطات ونقاط التوقف الوسيطة</label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg" 
                                        onClick={handleAddStop}
                                    >
                                        <Plus className="h-3.5 w-3.5 ml-1" /> إضافة محطة
                                    </Button>
                                </div>
                                
                                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                    {stops.map((stop, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60 relative hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">محطة وسيطة {idx + 1}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md" 
                                                    onClick={() => handleRemoveStop(idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <Select value={stop.destinationId} onValueChange={v => handleUpdateStop(idx, 'destinationId', v)}>
                                                    <SelectTrigger className="h-9 text-xs flex-1 rounded-lg bg-white border-slate-200"><SelectValue placeholder="المحطة" /></SelectTrigger>
                                                    <SelectContent>
                                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="date"
                                                    className="h-9 text-xs w-[110px] rounded-lg bg-white border-slate-200"
                                                    value={stop.departureDate}
                                                    onChange={e => handleUpdateStop(idx, 'departureDate', e.target.value)}
                                                />
                                                <Input
                                                    type="time"
                                                    className="h-9 text-xs w-[75px] rounded-lg bg-white border-slate-200"
                                                    value={stop.departureTime}
                                                    onChange={e => handleUpdateStop(idx, 'departureTime', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    className="h-9 text-xs w-[65px] rounded-lg bg-white border-slate-200"
                                                    placeholder="السعر"
                                                    value={stop.price}
                                                    onChange={e => handleUpdateStop(idx, 'price', e.target.value)}
                                                />
                                            </div>
                                            <div className="mt-1">
                                                <Input
                                                    type="text"
                                                    className="h-9 text-xs w-full bg-white rounded-lg border-slate-200"
                                                    placeholder="نقطة التجمع / عنوان التوقف"
                                                    value={stop.boardingPoint || ""}
                                                    onChange={e => handleUpdateStop(idx, 'boardingPoint', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {stops.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-3">لا توجد محطات توقف وسيطة حالياً</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recurrence Rule */}
                        {!editMode && (
                            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                                    <Repeat className="h-4 w-4" /> تكرار الجدولة الذاتي
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Input 
                                        type="number" 
                                        className="h-9 bg-white rounded-lg border-slate-200 text-center font-bold w-20" 
                                        value={daysToRepeat} 
                                        onChange={e => setDaysToRepeat(e.target.value)} 
                                        min={1} 
                                        max={365} 
                                    />
                                    <span className="text-xs text-blue-800 font-medium">أيام متتالية للمستقبل بنفس التوقيت</span>
                                </div>
                            </div>
                        )}

                        {/* Drivers / Vehicle info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">رقم لوحة الباص (المركبة)</label>
                                <Input 
                                    placeholder="مثال: 104" 
                                    value={busNumber} 
                                    onChange={e => setBusNumber(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">اسم الكابتن (السائق)</label>
                                <Input 
                                    placeholder="مثال: محمد علي" 
                                    value={driverName} 
                                    onChange={e => setDriverName(e.target.value)} 
                                    className="rounded-lg border-slate-200 focus:ring-blue-500" 
                                />
                            </div>
                        </div>

                        {/* Trip Status on Edit Mode */}
                        {editMode && (
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <label className="text-xs font-bold text-rose-600">حالة الرحلة الحالية</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="border-rose-100 focus:ring-rose-500 rounded-lg text-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHEDULED">مجدولة (نشطة)</SelectItem>
                                        <SelectItem value="CANCELLED">ملغاة (CANCELLED)</SelectItem>
                                        <SelectItem value="DEPARTED">غادرت (DEPARTED)</SelectItem>
                                        <SelectItem value="COMPLETED">مكتملة (COMPLETED)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <SheetFooter className="border-t pt-4 mt-6">
                        <Button 
                            onClick={handleSave} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold transition-all hover:scale-[1.01]"
                        >
                            {editMode ? "حفظ التعديلات الطارئة" : "تأكيد وجدولة الرحلة"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
