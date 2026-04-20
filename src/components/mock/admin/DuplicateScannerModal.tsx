"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, ScanSearch, Loader2, AlertTriangle, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
    professions: any[];
    onSuccess: () => void;
}

const AXIS_OPTIONS = [
    { value: "ALL", label: "🔍 جميع المحاور (فحص شامل)" },
    { value: "HEALTH_SAFETY", label: "الصحة والسلامة في بيئة العمل" },
    { value: "PROFESSION_KNOWLEDGE", label: "المعرفة المهنية التخصصية" },
    { value: "GENERAL_SKILLS", label: "المهارات العامة وجودة التنفيذ" },
    { value: "OCCUPATIONAL_SAFETY", label: "السلامة المهنية والمخاطر" },
    { value: "CORRECT_METHODS", label: "الأساليب الصحيحة والقياسية" },
    { value: "PROFESSIONAL_BEHAVIOR", label: "السلوك الوظيفي والانضباط" },
    { value: "TOOLS_AND_EQUIPMENT", label: "الأدوات والمعدات وتشخيصها" },
    { value: "EMERGENCIES_FIRST_AID", label: "الطوارئ والإسعافات الأولية" }
];

const AXIS_LABELS: Record<string, string> = {
    HEALTH_SAFETY: "الصحة والسلامة",
    PROFESSION_KNOWLEDGE: "المعرفة المهنية",
    GENERAL_SKILLS: "المهارات العامة",
    OCCUPATIONAL_SAFETY: "السلامة المهنية",
    CORRECT_METHODS: "الأساليب الصحيحة",
    PROFESSIONAL_BEHAVIOR: "السلوك المهني",
    TOOLS_AND_EQUIPMENT: "الأدوات والمعدات",
    EMERGENCIES_FIRST_AID: "الطوارئ والإسعافات"
};

