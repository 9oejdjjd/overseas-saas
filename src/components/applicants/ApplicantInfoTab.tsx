"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, FileText, Copy, Check, Lock, Save, Loader2, Search } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { OCRUploader } from "@/components/applicants/OCRUploader";

interface ApplicantInfoTabProps {
    applicant: ExtendedApplicant;
    isPlatformRegistered: boolean;
    // We might need a refresh/update callback if we are saving credentials here
    onUpdate?: () => void;
    viewMode?: "setup" | "admin";
}

export function ApplicantInfoTab({ applicant, isPlatformRegistered, onUpdate, viewMode = "setup" }: ApplicantInfoTabProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [platformData, setPlatformData] = useState({
        email: applicant.platformEmail || "",
        password: applicant.platformPassword || ""
    });
    const [professions, setProfessions] = useState<any[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetch("/api/mock/admin/professions")
            .then(res => res.json())
            .then(data => setProfessions(data))
            .catch(console.error);
    }, []);
    const [basicInfo, setBasicInfo] = useState({
        fullName: applicant.fullName || "",
        firstName: applicant.firstName || "",
        lastName: applicant.lastName || "",
        passportNumber: applicant.passportNumber || "",
        passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined as Date | undefined,
        dob: applicant.dob ? new Date(applicant.dob) : undefined as Date | undefined,
        nationalId: applicant.nationalId || "",
        profession: applicant.profession || "",
        phone: applicant.phone || "",
        whatsappNumber: applicant.whatsappNumber || ""
    });
    const [loading, setLoading] = useState(false);
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [savingBasic, setSavingBasic] = useState(false);

    // Sync local state when applicant changes (fixes stale data bug)
    useEffect(() => {
        setPlatformData({
            email: applicant.platformEmail || "",
            password: applicant.platformPassword || ""
        });
        setBasicInfo({
            fullName: applicant.fullName || "",
            firstName: applicant.firstName || "",
            lastName: applicant.lastName || "",
            passportNumber: applicant.passportNumber || "",
            passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined,
            dob: applicant.dob ? new Date(applicant.dob) : undefined,
            nationalId: applicant.nationalId || "",
            profession: applicant.profession || "",
            phone: applicant.phone || "",
            whatsappNumber: applicant.whatsappNumber || ""
        });
        setIsEditingBasic(false);
    }, [applicant.id]);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSaveBasicInfo = async () => {
        setSavingBasic(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: basicInfo.fullName,
                    firstName: basicInfo.firstName,
                    lastName: basicInfo.lastName,
                    passportNumber: basicInfo.passportNumber,
                    passportExpiry: basicInfo.passportExpiry,
                    dob: basicInfo.dob,
                    nationalId: basicInfo.nationalId,
                    profession: basicInfo.profession,
                    phone: basicInfo.phone,
                    whatsappNumber: basicInfo.whatsappNumber
                }),
            });

            if (res.ok) {
                alert("تم تحديث البيانات الأساسية بنجاح");
                setIsEditingBasic(false);
                if (onUpdate) onUpdate();
            } else {
                alert("فشل التحديث");
            }
        } catch (e) {
            console.error(e);
            alert("خطأ في الاتصال");
        } finally {
            setSavingBasic(false);
        }
    };

    const handleSaveCredentials = async () => {
        if (!platformData.email) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platformEmail: platformData.email,
                    platformPassword: platformData.password,
                    updateStatus: true
                }),
            });

            if (res.ok) {
                alert("تم حفظ بيانات المنصة بنجاح");
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            alert("خطأ في حفظ البيانات");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-5 w-5 text-blue-600" />
                            المعلومات الأساسية والوثائق
                        </CardTitle>
                        {viewMode === 'setup' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (isEditingBasic) {
                                        // Reset to original data when cancelling
                                        setBasicInfo({
                                            fullName: applicant.fullName || "",
                                            firstName: applicant.firstName || "",
                                            lastName: applicant.lastName || "",
                                            passportNumber: applicant.passportNumber || "",
                                            passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined,
                                            dob: applicant.dob ? new Date(applicant.dob) : undefined,
                                            nationalId: applicant.nationalId || "",
                                            profession: applicant.profession || "",
                                            phone: applicant.phone || "",
                                            whatsappNumber: applicant.whatsappNumber || ""
                                        });
                                    } else {
                                        // When entering edit mode, ensure we populate with the absolute latest Applicant data
                                        setBasicInfo({
                                            fullName: applicant.fullName || "",
                                            firstName: applicant.firstName || (applicant.fullName && !applicant.firstName ? applicant.fullName.split(' ')[0] : ""),
                                            lastName: applicant.lastName || (applicant.fullName && !applicant.lastName ? applicant.fullName.split(' ').slice(1).join(' ') : ""),
                                            passportNumber: applicant.passportNumber || "",
                                            passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined,
                                            dob: applicant.dob ? new Date(applicant.dob) : undefined,
                                            nationalId: applicant.nationalId || "",
                                            profession: applicant.profession || "",
                                            phone: applicant.phone || "",
                                            whatsappNumber: applicant.whatsappNumber || ""
                                        });
                                    }
                                    setIsEditingBasic(!isEditingBasic);
                                }}
                            >
                                {isEditingBasic ? "إلغاء" : "تعديل"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditingBasic ? (
                            <div className="space-y-4 animate-in fade-in relative">
                                {savingBasic && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-800">جاري حفظ البيانات...</span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-700">الاسم الكامل (عربي)</Label>
                                    <Input value={basicInfo.fullName} onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })} className="font-semibold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">الاسم الإنجليزي (الأول)</Label>
                                        <Input value={basicInfo.firstName} onChange={e => setBasicInfo({ ...basicInfo, firstName: e.target.value })} className="dir-ltr font-mono bg-blue-50/50" placeholder="First Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">الاسم الإنجليزي (الأخير)</Label>
                                        <Input value={basicInfo.lastName} onChange={e => setBasicInfo({ ...basicInfo, lastName: e.target.value })} className="dir-ltr font-mono bg-blue-50/50" placeholder="Last Name" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">رقم الهاتف</Label>
                                        <Input value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} className="dir-ltr font-mono" placeholder="967..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">رقم الواتساب</Label>
                                        <Input value={basicInfo.whatsappNumber} onChange={e => setBasicInfo({ ...basicInfo, whatsappNumber: e.target.value })} className="dir-ltr font-mono" placeholder="967..." />
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label className="text-xs">المهنة</Label>
                                    <div className="relative">
                                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input 
                                            value={basicInfo.profession} 
                                            onChange={e => {
                                                setBasicInfo({ ...basicInfo, profession: e.target.value });
                                                setDropdownOpen(true);
                                            }}
                                            onFocus={() => setDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                            className="pr-9"
                                            placeholder="ابحث أو اكتب المهنة..."
                                        />
                                    </div>
                                    {dropdownOpen && (
                                        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {professions.filter(p => p.name.includes(basicInfo.profession || "")).map(p => (
                                                <div 
                                                    key={p.id} 
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                                    onClick={() => {
                                                        setBasicInfo({ ...basicInfo, profession: p.name });
                                                        setDropdownOpen(false);
                                                    }}
                                                >
                                                    {p.name}
                                                </div>
                                            ))}
                                            {professions.filter(p => p.name.includes(basicInfo.profession || "")).length === 0 && (
                                                <div className="px-4 py-2 text-sm text-gray-500 text-center">قم بكتابة المهنة أو ابحث عنها</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs">رقم الجواز</Label>
                                        <OCRUploader
                                            type="PASSPORT"
                                            onScanComplete={(data) => {
                                                const updates: any = {};
                                                if (data.passportNumber) updates.passportNumber = data.passportNumber;
                                                if (data.firstName) updates.firstName = data.firstName;
                                                if (data.lastName) updates.lastName = data.lastName;
                                                if (data.passportExpiry) updates.passportExpiry = new Date(data.passportExpiry);
                                                if (data.dob) updates.dob = new Date(data.dob);
                                                if (data.profession) updates.profession = data.profession;
                                                if (data.nationalId) updates.nationalId = data.nationalId;

                                                setBasicInfo(prev => ({ ...prev, ...updates }));
                                            }}
                                            label="مسح"
                                            className="scale-90"
                                        />
                                    </div>
                                    <Input value={basicInfo.passportNumber} onChange={e => setBasicInfo({ ...basicInfo, passportNumber: e.target.value })} className="dir-ltr font-mono uppercase" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">انتهاء الجواز</Label>
                                        <CustomDatePicker value={basicInfo.passportExpiry} onChange={d => setBasicInfo({ ...basicInfo, passportExpiry: d })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">تاريخ الميلاد</Label>
                                        <CustomDatePicker value={basicInfo.dob} onChange={d => setBasicInfo({ ...basicInfo, dob: d })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs">الرقم الوطني</Label>
                                        <OCRUploader
                                            type="NATIONAL_ID"
                                            onScanComplete={(data) => {
                                                if (data.nationalId) setBasicInfo(prev => ({ ...prev, nationalId: data.nationalId }));
                                            }}
                                            label="مسح"
                                            className="scale-90"
                                        />
                                    </div>
                                    <Input value={basicInfo.nationalId} onChange={e => setBasicInfo({ ...basicInfo, nationalId: e.target.value })} />
                                </div>
                                <Button onClick={handleSaveBasicInfo} disabled={savingBasic} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {savingBasic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                                    حفظ التعديلات
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">الاسم الكامل</span>
                                    <span className="font-medium text-right">{applicant.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">المهنة</span>
                                    <span className="font-medium">{applicant.profession}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">رقم الهاتف</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium direction-ltr">{applicant.phone || "-"}</span>
                                        {applicant.phone && (
                                            <button onClick={() => copyToClipboard(applicant.phone, 'phone')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'phone' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">رقم الواتساب</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium direction-ltr">{applicant.whatsappNumber || "-"}</span>
                                        {applicant.whatsappNumber && (
                                            <button onClick={() => copyToClipboard(applicant.whatsappNumber, 'whatsapp')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'whatsapp' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">First Name</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">{applicant.firstName || "-"}</span>
                                        {applicant.firstName && (
                                            <button onClick={() => copyToClipboard(applicant.firstName!, 'fname')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'fname' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">Last Name</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">{applicant.lastName || "-"}</span>
                                        {applicant.lastName && (
                                            <button onClick={() => copyToClipboard(applicant.lastName!, 'lname')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'lname' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">رقم الجواز</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">{applicant.passportNumber || "-"}</span>
                                        {applicant.passportNumber && (
                                            <button onClick={() => copyToClipboard(applicant.passportNumber!, 'passport')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'passport' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">انتهاء الجواز</span>
                                    <span className="font-mono font-medium">
                                        {applicant.passportExpiry ? new Date(applicant.passportExpiry).toLocaleDateString('en-GB') : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">تاريخ الميلاد</span>
                                    <span className="font-mono font-medium">
                                        {applicant.dob ? new Date(applicant.dob).toLocaleDateString('en-GB') : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-500">الرقم الوطني</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">{applicant.nationalId || "-"}</span>
                                        {applicant.nationalId && (
                                            <button onClick={() => copyToClipboard(applicant.nationalId!, 'nid')} className="text-gray-400 hover:text-blue-600">
                                                {copiedField === 'nid' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Platform Credentials Card */}
                <Card className={`relative overflow-hidden ${isPlatformRegistered ? "bg-green-50/50 border-green-200 shadow-sm" : "bg-orange-50/50 border-orange-200 shadow-sm"}`}>
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="text-xs font-semibold text-blue-800">جاري معالجة المنصة...</span>
                            </div>
                        </div>
                    )}
                    <CardHeader className="pb-3 border-b border-gray-100/50 bg-white/50">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                            <Lock className="h-4 w-4 text-gray-500" />
                            بيانات الدخول للمنصة
                            {isPlatformRegistered && <Badge className="bg-green-500 text-[10px] mr-auto shadow-sm">تم الربط والمزامنة</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-4">
                        {/* Admin Mode - Read Only View */}
                        {viewMode === "admin" || isPlatformRegistered ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">البريد الإلكتروني (Email)</Label>
                                    <div className="relative flex items-center bg-white border rounded px-3 py-2">
                                        <span className="flex-1 font-mono text-sm overflow-hidden text-ellipsis direction-ltr text-left">
                                            {applicant.platformEmail || "---"}
                                        </span>
                                        {applicant.platformEmail && (
                                            <button onClick={() => copyToClipboard(applicant.platformEmail!, 'email')} className="text-gray-400 hover:text-blue-600 ml-2">
                                                {copiedField === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">كلمة المرور (Password)</Label>
                                    <div className="relative flex items-center bg-white border rounded px-3 py-2">
                                        <span className="flex-1 font-mono text-sm overflow-hidden text-ellipsis">
                                            {/* Show Only if it exists. Note: Old passwords might be hashed. New ones will be plain. */}
                                            {applicant.platformPassword || "---"}
                                        </span>
                                        {applicant.platformPassword && (
                                            <button onClick={() => copyToClipboard(applicant.platformPassword!, 'password')} className="text-gray-400 hover:text-blue-600 ml-2">
                                                {copiedField === 'password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* WhatsApp Button in Admin Mode */}
                                {isPlatformRegistered && (
                                    <ContextualMessageButton
                                        applicant={applicant}
                                        trigger="ON_REGISTRATION"
                                        variant="success"
                                        label="إرسال تأكيد التسجيل"
                                        onSuccess={onUpdate}
                                        className="w-full mt-2"
                                    />
                                )}
                            </>
                        ) : (
                            // Setup Mode - Editable View
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs">البريد الإلكتروني (Email)</Label>
                                    <div className="relative">
                                        <Input
                                            value={platformData.email}
                                            onChange={(e) => setPlatformData({ ...platformData, email: e.target.value })}
                                            className="bg-white pr-8 font-mono text-sm direction-ltr text-left"
                                            placeholder="email@example.com"
                                        />
                                        {platformData.email && (
                                            <button
                                                onClick={() => copyToClipboard(platformData.email, 'email')}
                                                className="absolute right-2 top-2.5 text-gray-400 hover:text-blue-600"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">كلمة المرور (Password)</Label>
                                    <div className="relative">
                                        <Input
                                            value={platformData.password}
                                            onChange={(e) => setPlatformData({ ...platformData, password: e.target.value })}
                                            className="bg-white pr-8 font-mono text-sm"
                                            placeholder="********"
                                        />
                                        {platformData.password && (
                                            <button
                                                onClick={() => copyToClipboard(platformData.password, 'password')}
                                                className="absolute right-2 top-2.5 text-gray-400 hover:text-blue-600"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveCredentials}
                                        disabled={loading || !platformData.email}
                                        size="sm"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="h-4 w-4 ml-2" />
                                        {loading ? "جاري الحفظ..." : "حفظ بيانات المنصة"}
                                    </Button>
                                    {isPlatformRegistered && (
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            trigger="ON_REGISTRATION"
                                            variant="success"
                                            label="تأكيد التسجيل"
                                            onSuccess={onUpdate}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
