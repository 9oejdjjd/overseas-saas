"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Pencil, Copy, Trash2, Crown, Star, Gem, Rocket, Gift, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const ICONS: Record<string, any> = { crown: Crown, star: Star, diamond: Gem, rocket: Rocket, gift: Gift };

export function MockExamPackages() {
    const [packages, setPackages] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalPackages: 0, totalPurchases: 0, totalRevenue: 0, totalCreditsSold: 0 });
    const [config, setConfig] = useState<any>({ mockExamSinglePrice: 0, mockExamPackagesEnabled: true, registrationPrice: 0 });
    const [loading, setLoading] = useState(true);
    const [isConfigEditing, setIsConfigEditing] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgsRes, statsRes, configRes] = await Promise.all([
                fetch("/api/pricing/mock-packages"), fetch("/api/pricing/mock-stats"), fetch("/api/pricing/config")
            ]);
            if (pkgsRes.ok) setPackages(await pkgsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (configRes.ok) {
                const c = await configRes.json();
                setConfig({ mockExamSinglePrice: c.mockExamSinglePrice ?? 0, mockExamPackagesEnabled: c.mockExamPackagesEnabled ?? true, registrationPrice: Number(c.registrationPrice ?? 0) });
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSaveConfig = async () => {
        try {
            await fetch("/api/pricing/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
            setIsConfigEditing(false);
        } catch { alert("فشل حفظ الإعدادات"); }
    };

    const handleSavePackage = async () => {
        setIsSaving(true);
        try {
            const method = currentPackage.id ? "PATCH" : "POST";
            const url = currentPackage.id ? `/api/pricing/mock-packages/${currentPackage.id}` : "/api/pricing/mock-packages";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...currentPackage, examPrice: Number(currentPackage.examPrice), registrationDiscount: Number(currentPackage.registrationDiscount), transportDiscount: Number(currentPackage.transportDiscount), examCredits: Number(currentPackage.examCredits), sortOrder: Number(currentPackage.sortOrder || 0), validityDays: currentPackage.validityDays ? Number(currentPackage.validityDays) : null, priceSAR: Number(currentPackage.priceSAR || 0) }) });
            if (res.ok) { setIsPackageModalOpen(false); fetchData(); } else alert("حدث خطأ أثناء الحفظ");
        } catch { alert("حدث خطأ أثناء الحفظ"); }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => { if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return; try { await fetch(`/api/pricing/mock-packages/${id}`, { method: "DELETE" }); fetchData(); } catch { alert("خطأ"); } };
    const handleDuplicate = async (id: string) => { try { await fetch(`/api/pricing/mock-packages/${id}/duplicate`, { method: "POST" }); fetchData(); } catch { alert("خطأ"); } };
    const handleToggle = async (pkg: any) => { try { await fetch(`/api/pricing/mock-packages/${pkg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !pkg.isActive }) }); fetchData(); } catch { alert("خطأ"); } };

    const openNew = () => {
        setCurrentPackage({ name: "", description: "", examCredits: 1, includesRegistration: false, includesTransport: false, examPrice: 0, priceSAR: 0, registrationDiscount: 0, transportDiscount: 0, isActive: true, isFeatured: false, badge: "", color: "#3B82F6", icon: "star", sortOrder: packages.length, transportType: "ONE_WAY", isFree: false, showResultScore: true, showResultQuestions: true, showResultCorrectAnswers: true });
        setIsPackageModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    const regPrice = config.registrationPrice;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: "الباقات المتاحة", value: stats.totalPackages, color: "" }, { label: "إجمالي المشتريات", value: stats.totalPurchases, color: "" }, { label: "إجمالي الإيرادات", value: `${stats.totalRevenue} ر.ي`, color: "text-green-600" }, { label: "اختبارات مُباعة", value: stats.totalCreditsSold, color: "text-blue-600" }].map((s, i) => (
                    <Card key={i}><CardContent className="p-4 flex flex-col items-center"><span className="text-sm text-gray-500">{s.label}</span><span className={`text-2xl font-bold ${s.color}`}>{s.value}</span></CardContent></Card>
                ))}
            </div>

            {/* Config */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-blue-600" /> الإعدادات العامة</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-6 items-end p-4 bg-slate-50 rounded-lg border">
                        <div className="space-y-2"><label className="text-xs font-medium text-slate-500">سعر الاختبار المفرد</label><Input type="number" value={config.mockExamSinglePrice} disabled={!isConfigEditing} onChange={e => setConfig({...config, mockExamSinglePrice: Number(e.target.value)})} /></div>
                        <div className="flex items-center gap-2 pb-2"><Switch checked={config.mockExamPackagesEnabled} disabled={!isConfigEditing} onCheckedChange={c => setConfig({...config, mockExamPackagesEnabled: c})} /><label className="text-sm font-medium">تفعيل الباقات</label></div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        {!isConfigEditing ? <Button onClick={() => setIsConfigEditing(true)} variant="outline">تعديل</Button> : (<><Button onClick={() => { setIsConfigEditing(false); fetchData(); }} variant="ghost">إلغاء</Button><Button onClick={handleSaveConfig}>حفظ</Button></>)}
                    </div>
                </CardContent>
            </Card>

            {/* Packages Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>باقات الاختبارات التجريبية</CardTitle><CardDescription>إدارة الباقات والأسعار</CardDescription></div>
                    <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> باقة جديدة</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>الباقة</TableHead><TableHead>الاختبارات</TableHead><TableHead>تسجيل / مواصلات</TableHead><TableHead>سعر الاختبارات</TableHead><TableHead>الخصومات</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {packages.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">لا توجد باقات</TableCell></TableRow> : packages.map(pkg => {
                                const Icon = ICONS[pkg.icon] || Star;
                                return (
                                    <TableRow key={pkg.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: pkg.color || '#3B82F6' }}><Icon className="h-4 w-4" /></div>
                                                <div><div className="font-semibold flex items-center gap-2">{pkg.name}{pkg.isFeatured && <Badge variant="secondary" className="bg-amber-100 text-amber-800">مميزة</Badge>}{pkg.isFree && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مجانية</Badge>}</div>{pkg.badge && <span className="text-xs text-blue-600">{pkg.badge}</span>}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{pkg.examCredits === -1 ? '∞' : pkg.examCredits}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="flex items-center gap-1">{pkg.includesRegistration ? <Check className="h-3 w-3 text-green-500"/> : <X className="h-3 w-3 text-red-400"/>} التسجيل</span>
                                                <span className="flex items-center gap-1">{pkg.includesTransport ? <Check className="h-3 w-3 text-green-500"/> : <X className="h-3 w-3 text-red-400"/>} المواصلات</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">{Number(pkg.examPrice)} ر.ي</TableCell>
                                        <TableCell>
                                            <div className="text-xs space-y-1">
                                                {pkg.includesRegistration && <div className="text-orange-600">تسجيل: -{Number(pkg.registrationDiscount)}</div>}
                                                {pkg.includesTransport && <div className="text-purple-600">مواصلات: -{Number(pkg.transportDiscount)}</div>}
                                                {!pkg.includesRegistration && !pkg.includesTransport && <span className="text-gray-400">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell><Switch checked={pkg.isActive} onCheckedChange={() => handleToggle(pkg)} /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => { setCurrentPackage(pkg); setIsPackageModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDuplicate(pkg.id)}><Copy className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{currentPackage?.id ? 'تعديل الباقة' : 'باقة جديدة'}</DialogTitle><DialogDescription>تفاصيل ومحتويات الباقة</DialogDescription></DialogHeader>
                    {currentPackage && (
                        <div className="space-y-6 py-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-sm font-medium">اسم الباقة (عربي)</label><Input value={currentPackage.name} onChange={e => setCurrentPackage({...currentPackage, name: e.target.value})} /></div>
                                <div className="space-y-2"><label className="text-sm font-medium">اسم (إنجليزي)</label><Input value={currentPackage.nameEn || ''} onChange={e => setCurrentPackage({...currentPackage, nameEn: e.target.value})} dir="ltr" /></div>
                                <div className="col-span-2 space-y-2"><label className="text-sm font-medium">وصف الباقة</label><Input value={currentPackage.description || ''} onChange={e => setCurrentPackage({...currentPackage, description: e.target.value})} /></div>
                            </div>

                            {/* Look */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="space-y-2"><label className="text-sm font-medium">الأيقونة</label>
                                    <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" value={currentPackage.icon || 'star'} onChange={e => setCurrentPackage({...currentPackage, icon: e.target.value})}>
                                        <option value="star">نجمة</option><option value="crown">تاج</option><option value="diamond">ماسة</option><option value="rocket">صاروخ</option><option value="gift">هدية</option>
                                    </select></div>
                                <div className="space-y-2"><label className="text-sm font-medium">اللون</label><div className="flex gap-2"><input type="color" className="h-10 w-10 p-1 rounded cursor-pointer" value={currentPackage.color || '#3B82F6'} onChange={e => setCurrentPackage({...currentPackage, color: e.target.value})} /><Input value={currentPackage.color || '#3B82F6'} onChange={e => setCurrentPackage({...currentPackage, color: e.target.value})} dir="ltr" /></div></div>
                                <div className="space-y-2"><label className="text-sm font-medium">شارة</label><Input placeholder="الأكثر مبيعاً" value={currentPackage.badge || ''} onChange={e => setCurrentPackage({...currentPackage, badge: e.target.value})} /></div>
                            </div>

                            {/* Exams */}
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold text-sm border-b pb-2">🧪 الاختبارات التجريبية</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><label className="text-sm font-medium">عدد الاختبارات (-1 = غير محدود)</label><Input type="number" value={currentPackage.examCredits} onChange={e => setCurrentPackage({...currentPackage, examCredits: Number(e.target.value)})} /></div>
                                    <div className="space-y-2"><label className="text-sm font-medium">الصلاحية (أيام)</label><Input type="number" placeholder="فارغ = دائم" value={currentPackage.validityDays || ''} onChange={e => setCurrentPackage({...currentPackage, validityDays: e.target.value})} /></div>
                                </div>
                                <div className="flex items-center gap-2 mt-4"><Switch checked={currentPackage.isFree} onCheckedChange={c => setCurrentPackage({...currentPackage, isFree: c, examPrice: c ? 0 : currentPackage.examPrice, priceSAR: c ? 0 : currentPackage.priceSAR})} /><label className="text-sm font-semibold text-green-600">باقة مجانية (تصفير الأسعار)</label></div>
                                {!currentPackage.isFree && (
                                    <div className="grid grid-cols-2 gap-4 mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="space-y-2"><label className="text-sm font-medium text-blue-800">سعر الحزمة (ريال يمني)</label><Input type="number" className="font-bold border-blue-200" value={currentPackage.examPrice} onChange={e => setCurrentPackage({...currentPackage, examPrice: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-sm font-medium text-emerald-800">سعر الحزمة (ريال سعودي) 🇸🇦</label><Input type="number" className="font-bold border-emerald-200 bg-emerald-50" value={currentPackage.priceSAR} onChange={e => setCurrentPackage({...currentPackage, priceSAR: e.target.value})} /></div>
                                    </div>
                                )}
                            </div>

                            {/* Result Page Features */}
                            <div className="space-y-4 p-4 border rounded-lg bg-orange-50/50">
                                <h3 className="font-semibold text-sm border-b pb-2">🛡️ صلاحيات صفحة النتيجة (تخصيص العرض)</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={currentPackage.showResultScore} onCheckedChange={c => setCurrentPackage({...currentPackage, showResultScore: c})} />
                                        <label className="text-sm font-medium">إظهار النتيجة المئوية (مثل: 80%)</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={currentPackage.showResultQuestions} onCheckedChange={c => setCurrentPackage({...currentPackage, showResultQuestions: c, showResultCorrectAnswers: c ? currentPackage.showResultCorrectAnswers : false})} />
                                        <label className="text-sm font-medium">إظهار الأسئلة المنجزة (الخاطئة والصحيحة)</label>
                                    </div>
                                    {currentPackage.showResultQuestions && (
                                        <div className="flex items-center gap-2 pl-6">
                                            <Switch checked={currentPackage.showResultCorrectAnswers} onCheckedChange={c => setCurrentPackage({...currentPackage, showResultCorrectAnswers: c})} />
                                            <label className="text-sm font-medium text-gray-600">إظهار الإجابة الصحيحة (التصحيح) للأسئلة الخاطئة</label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Registration */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center gap-2"><Switch checked={currentPackage.includesRegistration} onCheckedChange={c => setCurrentPackage({...currentPackage, includesRegistration: c, registrationDiscount: c ? currentPackage.registrationDiscount : 0})} /><label className="text-sm font-semibold">📝 تشمل التسجيل؟</label></div>
                                {currentPackage.includesRegistration && (
                                    <div className="grid grid-cols-3 gap-4 bg-blue-50 p-3 rounded-lg animate-in fade-in">
                                        <div><label className="text-xs text-gray-500">رسوم التسجيل (من النظام)</label><div className="text-lg font-bold text-gray-700">{regPrice} ر.ي</div></div>
                                        <div className="space-y-1"><label className="text-xs text-gray-500">خصم التسجيل في الباقة</label><Input type="number" className="border-orange-200" value={currentPackage.registrationDiscount} onChange={e => setCurrentPackage({...currentPackage, registrationDiscount: e.target.value})} /></div>
                                        <div><label className="text-xs text-gray-500">بعد الخصم</label><div className="text-lg font-bold text-green-700">{regPrice - Number(currentPackage.registrationDiscount || 0)} ر.ي ✨</div></div>
                                    </div>
                                )}
                            </div>

                            {/* Transport */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center gap-2"><Switch checked={currentPackage.includesTransport} onCheckedChange={c => setCurrentPackage({...currentPackage, includesTransport: c, transportType: c ? 'ONE_WAY' : null, transportDiscount: c ? currentPackage.transportDiscount : 0})} /><label className="text-sm font-semibold">🚗 تشمل المواصلات؟</label></div>
                                {currentPackage.includesTransport && (
                                    <div className="bg-purple-50 p-3 rounded-lg animate-in fade-in space-y-3">
                                        <div className="flex gap-4 items-center">
                                            <label className="text-sm">نوع الرحلة:</label>
                                            <select className="h-8 rounded-md border px-2 text-sm" value={currentPackage.transportType || 'ONE_WAY'} onChange={e => setCurrentPackage({...currentPackage, transportType: e.target.value})}>
                                                <option value="ONE_WAY">ذهاب فقط</option><option value="ROUND_TRIP">ذهاب وعودة</option>
                                            </select>
                                        </div>
                                        <p className="text-xs text-purple-600">💡 أسعار المواصلات تختلف حسب الخط. الخصم يُطبق على أي خط.</p>
                                        <div className="space-y-1"><label className="text-xs text-gray-500">خصم المواصلات في الباقة (ر.ي)</label><Input type="number" className="border-purple-200 max-w-xs" value={currentPackage.transportDiscount} onChange={e => setCurrentPackage({...currentPackage, transportDiscount: e.target.value})} /></div>
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h3 className="font-semibold text-sm mb-3">📊 ملخص الباقة</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span>سعر الاختبارات:</span><span className="font-bold">{Number(currentPackage.examPrice || 0)} ر.ي</span></div>
                                    {currentPackage.includesRegistration && <div className="flex justify-between text-orange-600"><span>خصم التسجيل:</span><span>-{Number(currentPackage.registrationDiscount || 0)} ر.ي</span></div>}
                                    {currentPackage.includesTransport && <div className="flex justify-between text-purple-600"><span>خصم المواصلات:</span><span>-{Number(currentPackage.transportDiscount || 0)} ر.ي</span></div>}
                                </div>
                                <div className="flex items-center gap-4 mt-3 pt-2 border-t">
                                    <div className="flex items-center gap-2"><Switch checked={currentPackage.isFeatured} onCheckedChange={c => setCurrentPackage({...currentPackage, isFeatured: c})} /><label className="text-sm text-amber-600">مميزة؟</label></div>
                                    <div className="flex items-center gap-2"><label className="text-sm">ترتيب:</label><Input type="number" className="w-20 h-8" value={currentPackage.sortOrder} onChange={e => setCurrentPackage({...currentPackage, sortOrder: e.target.value})} /></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPackageModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSavePackage} disabled={isSaving}>{isSaving ? "جاري الحفظ..." : "حفظ الباقة"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
