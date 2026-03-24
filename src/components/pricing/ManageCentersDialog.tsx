"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, MapPin, ExternalLink, Save, X, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type ExamCenter = {
    id: string;
    name: string;
    address: string | null;
    locationUrl: string | null;
    isActive: boolean;
};

type Location = {
    id: string;
    name: string;
    examCenters?: ExamCenter[];
};

export function ManageCentersDialog({ location, onUpdate }: { location: Location, onUpdate: () => void }) {
    const [centers, setCenters] = useState<ExamCenter[]>(location.examCenters || []);
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Update local state when prop changes
    useEffect(() => {
        setCenters(location.examCenters || []);
    }, [location.examCenters]);

    const handleAdd = async () => {
        if (!newName) return;

        try {
            if (editingId) {
                // Update
                const res = await fetch(`/api/pricing/centers/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, address: newAddress, locationUrl: newUrl }),
                });
                if (res.ok) {
                    onUpdate(); // Trigger parent refresh
                    resetForm();
                }
            } else {
                // Create
                const res = await fetch(`/api/locations/${location.id}/centers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, address: newAddress, locationUrl: newUrl }),
                });
                if (res.ok) {
                    onUpdate(); // Trigger parent refresh
                    resetForm();
                }
            }
        } catch (e) {
            console.error(e);
            alert("حدث خطأ");
        }
    };

    const handleEdit = (center: ExamCenter) => {
        setEditingId(center.id);
        setNewName(center.name);
        setNewAddress(center.address || "");
        setNewUrl(center.locationUrl || "");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المركز؟")) return;
        try {
            const res = await fetch(`/api/pricing/centers/${id}`, { method: "DELETE" });
            if (res.ok) onUpdate();
            else {
                const data = await res.json();
                alert(data.error || "فشل الحذف");
            }
        } catch (e) { alert("حدث خطأ"); }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewName("");
        setNewAddress("");
        setNewUrl("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    إدارة المراكز ({centers.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>مراكز الاختبار - {location.name}</DialogTitle>
                    <DialogDescription>إضافة وتعديل المراكز التابعة لمدينة {location.name}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Form */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم المركز</Label>
                                <Input
                                    placeholder="مثال: جامعة تعز"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>العنوان النصي</Label>
                                <Input
                                    placeholder="وصف الموقع..."
                                    value={newAddress}
                                    onChange={e => setNewAddress(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>رابط الخريطة (URL)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://maps.google.com/..."
                                        dir="ltr"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                    />
                                    {editingId ? (
                                        <Button onClick={resetForm} variant="ghost" size="icon">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                    <Button onClick={handleAdd} className="w-32 gap-2">
                                        {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {editingId ? "حفظ" : "إضافة"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-right">اسم المركز</TableHead>
                                    <TableHead className="text-right">العنوان</TableHead>
                                    <TableHead className="text-center w-[100px]">الخريطة</TableHead>
                                    <TableHead className="text-center w-[150px]">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {centers.map(center => (
                                    <TableRow key={center.id}>
                                        <TableCell className="font-medium">{center.name}</TableCell>
                                        <TableCell className="text-gray-500 text-sm">{center.address || "-"}</TableCell>
                                        <TableCell className="text-center">
                                            {center.locationUrl ? (
                                                <a href={center.locationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(center)}>
                                                    تعديل
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(center.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {centers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                            لا توجد مراكز مضافة لهذه المدينة
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
