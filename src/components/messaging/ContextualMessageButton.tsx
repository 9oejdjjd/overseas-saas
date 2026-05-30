"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2, Copy, CheckCircle2, Paperclip, FileText, X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContextualMessage } from "@/hooks/messaging/useContextualMessage";
import { useToast } from "@/components/ui/simple-toast";

interface ContextualMessageButtonProps {
    applicant: any;
    ticket?: any;
    trigger: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowCustomAttachment?: boolean; // Allow user to add their own attachment
    requireAttachment?: boolean; // FORCE user to attach a file before sending
    autoGeneratePDF?: boolean; // For ticket - auto generate PDF
    pdfGeneratorRef?: React.RefObject<HTMLDivElement>; // Ref to ticket template for PDF generation
    variant?: "default" | "success" | "mini" | "inline";
    label?: string;
    onSuccess?: () => void;
    className?: string;
}

const TRIGGER_LABELS: Record<string, string> = {
    "ON_REGISTRATION": "تأكيد التسجيل الجديد",
    "ON_DASHBOARD_ACCESS": "بيانات الدخول للمنصة",
    "ON_EXAM_SCHEDULE": "تأكيد حجز الاختبار",
    "ON_EXAM_RESCHEDULE": "تعديل موعد الاختبار",
    "ON_EXAM_CANCEL": "إلغاء حجز الاختبار",
    "ON_EXAM_ABSENT": "تغيب عن الاختبار",
    "ON_EXAM_VOUCHER": "قسيمة اختبار",
    "ON_TICKET_ISSUE": "إصدار تذكرة سفر",
    "ON_TICKET_UPDATE": "تعديل تذكرة سفر",
    "ON_TICKET_CANCEL": "إلغاء تذكرة سفر",
    "ON_TICKET_NO_SHOW": "تغيب عن الرحلة",
    "ON_TICKET_VOUCHER": "قسيمة تذكرة سفر",
    "REMINDER_EXAM_2DAYS": "تذكير اختبار (48 ساعة)",
    "REMINDER_TRAVEL_2DAYS": "تذكير سفر (48 ساعة)",
    "ON_MOCK_EXAM_LINK": "رابط الاختبار التجريبي",
    "ON_MOCK_PASS": "نتيجة اختبار تجريبي (ناجح - مسجل)",
    "ON_MOCK_FAIL": "نتيجة اختبار تجريبي (راسب - مسجل)",
    "ON_MOCK_PASS_VISITOR": "نتيجة اختبار تجريبي (ناجح - زائر)",
    "ON_MOCK_FAIL_VISITOR": "نتيجة اختبار تجريبي (راسب - زائر)",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_CERTIFICATE": "إرسال الشهادة",
    "ON_FAIL": "إشعار نتيجة (لم يجتز)",
    "ON_RETAKE_VOUCHER": "قسيمة تعويضية",
    "ON_FEEDBACK": "طلب تقييم الخدمة",
    "ON_REFERRAL_VOUCHER": "قسيمة تسويقية"
};

