"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2, Copy, CheckCircle2, Paperclip, FileText, X, Upload, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Global window reference to reuse the same WhatsApp tab
let whatsappWindowRef: Window | null = null;

interface ContextualMessageButtonProps {
    applicant: any;
    ticket?: any;
    trigger: string;
    attachmentUrl?: string;
    attachmentName?: string;
    allowCustomAttachment?: boolean; // Allow user to add their own attachment
    autoGeneratePDF?: boolean; // For ticket - auto generate PDF
    pdfGeneratorRef?: React.RefObject<HTMLDivElement>; // Ref to ticket template for PDF generation
    variant?: "default" | "success" | "mini" | "inline";
    label?: string;
    onSuccess?: () => void;
    className?: string;
}

const TRIGGER_LABELS: Record<string, string> = {
    "ON_ACCOUNT_CREATED": "رسالة الترحيب",
    "ON_EXAM_SCHEDULED": "تأكيد موعد الاختبار",
    "ON_EXAM_MODIFIED": "تعديل موعد الاختبار",
    "ON_EXAM_ABSENT": "تسجيل غياب",
    "ON_TICKET_ISSUED": "تفاصيل التذكرة",
    "ON_TICKET_MODIFIED": "تعديل التذكرة",
    "ON_TICKET_CANCELLED": "إلغاء التذكرة",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_FAIL": "رسالة تشجيع",
    "ON_EXAM_REMINDER": "تذكير بالاختبار",
    "ON_TRAVEL_REMINDER": "تذكير بالسفر",
    "ON_REGISTRATION": "تأكيد التسجيل",
    "ON_CERTIFICATE_SENT": "إرسال الشهادة",
};

export function ContextualMessageButton({
    applicant,
    ticket,
    trigger,
    attachmentUrl,
    attachmentName,
    allowCustomAttachment = false,
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
            const res = await fetch("/api/settings/templates");
            const templates = await res.json();

            const template = templates.find((t: any) => t.trigger === trigger);

            if (template) {
                setTemplateName(template.name);
                let text = template.body;

                const effectiveTicket = ticket || applicant.ticket;

                // Variable Replacement
                text = text.replace(/{name}/g, applicant.fullName || "");
                text = text.replace(/{applicant_code}/g, applicant.applicantCode || "");
                text = text.replace(/{phone}/g, applicant.phone || "");
                text = text.replace(/{profession}/g, applicant.profession || "");
                text = text.replace(/{location}/g, applicant.location?.name || applicant.examLocation || "");
                text = text.replace(/{location_address}/g, applicant.location?.address || "");
                text = text.replace(/{location_url}/g, applicant.location?.locationUrl || "");
                text = text.replace(/{remaining}/g, Number(applicant.remainingBalance || 0).toLocaleString());
                text = text.replace(/{email}/g, applicant.platformEmail || "");
                text = text.replace(/{password}/g, applicant.platformPassword || "");

                if (applicant.examDate) {
                    const dateStr = format(new Date(applicant.examDate), "EEEE d MMMM yyyy", { locale: ar });
                    text = text.replace(/{exam_date}/g, dateStr);
                }
                if (applicant.examTime) {
                    text = text.replace(/{exam_time}/g, applicant.examTime);
                }

                if (effectiveTicket) {
                    text = text.replace(/{ticket_number}/g, effectiveTicket.ticketNumber || "");
                    text = text.replace(/{transport_company}/g, effectiveTicket.transportCompany || "");
                    text = text.replace(/{departure_location}/g, effectiveTicket.departureLocation || "");
                    text = text.replace(/{arrival_location}/g, effectiveTicket.arrivalLocation || "");
                    text = text.replace(/{bus_number}/g, effectiveTicket.busNumber || "");
                    text = text.replace(/{seat_number}/g, effectiveTicket.seatNumber || "");
                    if (effectiveTicket.departureDate) {
                        const travelDate = format(new Date(effectiveTicket.departureDate), "EEEE d MMMM yyyy", { locale: ar });
                        text = text.replace(/{travel_date}/g, travelDate);
                    }
                }

                setMessage(text);
            } else {
                setMessage(`لا يوجد قالب معرف لهذا النوع: ${trigger}\n\nيرجى إنشاء قالب جديد من صفحة قوالب الرسائل.`);
            }

        } catch (error) {
            console.error(error);
            setMessage("حدث خطأ في توليد الرسالة.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        // Log the message to database
        try {
            await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    trigger,
                    channel: "WHATSAPP",
                    message,
                    attachments: attachmentUrl ? [attachmentUrl] : null,
                    status: "SENT",
                })
            });
        } catch (e) {
            console.error("Failed to log message", e);
        }

        // Open WhatsApp
        const phone = applicant.whatsappNumber || applicant.phone;
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        if (!cleanPhone.startsWith('967')) cleanPhone = '967' + cleanPhone;

        let finalMessage = message;
        if (attachmentUrl) {
            finalMessage += `\n\n📎 الملف المرفق:\n${attachmentUrl}`;
        }

        // Use WhatsApp Web directly for faster access (skips the intermediate page)
        const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(finalMessage)}`;

        // Reuse the same window/tab if it's still open
        if (whatsappWindowRef && !whatsappWindowRef.closed) {
            whatsappWindowRef.location.href = url;
            whatsappWindowRef.focus();
        } else {
            whatsappWindowRef = window.open(url, 'whatsapp_chat');
        }

        setIsOpen(false);
        setAlreadySent(true);
        if (onSuccess) onSuccess();
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
