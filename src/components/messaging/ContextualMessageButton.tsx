"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2, Copy, CheckCircle2, Paperclip, FileText, X, Upload, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [alreadySent, setAlreadySent] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Attachment states
    const [customAttachment, setCustomAttachment] = useState<File | null>(null);
    const [customAttachmentPreview, setCustomAttachmentPreview] = useState<string | null>(null);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Check if this message was already sent
    useEffect(() => {
        const checkSentStatus = async () => {
            try {
                const res = await fetch(`/api/messages?applicantId=${applicant.id}&trigger=${trigger}`);
                const data = await res.json();
                setAlreadySent(data.messages?.some((m: any) => m.status === "SENT") || false);
            } catch (e) {
                console.error("Failed to check message status", e);
            } finally {
                setCheckingStatus(false);
            }
        };
        checkSentStatus();
    }, [applicant.id, trigger]);

    const handleGenerate = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            // Use Backend Engine to Parse Template
            const response = await fetch("/api/messages/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    trigger,
                    ticketId: ticket?.id,
                    // Pass additional custom variables here if needed
                    customVars: {
                        discountAmount: "---", // To be filled optionally by parent components if needed 
                        voucherCode: "---",
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                setMessage(errData.error || "خطأ في توليد الرسالة من الخادم.");
                setTemplateName("");
                return;
            }

            const data = await response.json();
            setTemplateName(data.templateName);
            setMessage(data.message);

        } catch (error) {
            console.error(error);
            setMessage("حدث خطأ في توليد الرسالة.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        // Enforce attachment requirement
        if (requireAttachment && !customAttachment) {
            toast("يرجى إرفاق الملف المطلوب قبل الإرسال", "error");
            return;
        }

        setLoading(true);
        let finalMessage = message;
        if (attachmentUrl) {
            finalMessage += `\n\n📎 الملف المرفق:\n${attachmentUrl}`;
        }

        // Process custom attachment if any
        let base64Data = null;
        let fileName = null;

        if (customAttachment) {
            try {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(customAttachment);
                });
                fileName = customAttachment.name;
            } catch (err) {
                console.error("Failed to read attachment", err);
                toast("فشل في قراءة المرفق", "error");
                setLoading(false);
                return;
            }
        }

        try {
            const sendResponse = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    trigger,
                    message: finalMessage,
                    attachments: attachmentUrl ? [attachmentUrl] : null,
                    customAttachmentBase64: base64Data,
                    customAttachmentName: fileName
                })
            });

            if (!sendResponse.ok) {
                const errData = await sendResponse.json();
                toast(errData.error || "فشل إرسال الرسالة عبر Evolution API", "error");
                setLoading(false);
                return;
            }

            toast("تم إرسال الرسالة بنجاح عبر Evolution API", "success");
            setIsOpen(false);
            setAlreadySent(true);
            if (onSuccess) onSuccess();

        } catch (e) {
            console.error("Failed to send message", e);
            toast("حدث خطأ في طلب الإرسال", "error");
        } finally {
            setLoading(false);
        }
    };

    const buttonLabel = label || TRIGGER_LABELS[trigger] || "إرسال رسالة";

    // Render based on variant
    if (variant === "mini") {
        return (
            <>
                <Button
                    onClick={handleGenerate}
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full shadow-md transition-all",
                        alreadySent
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-500"
                            : "bg-green-500 hover:bg-green-600 text-white",
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
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors",
                        alreadySent
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-emerald-500 text-white hover:bg-emerald-600",
                        className
                    )}
                >
                    {checkingStatus ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : alreadySent ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <MessageCircle className="h-3 w-3" />
                    )}
                    {alreadySent ? "تم الإرسال" : buttonLabel}
                </button>
                {renderDialog()}
            </>
        );
    }

    if (variant === "success") {
        return (
            <>
                <Button
                    onClick={handleGenerate}
                    disabled={checkingStatus}
                    className={cn(
                        "gap-2 shadow-sm transition-all",
                        alreadySent
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                            : "bg-green-600 hover:bg-green-700 text-white",
                        className
                    )}
                    variant={alreadySent ? "outline" : "default"}
                >
                    {checkingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : alreadySent ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                        <MessageCircle className="h-4 w-4" />
                    )}
                    {alreadySent ? `${buttonLabel} ✓` : buttonLabel}
                    {attachmentUrl && <Paperclip className="h-3 w-3 opacity-70" />}
                </Button>
                {renderDialog()}
            </>
        );
    }

    // Default variant
    return (
        <>
            <Button
                onClick={handleGenerate}
                disabled={checkingStatus}
                className={cn(
                    "gap-2 shadow-sm",
                    alreadySent
                        ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                        : "bg-green-600 hover:bg-green-700 text-white",
                    className
                )}
                variant={alreadySent ? "outline" : "default"}
            >
                {checkingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : alreadySent ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <MessageCircle className="h-4 w-4" />
                )}
                {alreadySent ? `${buttonLabel} ✓` : buttonLabel}
                {attachmentUrl && <Paperclip className="h-3 w-3 opacity-70" />}
            </Button>
            {renderDialog()}
        </>
    );

    function renderDialog() {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            {templateName || TRIGGER_LABELS[trigger] || "رسالة"}
                            {alreadySent && (
                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200">
                                    تم الإرسال مسبقاً ✅
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            نافذة إرسال رسالة واتساب، قم بمراجعة النص والمرفقات قبل الإرسال.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-green-500 h-8 w-8" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 rounded-tr-none">
                                    <textarea
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 text-sm leading-relaxed min-h-[150px] outline-none"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        dir="auto"
                                    />
                                </div>

                                {/* Attachments Section */}
                                <div className="space-y-2">
                                    {/* Pre-defined attachment */}
                                    {(attachmentUrl || generatedPdfUrl) && (
                                        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            <span className="text-blue-800 flex-1">{attachmentName || "ملف PDF التذكرة"}</span>
                                            <Paperclip className="h-4 w-4 text-blue-400" />
                                        </div>
                                    )}

                                    {/* Custom attachment preview */}
                                    {customAttachment && (
                                        <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                                            {customAttachment.type.startsWith('image/') ? (
                                                <ImageIcon className="h-4 w-4 text-purple-600" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-purple-600" />
                                            )}
                                            <span className="text-purple-800 flex-1 truncate">{customAttachment.name}</span>
                                            <button
                                                onClick={() => {
                                                    setCustomAttachment(null);
                                                    setCustomAttachmentPreview(null);
                                                }}
                                                className="text-purple-400 hover:text-purple-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image preview */}
                                    {customAttachmentPreview && (
                                        <div className="relative">
                                            <img
                                                src={customAttachmentPreview}
                                                alt="معاينة"
                                                className="max-h-40 rounded-lg border shadow-sm mx-auto"
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
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                <Upload className="h-4 w-4" />
                                                إرفاق صورة أو ملف PDF
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-xs text-gray-500 px-1">
                                    <span>
                                        سيتم الإرسال إلى: <span className="font-bold font-mono">{applicant.whatsappNumber || applicant.phone}</span>
                                    </span>
                                    <span>{message.length} حرف</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(message);
                                alert('تم النسخ');
                            }}
                            className="text-gray-500"
                        >
                            <Copy className="h-4 w-4 mr-1" /> نسخ النص
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 gap-2">
                                <Send className="h-4 w-4" />
                                إرسال عبر واتساب
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
}
