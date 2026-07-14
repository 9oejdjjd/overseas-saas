"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Plus, Trash2, ArrowRightLeft, Route, Clock, ChevronDown } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoutesManagement } from "@/hooks/transport/useRoutesManagement";

export function RoutesManagement() {
    const {
        routes,
        destinations,
        loading,
        isSheetOpen,
        setIsSheetOpen,
        editMode,
        stops,
        originId,
        setOriginId,
        destinationId,
        setDestinationId,
        createReturnRoute,
        setCreateReturnRoute,
        derivedDetails,
        openCreate,
        openEdit,
        deleteRoute,
        handleAddStop,
        handleUpdateStop,
        handleRemoveStop,
        handleSave,
    } = useRoutesManagement();

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-6 rounded-2xl border border-indigo-100/80 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                        <Route className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">إدارة مسارات وخطوط السير</h2>
                        <p className="text-sm text-slate-500 mt-0.5">تعريف الخطوط الأساسية والفرعية ومحطات التجمع ومدة الرحلات</p>
                    </div>
                </div>
                <Button 
                    onClick={openCreate} 
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 px-5 py-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-5 w-5" />
                    إضافة خط جديد
                </Button>
            </div>

            {/* List of Routes */}
            {loading ? (
                <div className="text-center py-12 text-slate-400 border border-slate-100 rounded-2xl bg-white shadow-sm font-medium">
                    جاري تحميل خطوط السير والمحطات...
                </div>
            ) : routes.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-slate-100 border-dashed rounded-2xl bg-white shadow-sm text-sm">
                    لا توجد خطوط سير مضافة حالياً. ابدأ بإضافة خط جديد للجدولة.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map(route => (
                        <div key={route.id} className="border border-slate-150 rounded-2xl bg-white shadow-sm p-5 relative hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-800 mb-1">{route.name}</h3>
                                        {route.code && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/50">
                                                كود: {route.code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => openEdit(route)} 
                                            className="h-7 px-2 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-md"
                                        >
                                            تعديل
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => deleteRoute(route.id)} 
                                            className="h-7 px-2 text-rose-500 hover:bg-rose-50 text-xs font-bold rounded-md"
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                    <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                        <span>مسار الرحلة والمحطات</span>
                                        <span className="bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5 text-[10px] font-black">{route.stops?.length}</span>
                                    </p>
                                    <div className="relative border-r-2 border-indigo-100 space-y-3 mr-1.5 pr-4 pl-0 py-1">
                                        {route.stops?.sort((a,b) => a.orderIndex - b.orderIndex).map((stop, idx) => (
                                            <div key={stop.id || idx} className="relative">
                                                <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -right-[21.5px] top-1.5 ring-4 ring-white shadow-sm shadow-indigo-100"></div>
                                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs hover:bg-slate-100/50 transition-colors">
                                                    <span className="font-bold text-slate-700">{stop.destination?.name || 'محطة غير معروفة'}</span>
                                                    <div className="flex gap-2 text-[10px] text-slate-500 font-bold">
                                                        {idx > 0 && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />+{stop.minutesFromStart} د</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {route.returnRouteId && (
                                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                    <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                                    <span>مرتبط بخط رحلة العودة المقابل</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Editing Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full overflow-y-auto rounded-r-3xl text-right">
                    <SheetHeader className="border-b pb-4 mb-6">
                        <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Map className="h-5 w-5 text-indigo-600" />
                            {editMode ? "تعديل مسار الرحلة" : "إضافة خط سير جديد"}
                        </SheetTitle>
                        <SheetDescription className="text-sm text-slate-500">
                            حدد نقاط الانطلاق والوصول الأساسية، ثم قم بإضافة المحطات ونقاط التجمع بالترتيب الجغرافي.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-2">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">مدينة الانطلاق (البداية) *</label>
                                <Select value={originId} onValueChange={setOriginId}>
                                    <SelectTrigger className="border-slate-200 rounded-lg">
                                        <SelectValue placeholder="اختر الانطلاق" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} {d.nameEn ? `(${d.nameEn})` : ''}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">الوجهة النهائية (الوصول) *</label>
                                <Select value={destinationId} onValueChange={setDestinationId}>
                                    <SelectTrigger className="border-slate-200 rounded-lg">
                                        <SelectValue placeholder="اختر الوجهة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} {d.nameEn ? `(${d.nameEn})` : ''}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {derivedDetails.isComplete && (
                            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
                                <p className="text-xs font-bold text-indigo-900">الاسم التلقائي المعادل لخط السير الجديد:</p>
                                <p className="text-base font-extrabold text-indigo-700">{derivedDetails.name}</p>
                            </div>
                        )}

                        {!editMode && (
                            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <Checkbox 
                                        checked={createReturnRoute} 
                                        onCheckedChange={(c) => setCreateReturnRoute(!!c)} 
                                        className="h-5 w-5 rounded mt-0.5"
                                    />
                                    <div>
                                        <p className="font-bold text-xs text-slate-700">إنشاء خط رحلة العودة تلقائياً (ذهاب وعودة)</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">سيقوم النظام بتوليد خط معاكس بالاتجاه المعاكس وبنفس المحطات تلقائياً لرحلات العودة.</p>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Stops Management */}
                        <div className="border-t border-slate-100 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-700">محطات المسار ونقاط الصعود والنزول</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">أضف محطات التوقف ومحددات الوقت لتقدير مواعيد الوصول للركاب</p>
                                </div>
                                <Button size="sm" onClick={handleAddStop} className="gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-8 text-xs font-bold">
                                    <Plus className="h-3.5 w-3.5 ml-1" /> إضافة محطة وسيطة
                                </Button>
                            </div>

                            {stops.length > 0 && (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                    {stops.map((stop, idx) => (
                                        <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 relative hover:bg-slate-50 transition-colors">
                                            {/* Allow removing intermediate stops only */}
                                            {(idx > 0 && idx < stops.length - 1) && (
                                                <div className="absolute top-4 left-4">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
                                                        onClick={() => handleRemoveStop(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black font-mono">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-xs text-slate-700">
                                                    {idx === 0 ? "محطة الانطلاق الأساسية" : idx === stops.length - 1 ? "محطة الوصول النهائية" : "محطة ترانزيت وسيطة"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500">اختر المدينة</label>
                                                    <Select value={stop.destinationId} onValueChange={v => handleUpdateStop(idx, 'destinationId', v)}>
                                                        <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                                                        <SelectContent>
                                                            {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} {d.nameEn ? `(${d.nameEn})` : ''}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500">نقطة التجمع / عنوان التوقف</label>
                                                    <Input 
                                                        placeholder="شارع/معلم/عنوان المحطة" 
                                                        value={stop.boardingPoint || ""} 
                                                        onChange={e => handleUpdateStop(idx, 'boardingPoint', e.target.value)} 
                                                        className="h-9 rounded-lg"
                                                    />
                                                </div>

                                                {idx > 0 && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500">وقت الوصول (دقيقة من محطة الانطلاق)</label>
                                                            <Input 
                                                                type="number" 
                                                                min={0}
                                                                value={stop.minutesFromStart} 
                                                                onChange={e => handleUpdateStop(idx, 'minutesFromStart', parseInt(e.target.value) || 0)} 
                                                                className="h-9 rounded-lg"
                                                            />
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500">فترة الاستراحة والتوقف (دقائق)</label>
                                                            <Input 
                                                                type="number" 
                                                                min={0}
                                                                value={stop.stopDurationMinutes} 
                                                                onChange={e => handleUpdateStop(idx, 'stopDurationMinutes', parseInt(e.target.value) || 0)} 
                                                                className="h-9 rounded-lg"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex gap-6 mt-3.5 pr-6 text-xs">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox 
                                                        checked={stop.allowBoarding} 
                                                        onCheckedChange={(c) => handleUpdateStop(idx, 'allowBoarding', !!c)} 
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <span className="font-medium text-slate-600 text-xs">يسمح بصعود الركاب من هذه النقطة</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox 
                                                        checked={stop.allowDropoff} 
                                                        onCheckedChange={(c) => handleUpdateStop(idx, 'allowDropoff', !!c)} 
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <span className="font-medium text-slate-600 text-xs">يسمح بنزول الركاب في هذه النقطة</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {stops.length === 0 && (
                                <div className="text-center p-6 bg-slate-50 border border-dashed rounded-xl text-slate-400 text-xs">
                                    يرجى اختيار مدينتي الانطلاق والوصول الأساسية لتهيئة المسار.
                                </div>
                            )}
                        </div>

                    </div>

                    <SheetFooter className="border-t pt-4 mt-6">
                        <Button 
                            onClick={handleSave} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-bold transition-all hover:scale-[1.01]"
                        >
                            {editMode ? "حفظ التعديلات الطارئة" : "حفظ وإنشاء خط السير"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
