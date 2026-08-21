import React from "react";
import { CheckCircle2, XCircle, Send, Clock } from "lucide-react";

interface AgentStatusBadgeProps {
    status: string;
    isPassed: boolean | null;
}

export function AgentStatusBadge({ status, isPassed }: AgentStatusBadgeProps) {
    switch (status) {
        case "COMPLETED":
            return isPassed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 size={12} /> ناجح
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                    <XCircle size={12} /> راسب
                </span>
            );
        case "SENT":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    <Send size={12} /> تم الإرسال
                </span>
            );
        case "STARTED":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    <Clock size={12} className="animate-spin" /> بدأ الاختبار
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100">
                    {status}
                </span>
            );
    }
}
