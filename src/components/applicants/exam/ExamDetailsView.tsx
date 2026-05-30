"use client";

import { ExtendedApplicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, XCircle, Lock } from "lucide-react";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

interface ExamDetailsViewProps {
    applicant: ExtendedApplicant;
    locations: any[];
    isFailedOrAbsent: boolean;
    isExamScheduled: boolean;
    onUpdate: () => void;
}

export function ExamDetailsView({
    applicant,
    locations,
    isFailedOrAbsent,
    isExamScheduled,
    onUpdate
}: ExamDetailsViewProps) {
    return (
        <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Date Block */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">التاريخ</span>
                    <span className="font-bold text-lg text-gray-900">
                        {applicant.examDate ? new Date(applicant.examDate).toLocaleDateString("en-GB") : "-"}
                    </span>
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
                    {applicant.examCenter && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                            {applicant.examCenter.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Banner */}
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
                        trigger="ON_EXAM_SCHEDULE"
                        variant="success"
                        label="إرسال تأكيد الموعد"
                        allowCustomAttachment={true}
                        onSuccess={onUpdate}
                    />
                </div>
            )}
        </div>
    );
}
