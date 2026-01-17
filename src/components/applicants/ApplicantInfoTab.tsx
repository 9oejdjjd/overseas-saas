"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, FileText, Copy, Check, Lock, Save } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

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
    const [loading, setLoading] = useState(false);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSaveCredentials = async () => {
        if (!platformData.email) return; // Password might be optional on update, but let's assume required for initial
        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platformEmail: platformData.email,
                    platformPassword: platformData.password,
                    // We might not want to change status purely on this, or maybe we do?
                    // Let's keep status update minimal unless requested.
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-5 w-5 text-blue-600" />
                            المعلومات الأساسية والوثائق
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                            {/* Moved Document Info Here */}
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
                    </CardContent>
                </Card>

                {/* Platform Credentials Card */}
                <Card className={isPlatformRegistered ? "bg-green-50 border-green-100 shadow-sm" : "bg-orange-50 border-orange-100 shadow-sm"}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            بيانات الدخول للمنصة
                            {isPlatformRegistered && <Badge className="bg-green-500 text-[10px] mr-auto">تم الربط</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Admin Mode - Read Only View */}
                        {viewMode === "admin" ? (
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
