
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Save, Settings, X } from "lucide-react";
import { ManageCentersDialog } from "@/components/pricing/ManageCentersDialog";

type Location = {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    locationUrl: string | null;
    isActive: boolean;
    examCenters?: any[];
};

export function LocationsManagement() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/locations");
            if (res.ok) setLocations(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchLocations(); }, []);

    const handleAdd = async () => {
        if (!newName) return;

        try {
            if (editingId) {
                // Update existing
                await fetch(`/api/locations/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name: newName, code: newCode }),
                });
            } else {
                // Create new
                await fetch("/api/locations", {
                    method: "POST",
                    body: JSON.stringify({ name: newName, code: newCode }),
                });
            }

            setNewName("");
            setNewCode("");
            setEditingId(null);
            fetchLocations();
        } catch (e) { alert("حدث خطأ"); }
    };

    const handleEdit = (loc: Location) => {
        setEditingId(loc.id);
        setNewName(loc.name);
        setNewCode(loc.code || "");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewName("");
        setNewCode("");
    };

    const toggleActive = async (loc: Location) => {
        await fetch(`/api/locations/${loc.id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: !loc.isActive }),
        });
        fetchLocations();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>مراكز الاختبار والمدن</CardTitle>
                <CardDescription>إدارة المدن والمراكز المتاحة للتسجيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                    <div className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">اسم المركز (مثال: مأرب)</label>
                            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المركز" />
                        </div>
                        <div className="space-y-2 w-32">
                            <label className="text-sm font-medium">الكود (اختياري)</label>
                            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="MRB" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        {editingId && (
                            <Button onClick={handleCancelEdit} variant="outline" className="text-gray-500">
                                <X className="h-4 w-4 ml-1" /> إلغاء
                            </Button>
                        )}
                        <Button onClick={handleAdd} className={`${editingId ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"} text-white px-8`}>
                            {editingId ? <Save className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                            {editingId ? "حفظ التعديلات" : "إضافة المدينة"}
                        </Button>
                    </div>
                </div>

                <div className="border rounded-md">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">الاسم</th>
                                <th className="px-4 py-3 font-medium text-gray-700">الكود</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">المراكز</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">تعديل</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {locations.map(loc => (
                                <tr key={loc.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{loc.name}</td>
                                    <td className="px-4 py-3 font-mono text-gray-500">{loc.code || "-"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <ManageCentersDialog location={loc} onUpdate={fetchLocations} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleEdit(loc)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors">
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggleActive(loc)} className={`px-2 py-1 rounded text-xs font-bold ${loc.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {loc.isActive ? "نشط" : "غير نشط"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && !loading && <tr><td colSpan={6} className="p-4 text-center text-gray-500">لا توجد مواقع</td></tr>}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
