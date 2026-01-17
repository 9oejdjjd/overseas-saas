
import { cn } from "@/lib/utils";

type ApplicantStatus =
    | "NEW_REGISTRATION"
    | "SERVICES_CONFIGURED"
    | "ACCOUNT_CREATED"
    | "EXAM_SCHEDULED"
    | "AWAITING_EXAM"
    | "ATTENDED_EXAM"
    | "PASSED"
    | "FAILED"
    | "POSTPONED"
    | "CANCELLED"
    | "ABSENT";

const STATUS_CONFIG: Record<ApplicantStatus, { label: string; className: string }> = {
    NEW_REGISTRATION: { label: "مسجل جديد", className: "bg-gray-100 text-gray-700 border-gray-300" },
    SERVICES_CONFIGURED: { label: "تم إعداد الخدمات", className: "bg-blue-50 text-blue-700 border-blue-200" },
    ACCOUNT_CREATED: { label: "تم إنشاء حساب", className: "bg-blue-100 text-blue-700 border-blue-300" },
    EXAM_SCHEDULED: { label: "تم تأكيد موعد", className: "bg-purple-100 text-purple-700 border-purple-300" },
    AWAITING_EXAM: { label: "بانتظار الاختبار", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    ATTENDED_EXAM: { label: "حضر الاختبار", className: "bg-indigo-100 text-indigo-700 border-indigo-300" },
    PASSED: { label: "ناجح", className: "bg-green-100 text-green-700 border-green-300" },
    FAILED: { label: "راسب", className: "bg-red-100 text-red-700 border-red-300" },
    POSTPONED: { label: "مؤجل", className: "bg-orange-100 text-orange-700 border-orange-300" },
    CANCELLED: { label: "ملغي", className: "bg-slate-100 text-slate-700 border-slate-300" },
    ABSENT: { label: "غائب", className: "bg-rose-100 text-rose-700 border-rose-300" },
};

interface StatusBadgeProps {
    status: ApplicantStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
