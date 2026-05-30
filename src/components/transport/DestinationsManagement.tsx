"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MapPin } from "lucide-react";
import { useDestinationsManagement } from "@/hooks/transport/useDestinationsManagement";

export function DestinationsManagement() {
    const {
        destinations,
        newName,
        setNewName,
        loading,
        handleAdd,
        handleDelete
    } = useDestinationsManagement();

    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden text-right" dir="rtl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">الوجهات الجغرافية (المدن والمحافظات)</CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">أضف المدن والوجهات الأساسية التي تسير إليها الرحلات البرية ومحطات الانطلاق</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input 
                        placeholder="اسم المدينة بالكامل (مثال: صنعاء، عدن، تعز)" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        className="rounded-xl border-slate-200 focus:ring-blue-500"
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                    />
                    <Button 
                        onClick={handleAdd} 
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold transition-all hover:scale-[1.01]"
                    >
                        <Plus className="h-4 w-4 ml-1" /> إضافة الوجهة
                    </Button>
                </div>
                
                <div className="border border-slate-100 rounded-xl divide-y overflow-hidden bg-white shadow-inner max-h-[400px] overflow-y-auto pr-1">
                    {destinations.map(d => (
                        <div key={d.id} className="p-4 flex justify-between items-center hover:bg-blue-50/20 transition-all">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                <span className="font-bold text-slate-700 text-sm">{d.name}</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2 h-8 w-8"
                                onClick={() => handleDelete(d.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {destinations.length === 0 && !loading && (
                        <div className="p-8 text-center text-slate-400 text-xs">لا توجد وجهات جغرافية مضافة حالياً. ابدأ بإضافة مدينة جديدة أعلاه.</div>
                    )}
                    {loading && (
                        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل المدن والوجهات...</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
