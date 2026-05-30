"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, MapPin, ExternalLink, Save, X, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useManageCenters, ExamCenter } from "@/hooks/pricing/useManageCenters";

interface Location {
    id: string;
    name: string;
    examCenters?: ExamCenter[];
}

export function ManageCentersDialog({ location, onUpdate }: { location: Location, onUpdate: () => void }) {
    const {
        centers,
        isOpen,
        setIsOpen,
        newName,
        setNewName,
        newAddress,
        setNewAddress,
        newUrl,
        setNewUrl,
        editingId,
        handleAdd,
        handleEdit,
        handleDelete,
        resetForm
    } = useManageCenters(location, onUpdate);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors h-8"
                >
                    <Building2 className="h-3.5 w-3.5" />
                    إدارة المراكز ({centers.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-3xl text-right" dir="rtl">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        مراكز الاختبار - {location.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        أضف وحدث مراكز وقاعات الاختبار المتاحة للمتقدمين التابعة لمدينة {location.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2 text-slate-700">
                    {/* Add Center Form */}
                    <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">اسم قاعة / مركز الاختبار *</Label>
                                <Input
                                    placeholder="مثال: كلية الحاسبات بجامعة تعز"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="rounded-lg h-9 text-xs"
                                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">الوصف النصي للعنوان</Label>
                                <Input
                                    placeholder="مثال: الحرم الجامعي، الدور الثاني"
                                    value={newAddress}
                                    onChange={e => setNewAddress(e.target.value)}
                                    className="rounded-lg h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label className="text-xs font-bold text-slate-600">رابط موقع الخريطة الجغرافية (Google Maps URL)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://maps.google.com/..."
                                        dir="ltr"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        className="rounded-lg h-9 text-xs font-mono text-left"
                                    />
                                    {editingId ? (
                                        <Button 
                                            onClick={resetForm} 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-9 w-9 rounded-lg"
                                        >
                                            <X className="h-4.5 w-4.5 text-slate-500" />
                                        </Button>
                                    ) : null}
                                    <Button 
                                        onClick={handleAdd} 
                                        className="w-32 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-xs font-bold shadow shadow-blue-100"
                                    >
                                        {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {editingId ? "حفظ" : "إضافة مركز"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Centers List */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-inner max-h-[300px] overflow-y-auto pr-1">
                        <Table>
                            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="text-right font-bold text-slate-700 text-xs">اسم المركز</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 text-xs">العنوان الجغرافي</TableHead>
                                    <TableHead className="text-center w-[100px] font-bold text-slate-700 text-xs">الخريطة</TableHead>
                                    <TableHead className="text-center w-[150px] font-bold text-slate-700 text-xs">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {centers.map(center => (
                                    <TableRow key={center.id} className="hover:bg-blue-50/10 transition-colors">
                                        <TableCell className="font-extrabold text-slate-800 text-xs">{center.name}</TableCell>
                                        <TableCell className="text-slate-500 text-xs font-medium">{center.address || "-"}</TableCell>
                                        <TableCell className="text-center">
                                            {center.locationUrl ? (
                                                <a 
                                                    href={center.locationUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-105"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 font-bold">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(center)}
                                                    className="h-8 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xs"
                                                >
                                                    تعديل
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-8 px-2.5 font-bold text-xs" 
                                                    onClick={() => handleDelete(center.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {centers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-400 font-bold py-10">
                                            لا توجد مراكز أو قاعات اختبار تابعة لهذه المدينة حالياً
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                
                <DialogFooter className="border-t pt-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl px-6 border-slate-200 font-bold text-xs hover:bg-slate-50"
                    >
                        إغلاق لوحة المراكز
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