export function DuplicateScannerModal({ professions, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [professionId, setProfessionId] = useState("");
    const [searchProfession, setSearchProfession] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [axis, setAxis] = useState("ALL");
    const [isScanning, setIsScanning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleScan = async () => {
        if (!professionId) {
            setError("يرجى اختيار المهنة أولاً");
            return;
        }
        setError("");
        setIsScanning(true);
        setScanResult(null);
        setSelectedIds(new Set());

        try {
            const res = await fetch("/api/mock/admin/questions/scan-duplicates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ professionId, axis })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setScanResult(data);
        } catch (err: any) {
            setError(err.message || "فشل عملية الفحص");
        } finally {
            setIsScanning(false);
        }
    };

    const toggleId = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllDuplicates = () => {
        if (!scanResult) return;
        const allIds = new Set<string>();
        scanResult.duplicateGroups.forEach((g: any) => {
            g.duplicates.forEach((d: any) => allIds.add(d.id));
        });
        setSelectedIds(allIds);
    };

    const deselectAll = () => setSelectedIds(new Set());

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} سؤال مكرر؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        
        setIsDeleting(true);
        setError("");

        try {
            const res = await fetch("/api/mock/admin/questions/scan-duplicates", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionIds: Array.from(selectedIds) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSuccess();
            handleScan();
        } catch (err: any) {
            setError(err.message || "فشل حذف الأسئلة");
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setScanResult(null);
        setError("");
        setSelectedIds(new Set());
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setTimeout(resetForm, 300);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                    <ScanSearch className="h-4 w-4" /> فحص التكرار
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1">
                        <span className="text-xl flex items-center gap-2"><ShieldAlert className="text-orange-500 w-6 h-6" /> فاحص الأسئلة المكررة</span>
                        <span className="text-sm font-normal text-gray-500">
                            يكتشف الأسئلة المتشابهة بالفكرة أو الإجابة حتى لو كانت بصياغة مختلفة — يدعم الفحص الشامل عبر جميع المحاور
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 relative">
                            <Label className="font-bold">المهنة</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pr-9"
                                    placeholder="ابحث واختر المهنة..."
                                    value={searchProfession}
                                    onChange={(e) => {
                                        setSearchProfession(e.target.value);
                                        setDropdownOpen(true);
                                        setProfessionId("");
                                    }}
                                    onFocus={() => setDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                />
                            </div>
                            {dropdownOpen && (
                                <div className="absolute top-[68px] right-0 left-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {professions.filter(p => p.name.includes(searchProfession)).sort((a: any, b: any) => a.name.localeCompare(b.name, 'ar')).map((p: any) => (
                                        <div key={p.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b last:border-0 border-gray-50"
                                            onClick={() => { setProfessionId(p.id); setSearchProfession(p.name); setDropdownOpen(false); }}>
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">نطاق الفحص</Label>
                            <Select value={axis} onValueChange={setAxis}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {AXIS_OPTIONS.map(a => (
                                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleScan} disabled={isScanning} className="w-full h-12 gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        {isScanning ? <Loader2 className="animate-spin h-5 w-5" /> : <ScanSearch className="h-5 w-5" />}
                        {isScanning ? "جاري الفحص الذكي..." : axis === "ALL" ? "فحص شامل لجميع المحاور" : "بدء فحص التكرار"}
                    </Button>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}

                    {scanResult && (
                        <div className="space-y-4">
                            <div className={`p-5 rounded-xl border ${scanResult.totalDuplicates > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {scanResult.totalDuplicates > 0 ? (
                                        <AlertTriangle className="text-orange-500 w-6 h-6" />
                                    ) : (
                                        <CheckCircle2 className="text-green-500 w-6 h-6" />
                                    )}
                                    <h3 className={`font-bold text-lg ${scanResult.totalDuplicates > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                                        {scanResult.totalDuplicates > 0
                                            ? `تم اكتشاف ${scanResult.totalDuplicates} سؤال مكرر في ${scanResult.duplicateGroups.length} مجموعة`
                                            : "لا توجد أسئلة مكررة! بنك الأسئلة نظيف ✓"
                                        }
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600">تم فحص {scanResult.totalScanned} سؤال {axis === "ALL" ? "عبر جميع المحاور" : ""}</p>
                            </div>

                            {scanResult.totalDuplicates > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={selectAllDuplicates} className="text-xs">
                                            تحديد كل المكرر ({scanResult.totalDuplicates})
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs" disabled={selectedIds.size === 0}>
                                            إلغاء التحديد
                                        </Button>
                                    </div>
                                    <Button onClick={handleDelete} disabled={selectedIds.size === 0 || isDeleting} className="gap-2 bg-red-600 hover:bg-red-700 text-white" size="sm">
                                        {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                        حذف المحدد ({selectedIds.size})
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                {scanResult.duplicateGroups.map((group: any, gi: number) => (
                                    <div key={gi} className="border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="p-4 bg-blue-50/50 border-b border-gray-200">
                                            <div className="flex items-start gap-2">
                                                <Badge className="bg-blue-600 text-white shrink-0 mt-1">الأصل</Badge>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{group.keepText}</p>
                                                    {axis === "ALL" && group.keepAxis && (
                                                        <Badge variant="outline" className="mt-2 text-[10px] text-blue-700 border-blue-200">{AXIS_LABELS[group.keepAxis] || group.keepAxis}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {group.duplicates.map((dup: any, di: number) => (
                                            <div key={di} className={`p-4 border-b last:border-0 border-gray-100 ${selectedIds.has(dup.id) ? 'bg-red-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                                                <div className="flex items-start gap-3">
                                                    <Checkbox checked={selectedIds.has(dup.id)} onCheckedChange={() => toggleId(dup.id)} className="mt-1 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-700 leading-relaxed mb-2">{dup.text}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px]">
                                                                تشابه {dup.score}%
                                                            </Badge>
                                                            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 text-[10px]">
                                                                {dup.reason}
                                                            </Badge>
                                                            {axis === "ALL" && dup.axis && (
                                                                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-[10px]">
                                                                    {AXIS_LABELS[dup.axis] || dup.axis}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
