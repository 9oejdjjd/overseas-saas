"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    AlertCircle,
    RefreshCw,
    XCircle,
    Trash2,
    CheckCircle2
} from "lucide-react";
import { ContextualMessageButton } from "./ContextualMessageButton";
import { PendingMessage } from "@/hooks/messaging/useMessagingDashboard";

interface PendingMessagesTabProps {
    pendingMessages: PendingMessage[];
    handleBulkAction: (action: 'retry' | 'delete') => Promise<void>;
    handleSingleAction: (action: 'retry' | 'delete', messageLogId: string) => Promise<void>;
    handleDismissPending: (applicantId: string, trigger: string) => Promise<void>;
    onSuccess: () => void;
}

export function PendingMessagesTab({
    pendingMessages,
    handleBulkAction,
    handleSingleAction,
    handleDismissPending,
    onSuccess
}: PendingMessagesTabProps) {
    
    const retriesCount = pendingMessages.filter(m => m.isRetry).length;
    const hasRetries = retriesCount > 0;

    if (pendingMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">لا توجد رسائل معلقة 🎉</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">لقد تم إرسال جميع الرسائل أو جدولتها بنجاح!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Bulk Actions Header */}
            {hasRetries && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                                إعادة إرسال الرسائل الفاشلة
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                يوجد {retriesCount} رسالة واجهت مشاكل أثناء الإرسال التلقائي وبانتظار الإجراء.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button 
                            onClick={() => handleBulkAction('delete')}
                            variant="outline" 
                            size="sm"
                            className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 bg-white dark:bg-slate-900 font-bold transition-all text-xs"
                        >
                            <XCircle className="w-4 h-4 ml-1.5" /> حذف الكل
                        </Button>
                        <Button 
                            onClick={() => handleBulkAction('retry')}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs"
                        >
                            <RefreshCw className="w-4 h-4 ml-1.5 animate-pulse" /> إعادة إرسال الكل
                        </Button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                {pendingMessages.map((msg, idx) => {
                    const initials = msg.applicant?.fullName?.charAt(0) || "ز";
                    return (
                        <div
                            key={`${msg.applicantId}-${msg.trigger}-${idx}`}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors ${
                                msg.isRetry 
                                    ? 'bg-amber-50/20 hover:bg-amber-50/40 dark:bg-amber-950/5 dark:hover:bg-amber-950/10' 
                                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                                    msg.isRetry 
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                }`}>
                                    {initials}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                            {msg.applicant?.fullName || "زائر (اختبار تجريبي)"}
                                        </p>
                                        {msg.isRetry && (
                                            <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                                                فشل الإرسال
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300">
                                            {msg.applicant?.applicantCode || "VISITOR"}
                                        </span>
                                        <span className="opacity-40">•</span>
                                        <span className={msg.isRetry ? 'text-amber-700 dark:text-amber-400 font-medium' : ''}>
                                            {msg.triggerLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-3 self-end sm:self-center">
                                {msg.isRetry && msg.createdAt && (
                                    <span className="text-xs text-slate-400 hidden md:block font-mono" dir="ltr">
                                        {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                )}
                                
                                {!msg.isRetry && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 shrink-0 text-xs">
                                        <Clock className="h-3 w-3 ml-1" /> مجدولة
                                    </Badge>
                                )}

                                {msg.isRetry && msg.messageLogId ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleSingleAction('delete', msg.messageLogId!)}
                                            variant="outline"
                                            size="sm"
                                            className="h-9 w-9 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-100 dark:border-rose-900/50 bg-white dark:bg-slate-900 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <XCircle className="w-4.5 h-4.5" />
                                        </Button>
                                        <Button
                                            onClick={() => handleSingleAction('retry', msg.messageLogId!)}
                                            size="sm"
                                            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 text-xs shadow-sm hover:shadow transition-all rounded-lg"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" /> إعادة
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleDismissPending(msg.applicantId, msg.trigger)}
                                            variant="outline"
                                            size="sm"
                                            className="h-9 w-9 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-100 dark:border-rose-900/50 bg-white dark:bg-slate-900 rounded-lg transition-colors"
                                            title="تخطي هذه الرسالة"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </Button>
                                        <ContextualMessageButton
                                            applicant={msg.applicant}
                                            trigger={msg.trigger}
                                            variant="inline"
                                            label="إرسال"
                                            onSuccess={onSuccess}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