export function ContextualMessageButton({
    applicant,
    ticket,
    trigger,
    attachmentUrl,
    attachmentName,
    allowCustomAttachment = false,
    requireAttachment = false,
    autoGeneratePDF = false,
    pdfGeneratorRef,
    variant = "default",
    label,
    onSuccess,
    className,
}: ContextualMessageButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const {
        isOpen,
        setIsOpen,
        loading,
        message,
        setMessage,
        templateName,
        alreadySent,
        checkingStatus,
        customAttachment,
        setCustomAttachment,
        customAttachmentPreview,
        setCustomAttachmentPreview,
        generatedPdfUrl,
        handleGenerate,
        handleSend
    } = useContextualMessage({
        applicant,
        trigger,
        ticket,
        attachmentUrl,
        requireAttachment,
        onSuccess
    });

    const buttonLabel = label || TRIGGER_LABELS[trigger] || "إرسال رسالة";

    const renderDialog = () => {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-bold">
                            <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            {templateName || TRIGGER_LABELS[trigger] || "رسالة"}
                            {alreadySent && (
                                <span className="bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/30 mr-2 font-bold animate-pulse">
                                    تم الإرسال مسبقاً ✅
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            نافذة إرسال رسالة واتساب، قم بمراجعة النص والمرفقات قبل الإرسال.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loading && !message ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-emerald-50/40 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-100/50 dark:border-slate-800 rounded-tr-none shadow-inner">
                                    <textarea
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-800 dark:text-slate-200 text-sm leading-relaxed min-h-[160px] outline-none"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        dir="auto"
                                    />
                                </div>

                                {/* Attachments Section */}
                                <div className="space-y-2">
                                    {/* Pre-defined attachment */}
                                    {(attachmentUrl || generatedPdfUrl) && (
                                        <div className="flex items-center gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/40 rounded-xl text-xs">
                                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span className="text-blue-800 dark:text-blue-300 flex-1 truncate">{attachmentName || "ملف PDF التذكرة"}</span>
                                            <Paperclip className="h-4 w-4 text-blue-400 shrink-0" />
                                        </div>
                                    )}

                                    {/* Custom attachment preview */}
                                    {customAttachment && (
                                        <div className="flex items-center gap-2 p-2 bg-purple-50/55 dark:bg-purple-950/20 border border-purple-100/70 dark:border-purple-900/40 rounded-xl text-xs">
                                            {customAttachment.type.startsWith('image/') ? (
                                                <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                            )}
                                            <span className="text-purple-800 dark:text-purple-300 flex-1 truncate">{customAttachment.name}</span>
                                            <button
                                                onClick={() => {
                                                    setCustomAttachment(null);
                                                    setCustomAttachmentPreview(null);
                                                }}
                                                className="text-purple-400 hover:text-rose-600 p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image preview */}
                                    {customAttachmentPreview && (
                                        <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm max-h-36 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-950">
                                            <img
                                                src={customAttachmentPreview}
                                                alt="معاينة"
                                                className="max-h-32 object-contain rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Add attachment button */}
                                    {allowCustomAttachment && !customAttachment && (
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setCustomAttachment(file);
                                                        if (file.type.startsWith('image/')) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                setCustomAttachmentPreview(ev.target?.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 transition-colors w-full justify-center"
                                            >
                                                <Upload className="h-4 w-4" />
                                                إرفاق صورة أو ملف PDF إضافي
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-mono">
                                    <span>
                                        المستلم: <span>{applicant.whatsappNumber || applicant.phone}</span>
                                    </span>
                                    <span>{message.length} حرف</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(message);
                                toast("تم نسخ نص الرسالة للحافظة", "success");
                            }}
                            className="text-slate-500 dark:text-slate-400 text-xs font-bold"
                        >
                            <Copy className="h-4 w-4 mr-1" /> نسخ النص
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl">إلغاء</Button>
                            <Button 
                                onClick={handleSend} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm rounded-xl text-xs"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        إرسال عبر واتساب
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    if (variant === "mini") {
        return (
            <>
                <Button
                    onClick={handleGenerate}
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full shadow-md transition-all shrink-0",
                        alreadySent
                            ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white",
                        className
                    )}
                    title={alreadySent ? `${buttonLabel} (تم الإرسال)` : buttonLabel}
                    disabled={checkingStatus}
                >
                    {checkingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : alreadySent ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <MessageCircle className="h-4 w-4" />
                    )}
                </Button>
                {renderDialog()}
            </>
        );
    }

    if (variant === "inline") {
        return (
            <>
                <button
                    onClick={handleGenerate}
                    disabled={checkingStatus}
                    className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0",
                        alreadySent
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-100/50 dark:border-emerald-900/30"
                            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
                        className
                    )}
                >
                    {checkingStatus ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : alreadySent ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                        <MessageCircle className="h-3.5 w-3.5" />
                    )}
                    {alreadySent ? "تم الإرسال" : buttonLabel}
                </button>
                {renderDialog()}
            </>
        );
    }

    return (
        <>
            <Button
                onClick={handleGenerate}
                disabled={checkingStatus}
                className={cn(
                    "gap-2 shadow-sm font-bold rounded-xl transition-all shrink-0",
                    alreadySent
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white",
                    className
                )}
                variant={alreadySent ? "outline" : "default"}
            >
                {checkingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : alreadySent ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                    <MessageCircle className="h-4 w-4" />
                )}
                {alreadySent ? `${buttonLabel} ✓` : buttonLabel}
                {attachmentUrl && <Paperclip className="h-3.5 w-3.5 opacity-80" />}
            </Button>
            {renderDialog()}
        </>
    );
}
