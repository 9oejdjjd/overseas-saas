"use client";

import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { MessageLog } from "@/hooks/messaging/useMessagingDashboard";

const TRIGGER_LABELS: Record<string, string> = {
    "ON_REGISTRATION": "تأكيد التسجيل",
    "ON_DASHBOARD_ACCESS": "بيانات الدخول للمنصة",
    "ON_EXAM_SCHEDULE": "تأكيد موعد الاختبار",
    "ON_EXAM_RESCHEDULE": "تعديل موعد الاختبار",
    "ON_EXAM_CANCEL": "إلغاء حجز الاختبار",
    "ON_EXAM_ABSENT": "تغيب عن الاختبار",
    "ON_EXAM_VOUCHER": "قسيمة اختبار",
    "ON_TICKET_ISSUE": "تفاصيل التذكرة",
    "ON_TICKET_UPDATE": "تعديل التذكرة",
    "ON_TICKET_CANCEL": "إلغاء التذكرة",
    "ON_TICKET_NO_SHOW": "تغيب عن الرحلة",
    "ON_TICKET_VOUCHER": "قسيمة تذكرة سفر",
    "ON_TICKET_ATTENDED": "حضور الرحلة",
    "REMINDER_EXAM_2DAYS": "تذكير اختبار (48 ساعة)",
    "REMINDER_TRAVEL_2DAYS": "تذكير سفر (48 ساعة)",
    "ON_MOCK_EXAM_LINK": "رابط الاختبار التجريبي",
    "ON_MOCK_PASS": "نجاح اختبار تجريبي (مسجل)",
    "ON_MOCK_FAIL": "رسوب اختبار تجريبي (مسجل)",
    "ON_MOCK_PASS_VISITOR": "نجاح اختبار تجريبي (زائر)",
    "ON_MOCK_FAIL_VISITOR": "رسوب اختبار تجريبي (زائر)",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_CERTIFICATE": "إرسال الشهادة",
    "ON_FAIL": "إشعار نتيجة (راسب)",
    "ON_RETAKE_VOUCHER": "قسيمة تعويضية",
    "ON_FEEDBACK": "طلب تقييم الخدمة",
    "ON_REFERRAL_VOUCHER": "قسيمة تسويقية",
    "MANUAL_QUICK_MSG": "رسالة سريعة يدوية",
};

interface AllMessagesTabProps {
    messages: MessageLog[];
}

export function AllMessagesTab({ messages }: AllMessagesTabProps) {
    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <MessageCircle className="h-8 w-8 opacity-45" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">لا توجد رسائل</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">لا تتوفر أي سجلات مراسلة حالياً.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm animate-fade-in">
            {messages.map((msg) => {
                const initials = msg.applicant?.fullName?.charAt(0) || "?";
                const isSent = msg.status === "SENT";
                const isFailed = msg.status === "FAILED";
                const isPending = msg.status === "PENDING";
                const isDismissed = msg.status === "DISMISSED";

                return (
                    <div
                        key={msg.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                                isSent 
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" 
                                    : isFailed
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                    : isPending
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}>
                                {initials}
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                    {msg.applicant?.fullName || "زائر (اختبار تجريبي)"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                    <span className="font-medium">
                                        {TRIGGER_LABELS[msg.trigger] || msg.trigger}
                                    </span>
                                    <span className="opacity-40">•</span>
                                    <span className="font-mono text-[11px]">
                                        {new Date(msg.createdAt).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 self-end sm:self-center">
                            <span className="text-xs text-slate-400 hidden md:block font-mono" dir="ltr">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            <Badge
                                variant="outline"
                                className={`text-xs py-0.5 px-2.5 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                                    isSent
                                        ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                                        : isFailed
                                        ? "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20"
                                        : isPending
                                        ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20"
                                        : isDismissed
                                        ? "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                                        : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                                }`}
                            >
                                {isSent ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        تم الإرسال
                                    </>
                                ) : isFailed ? (
                                    <>
                                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                                        فشل الإرسال
                                    </>
                                ) : isPending ? (
                                    <>
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        معلقة
                                    </>
                                ) : isDismissed ? (
                                    <>
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        تم التخطي
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {msg.status}
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
