"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Save, Settings, X, MapPin } from "lucide-react";
import { ManageCentersDialog } from "@/components/pricing/ManageCentersDialog";
import { useLocationsManagement } from "@/hooks/pricing/useLocationsManagement";

export function LocationsManagement() {
    const {
        locations,
        newName,
        setNewName,
        newCode,
        setNewCode,
        loading,
        editingId,
        handleAdd,
        handleEdit,
        handleCancelEdit,
        toggleActive,
        fetchLocations
    } = useLocationsManagement();

    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden text-right" dir="rtl">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">مراكز الاختبار والمدن</CardTitle>
                        <CardDescription className="text-sm text-slate-500 mt-1">إضافة وإدارة المدن الجغرافية ومراكز الاختبار المتاحة للتسجيل</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Cities Add/Edit Form Panel */}
                <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-slate-650">اسم المدينة / المركز *</label>
                            <Input 
                                value={newName} 
                                onChange={e => setNewName(e.target.value)} 
                                placeholder="مثال: صنعاء، عدن، تعز" 
                                className="rounded-xl border-slate-200 focus:ring-blue-500 bg-white h-10 text-xs"
                                onKeyDown={e => e.key === "Enter" && handleAdd()}
                            />
                        </div>
                        <div className="space-y-1.5 w-full sm:w-32">
                            <label className="text-xs font-bold text-slate-650">الكود الرمزي (اختياري)</label>
                            <Input 
                                value={newCode} 
                                onChange={e => setNewCode(e.target.value)} 
                                placeholder="مثال: SAN" 
                                className="rounded-xl border-slate-200 focus:ring-blue-500 bg-white h-10 text-xs font-bold text-center"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        {editingId && (
                            <Button 
                                onClick={handleCancelEdit} 
                                variant="outline" 
                                className="text-slate-500 rounded-xl px-5 h-10 text-xs font-bold border-slate-200 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4 ml-1" /> إلغاء
                            </Button>
                        )}
                        <Button 
                            onClick={handleAdd} 
                            className={`rounded-xl px-8 h-10 text-xs font-bold text-white transition-all ${
                                editingId ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
                            }`}
                        >
                            {editingId ? <Save className="h-4 w-4 ml-1.5" /> : <Plus className="h-4 w-4 ml-1.5" />}
                            {editingId ? "حفظ التعديلات" : "إضافة المدينة الجغرافية"}
                        </Button>
                    </div>
                </div>

                {/* Cities Table */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                            <thead className="bg-slate-50/70 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5 font-bold text-slate-700">المدينة</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700">رمز المطار / الكود</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">مراكز الاختبار الفرعية</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center no-print">إعداد</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-700 text-center">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locations.map(loc => (
                                    <tr key={loc.id} className="hover:bg-blue-50/10 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{loc.name}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">{loc.code || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <ManageCentersDialog location={loc} onUpdate={fetchLocations} />
                                        </td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleEdit(loc)} 
                                                className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0 rounded-lg"
                                            >
                                                <Settings className="h-4.5 w-4.5" />
                                            </Button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleActive(loc)} 
                                                className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                                    loc.isActive 
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                                                        : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                                                }`}
                                            >
                                                {loc.isActive ? "نشط" : "غير نشط"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {locations.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا توجد مواقع أو مدن مضافة حالياً.</td>
                                    </tr>
                                )}
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">جاري تحميل البيانات...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
