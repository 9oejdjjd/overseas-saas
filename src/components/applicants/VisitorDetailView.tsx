"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tag, Phone, Beaker, UserPlus, CalendarClock, Trash2, Mail, Pencil, Plus, Check, X, Copy, Loader2, Briefcase } from "lucide-react";
import { MockExamRenewalCard } from "./MockExamRenewalCard";
import { useToast } from "@/components/ui/simple-toast";
import { useRouter } from "next/navigation";

interface VisitorDetailViewProps {
    visitor: any;
    onUpdate: () => void;
    onClose: () => void;
}

export function VisitorDetailView({ visitor, onUpdate, onClose }: VisitorDetailViewProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [converting, setConverting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailInput, setEmailInput] = useState(visitor.email || "");
    const [savingEmail, setSavingEmail] = useState(false);

    const [isEditingProfession, setIsEditingProfession] = useState(false);
    const [professionInput, setProfessionInput] = useState(visitor.profession || "");
    const [savingProfession, setSavingProfession] = useState(false);
    const [availableProfessions, setAvailableProfessions] = useState<string[]>([]);
    const [showProfDropdown, setShowProfDropdown] = useState(false);

    useEffect(() => {
        setEmailInput(visitor.email || "");
        setIsEditingEmail(false);
        setProfessionInput(visitor.profession || "");
        setIsEditingProfession(false);

        // Fetch professions list for autocomplete
        fetch("/api/mock/public/professions")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAvailableProfessions(data.map((p: any) => p.name).filter(Boolean));
                }
            })
            .catch(() => {});
    }, [visitor.visitorPurchaseId, visitor.email, visitor.profession]);

    const handleSaveEmail = async () => {
        setSavingEmail(true);
        try {
            const res = await fetch(`/api/applicants/${visitor.visitorPurchaseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput })
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error || "فشل في حفظ البريد الإلكتروني", "error");
                return;
            }
            toast("تم حفظ البريد الإلكتروني بنجاح", "success");
            setIsEditingEmail(false);
            visitor.email = emailInput; // Optimistic update
            onUpdate();
        } catch (err) {
            console.error("Save email error:", err);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setSavingEmail(false);
        }
    };

    const handleSaveProfession = async () => {
        setSavingProfession(true);
        try {
            const res = await fetch(`/api/applicants/${visitor.visitorPurchaseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profession: professionInput })
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error || "فشل في حفظ المهنة", "error");
                return;
            }
            toast("تم حفظ المهنة بنجاح", "success");
            setIsEditingProfession(false);
            visitor.profession = professionInput; // Optimistic update
            onUpdate();
        } catch (err) {
            console.error("Save profession error:", err);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setSavingProfession(false);
        }
    };

    const handleDeleteVisitor = async () => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الزائر نهائياً وإلغاء باقته واسترجاع كامل الرصيد؟ لا يمكن التراجع عن هذا الإجراء.")) return;
        
        setDeleting(true);
        try {
            const res = await fetch(`/api/applicants/${visitor.visitorPurchaseId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error || "فشل في حذف الزائر", "error");
                return;
            }
            toast(`تم حذف بيانات الزائر بنجاح. المبلغ المسترجع: ${data.cashRefund?.toLocaleString() || 0} ر.ي`, "success");
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Delete visitor error:", err);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setDeleting(false);
        }
    };

    const mp = visitor.mockPurchase;
    const creditsRemaining = mp ? (mp.totalCredits === -1 ? -1 : mp.totalCredits - mp.usedCredits) : 0;
    const isExpired = mp?.expiresAt && new Date(mp.expiresAt) < new Date();

    const handleConvertToApplicant = () => {
        const params = new URLSearchParams({
            prefill: "true",
            name: visitor.fullName || "",
            phone: visitor.phone || "",
            purchaseId: visitor.visitorPurchaseId || "",
        });
        onClose();
        router.push(`/dashboard/applicants/new?${params.toString()}`);
    };

    return (
        <div className="space-y-4 p-4">
            {/* Visitor Header Card */}
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-orange-500 text-white text-xs"><Tag className="h-3 w-3 ml-1" /> زائر</Badge>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{visitor.fullName}</h2>
                            
                            {/* Profession View / Edit */}
                            <div className="mt-1.5 min-h-[30px] flex items-center gap-2">
                                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                {isEditingProfession ? (
                                    <div className="relative flex items-center gap-1.5 w-full max-w-[260px]">
                                        <Input
                                            value={professionInput}
                                            onChange={e => {
                                                setProfessionInput(e.target.value);
                                                setShowProfDropdown(true);
                                            }}
                                            onFocus={() => setShowProfDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowProfDropdown(false), 200)}
                                            placeholder="اختر أو اكتب المهنة..."
                                            className="h-7 py-0.5 px-2 text-xs bg-white border border-orange-200 focus:border-orange-500 focus-visible:ring-0"
                                            disabled={savingProfession}
                                        />
                                        <Button 
                                            onClick={handleSaveProfession} 
                                            disabled={savingProfession} 
                                            size="sm" 
                                            className="h-7 w-7 p-0 bg-orange-600 hover:bg-orange-700 text-white shrink-0"
                                        >
                                            {savingProfession ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button 
                                            onClick={() => {
                                                setProfessionInput(visitor.profession || "");
                                                setIsEditingProfession(false);
                                            }} 
                                            disabled={savingProfession} 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 shrink-0"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>

                                        {showProfDropdown && availableProfessions.length > 0 && (
                                            <div className="absolute top-full right-0 left-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-36 overflow-y-auto">
                                                {availableProfessions
                                                    .filter(p => p.toLowerCase().includes((professionInput || "").toLowerCase()))
                                                    .map((p, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="px-3 py-1.5 hover:bg-orange-50 cursor-pointer text-xs border-b border-gray-50 last:border-0"
                                                            onMouseDown={e => {
                                                                e.preventDefault();
                                                                setProfessionInput(p);
                                                                setShowProfDropdown(false);
                                                            }}
                                                        >
                                                            {p}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {visitor.profession ? (
                                            <>
                                                <span className="text-sm text-gray-700 font-medium">{visitor.profession}</span>
                                                <button 
                                                    onClick={() => setIsEditingProfession(true)} 
                                                    className="text-gray-400 hover:text-orange-600 p-0.5 rounded transition-colors"
                                                    title="تعديل المهنة"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => setIsEditingProfession(true)} 
                                                className="text-[10px] text-orange-700 hover:text-orange-800 font-bold flex items-center gap-1 bg-orange-100/60 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/50 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                                إضافة مهنة
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {visitor.phone}</span>
                                    {visitor.createdAt && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <CalendarClock className="h-3 w-3" />
                                            {new Date(visitor.createdAt).toLocaleDateString('en-GB')}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1 min-h-[32px]">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    {isEditingEmail ? (
                                        <div className="flex items-center gap-1.5 w-full max-w-[240px]">
                                            <Input
                                                value={emailInput}
                                                onChange={e => setEmailInput(e.target.value)}
                                                placeholder="example@email.com"
                                                className="h-7 py-0.5 px-2 text-xs font-mono direction-ltr text-left bg-white border border-orange-200 focus:border-orange-500 focus-visible:ring-0"
                                                disabled={savingEmail}
                                            />
                                            <Button 
                                                onClick={handleSaveEmail} 
                                                disabled={savingEmail} 
                                                size="sm" 
                                                className="h-7 w-7 p-0 bg-orange-600 hover:bg-orange-700 text-white shrink-0"
                                            >
                                                {savingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    setEmailInput(visitor.email || "");
                                                    setIsEditingEmail(false);
                                                }} 
                                                disabled={savingEmail} 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 shrink-0"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {visitor.email ? (
                                                <>
                                                    <span className="font-mono text-gray-800 text-xs">{visitor.email}</span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(visitor.email);
                                                            toast("تم نسخ البريد الإلكتروني", "success");
                                                        }} 
                                                        className="text-gray-400 hover:text-orange-600 p-0.5 rounded transition-colors"
                                                        title="نسخ"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsEditingEmail(true)} 
                                                        className="text-gray-400 hover:text-orange-600 p-0.5 rounded transition-colors"
                                                        title="تعديل"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsEditingEmail(true)} 
                                                    className="text-[10px] text-orange-700 hover:text-orange-800 font-bold flex items-center gap-1 bg-orange-100/60 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200/50 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    إضافة بريد إلكتروني
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-left">
                            {mp && (
                                <div className={`text-center p-3 rounded-xl ${isExpired ? 'bg-red-100' : creditsRemaining === 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                    <div className={`text-3xl font-black ${isExpired ? 'text-red-600' : creditsRemaining === 0 ? 'text-yellow-600' : 'text-green-700'}`}>
                                        {creditsRemaining === -1 ? '∞' : creditsRemaining}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">اختبارات متبقية</div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Package Details */}
            {mp && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Beaker className="h-4 w-4 text-purple-600" /> تفاصيل الباقة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-purple-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">الباقة</div>
                                <div className="font-bold text-sm text-purple-700 mt-1">{mp.packageName || "مفردة"}</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">المستخدم</div>
                                <div className="font-bold text-lg text-blue-700">{mp.usedCredits}</div>
                            </div>
                            <div className={`rounded-lg p-3 ${creditsRemaining === 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                <div className="text-xs text-gray-500">المتبقي</div>
                                <div className={`font-bold text-lg ${creditsRemaining === 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {mp.totalCredits === -1 ? '∞' : creditsRemaining}
                                </div>
                            </div>
                        </div>
                        {mp.expiresAt && (
                            <div className={`mt-3 text-xs text-center rounded p-1.5 ${isExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                {isExpired ? '⚠️ انتهت الصلاحية في' : '📅 تنتهي في'} {new Date(mp.expiresAt).toLocaleDateString('en-GB')}
                            </div>
                        )}
                        {mp.totalCredits > 0 && (
                            <div className="w-full h-2.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${creditsRemaining === 0 ? 'bg-red-400' : creditsRemaining <= 2 ? 'bg-yellow-400' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, (mp.usedCredits / mp.totalCredits) * 100)}%` }} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Renewal & Actions */}
            <MockExamRenewalCard
                phone={visitor.phone}
                buyerName={visitor.fullName}
                currentPurchase={mp}
                onUpdate={onUpdate}
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t mt-4">
                <Button
                    variant="outline"
                    onClick={handleConvertToApplicant}
                    className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                >
                    <UserPlus className="h-4 w-4" />
                    تسجيل كمتقدم رسمي
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleDeleteVisitor}
                    disabled={deleting}
                    className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    حذف وإلغاء الباقة
                </Button>
            </div>
        </div>
    );
}
