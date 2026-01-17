"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageCircle, Wand2, Send, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Global window reference to reuse the same WhatsApp tab
let whatsappWindowRef: Window | null = null;

interface SmartWhatsAppButtonProps {
    applicant: any;
    ticket?: any;
    activityLogs?: any[];
    mini?: boolean;
    onMessageSent?: () => void;
}

export function SmartWhatsAppButton({ applicant, ticket, activityLogs = [], mini = false, onMessageSent }: SmartWhatsAppButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [currentTrigger, setCurrentTrigger] = useState("");
    const [alreadySent, setAlreadySent] = useState(false);

    // Helper to check if a message with this trigger was sent
    const isSent = (trigger: string) => {
        return activityLogs?.some(log =>
            log.action === "MESSAGE_SENT" && log.details?.includes(trigger)
        );
    };

    const determineTrigger = () => {
        // Effective Ticket: specific prop OR applicant.ticket
        const effectiveTicket = ticket || applicant.ticket;

        // Priority 1: Ticket Issued (if not sent)
        if ((applicant.status === "TICKET_ISSUED" || effectiveTicket) && !isSent("ON_TICKET_ISSUED")) return "ON_TICKET_ISSUED";

        // Priority 2: Exam Scheduled (if not sent)
        if ((applicant.status === "EXAM_SCHEDULED" && applicant.examDate) && !isSent("ON_EXAM_SCHEDULE")) return "ON_EXAM_SCHEDULE";

        // Priority 3: Results (if not sent)
        if (applicant.status === "PASSED" && !isSent("ON_PASS")) return "ON_PASS";
        if (applicant.status === "FAILED" && !isSent("ON_FAIL")) return "ON_FAIL";

        // Fallbacks (If everything relevant is sent, or nothing matches)
        if (effectiveTicket) return "ON_TICKET_ISSUED";
        if (applicant.examDate) return "ON_EXAM_SCHEDULE";
        if (applicant.status === "PASSED") return "ON_PASS";

        return "ON_REGISTRATION";
    };

    const handleGenerate = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const trigger = determineTrigger();
            setCurrentTrigger(trigger);
            setAlreadySent(isSent(trigger));

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
                text = text.replace(/{location}/g, applicant.location?.name || "");
                text = text.replace(/{remaining}/g, Number(applicant.remainingBalance).toLocaleString() || "0");

                if (applicant.examDate) {
                    const dateStr = format(new Date(applicant.examDate), "EEEE d MMMM yyyy", { locale: ar });
                    text = text.replace(/{exam_date}/g, dateStr);
                }

                if (effectiveTicket) {
                    text = text.replace(/{ticket_number}/g, effectiveTicket.ticketNumber || "");
                    text = text.replace(/{transport_company}/g, effectiveTicket.transportCompany || "");
                    if (effectiveTicket.departureDate) {
                        const travelDate = format(new Date(effectiveTicket.departureDate), "d MMMM yyyy - h:mm a", { locale: ar });
                        text = text.replace(/{travel_date}/g, travelDate);
                    }
                }

                setMessage(text);
            } else {
                setMessage("لا يوجد قالب معرف لهذه الحالة.");
            }

        } catch (error) {
            console.error(error);
            setMessage("حدث خطأ في توليد الرسالة.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        // Log the sending
        try {
            await fetch(`/api/applicants/${applicant.id}/logs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "MESSAGE_SENT",
                    details: `تم إرسال رسالة واتساب: ${templateName} (${currentTrigger})`,
                })
            });
            if (onMessageSent) onMessageSent();
        } catch (e) {
            console.error("Failed to log message", e);
        }

        const phone = applicant.whatsappNumber || applicant.phone;
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        if (!cleanPhone.startsWith('967')) cleanPhone = '967' + cleanPhone;

        // Use WhatsApp Web directly for faster access (skips the intermediate page)
        const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

        // Reuse the same window/tab if it's still open
        if (whatsappWindowRef && !whatsappWindowRef.closed) {
            whatsappWindowRef.location.href = url;
            whatsappWindowRef.focus();
        } else {
            whatsappWindowRef = window.open(url, 'whatsapp_chat');
        }

        setIsOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleGenerate}
                className={mini ? "h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600 shadow-md" : "bg-green-600 hover:bg-green-700 gap-2 shadow-sm text-white"}
                variant={mini ? "ghost" : "default"}
                title="إرسال واتساب ذكي"
            >
                {mini ? <MessageCircle className="h-4 w-4 text-white" /> : <><Wand2 className="h-4 w-4" /> مراسلة واتساب</>}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            تجهيز الرسالة ({templateName})
                            {alreadySent && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200 mr-2">تم الإرسال مسبقاً ✅</span>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-green-500 h-8 w-8" /></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 rounded-tr-none">
                                    <textarea
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 text-sm leading-relaxed min-h-[150px]"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 px-1">
                                    <span>سيتم الإرسال إلى: <span className="font-bold font-mono">{applicant.whatsappNumber || applicant.phone}</span></span>
                                    <span>{message.length} حرف</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(message); alert('تم النسخ'); }} className="text-gray-500">
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
        </>
    );
}
