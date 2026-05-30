"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Save, Lock, Edit, X, Loader2 } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantExam } from "@/hooks/applicants/useApplicantExam";
import { ExamDetailsView } from "./exam/ExamDetailsView";
import { ExamSchedulingForm } from "./exam/ExamSchedulingForm";
import { ExamStatusManager } from "./exam/ExamStatusManager";

interface ApplicantExamTabProps {
    applicant: ExtendedApplicant;
    onUpdate: () => void;
    viewMode?: "setup" | "admin";
}

export function ApplicantExamTab({
    applicant,
    onUpdate,
    viewMode = "admin"
}: ApplicantExamTabProps) {
    const hook = useApplicantExam({ applicant, onUpdate, viewMode });
    const {
        loading,
        isEditing,
        setIsEditing,
        locations,
        isExamScheduled,
        isFailedOrAbsent,
        showEditButton,
        setFormData,
        handleScheduleExam
    } = hook;

    // Determine if we are in "View Mode" (Scheduled/Processed and not editing)
    const isViewMode = (isExamScheduled || isFailedOrAbsent) && !isEditing;

    return (
        <div className="space-y-6 relative">
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">جاري المعالجة...</span>
                    </div>
                </div>
            )}
            
            {/* --- EXAM DATE CARD --- */}
            <Card className={isViewMode ? "bg-white border-blue-100 shadow-sm" : "bg-white"}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                            {isViewMode ? "تفاصيل الموعد" : isEditing ? "تعديل / إعادة جدولة" : "جدولة اختبار جديد"}
                        </div>
                        {isViewMode && showEditButton && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <Edit className="h-3 w-3 ml-2" />
                                {isFailedOrAbsent ? "إعادة اختبار (برسوم)" : "تعديل الموعد"}
                            </Button>
                        )}
                        {isViewMode && !showEditButton && (
                            <Badge variant="secondary">
                                <Lock className="w-3 h-3 mr-1" /> مثبت
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {isViewMode ? (
                        <ExamDetailsView
                            applicant={applicant}
                            locations={locations}
                            isFailedOrAbsent={isFailedOrAbsent}
                            isExamScheduled={isExamScheduled}
                            onUpdate={onUpdate}
                        />
                    ) : (
                        <ExamSchedulingForm applicant={applicant} hook={hook} />
                    )}
                </CardContent>

                {/* Footer Buttons for Edit/Create Mode */}
                {!isViewMode && (
                    <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-gray-50/50">
                        {isEditing && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        examDate: applicant.examDate ? new Date(applicant.examDate).toISOString().split('T')[0] : "",
                                        examTime: applicant.examTime || "",
                                        examLocation: applicant.examLocation || applicant.location?.name || "",
                                        examCenter: applicant.examCenterId || "",
                                    });
                                }}
                            >
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
                <ExamStatusManager
                    applicant={applicant}
                    hook={hook}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
}
