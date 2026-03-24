import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/simple-toast";

interface Template {
    id: string;
    name: string;
    trigger: string;
    body: string;
    active: boolean;
}

export function TemplatesManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/templates");
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
            toast("فشل تحميل القوالب", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleEdit = (template: Template) => {
        setSelectedTemplate(template);
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/settings/templates`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedTemplate)
            });
            if (!res.ok) throw new Error("Failed to save");
            toast("تم حفظ القالب بنجاح", "success");
            setIsEditModalOpen(false);
            fetchTemplates();
        } catch (error) {
            toast("حدث خطأ أثناء الحفظ", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedTemplate({
            id: "new",
            name: "قالب جديد",
            trigger: "CUSTOM_TRIGGER",
            body: "مرحبا {name}...",
            active: true
        });
        setIsEditModalOpen(true);
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
            toast(error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">إدارة قوالب الرسائل</h3>
                <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="h-4 w-4" /> قالب جديد
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map(tmpl => (
                    <Card key={tmpl.id} className="flex flex-col h-full border hover:border-green-200 transition-colors">
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 line-clamp-1">{tmpl.name}</h4>
                                <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-500">
                                    {tmpl.trigger}
                                </Badge>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4 flex-1 whitespace-pre-wrap overflow-y-auto max-h-32">
                                {tmpl.body}
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Button variant="outline" size="sm" className="w-full gap-2 text-blue-600 hover:text-blue-700" onClick={() => handleEdit(tmpl)}>
                                    <Edit2 className="h-4 w-4" /> تعديل
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedTemplate?.id === "new" ? "إنشاء قالب جديد" : "تعديل القالب"}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم القالب</Label>
                                <Input
                                    value={selectedTemplate?.name || ""}
                                    onChange={e => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>المعرّف (Trigger)</Label>
                                <Input
                                    value={selectedTemplate?.trigger || ""}
                                    onChange={e => setSelectedTemplate(prev => prev ? { ...prev, trigger: e.target.value } : null)}
                                    className="font-mono text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <Label>نص الرسالة</Label>
                                <span className="text-[11px] text-gray-500 font-mono">
                                    المتغيرات المتاحة: {'{name}, {examDate}, {location}...'}
                                </span>
                            </div>
                            <Textarea
                                className="min-h-[200px] font-sans leading-relaxed text-base pt-3"
                                value={selectedTemplate?.body || ""}
                                onChange={e => setSelectedTemplate(prev => prev ? { ...prev, body: e.target.value } : null)}
                                dir="auto"
                            />
                        </div>

                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex gap-2">
                            <Wand2 className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>يتم تعويض المتغيرات المحاطة بأقواس {'{}'} تلقائياً ببيانات المتقدم عند الإرسال.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
                        <Button
                            onClick={selectedTemplate?.id === "new" ? handleSaveNew : handleSave}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            حفظ القالب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
