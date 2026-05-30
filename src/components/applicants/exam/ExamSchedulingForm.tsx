"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertCircle } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantExam } from "@/hooks/applicants/useApplicantExam";

interface ExamSchedulingFormProps {
    applicant: ExtendedApplicant;
    hook: ReturnType<typeof useApplicantExam>;
}

export function ExamSchedulingForm({ applicant, hook }: ExamSchedulingFormProps) {
    const {
        isEditing,
        isFailedOrAbsent,
        locations,
        formData,
        setFormData,
        availableCenters,
        handleSetDate
    } = hook;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {isEditing && (
                <div className={`col-span-1 md:col-span-2 p-3 rounded-md text-sm flex items-start gap-2 border ${
                    isFailedOrAbsent ? "bg-red-50 text-red-800 border-red-100" : "bg-blue-50 text-blue-800 border-blue-100"
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

            <div className="space-y-2">
                <Label>مركز الاختبار <span className="text-xs text-gray-400 font-normal">({availableCenters.length} متاح)</span></Label>
                <Select
                    value={formData.examCenter}
                    onValueChange={(v) => setFormData({ ...formData, examCenter: v })}
                    disabled={!formData.examLocation || availableCenters.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={!formData.examLocation ? "اختر المدينة أولاً" : "اختر المركز"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableCenters.length > 0 ? (
                            availableCenters.map((center) => (
                                <SelectItem key={center.id} value={center.id}>
                                    {center.name}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-center text-gray-500 text-sm">
                                لا توجد مراكز متاحة
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
