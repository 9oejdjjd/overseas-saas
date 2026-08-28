"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SmtpManager } from "@/components/emails/SmtpManager";
import { useToast } from "@/components/ui/simple-toast";
import {
    Mail, Send, Clock, CheckCircle2, XCircle, Search, RefreshCw, Loader2,
    Settings, Eye, RefreshCwIcon, Edit2, Info, AlertTriangle, Layers, BookOpen, Plus
} from "lucide-react";

export default function EmailsDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    // Tab control
    const [activeTab, setActiveTab] = useState("logs");

    // Logs state
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        sentCount: 0,
        failedCount: 0,
        failedToday: 0,
        successRate: 100
    });
    const [triggers, setTriggers] = useState<string[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [triggerFilter, setTriggerFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Selected log for viewing details
    const [viewingLog, setViewingLog] = useState<any>(null);
    const [resendingLogId, setResendingLogId] = useState<string | null>(null);

    // Templates state
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);

    // Quick send state
    const [quickSendOpen, setQuickSendOpen] = useState(false);
    const [sendingQuickMail, setSendingQuickMail] = useState(false);
    const [quickMailData, setQuickMailData] = useState({
        to: "",
        subject: "",
        html: ""
    });

    // Access control
    useEffect(() => {
        if (status === "authenticated" && session?.user.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [session, status, router]);

    // Fetch logs
    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                search: searchTerm,
                status: statusFilter,
                trigger: triggerFilter
            });
            const res = await fetch(`/api/emails/logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setStats(data.stats);
                setTotalPages(data.pagination.totalPages);
                setTriggers(data.triggers);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Fetch templates
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await fetch("/api/templates");
            if (res.ok) {
                const data = await res.json();
                // Filter templates with type "EMAIL"
                // If there are none, we will display placeholders that users can create
                const emailTemplates = data.filter((t: any) => t.type === "EMAIL");
                setTemplates(emailTemplates);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        if (activeTab === "logs") {
            fetchLogs();
        } else if (activeTab === "templates") {
            fetchTemplates();
        }
    }, [activeTab, page, statusFilter, triggerFilter]);

    // Handle search click/enter
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    // Resend failed email
    const handleResend = async (logId: string) => {
        setResendingLogId(logId);
        try {
            const res = await fetch("/api/emails/logs/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast("تمت إعادة إرسال البريد الإلكتروني بنجاح.", "success");
                fetchLogs();
            } else {
                throw new Error(data.error || "فشل إعادة الإرسال");
            }
        } catch (err: any) {
            toast("فشل إعادة الإرسال: " + err.message, "error");
        } finally {
            setResendingLogId(null);
        }
    };

    // Save edited template
    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.body) {
            toast("يرجى ملء جميع الحقول المطلوبة لتعديل القالب.", "error");
            return;
        }

        setSavingTemplate(true);
        try {
            const res = await fetch(`/api/templates/${editingTemplate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingTemplate.name,
                    subject: editingTemplate.subject,
                    body: editingTemplate.body,
                    active: editingTemplate.active
                })
            });
            if (res.ok) {
                toast("تم حفظ قالب البريد الإلكتروني بنجاح.", "success");
                setEditingTemplate(null);
                fetchTemplates();
            } else {
                const data = await res.json();
                throw new Error(data.error || "فشل حفظ القالب");
            }
        } catch (err: any) {
            toast("فشل حفظ القالب: " + err.message, "error");
        } finally {
            setSavingTemplate(false);
        }
    };

    // Initialize an email template
    const handleCreateDefaultTemplate = async (trigger: string, name: string) => {
        setLoadingTemplates(true);
        try {
            let defaultBody = "";
            let defaultSubject = "";

            if (trigger === "ON_OTP") {
                defaultSubject = "رمز التحقق الخاص بك — الاختبار التجريبي";
                defaultBody = `مرحباً بك، {name}\n\nرمز التحقق (OTP) الخاص بك هو: {otp}\n\nهذا الرمز صالح لمدة 5 دقائق فقط.`;
            } else if (trigger === "ON_MOCK_EXAM_LINK") {
                defaultSubject = "رابط اختبارك التجريبي لمهنة {profession} — بوابة الاعتماد المهني";
                defaultBody = `مرحباً بك، {name}\n\nرابط اختبارك التجريبي لمهنة {profession} جاهز:\n{examLink}\n\nنتمنى لك التوفيق.`;
            } else if (trigger === "ON_MOCK_RESULT") {
                defaultSubject = "نتيجة اختبارك التجريبي لمهنة {profession} — بوابة الاعتماد المهني";
                defaultBody = `مرحباً بك، {name}\n\nنتيجة اختبارك التجريبي لمهنة {profession}:\n{resultText}\n\n{scoreDetails}`;
            }

            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type: "EMAIL",
                    trigger,
                    subject: defaultSubject,
                    body: defaultBody,
                    active: true
                })
            });
            if (res.ok) {
                toast("تم إنشاء قالب البريد الافتراضي بنجاح.", "success");
                fetchTemplates();
            }
        } catch (err) {
            console.error("Failed to create template:", err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Quick Send email handler
    const handleQuickSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickMailData.to || !quickMailData.subject || !quickMailData.html) {
            toast("يرجى ملء جميع الحقول المطلوبة للإرسال السريع.", "error");
            return;
        }

        setSendingQuickMail(true);
        try {
            const res = await fetch("/api/emails/quick-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(quickMailData)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast("تم إرسال البريد الإلكتروني السريع بنجاح.", "success");
                setQuickSendOpen(false);
                setQuickMailData({ to: "", subject: "", html: "" });
                fetchLogs();
            } else {
                throw new Error(data.error || "فشل الإرسال");
            }
        } catch (err: any) {
            toast("فشل الإرسال: " + err.message, "error");
        } finally {
            setSendingQuickMail(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-400 font-bold animate-pulse">جاري التحقق من الصلاحيات...</p>
            </div>
        );
    }

    if (!session || session.user.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-slate-100 rounded-3xl shadow-sm w-full" dir="rtl">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-lg font-bold text-slate-800 mb-2">عذراً، الوصول غير مصرح به</h2>
                <p className="text-slate-500 text-xs max-w-md">
                    هذه الصفحة مخصصة لمدير النظام فقط.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-2 text-right" dir="rtl">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                        <Mail className="h-7 w-7 text-indigo-600" />
                        لوحة إدارة البريد الإلكتروني
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                        مراقبة البريد الصادر، تعديل قوالب الرسائل، إدارة خوادم SMTP، وإرسال بريد سريع.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button 
                        onClick={() => setQuickSendOpen(true)}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl text-xs shadow-md"
                    >
                        <Send className="h-4 w-4" />
                        إرسال بريد سريع
                    </Button>
                    <Button 
                        onClick={() => {
                            if (activeTab === "logs") fetchLogs();
                            else if (activeTab === "templates") fetchTemplates();
                        }}
                        variant="outline"
                        className="gap-2 h-10 rounded-xl border-slate-200"
                    >
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                        تحديث
                    </Button>
                </div>
            </div>

            {/* Email Statistics Section (Active on Logs/Settings) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-slate-100 bg-white shadow-none rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-xs font-bold">إجمالي البريد الصادر</span>
                            <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500">
                            <Mail className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="border border-slate-100 bg-white shadow-none rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-xs font-bold">نسبة نجاح الإرسال</span>
                            <h3 className="text-2xl font-black text-emerald-600">{stats.successRate}%</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="border border-slate-100 bg-white shadow-none rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-xs font-bold">إجمالي البريد الفاشل</span>
                            <h3 className="text-2xl font-black text-red-650">{stats.failedCount}</h3>
                        </div>
                        <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                            <XCircle className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="border border-slate-100 bg-white shadow-none rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-xs font-bold">فشل اليوم (آخر 24 ساعة)</span>
                            <h3 className="text-2xl font-black text-amber-600">{stats.failedToday}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs List */}
            <Card className="border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-slate-100 bg-slate-50/50 p-4">
                        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 rounded-xl p-1 h-10">
                            <TabsTrigger value="logs" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white">
                                <Clock className="h-3.5 w-3.5" />
                                سجلات البريد
                            </TabsTrigger>
                            <TabsTrigger value="templates" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white">
                                <Edit2 className="h-3.5 w-3.5" />
                                قوالب البريد
                            </TabsTrigger>
                            <TabsTrigger value="smtp" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white">
                                <Settings className="h-3.5 w-3.5" />
                                خوادم SMTP
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <CardContent className="p-5">
                        {/* Tab Content: Logs */}
                        <TabsContent value="logs" className="space-y-4 m-0">
                            {/* Search Filters */}
                            <form onSubmit={handleSearch} className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="ابحث بالمرسل إليه، العنوان..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pr-10 h-10 text-xs rounded-xl bg-white focus-visible:ring-indigo-500"
                                        />
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                        className="h-10 text-xs px-3 border border-slate-200 rounded-xl bg-white focus-visible:ring-indigo-500"
                                    >
                                        <option value="ALL">كل الحالات</option>
                                        <option value="SENT">المرسلة بنجاح</option>
                                        <option value="FAILED">الفاشلة</option>
                                    </select>

                                    <select
                                        value={triggerFilter}
                                        onChange={(e) => { setTriggerFilter(e.target.value); setPage(1); }}
                                        className="h-10 text-xs px-3 border border-slate-200 rounded-xl bg-white focus-visible:ring-indigo-500"
                                    >
                                        <option value="ALL">كل التنبيهات</option>
                                        {triggers.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs h-10 px-5">
                                    تصفية وبحث
                                </Button>
                            </form>

                            {/* Logs Table */}
                            {loadingLogs ? (
                                <div className="flex flex-col items-center py-20 gap-3">
                                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                    <span className="text-xs text-slate-400">جاري تحميل سجلات البريد الإلكتروني...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 text-xs font-bold border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                                    لا توجد سجلات بريد إلكتروني مطابقة لخيارات البحث المحددة.
                                </div>
                            ) : (
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-650">
                                                <th className="p-4">المرسل إليه</th>
                                                <th className="p-4">موضوع الرسالة</th>
                                                <th className="p-4">الزناد / التنبيه</th>
                                                <th className="p-4">الحالة</th>
                                                <th className="p-4">خادم SMTP المستخدم</th>
                                                <th className="p-4">تاريخ الإرسال</th>
                                                <th className="p-4 text-left">العمليات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-semibold text-slate-700">{log.recipient}</td>
                                                    <td className="p-4 max-w-[200px] truncate text-slate-600">{log.subject}</td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200">
                                                            {log.trigger || "إرسال يدوي"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        {log.status === "SENT" ? (
                                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                                                تم الإرسال
                                                            </span>
                                                        ) : (
                                                            <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 w-max">
                                                                فشل الإرسال
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-450">{log.senderEmail || "—"}</td>
                                                    <td className="p-4 text-slate-500">
                                                        {new Date(log.sentAt).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" })}
                                                    </td>
                                                    <td className="p-4 text-left flex justify-end gap-2.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setViewingLog(log)}
                                                            className="h-8 text-[11px] rounded-lg gap-1 hover:bg-slate-100"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            معاينة
                                                        </Button>

                                                        {log.status === "FAILED" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleResend(log.id)}
                                                                className="h-8 text-[11px] rounded-lg border-indigo-200 hover:bg-indigo-50 text-indigo-700 gap-1.5"
                                                                disabled={resendingLogId === log.id}
                                                            >
                                                                {resendingLogId === log.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <RefreshCwIcon className="h-3 w-3" />
                                                                )}
                                                                إعادة محاولة
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <span className="text-xs text-slate-500">صفحة {page} من {totalPages}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="h-9 px-3 rounded-lg text-xs"
                                        >
                                            السابق
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="h-9 px-3 rounded-lg text-xs"
                                        >
                                            التالي
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Tab Content: Templates */}
                        <TabsContent value="templates" className="space-y-6 m-0">
                            {loadingTemplates ? (
                                <div className="flex flex-col items-center py-20 gap-3">
                                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                    <span className="text-xs text-slate-400">جاري تحميل قوالب البريد الإلكتروني...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Alert to explain templates */}
                                    <div className="bg-blue-50 text-blue-800 p-4 border border-blue-150 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed">
                                        <Info className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">ملاحظة هامة عن قوالب البريد الإلكتروني:</span>
                                            <p className="mt-1">
                                                النظام يعتمد تلقائياً على قوالب HTML تفاعلية ومصممة باحترافية لإرسال الرسائل. عندما تقوم بإنشاء أو تفعيل قالب مخصص هنا، سيقوم النظام باستخدامه فوراً واستبدال المتغيرات المضمنة بداخله (مثل موضوع الرسالة ومحتواها). إذا قمت بحذف قالب مخصص، سيعود النظام للعمل بالقالب المدمج الافتراضي تلقائياً.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Grid of Available templates */}
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Template 1: ON_OTP */}
                                        <Card className="border border-slate-100 rounded-2xl shadow-none">
                                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        رمز التحقق المؤقت (OTP)
                                                        <Badge variant="outline" className="text-[9px]">ON_OTP</Badge>
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px]">القالب المستخدم لإرسال كود تسجيل الدخول أو فحص الهوية عبر البريد.</CardDescription>
                                                </div>
                                                {templates.some(t => t.trigger === "ON_OTP") ? (
                                                    <Button
                                                        onClick={() => setEditingTemplate(templates.find(t => t.trigger === "ON_OTP"))}
                                                        size="sm"
                                                        className="h-8 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-900 gap-1.5"
                                                    >
                                                        <Edit2 className="h-3 w-3" /> تعديل القالب
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleCreateDefaultTemplate("ON_OTP", "رمز التحقق OTP (بريد)")}
                                                        size="sm"
                                                        className="h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs gap-1.5"
                                                    >
                                                        <Plus className="h-3 w-3" /> إنشاء قالب مخصص
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="text-[11px] text-slate-400 space-y-2 border-t border-slate-50 pt-3">
                                                <div className="flex gap-2"><span className="font-bold text-slate-600">المتغيرات المدعومة:</span> <span>{`{name} (الاسم)، {otp} (الرمز)، {profession} (المهنة)`}</span></div>
                                            </CardContent>
                                        </Card>

                                        {/* Template 2: ON_MOCK_EXAM_LINK */}
                                        <Card className="border border-slate-100 rounded-2xl shadow-none">
                                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        رابط الاختبار التجريبي (Mock Exam Link)
                                                        <Badge variant="outline" className="text-[9px]">ON_MOCK_EXAM_LINK</Badge>
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px]">القالب المستخدم لإرسال رابط وجلسة الاختبار التجريبي للمتقدمين.</CardDescription>
                                                </div>
                                                {templates.some(t => t.trigger === "ON_MOCK_EXAM_LINK") ? (
                                                    <Button
                                                        onClick={() => setEditingTemplate(templates.find(t => t.trigger === "ON_MOCK_EXAM_LINK"))}
                                                        size="sm"
                                                        className="h-8 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-900 gap-1.5"
                                                    >
                                                        <Edit2 className="h-3 w-3" /> تعديل القالب
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleCreateDefaultTemplate("ON_MOCK_EXAM_LINK", "رابط الاختبار التجريبي (بريد)")}
                                                        size="sm"
                                                        className="h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs gap-1.5"
                                                    >
                                                        <Plus className="h-3 w-3" /> إنشاء قالب مخصص
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="text-[11px] text-slate-400 space-y-2 border-t border-slate-50 pt-3">
                                                <div className="flex gap-2"><span className="font-bold text-slate-600">المتغيرات المدعومة:</span> <span>{`{name} (الاسم)، {profession} (المهنة)، {examLink} (رابط الاختبار)`}</span></div>
                                            </CardContent>
                                        </Card>

                                        {/* Template 3: ON_MOCK_RESULT */}
                                        <Card className="border border-slate-100 rounded-2xl shadow-none">
                                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        نتيجة الاختبار التجريبي (Mock Exam Result)
                                                        <Badge variant="outline" className="text-[9px]">ON_MOCK_RESULT</Badge>
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px]">القالب المستخدم لإرسال التقييم والدرجة وتفاصيل النتيجة بعد إنهاء الاختبار.</CardDescription>
                                                </div>
                                                {templates.some(t => t.trigger === "ON_MOCK_RESULT") ? (
                                                    <Button
                                                        onClick={() => setEditingTemplate(templates.find(t => t.trigger === "ON_MOCK_RESULT"))}
                                                        size="sm"
                                                        className="h-8 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-900 gap-1.5"
                                                    >
                                                        <Edit2 className="h-3 w-3" /> تعديل القالب
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleCreateDefaultTemplate("ON_MOCK_RESULT", "نتيجة الاختبار التجريبي (بريد)")}
                                                        size="sm"
                                                        className="h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs gap-1.5"
                                                    >
                                                        <Plus className="h-3 w-3" /> إنشاء قالب مخصص
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="text-[11px] text-slate-400 space-y-2 border-t border-slate-50 pt-3">
                                                <div className="flex gap-2"><span className="font-bold text-slate-600">المتغيرات المدعومة:</span> <span>{`{name} (الاسم)، {profession} (المهنة)، {resultText} (الحالة)، {resultUrl} (رابط التقرير)، {scoreDetails} (الدرجات)`}</span></div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Tab Content: SMTP Setup */}
                        <TabsContent value="smtp" className="m-0">
                            <SmtpManager />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            {/* Modal: View Email Log HTML Body */}
            {viewingLog && (
                <Dialog open={!!viewingLog} onOpenChange={(open) => !open && setViewingLog(null)}>
                    <DialogContent className="max-w-2xl rounded-3xl" dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-slate-800 font-bold text-sm">تفاصيل ومعاينة الرسالة البريدية</DialogTitle>
                            <DialogDescription className="text-xs">سجل رسالة البريد للمستلم {viewingLog.recipient}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 my-2 text-right">
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 text-xs">
                                <div><span className="font-bold text-slate-400">العنوان:</span> <span className="text-slate-700 font-semibold">{viewingLog.subject}</span></div>
                                <div><span className="font-bold text-slate-400">الزناد:</span> <span className="text-slate-700 font-semibold">{viewingLog.trigger || "إرسال يدوي"}</span></div>
                                <div><span className="font-bold text-slate-400">المرسل:</span> <span className="text-slate-750 font-semibold">{viewingLog.senderEmail || "—"}</span></div>
                            </div>

                            {viewingLog.status === "FAILED" && viewingLog.error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-semibold text-red-750 flex items-start gap-2 animate-fade-in">
                                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">خطأ تقني في خادم البريد:</span>
                                        <p className="mt-1 leading-relaxed">{viewingLog.error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400">محتوى البريد الإلكتروني (HTML View)</Label>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 min-h-[300px] max-h-[400px] overflow-y-auto p-4" dir="ltr">
                                    <div dangerouslySetInnerHTML={{ __html: viewingLog.body }} />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="justify-end gap-2 text-right">
                            <Button variant="outline" onClick={() => setViewingLog(null)} className="h-10 rounded-xl text-xs">إغلاق</Button>
                            {viewingLog.status === "FAILED" && (
                                <Button 
                                    onClick={() => { handleResend(viewingLog.id); setViewingLog(null); }}
                                    className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs h-10 px-5"
                                >
                                    إعادة الإرسال الآن
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal: Edit Email Template */}
            {editingTemplate && (
                <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                    <DialogContent className="max-w-2xl rounded-3xl" dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-slate-800 font-bold text-sm">تعديل قالب البريد الإلكتروني</DialogTitle>
                            <DialogDescription className="text-xs">تحديث الموضوع والنص المخصص لتنبيه {editingTemplate.name}</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveTemplate} className="space-y-4 my-2 text-right">
                            <div className="space-y-1.5">
                                <Label htmlFor="tmpl-subject" className="text-xs font-bold text-slate-700">موضوع البريد الإلكتروني (Subject)</Label>
                                <Input
                                    id="tmpl-subject"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    className="h-10 text-xs rounded-xl focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="tmpl-body" className="text-xs font-bold text-slate-700">محتوى البريد الإلكتروني (HTML/Text)</Label>
                                <Textarea
                                    id="tmpl-body"
                                    value={editingTemplate.body}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                    className="min-h-[250px] text-xs rounded-xl focus-visible:ring-indigo-500 font-mono"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
                                <div className="space-y-1">
                                    <span className="font-bold flex items-center gap-1"><Info className="h-3.5 w-3.5 text-indigo-600" /> المتغيرات المدعومة للتعبئة التلقائية:</span>
                                    <p>
                                        رمز التحقق: <code className="bg-slate-200 px-1 rounded">{`{otp}`}</code> | 
                                        الاسم: <code className="bg-slate-200 px-1 rounded">{`{name}`}</code> | 
                                        المهنة: <code className="bg-slate-200 px-1 rounded">{`{profession}`}</code> | 
                                        الرابط: <code className="bg-slate-200 px-1 rounded">{`{examLink}`}</code>
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="justify-end gap-2 pt-3 border-t border-slate-50">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setEditingTemplate(null)} 
                                    className="h-10 rounded-xl text-xs font-bold"
                                    disabled={savingTemplate}
                                >
                                    إلغاء
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-5 gap-2"
                                    disabled={savingTemplate}
                                >
                                    {savingTemplate && <Loader2 className="h-4 w-4 animate-spin" />}
                                    حفظ القالب
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal: Quick Send Mail */}
            {quickSendOpen && (
                <Dialog open={quickSendOpen} onOpenChange={setQuickSendOpen}>
                    <DialogContent className="max-w-2xl rounded-3xl" dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-slate-800 font-bold text-sm">إرسال بريد إلكتروني فوري (Quick Mail)</DialogTitle>
                            <DialogDescription className="text-xs">إرسال رسالة بريدية يدوية ومباشرة من خوادم النظام النشطة.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleQuickSend} className="space-y-4 my-2 text-right">
                            <div className="space-y-1.5">
                                <Label htmlFor="qs-to" className="text-xs font-bold text-slate-700">المرسل إليه (Recipient Email)</Label>
                                <Input
                                    id="qs-to"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={quickMailData.to}
                                    onChange={(e) => setQuickMailData({ ...quickMailData, to: e.target.value })}
                                    className="h-10 text-xs rounded-xl text-left focus-visible:ring-indigo-500"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="qs-subject" className="text-xs font-bold text-slate-700">موضوع الرسالة (Subject)</Label>
                                <Input
                                    id="qs-subject"
                                    placeholder="أدخل عنوان موضوع البريد"
                                    value={quickMailData.subject}
                                    onChange={(e) => setQuickMailData({ ...quickMailData, subject: e.target.value })}
                                    className="h-10 text-xs rounded-xl focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="qs-html" className="text-xs font-bold text-slate-700">محتوى البريد الإلكتروني (HTML/Text)</Label>
                                <Textarea
                                    id="qs-html"
                                    placeholder="أدخل نص الرسالة أو كود HTML البريدي هنا..."
                                    value={quickMailData.html}
                                    onChange={(e) => setQuickMailData({ ...quickMailData, html: e.target.value })}
                                    className="min-h-[200px] text-xs rounded-xl focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>

                            <DialogFooter className="justify-end gap-2 pt-3 border-t border-slate-50">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setQuickSendOpen(false)} 
                                    className="h-10 rounded-xl text-xs font-bold"
                                    disabled={sendingQuickMail}
                                >
                                    إلغاء
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold h-10 px-5 gap-2"
                                    disabled={sendingQuickMail}
                                >
                                    {sendingQuickMail && <Loader2 className="h-4 w-4 animate-spin" />}
                                    إرسال الآن
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}
