"use client";

import { ExtendedApplicant } from "@/types/applicant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ExamStatusCardProps {
    applicant: ExtendedApplicant;
    onUpdate: () => void;
}

export function ExamStatusCard({ applicant, onUpdate }: ExamStatusCardProps) {
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    const hasExamDate = !!applicant.examDate;
    const currentStatus = applicant.status;

    // Only show if exam is scheduled but not yet passed
    const showStatusCards = hasExamDate && currentStatus !== 'PASSED';

    const updateStatus = async (newStatus: string) => {
        if (newStatus === currentStatus) return;
        if (!confirm(`هل أنت متأكد من تحديث الحالة إلى ${getStatusLabel(newStatus)}؟`)) return;

        setLoading(true);
        setSelectedStatus(newStatus);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                onUpdate();
            } else {
                alert("فشل تحديث الحالة");
            }
        } catch (error) {
            alert("فشل تحديث الحالة");
        } finally {
            setLoading(false);
            setSelectedStatus(null);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PASSED': return "ناجح";
            case 'FAILED': return "راسب";
            case 'ABSENT': return "غائب";
            case 'EXAM_SCHEDULED': return "موعد محدد";
            default: return status;
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PASSED': return {
                bg: "bg-green-50 border-green-200 hover:bg-green-100",
                text: "text-green-700",
                icon: CheckCircle,
                iconColor: "text-green-500"
            };
            case 'FAILED': return {
                bg: "bg-red-50 border-red-200 hover:bg-red-100",
                text: "text-red-700",
                icon: XCircle,
                iconColor: "text-red-500"
            };
            case 'ABSENT': return {
                bg: "bg-orange-50 border-orange-200 hover:bg-orange-100",
                text: "text-orange-700",
                icon: AlertTriangle,
                iconColor: "text-orange-500"
            };
            default: return {
                bg: "bg-gray-50 border-gray-200 hover:bg-gray-100",
                text: "text-gray-700",
                icon: GraduationCap,
                iconColor: "text-gray-500"
            };
        }
    };

    // If exam completed (passed/failed), show result badge only
    if (currentStatus === 'PASSED' || currentStatus === 'FAILED') {
        const config = getStatusConfig(currentStatus);
        return (
            <Card className={cn("border-2", config.bg)}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", config.bg)}>
                            <config.icon className={cn("h-6 w-6", config.iconColor)} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">نتيجة الاختبار</p>
                            <p className={cn("text-lg font-bold", config.text)}>
                                {getStatusLabel(currentStatus)}
                            </p>
                        </div>
                    </div>
                    <Badge className={cn("text-sm px-3 py-1", config.bg, config.text)}>
                        {applicant.examDate ? new Date(applicant.examDate).toLocaleDateString('ar-EG') : ''}
                    </Badge>
                </CardContent>
            </Card>
        );
    }

    // If no exam date, don't show this card
    if (!showStatusCards) {
        return null;
    }

    // Show status update buttons
    const statusOptions = [
        { value: 'PASSED', label: 'ناجح', ...getStatusConfig('PASSED') },
        { value: 'FAILED', label: 'راسب', ...getStatusConfig('FAILED') },
        { value: 'ABSENT', label: 'غائب', ...getStatusConfig('ABSENT') },
    ];

    return (
        <Card className="border shadow-sm">
            <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">تسجيل نتيجة الاختبار</p>
                            <p className="text-xs text-muted-foreground">
                                موعد الاختبار: {applicant.examDate ? new Date(applicant.examDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                onClick={() => updateStatus(option.value)}
                                className={cn(
                                    "border transition-all",
                                    currentStatus === option.value
                                        ? cn(option.bg, option.text, "ring-2 ring-offset-1")
                                        : "hover:border-gray-300"
                                )}
                            >
                                {loading && selectedStatus === option.value ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                                ) : (
                                    <option.icon className={cn("h-4 w-4 ml-1", option.iconColor)} />
                                )}
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
