"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Send, User, Wand2, Loader2, Copy } from "lucide-react";
import { useToast } from "@/components/ui/simple-toast";

interface QuickMessageProps {
    open: boolean;
    onClose: () => void;
}

interface ApplicantSummary {
    id: string;
    fullName: string;
    phone: string;
    applicantCode: string;
    platformEmail?: string;
    platformPassword?: string;
    examDate?: string;
    whatsappNumber?: string;
}

interface Template {
    id: string;
    name: string;
    body: string;
    trigger?: string;
}

export function QuickMessageSender({ open, onClose }: QuickMessageProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ApplicantSummary[]>([]);
    const [searching, setSearching] = useState(false);

    // Templates State
    const [templates, setTemplates] = useState<Template[]>([]);

    const [selectedApplicant, setSelectedApplicant] = useState<ApplicantSummary | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [messageText, setMessageText] = useState("");

    // Fetch Templates from API
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
        if (open) fetchTemplates();
    }, [open]);

    // Search Applicants
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                // We use the main applicants API but filter fields
                const res = await fetch(`/api/applicants?search=${searchQuery}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle Template Selection & Interpolation
    const handleTemplateChange = async (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        // If applicant is selected and template has a trigger, use server-side generation
        if (selectedApplicant && template.trigger) {
            try {
                const res = await fetch("/api/messages/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        applicantId: selectedApplicant.id,
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

        // Fallback: use local interpolation for templates without triggers or if server fails
        if (selectedApplicant) {
            setMessageText(interpolate(template.body, selectedApplicant));
        } else {
            setMessageText(template.body);
        }
    };

    // Re-interpolate when applicant changes if template is selected
    useEffect(() => {
        if (selectedApplicant && selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template?.trigger) {
                // Re-generate via server
                fetch("/api/messages/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        applicantId: selectedApplicant.id,
                        trigger: template.trigger,
                    })
                }).then(res => res.ok ? res.json() : null)
                  .then(data => data && setMessageText(data.message))
                  .catch(() => setMessageText(interpolate(template.body, selectedApplicant)));
            } else if (template) {
                setMessageText(interpolate(template.body, selectedApplicant));
            }
        }
    }, [selectedApplicant]);

    const interpolate = (text: string, applicant: ApplicantSummary) => {
        if (!text) return "";

        // Helper for date formatting
        const formatDate = (date: string | Date) => {
            if (!date) return "";
            return new Date(date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
        };

        const app = applicant as any;
        const cityName = app.location?.name || "";
        const centerName = app.examCenter?.name || "";
        const address = app.examCenter?.address || app.location?.address || "";
        const mapUrl = app.examCenter?.locationUrl || app.location?.locationUrl || "";

        return text
            .replace(/{name}|{fullName}/g, applicant.fullName.split(' ')[0])
            .replace(/{code}|{applicantCode}/g, applicant.applicantCode || '?')
            .replace(/{email}/g, applicant.platformEmail || '(لا يوجد إيميل)')
            .replace(/{password}/g, applicant.platformPassword || '(غير متوفر)')
            .replace(/{phone}/g, applicant.phone || '')
            .replace(/{profession}/g, app.profession || '')
            .replace(/{remaining}/g, Number(app.remainingBalance || 0).toLocaleString())

            // Location Mapping
            .replace(/{location}|{city}|{examLocation}/g, cityName)
            .replace(/{centerName}|{center_name}/g, centerName)
            .replace(/{locationName}|{location_name}/g, app.location?.name || "")
            .replace(/{locationAddress}|{location_address}/g, address)
            .replace(/{locationUrl}|{location_url}/g, mapUrl)

            // Date & Time
            .replace(/{examDate}|{exam_date}/g, applicant.examDate ? formatDate(applicant.examDate) : '(لم يحدد)')
            .replace(/{examTime}|{exam_time}/g, app.examTime || "");
    };

    const handleSend = async () => {
        if (!selectedApplicant?.phone) {
            toast("لا يوجد رقم هاتف للمتقدم", "error");
            return;
        }

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
            onClose();

        } catch (e) {
            console.error("Failed to send message", e);
            toast("حدث خطأ في طلب الإرسال", "error");
        }
    };

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-green-600" />
                        إرسال رسالة سريعة
                    </SheetTitle>
                    <SheetDescription>
                        ابحث عن متقدم، اختر قالباً من النظام، وسيتم تعبئة البيانات تلقائياً.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* 1. Applicant Search */}
                    <div className="space-y-2">
                        <Label>المتقدم</Label>
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="ابحث بالاسم، الرقم، أو الكود..."
                                className="pr-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchQuery("")}
                            />
                            {searching && <Loader2 className="absolute left-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && searchQuery.length > 1 && !selectedApplicant && (
                            <div className="bg-white border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto z-50 absolute w-full sm:w-[500px]">
                                {searchResults.map(app => (
                                    <div
                                        key={app.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                                        onClick={() => {
                                            setSelectedApplicant(app);
                                            setSearchResults([]);
                                            setSearchQuery("");
                                        }}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{app.fullName}</p>
                                            <p className="text-xs text-gray-500">{app.applicantCode} • {app.phone}</p>
                                        </div>
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Applicant Card */}
                        {selectedApplicant && (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex justify-between items-center mt-2">
                                <div>
                                    <p className="font-bold text-green-800">{selectedApplicant.fullName}</p>
                                    <p className="text-xs text-green-600">{selectedApplicant.applicantCode} • {selectedApplicant.phone}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs hover:text-red-600" onClick={() => setSelectedApplicant(null)}>
                                    تغيير
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 2. Template Selection */}
                    <div className="space-y-2">
                        <Label>القالب</Label>
                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الرسالة..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                                {templates.length === 0 && (
                                    <div className="p-2 text-xs text-gray-400 text-center">لا توجد قوالب مخزنة</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Message Editor */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>نص الرسالة</Label>
                            {selectedApplicant && selectedTemplateId && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Wand2 className="h-3 w-3" /> تم تعويض المتغيرات
                                </span>
                            )}
                        </div>
                        <Textarea
                            className="bg-gray-50 min-h-[150px] font-sans leading-relaxed text-base"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            dir="auto"
                        />
                        <div className="text-xs text-gray-400">
                            تلميح: يتم استبدال {'{name}'} و {'{password}'} تلقائياً.
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">إلغاء</Button>
                    <Button
                        onClick={handleSend}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 gap-2"
                        disabled={!selectedApplicant || !messageText}
                    >
                        <Send className="h-4 w-4" />
                        إرسال عبر واتساب (تلقائي)
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
