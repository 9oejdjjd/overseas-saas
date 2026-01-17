"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Save, Lock, AlertCircle, Edit, MapPin, Clock, CalendarDays, X, CheckCircle, CheckCircle2, XCircle, AlertTriangle, UserCheck } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

interface ApplicantExamTabProps {
    applicant: ExtendedApplicant;
    onUpdate: () => void;
    viewMode?: "setup" | "admin";
}

export function ApplicantExamTab({ applicant, onUpdate, viewMode = "admin" }: ApplicantExamTabProps) {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [pricingPackages, setPricingPackages] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [serviceConfig, setServiceConfig] = useState<{ registrationPrice: number } | null>(null);
    const [activeVouchers, setActiveVouchers] = useState<any[]>([]);
    const [useVoucher, setUseVoucher] = useState<{ id: string, notes?: string } | null>(null);

    // Check if exam is already scheduled
    const isExamScheduled = !!(applicant.examDate && applicant.examTime);

    // Status Logic
    const [status, setStatus] = useState(applicant.status || "");
    const isFailedOrAbsent = ["FAILED", "ABSENT", "CANCELLED"].includes(applicant.status);

    // In setup mode, if scheduled, it is strictly read only (no edit button)
    // In admin mode, it behaves as read-only initially but has an edit button.
    const showEditButton = viewMode === "admin" && (isExamScheduled || isFailedOrAbsent);

    const [formData, setFormData] = useState({
        examDate: applicant.examDate ? new Date(applicant.examDate).toISOString().split('T')[0] : "",
        examTime: applicant.examTime || "",
        // Auto-select location: use examLocation if set, otherwise fallback to location.name from registration
        examLocation: applicant.examLocation || applicant.location?.name || "",
    });

    // Fetch Locations and Pricing
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/pricing/packages', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setPricingPackages(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch packages", err);
            }
        };

        const fetchLocations = async () => {
            try {
                console.log("Fetching locations...");
                const res = await fetch('/api/locations', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    console.log("Locations fetched:", data.length);
                    // DEBUG: Show all locations regardless of status to verify existence
                    setLocations(Array.isArray(data) ? data : []);
                } else {
                    console.error("Locations fetch failed", res.status);
                }
            } catch (err) {
                console.error("Failed to fetch locations", err);
            }
        };

        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/pricing/config', { cache: 'no-store' });
                if (res.ok) {
                    setServiceConfig(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch config", err);
            }
        };

        const fetchVouchers = async () => {
            try {
                // Fetch ALL active vouchers and filter locally for exam-compatible types
                const res = await fetch(`/api/vouchers?applicantId=${applicant.id}&activeOnly=true`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    // Filter for Exam-related vouchers
                    const validVouchers = data.filter((v: any) =>
                        ['EXAM', 'EXAM_RETAKE', 'FULL_PROGRAM'].includes(v.type)
                    );
                    setActiveVouchers(validVouchers);
                    if (validVouchers.length > 0) {
                        setUseVoucher(validVouchers[0]); // Default to using first voucher
                    }
                }
            } catch (err) { console.error(err); }
        };

        // Fetch if Admin OR Editing OR No Exam Scheduled yet
        if (viewMode === 'admin' || isEditing || !isExamScheduled) {
            fetchPricing();
            fetchLocations();
            fetchConfig();
            fetchVouchers();
        }
    }, [viewMode, isEditing, isExamScheduled]);

    const handleScheduleExam = async () => {
        if (!formData.examDate) {
            alert("Please select a date");
            return;
        }

        const isReschedule = isExamScheduled;
        const isRetake = isFailedOrAbsent; // Treat as retake if current status indicates failure/absence

        let feeAmount = 0;
        let confirmMsg = isReschedule ? "هل أنت متأكد من تغيير موعد الاختبار؟" : "تأكيد موعد الاختبار؟";

        if (isRetake) {

            // Use Unified Registration Price from Service Config
            feeAmount = serviceConfig?.registrationPrice || 16000;

            if (useVoucher) {
                const discount = useVoucher.discountPercent || 100;
                const originalFee = feeAmount;
                feeAmount = Math.max(0, originalFee * (1 - discount / 100)); // Calculate discounted fee based on percentage

                if (feeAmount === 0) {
                    confirmMsg = `سيتم استخدام قسيمة إعفاء للصرف (${discount}% خصم).\nالمبلغ المطلوب: 0 ر.ي\nهل أنت موافق؟`;
                } else {
                    confirmMsg = `سيتم استخدام قسيمة خصم (${discount}%).\nالرسوم الأصلية: ${originalFee.toLocaleString()}\nالرسوم بعد الخصم: ${feeAmount.toLocaleString()} ر.ي\nهل أنت موافق؟`;
                }
            } else {
                confirmMsg = `المتقدم (راسب/غائب). سيتم احتساب رسوم إعادة اختبار: ${feeAmount.toLocaleString()} ر.ي.\nهل أنت موافق؟`;
            }
        } else if (isReschedule && (applicant.reschedulePolicy?.rescheduleCount ?? 0) >= (applicant.reschedulePolicy?.maxFreeChanges ?? 1)) {
            confirmMsg += `\nسيتم احتساب رسوم تغيير موعد: ${applicant.reschedulePolicy?.changeFee} ر.ي.`;
        }

        if (confirm(confirmMsg) === false) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examDate: formData.examDate,
                    examTime: formData.examTime,
                    examLocation: formData.examLocation,
                    scheduleExam: true,
                    isRetake: isRetake,
                    feeAmount: feeAmount,
                    voucherId: useVoucher?.id
                }),
            });

            if (res.ok) {
                alert(isRetake ? "تمت إعادة الجدولة واحتساب الرسوم" : "تم حفظ الموعد بنجاح");
                setIsEditing(false);
                onUpdate();
            }
        } catch (error) {
            alert("خطأ في العملية");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (newStatus === applicant.status) return;
        if (!confirm(`هل أنت أوكد من تحديث الحالة إلى ${newStatus}؟`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                alert("تم تحديث الحالة بنجاح");
                onUpdate();
            }
        } catch (error) {
            alert("فشل تحديث الحالة");
        } finally {
            setLoading(false);
        }
    };

    // Determine if we are in "View Mode" (Scheduled/Processed and not editing)
    const isViewMode = (isExamScheduled || isFailedOrAbsent) && !isEditing;

    return (
        <div className="space-y-6">
            {/* --- EXAM DATE CARD --- */}
            <Card className={isViewMode ? "bg-white border-blue-100 shadow-sm" : "bg-white"}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                            {isViewMode ? "تفاصيل الموعد" : isEditing ? "تعديل / إعادة جدولة" : "جدولة اختبار جديد"}
                        </div>
                        {isViewMode && showEditButton && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Edit className="h-3 w-3 ml-2" />
                                {isFailedOrAbsent ? "إعادة اختبار (برسوم)" : "تعديل الموعد"}
                            </Button>
                        )}
                        {isViewMode && !showEditButton && (
                            <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" /> مثبت</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* --- VIEW MODE --- */}
                    {isViewMode ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                {/* Date Block */}
                                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">التاريخ</span>
                                    <span className="font-bold text-lg text-gray-900">{applicant.examDate ? new Date(applicant.examDate).toLocaleDateString("en-GB") : "-"}</span>
                                </div>
                                <div className="h-12 w-px bg-slate-200 hidden md:block" />
                                {/* Time Block */}
                                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-1">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">الوقت</span>
                                    <span className="font-bold text-lg text-gray-900">{applicant.examTime || "-"}</span>
                                </div>
                                <div className="h-12 w-px bg-slate-200 hidden md:block" />
                                {/* Location Block */}
                                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-1">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">الموقع</span>
                                    <span className="font-bold text-lg text-gray-900">
                                        {locations.find(l => l.name === applicant.examLocation)?.name || applicant.examLocation || "-"}
                                    </span>
                                </div>
                            </div>

                            {/* Status Banner Idea */}
                            {isFailedOrAbsent && (
                                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded flex flex-col md:flex-row justify-between items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-5 w-5" />
                                        <span className="font-bold">حالة المتقدم: {applicant.status === "FAILED" ? "راسب" : "غائب"}</span>
                                        <span className="text-sm hidden md:inline">يرجى الضغط على زر "تعديل / إعادة اختبار" لجدولة موعد جديد.</span>
                                    </div>
                                    {applicant.status === "ABSENT" && (
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            trigger="ON_EXAM_ABSENT"
                                            variant="inline"
                                            label="إرسال إشعار الغياب"
                                            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 whitespace-nowrap"
                                            onSuccess={onUpdate}
                                        />
                                    )}
                                </div>
                            )}

                            {/* WhatsApp Button for Exam Scheduled */}
                            {isExamScheduled && !isFailedOrAbsent && (
                                <div className="flex justify-center pt-2">
                                    <ContextualMessageButton
                                        applicant={applicant}
                                        trigger="ON_EXAM_SCHEDULED"
                                        variant="success"
                                        label="إرسال تأكيد الموعد"
                                        onSuccess={onUpdate}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- EDIT / CREATE MODE --- */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            {isEditing && (
                                <div className={`col-span-1 md:col-span-2 p-3 rounded-md text-sm flex items-start gap-2 border ${isFailedOrAbsent
                                    ? "bg-red-50 text-red-800 border-red-100"
                                    : "bg-blue-50 text-blue-800 border-blue-100"
                                    }`}>
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">{isFailedOrAbsent ? "إعادة اختبار (Retake)" : "تعديل الموعد"}</p>
                                        {isFailedOrAbsent ? (
                                            <p>سيتم جدولة موعد جديد واحتساب رسوم إعادة اختبار تلقائياً.</p>
                                        ) : (applicant.reschedulePolicy?.rescheduleCount ?? 0) >= (applicant.reschedulePolicy?.maxFreeChanges ?? 1) ? (
                                            <p>
                                                لقد استنفذت التغييرات المجانية.
                                                سيتم خصم <span className="font-bold">{applicant.reschedulePolicy?.changeFee.toLocaleString()} ر.ي</span> مقابل هذا التعديل.
                                            </p>
                                        ) : (
                                            <p>تغيير مجاني ({applicant.reschedulePolicy?.rescheduleCount}/{applicant.reschedulePolicy?.maxFreeChanges}).</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>تاريخ الاختبار الجديد</Label>
                                <CustomDatePicker
                                    value={formData.examDate ? new Date(formData.examDate) : undefined}
                                    onChange={(date) => {
                                        const dateStr = date ? date.toISOString().split('T')[0] : "";
                                        setFormData({ ...formData, examDate: dateStr });
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>وقت الاختبار</Label>
                                <Input
                                    type="time"
                                    value={formData.examTime}
                                    onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>مدينة الاختبار <span className="text-xs text-gray-400 font-normal">({locations.length} متاح)</span></Label>
                                <Select
                                    value={formData.examLocation}
                                    onValueChange={(v) => setFormData({ ...formData, examLocation: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المدينة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.length > 0 ? (
                                            locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.name}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-gray-500 text-sm">
                                                لا توجد مدن متاحة
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Footer Buttons for Edit/Create Mode */}
                {!isViewMode && (
                    <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-gray-50/50">
                        {isEditing && (
                            <Button variant="ghost" onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    examDate: applicant.examDate ? new Date(applicant.examDate).toISOString().split('T')[0] : "",
                                    examTime: applicant.examTime || "",
                                    examLocation: applicant.examLocation || applicant.location?.name || "",
                                });
                            }}>
                                <X className="h-4 w-4 ml-2" />
                                إلغاء
                            </Button>
                        )}
                        <Button
                            onClick={handleScheduleExam}
                            disabled={loading}
                            className={isEditing ? "bg-orange-600 hover:bg-orange-700" : "bg-primary"}
                        >
                            <Save className="h-4 w-4 ml-2" />
                            {isEditing ? (isFailedOrAbsent ? "تأكيد واستقطاع الرسوم" : "حفظ التعديل") : "حفظ الموعد"}
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {/* --- ADMIN STATUS ACTIONS & POST-RESULT WORKFLOW --- */}
            {viewMode === "admin" && (
                <>
                    {/* CASE 1: ATTENDANCE PHASE (Shown if not Passed/Failed) */}
                    {!["PASSED", "FAILED"].includes(applicant.status) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-gray-600" />
                                    تحديث حالة الاختبار والنتايج
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {/* Section 1: Attendance */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-gray-700">1. تسجيل الحضور</Label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <Select
                                            value={["EXAM_SCHEDULED", "ATTENDED_EXAM", "ABSENT"].includes(applicant.status) ? applicant.status : "ATTENDED_EXAM"}
                                            onValueChange={(val) => updateStatus(val)}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="اختر حالة الحضور" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EXAM_SCHEDULED">مجدول (Scheduled)</SelectItem>
                                                <SelectItem value="ATTENDED_EXAM">حضر الاختبار (Attended)</SelectItem>
                                                <SelectItem value="ABSENT">غائب (Absent)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Section 2: Result (Conditional) */}
                                {["ATTENDED_EXAM"].includes(applicant.status) && (
                                    <div className="space-y-3 pt-4 border-t border-dashed animate-in fade-in slide-in-from-top-1">
                                        <Label className="text-sm font-semibold text-gray-700">2. نتيجة الاختبار</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={() => updateStatus("PASSED")}
                                                disabled={loading}
                                                className="h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="h-5 w-5 ml-2" />
                                                ناجح (Passed)
                                            </Button>
                                            <Button
                                                onClick={() => updateStatus("FAILED")}
                                                disabled={loading}
                                                className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <XCircle className="h-5 w-5 ml-2" />
                                                راسب (Failed)
                                            </Button>
                                        </div>
                                        <p className="text-xs text-blue-600 flex items-center mt-2">
                                            <AlertTriangle className="h-3 w-3 ml-1" />
                                            يرجى تحديد النتيجة بعد تصحيح الاختبار
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* CASE 2: PASSED ACTIONS */}
                    {applicant.status === "PASSED" && (
                        <Card className="border-green-200 bg-green-50/50 shadow-sm animate-in zoom-in-95 duration-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-6 w-6" />
                                    المتقدم ناجح (Passed)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm flex flex-col items-center gap-3">
                                        <h4 className="font-semibold text-gray-800">إرسال التهنئة</h4>
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            trigger="ON_PASS"
                                            variant="success"
                                            label="إرسال مباركة النجاح"
                                            className="w-full"
                                            onSuccess={onUpdate}
                                        />
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm flex flex-col items-center gap-3">
                                        <h4 className="font-semibold text-gray-800">إرسال الشهادة</h4>
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            trigger="ON_CERTIFICATE_SENT"
                                            variant="default"
                                            label="إرسال الشهادة + رسالة"
                                            allowCustomAttachment={true}
                                            attachmentName="ملف الشهادة"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onSuccess={onUpdate}
                                        />
                                    </div>
                                </div>
                                <div className="text-center pt-2">
                                    <p className="text-xs text-gray-500 mb-2">هل تم تحديد الحالة بالخطأ؟</p>
                                    <Button variant="ghost" size="sm" onClick={() => updateStatus("ATTENDED_EXAM")} className="text-gray-400 hover:text-red-500 h-6">
                                        تراجع عن النتيجة
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* CASE 3: FAILED ACTIONS & RETAKE */}
                    {applicant.status === "FAILED" && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <Card className="border-red-200 bg-red-50/50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                                        <XCircle className="h-6 w-6" />
                                        المتقدم راسب (Failed)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-red-800">
                                        يرجى إبلاغ المتقدم بالنتيجة وجدولة موعد إعادة اختبار.
                                    </p>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            trigger="ON_FAIL"
                                            variant="inline"
                                            label="إرسال إشعار الرسوب"
                                            className="bg-red-600 text-white hover:bg-red-700 flex-1 md:flex-none justify-center"
                                            onSuccess={onUpdate}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => updateStatus("ATTENDED_EXAM")} className="text-gray-400 hover:text-red-500 border-red-200">
                                            تراجع
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-orange-200 shadow-md">
                                <CardHeader className="bg-orange-50 border-b border-orange-100 pb-3">
                                    <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                                        <CalendarClock className="h-5 w-5" />
                                        حجز موعد إعادة اختبار
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100 flex gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            {activeVouchers.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="useVoucher"
                                                            checked={!!useVoucher}
                                                            onChange={(e) => setUseVoucher(e.target.checked ? activeVouchers[0] : null)}
                                                            className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                        />
                                                        <label htmlFor="useVoucher" className="font-bold text-green-700 cursor-pointer">
                                                            يوجد قسيمة إعفاء متاحة ({useVoucher ? "مستخدمة" : "غير مستخدمة"})
                                                        </label>
                                                    </div>
                                                    {useVoucher && (
                                                        <div className="text-xs text-green-800">
                                                            {(useVoucher.discountPercent || 100) === 100
                                                                ? "سيتم تصفير الرسوم بالكامل."
                                                                : `سيتم تطبيق خصم ${useVoucher.discountPercent}% على الرسوم.`}
                                                            {(useVoucher.discountPercent || 100) < 100 && (
                                                                <span className="block font-bold mt-1">
                                                                    المبلغ المطلوب: {((serviceConfig?.registrationPrice || 16000) * (1 - (useVoucher.discountPercent || 100) / 100)).toLocaleString()} ر.ي
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!useVoucher && (
                                                        <div>
                                                            <span className="font-bold">ملاحظة:</span> سيتم احتساب رسوم إعادة اختبار بقيمة
                                                            <span className="font-bold mx-1">
                                                                {(serviceConfig?.registrationPrice || 16000).toLocaleString()} ر.ي
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="font-bold">ملاحظة:</span> سيتم احتساب رسوم إعادة اختبار بقيمة
                                                    <span className="font-bold mx-1">
                                                        {(serviceConfig?.registrationPrice || 16000).toLocaleString()} ر.ي
                                                    </span>
                                                    وإضافتها إلى الرصيد المتبقي على العميل.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>تاريخ الاختبار الجديد</Label>
                                            <CustomDatePicker
                                                value={formData.examDate ? new Date(formData.examDate) : undefined}
                                                onChange={(date) => {
                                                    const dateStr = date ? date.toISOString().split('T')[0] : "";
                                                    setFormData({ ...formData, examDate: dateStr });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>وقت الاختبار</Label>
                                            <Input
                                                type="time"
                                                value={formData.examTime}
                                                onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>مدينة الاختبار</Label>
                                            <Select
                                                value={formData.examLocation}
                                                onValueChange={(v) => setFormData({ ...formData, examLocation: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر المدينة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-gray-50 border-t flex justify-end pt-4">
                                    <Button
                                        onClick={handleScheduleExam}
                                        disabled={loading}
                                        className="bg-orange-600 hover:bg-orange-700 text-white min-w-[200px]"
                                    >
                                        <Save className="h-4 w-4 ml-2" />
                                        تأكيد الموعد واحتساب الرسوم
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
