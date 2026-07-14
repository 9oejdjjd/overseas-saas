"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export interface Template {
    id: string;
    name: string;
    trigger: string;
    body: string;
    variants?: string[];
    active: boolean;
}

export function useTemplatesManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            } else {
                throw new Error("Failed to load templates");
            }
        } catch (error) {
            console.error("Failed to load templates:", error);
            toast("فشل تحميل القوالب", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleEdit = (template: Template) => {
        setSelectedTemplate(template);
        setIsEditModalOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedTemplate({
            id: "new",
            name: "قالب جديد",
            trigger: "CUSTOM_TRIGGER",
            body: "مرحبا {name}...",
            variants: [],
            active: true
        });
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/settings/templates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedTemplate)
            });
            if (!res.ok) throw new Error("Failed to save");
            
            toast("تم حفظ القالب بنجاح", "success");
            setIsEditModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error("Failed to save template:", error);
            toast("حدث خطأ أثناء الحفظ", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNew = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/settings/templates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: selectedTemplate.name,
                    trigger: selectedTemplate.trigger,
                    body: selectedTemplate.body,
                    variants: selectedTemplate.variants,
                    type: "WHATSAPP",
                })
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create");
            }
            
            toast("تم إنشاء القالب بنجاح", "success");
            setIsEditModalOpen(false);
            fetchTemplates();
        } catch (error: any) {
            console.error("Failed to create template:", error);
            toast(error.message || "فشل إنشاء القالب", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return {
        templates,
        loading,
        selectedTemplate,
        setSelectedTemplate,
        isEditModalOpen,
        setIsEditModalOpen,
        isSaving,
        handleEdit,
        handleCreateNew,
        handleSave: selectedTemplate?.id === "new" ? handleSaveNew : handleSave,
        refresh: fetchTemplates
    };
}
