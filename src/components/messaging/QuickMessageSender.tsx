"use client";

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
import { Search, Send, User, Wand2, Loader2 } from "lucide-react";
import { useQuickMessageSender } from "@/hooks/messaging/useQuickMessageSender";

interface QuickMessageProps {
    open: boolean;
    onClose: () => void;
}

export function QuickMessageSender({ open, onClose }: QuickMessageProps) {
    const {
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
    } = useQuickMessageSender(open, onClose);

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                <SheetHeader className="space-y-1.5">
                    <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-xl font-bold">
                        <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        إرسال رسالة سريعة
                    </SheetTitle>
                    <SheetDescription className="text-slate-500 dark:text-slate-400 text-sm">
                        ابحث عن متقدم، اختر قالباً من النظام، وسيتم تعبئة البيانات تلقائياً مع تعويض المتغيرات.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* 1. Applicant Search */}
                    <div className="space-y-2 relative">
                        <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">المتقدم</Label>
                        <div className="relative">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="ابحث بالاسم، الرقم، أو الكود..."
                                className="pr-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchQuery("")}
                            />
                            {searching && <Loader2 className="absolute left-3 top-3 h-5 w-5 animate-spin text-emerald-500" />}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && searchQuery.length > 1 && !selectedApplicant && (
                            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl mt-2 max-h-56 overflow-y-auto z-50 absolute w-full left-0 right-0 py-1 divide-y divide-slate-50 dark:divide-slate-900 animate-slide-in">
                                {searchResults.map((app: any) => (
                                    <div
                                        key={app.id}
                                        className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex justify-between items-center transition-colors"
                                        onClick={() => {
                                            setSelectedApplicant(app);
                                            setSearchResults([]);
                                            setSearchQuery("");
                                        }}
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{app.fullName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{app.applicantCode} • {app.phone}</p>
                                        </div>
                                        <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Applicant Card */}
                        {selectedApplicant && (
                            <div className="bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/35 rounded-2xl p-4 flex justify-between items-center mt-3 shadow-inner animate-fade-in group hover:border-emerald-200/80 transition-all">
                                <div>
                                    <p className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">{selectedApplicant.fullName}</p>
                                    <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 font-mono mt-0.5">{selectedApplicant.applicantCode} • {selectedApplicant.phone}</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 font-bold px-3 rounded-lg" 
                                    onClick={() => {
                                        setSelectedApplicant(null);
                                        setSelectedTemplateId("");
                                        setMessageText("");
                                    }}
                                >
                                    تغيير المتقدم
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 2. Template Selection */}
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">قالب الرسالة</Label>
                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue placeholder="اختر نوع الرسالة..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                {templates.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                                {templates.length === 0 && (
                                    <div className="p-2 text-xs text-slate-400 text-center">لا توجد قوالب مخزنة</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Message Editor */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">نص الرسالة</Label>
                            {selectedApplicant && selectedTemplateId && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-900/30 animate-pulse">
                                    <Wand2 className="h-3 w-3" /> تم تعويض المتغيرات
                                </span>
                            )}
                        </div>
                        <Textarea
                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 min-h-[180px] font-sans leading-relaxed text-slate-800 dark:text-slate-200 text-sm focus-visible:ring-emerald-500 rounded-2xl p-4"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            dir="auto"
                        />
                        <div className="text-[11px] text-slate-400 leading-normal">
                            تلميح: سيقوم محرك الرسائل تلقائياً باستبدال {'{name}'} و {'{password}'} و {'{examDate}'} ببيانات المتقدم المختار.
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-col sm:flex-row gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-11 rounded-xl">إلغاء</Button>
                    <Button
                        onClick={handleSend}
                        className="w-full sm:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md hover:shadow-lg rounded-xl transition-all"
                        disabled={!selectedApplicant || !messageText || sending}
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Send className="h-4.5 w-4.5" />
                                إرسال عبر واتساب (تلقائي)
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
