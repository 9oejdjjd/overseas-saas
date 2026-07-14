"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Wand2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTemplatesManager, Template } from "@/hooks/messaging/useTemplatesManager";

export function TemplatesManager() {
    const {
        templates,
        loading,
        selectedTemplate,
        setSelectedTemplate,
        isEditModalOpen,
        setIsEditModalOpen,
        isSaving,
        handleEdit,
        handleCreateNew,
        handleSave
    } = useTemplatesManager();

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">قوالب الرسائل التلقائية</h3>
                    <p className="text-xs text-slate-500 mt-0.5">تعديل وإضافة الصيغ النصية التي تُرسل تلقائياً للمتقدمين عند تغير حالتهم.</p>
                </div>
                <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md shadow-emerald-100 dark:shadow-none transition-all">
                    <Plus className="h-4.5 w-4.5" /> قالب جديد
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tmpl: Template) => (
                    <Card key={tmpl.id} className="flex flex-col h-full border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-200/80 dark:hover:border-emerald-900/60 hover:shadow-md transition-all duration-300 group">
                        <div className="p-4 flex-1 flex flex-col space-y-3">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-150 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">{tmpl.name}</h4>
                                <Badge variant="outline" className="font-mono text-[9px] bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 shrink-0">
                                    {tmpl.trigger}
                                </Badge>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 flex-1 whitespace-pre-wrap overflow-y-auto max-h-36 border border-slate-100/50 dark:border-slate-900/50">
                                {tmpl.body}
                            </div>
                            <div className="pt-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full gap-1.5 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold transition-all text-xs" 
                                    onClick={() => handleEdit(tmpl)}
                                >
                                    <Edit2 className="h-3.5 w-3.5" /> تعديل القالب
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                            {selectedTemplate?.id === "new" ? "إنشاء قالب جديد" : "تعديل قالب الرسالة"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم القالب</Label>
                                <Input
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                    value={selectedTemplate?.name || ""}
                                    onChange={e => setSelectedTemplate((prev: Template | null) => prev ? { ...prev, name: e.target.value } : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">المعرّف (Trigger)</Label>
                                <Input
                                    value={selectedTemplate?.trigger || ""}
                                    onChange={e => setSelectedTemplate((prev: Template | null) => prev ? { ...prev, trigger: e.target.value } : null)}
                                    className="font-mono text-left bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end flex-wrap gap-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">نص الرسالة</Label>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    المتغيرات المتاحة: {'{name}, {examDate}, {locationName}, {password}'}
                                </span>
                            </div>
                            <Textarea
                                className="min-h-[120px] font-sans leading-relaxed text-sm pt-3 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl p-4"
                                value={selectedTemplate?.body || ""}
                                onChange={e => setSelectedTemplate((prev: Template | null) => prev ? { ...prev, body: e.target.value } : null)}
                                dir="auto"
                            />
                        </div>

                        {/* Variants Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">صيغ بديلة للقالب (اختياري)</Label>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-[10px] gap-1"
                                    onClick={() => {
                                        setSelectedTemplate((prev: Template | null) => {
                                            if (!prev) return null;
                                            return { ...prev, variants: [...(prev.variants || []), ""] };
                                        });
                                    }}
                                >
                                    <Plus className="h-3 w-3" /> إضافة صيغة بديلة
                                </Button>
                            </div>
                            
                            {selectedTemplate?.variants?.map((variant, index) => (
                                <div key={index} className="relative group">
                                    <Textarea
                                        className="min-h-[80px] font-sans leading-relaxed text-sm pt-3 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl p-4 pr-10"
                                        value={variant}
                                        placeholder={`الصيغة البديلة رقم ${index + 1}`}
                                        onChange={e => {
                                            const newVariants = [...(selectedTemplate.variants || [])];
                                            newVariants[index] = e.target.value;
                                            setSelectedTemplate((prev: Template | null) => prev ? { ...prev, variants: newVariants } : null);
                                        }}
                                        dir="auto"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const newVariants = [...(selectedTemplate.variants || [])];
                                            newVariants.splice(index, 1);
                                            setSelectedTemplate((prev: Template | null) => prev ? { ...prev, variants: newVariants } : null);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs p-3.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 flex flex-col gap-2.5 items-start">
                            <div className="flex gap-2.5 items-start">
                                <Wand2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                <p className="leading-relaxed font-bold">ميزة التنويع الديناميكي (لتجنب الحظر):</p>
                            </div>
                            <ul className="list-disc list-inside space-y-1.5 mr-6 text-[11px] leading-relaxed">
                                <li>يمكنك إضافة <strong>صيغ بديلة كاملة</strong> باستخدام الزر أعلاه، وسيختار النظام إحداها عشوائياً.</li>
                                <li>يمكنك استخدام صيغة <strong>Spintax</strong> داخل أي نص. مثال: <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded text-emerald-900 dark:text-emerald-200">{' {مرحباً|أهلاً|حياك الله} يا {name} '}</code> وسيتم اختيار كلمة عشوائية منها عند كل إرسال.</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">إلغاء</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 shadow-md shadow-emerald-150 rounded-xl"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 ml-1.5 animate-spin" />}
                            حفظ القالب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
