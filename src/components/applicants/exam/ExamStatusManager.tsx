"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle, XCircle, CheckCircle2, AlertTriangle, CalendarClock, Save, AlertCircle } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";
import { useApplicantExam } from "@/hooks/applicants/useApplicantExam";

interface ExamStatusManagerProps {
    applicant: ExtendedApplicant;
    hook: ReturnType<typeof useApplicantExam>;
    onUpdate: () => void;
}

export function ExamStatusManager({
    applicant,
    hook,
    onUpdate
}: ExamStatusManagerProps) {
    const {
        loading,
        activeVouchers,
        useVoucher,
        setUseVoucher,
        serviceConfig,
        locations,
        formData,
        setFormData,
        availableCenters,
        updateStatus,
        handleScheduleExam,
        handleSetDate
    } = hook;

    return (
        <div className="space-y-6">
            {/* CASE 1: ATTENDANCE PHASE */}
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

                        {/* Section 2: Result */}
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
                                    trigger="ON_CERTIFICATE"
                                    variant="default"
                                    label="إرسال الشهادة + رسالة"
                                    allowCustomAttachment={true}
                                    requireAttachment={true}
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
                                    <DatePicker
                                        date={formData.examDate ? new Date(formData.examDate) : undefined}
                                        setDate={handleSetDate}
                                        placeholder="اختر تاريخ الاختبار"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>وقت الاختبار</Label>
                                    <Select
                                        value={formData.examTime}
                                        onValueChange={(v) => setFormData({ ...formData, examTime: v })}
                                    >
                                        <SelectTrigger className="font-mono text-center bg-white border-blue-200 focus:ring-blue-500">
                                            <SelectValue placeholder="اختر وقت الاختبار" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-56">
                                            {Array.from({ length: 27 }, (_, i) => {
                                                const hour = Math.floor(i / 2) + 7;
                                                const m = i % 2 === 0 ? "00" : "30";
                                                return `${hour.toString().padStart(2, '0')}:${m}`;
                                            }).map(time => (
                                                <SelectItem key={time} value={time}>
                                                    {time} {parseInt(time) < 12 ? 'ص' : 'م'}
                                                </SelectItem>
                                            ))}
                                            {formData.examTime && !Array.from({ length: 27 }, (_, i) => {
                                                const hour = Math.floor(i / 2) + 7;
                                                const m = i % 2 === 0 ? "00" : "30";
                                                return `${hour.toString().padStart(2, '0')}:${m}`;
                                            }).includes(formData.examTime) && (
                                                <SelectItem value={formData.examTime}>{formData.examTime}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
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
        </div>
    );
}
