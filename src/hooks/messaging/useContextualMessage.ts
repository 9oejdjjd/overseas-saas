"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

interface UseContextualMessageProps {
    applicant: any;
    trigger: string;
    ticket?: any;
    attachmentUrl?: string;
    requireAttachment?: boolean;
    onSuccess?: () => void;
}

export function useContextualMessage({
    applicant,
    trigger,
    ticket,
    attachmentUrl,
    requireAttachment = false,
    onSuccess
}: UseContextualMessageProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [alreadySent, setAlreadySent] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Custom Attachment states
    const [customAttachment, setCustomAttachment] = useState<File | null>(null);
    const [customAttachmentPreview, setCustomAttachmentPreview] = useState<string | null>(null);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Check if this message was already sent
    const checkSentStatus = useCallback(async () => {
        if (!applicant?.id || !trigger) {
            setCheckingStatus(false);
            return;
        }
        
        try {
            setCheckingStatus(true);
            const res = await fetch(`/api/messages?applicantId=${applicant.id}&trigger=${trigger}`);
            if (res.ok) {
                const data = await res.json();
                const isSent = data.messages?.some((m: any) => m.status === "SENT") || false;
                setAlreadySent(isSent);
            }
        } catch (e) {
            console.error("Failed to check message status", e);
        } finally {
            setCheckingStatus(false);
        }
    }, [applicant?.id, trigger]);

    useEffect(() => {
        checkSentStatus();
    }, [checkSentStatus]);

    const handleGenerate = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const response = await fetch("/api/messages/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    trigger,
                    ticketId: ticket?.id,
                    customVars: {
                        discountAmount: "---", 
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
            console.error("Error generating template content:", error);
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
                base64Data = await new Promise<string>((resolve, reject) => {
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
            
            // Clean up custom attachments
            setCustomAttachment(null);
            setCustomAttachmentPreview(null);
            
            if (onSuccess) onSuccess();
        } catch (e) {
            console.error("Failed to send message", e);
            toast("حدث خطأ في طلب الإرسال", "error");
        } finally {
            setLoading(false);
        }
    };

    return {
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
        setGeneratedPdfUrl,
        generatingPdf,
        setGeneratingPdf,
        handleGenerate,
        handleSend,
        checkSentStatus
    };
}
