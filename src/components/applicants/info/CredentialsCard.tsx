"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Copy, Check, Loader2, Save } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantInfo } from "@/hooks/applicants/useApplicantInfo";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

interface CredentialsCardProps {
    applicant: ExtendedApplicant;
    isPlatformRegistered: boolean;
    viewMode: "setup" | "admin";
    hook: ReturnType<typeof useApplicantInfo>;
    onUpdate?: () => void;
}

export function CredentialsCard({
    applicant,
    isPlatformRegistered,
    viewMode,
    hook,
    onUpdate
}: CredentialsCardProps) {
    const {
        copiedField,
        platformData,
        setPlatformData,
        loading,
        copyToClipboard,
        handleSaveCredentials
    } = hook;

    return (
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
                                    {applicant.platformPassword || "---"}
                                </span>
                                {applicant.platformPassword && (
                                    <button onClick={() => copyToClipboard(applicant.platformPassword!, 'password')} className="text-gray-400 hover:text-blue-600 ml-2">
                                        {copiedField === 'password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
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
    );
}
