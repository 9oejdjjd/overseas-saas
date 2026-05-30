"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";
import { interpolateTemplateVariables, ApplicantSummary } from "@/lib/messagingUtils";

export interface Template {
    id: string;
    name: string;
    body: string;
    trigger?: string;
}

export function useQuickMessageSender(open: boolean, onClose: () => void) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ApplicantSummary[]>([]);
    const [searching, setSearching] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<ApplicantSummary | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);

    // Fetch Templates from API when the sheet opens
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/settings/templates");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setTemplates(data);
                    } else {
                        setTemplates([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch templates", error);
            }
        };
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    // Search Applicants with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                const res = await fetch(`/api/applicants?search=${encodeURIComponent(searchQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.data || []);
                }
            } catch (error) {
                console.error("Failed to search applicants", error);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Helper to interpolate server-side or locally
    const applyTemplateInterpolation = useCallback(async (template: Template, applicant: ApplicantSummary) => {
        if (template.trigger) {
            try {
                const res = await fetch("/api/messages/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        applicantId: applicant.id,
                        trigger: template.trigger,
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessageText(data.message);
                    return;
                }
            } catch (e) {
                console.error("Server-side generation failed, falling back to local", e);
            }
        }

        // Fallback to local interpolation
        setMessageText(interpolateTemplateVariables(template.body, applicant));
    }, []);

    // Handle Template Selection
    const handleTemplateChange = async (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        if (selectedApplicant) {
            await applyTemplateInterpolation(template, selectedApplicant);
        } else {
            setMessageText(template.body);
        }
    };

    // Re-interpolate when applicant changes if a template is already selected
    useEffect(() => {
        if (selectedApplicant && selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                applyTemplateInterpolation(template, selectedApplicant);
            }
        }
    }, [selectedApplicant, selectedTemplateId, templates, applyTemplateInterpolation]);

    const handleSend = async () => {
        if (!selectedApplicant?.phone) {
            toast("لا يوجد رقم هاتف للمتقدم", "error");
            return;
        }

        setSending(true);
        try {
            const sendResponse = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: selectedApplicant.id,
                    trigger: "MANUAL_QUICK_MSG",
                    message: messageText,
                })
            });

            if (!sendResponse.ok) {
                const errData = await sendResponse.json();
                toast(errData.error || "فشل إرسال الرسالة عبر Evolution API", "error");
                return;
            }

            toast("تم إرسال الرسالة بنجاح عبر Evolution API", "success");
            
            // Clean up state
            setSelectedApplicant(null);
            setSelectedTemplateId("");
            setMessageText("");
            setSearchQuery("");
            onClose();

        } catch (e) {
            console.error("Failed to send message", e);
            toast("حدث خطأ في طلب الإرسال", "error");
        } finally {
            setSending(false);
        }
    };

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        searching,
        templates,
        selectedApplicant,
        setSelectedApplicant,
        selectedTemplateId,
        setSelectedTemplateId,
        messageText,
        setMessageText,
        sending,
        handleTemplateChange,
        handleSend
    };
}
