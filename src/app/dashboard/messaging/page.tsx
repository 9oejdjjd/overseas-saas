"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Send,
    Clock,
    CheckCircle2,
    Search,
    RefreshCw,
    Users,
    TrendingUp,
    Loader2,
    AlertCircle,
    MessageSquare,
    XCircle,
    Trash2,
} from "lucide-react";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

interface MessageLog {
    id: string;
    applicantId: string;
    trigger: string;
    channel: string;
    message: string;
    status: string;
    sentAt: string;
    createdAt: string;
    applicant: {
        id: string;
        fullName: string;
        phone: string;
        whatsappNumber: string;
        applicantCode: string;
        status: string;
    };
}

interface PendingMessage {
    messageLogId?: string;
    applicantId: string;
    applicant: {
        fullName: string;
        phone: string;
        whatsappNumber: string;
        applicantCode: string;
    };
    trigger: string;
    triggerLabel: string;
    priority: number;
    isRetry?: boolean;
    createdAt?: string;
}

interface Stats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    sentToday: number;
}

const TRIGGER_LABELS: Record<string, string> = {
    "ON_REGISTRATION": "تأكيد التسجيل",
    "ON_DASHBOARD_ACCESS": "بيانات الدخول للمنصة",
    "ON_EXAM_SCHEDULE": "تأكيد موعد الاختبار",
    "ON_EXAM_RESCHEDULE": "تعديل موعد الاختبار",
    "ON_EXAM_CANCEL": "إلغاء حجز الاختبار",
    "ON_EXAM_ABSENT": "تغيب عن الاختبار",
    "ON_EXAM_VOUCHER": "قسيمة اختبار",
    "ON_TICKET_ISSUE": "تفاصيل التذكرة",
    "ON_TICKET_UPDATE": "تعديل التذكرة",
    "ON_TICKET_CANCEL": "إلغاء التذكرة",
    "ON_TICKET_NO_SHOW": "تغيب عن الرحلة",
    "ON_TICKET_VOUCHER": "قسيمة تذكرة سفر",
    "ON_TICKET_ATTENDED": "حضور الرحلة",
    "REMINDER_EXAM_2DAYS": "تذكير اختبار (48 ساعة)",
    "REMINDER_TRAVEL_2DAYS": "تذكير سفر (48 ساعة)",
    "ON_MOCK_EXAM_LINK": "رابط الاختبار التجريبي",
    "ON_MOCK_PASS": "نجاح اختبار تجريبي (مسجل)",
    "ON_MOCK_FAIL": "رسوب اختبار تجريبي (مسجل)",
    "ON_MOCK_PASS_VISITOR": "نجاح اختبار تجريبي (زائر)",
    "ON_MOCK_FAIL_VISITOR": "رسوب اختبار تجريبي (زائر)",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_CERTIFICATE": "إرسال الشهادة",
    "ON_FAIL": "إشعار نتيجة (راسب)",
    "ON_RETAKE_VOUCHER": "قسيمة تعويضية",
    "ON_FEEDBACK": "طلب تقييم الخدمة",
    "ON_REFERRAL_VOUCHER": "قسيمة تسويقية",
    "MANUAL_QUICK_MSG": "رسالة سريعة يدوية",
};

import { QuickMessageSender } from "@/components/messaging/QuickMessageSender";
import { TemplatesManager } from "@/components/messaging/TemplatesManager";

export default function MessagingPage() {
    const [messages, setMessages] = useState<MessageLog[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0, sentToday: 0 });
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    // Quick Message State
    const [quickMessageOpen, setQuickMessageOpen] = useState(false);

    const fetchData = async () => {
        // ... (existing logic)
        setLoading(true);
        try {
            const messagesRes = await fetch("/api/messages");
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages || []);
            setStats(prev => ({ ...prev, ...messagesData.stats }));

            const pendingRes = await fetch("/api/messages/pending");
            const pendingData = await pendingRes.json();
            setPendingMessages(pendingData.pending || []);
            setStats(prev => ({ ...prev, pending: pendingData.count || 0 }));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ... (filters)
    const filteredMessages = messages.filter(m =>
        (m.applicant?.fullName || "زائر (اختبار تجريبي)").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.trigger?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPending = pendingMessages.filter(m =>
        (m.applicant?.fullName || "زائر (اختبار تجريبي)").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.triggerLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBulkAction = async (action: 'retry' | 'delete') => {
        setLoading(true);
        try {
            const method = action === 'retry' ? 'POST' : 'DELETE';
            const body = action === 'retry' ? JSON.stringify({ retryAll: true }) : undefined;
            const url = action === 'delete' ? '/api/messages/retry?all=true' : '/api/messages/retry';
            
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });
            await fetchData();
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            setLoading(false);
        }
    };

    const handleSingleAction = async (action: 'retry' | 'delete', messageLogId: string) => {
        try {
            const method = action === 'retry' ? 'POST' : 'DELETE';
            const body = action === 'retry' ? JSON.stringify({ messageLogId }) : undefined;
            const url = action === 'delete' ? `/api/messages/retry?id=${messageLogId}` : '/api/messages/retry';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });
            fetchData();
        } catch (error) {
            console.error(`Single ${action} failed:`, error);
        }
    };

    const handleDismissPending = async (applicantId: string, trigger: string) => {
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantId,
                    trigger,
                    message: 'تم التخطي يدوياً',
                    status: 'DISMISSED',
                    channel: 'WHATSAPP',
                })
            });
            fetchData();
        } catch (error) {
            console.error('Dismiss pending failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-7 w-7 text-green-600" />
                        مركز الرسائل
                    </h1>
                    <p className="text-gray-500 mt-1">إدارة وتتبع جميع رسائل واتساب للمتقدمين</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setQuickMessageOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 shadow-md">
                        <Send className="h-4 w-4" />
                        إرسال رسالة سريعة
                    </Button>
                    <Button onClick={fetchData} variant="outline" className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>
            </div>

            {/* Quick Message Sender Component */}
            <QuickMessageSender open={quickMessageOpen} onClose={() => setQuickMessageOpen(false)} />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatsCard
                    title="رسائل معلقة"
                    value={stats.pending}
                    icon={Clock}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <StatsCard
                    title="أُرسلت اليوم"
                    value={stats.sentToday}
                    icon={Send}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatsCard
                    title="إجمالي المُرسل"
                    value={stats.sent}
                    icon={CheckCircle2}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <StatsCard
                    title="رسائل فاشلة"
                    value={stats.failed}
                    icon={XCircle}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <StatsCard
                    title="معدل النجاح"
                    value={stats.total > 0 ? `${Math.round((stats.sent / stats.total) * 100)}%` : "100%"}
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle className="text-lg">سجل الرسائل</CardTitle>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b px-4 py-2 bg-gray-50/30">
                            <TabsList className="grid w-full max-w-2xl grid-cols-4">
                                <TabsTrigger value="pending" className="gap-2">
                                    <Clock className="h-4 w-4" />
                                    معلقة
                                    {stats.pending > 0 && (
                                        <Badge variant="destructive" className="mr-1 text-[10px] px-1.5">
                                            {stats.pending}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="sent" className="gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    مُرسلة
                                </TabsTrigger>
                                <TabsTrigger value="all" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    الكل
                                </TabsTrigger>
                                <TabsTrigger value="templates" className="gap-2 font-bold text-blue-700 data-[state=active]:bg-blue-100/50">
                                    <MessageSquare className="h-4 w-4" />
                                    قوالب الرسائل
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Pending Messages Tab */}
                        <TabsContent value="pending" className="m-0">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : filteredPending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <CheckCircle2 className="h-12 w-12 mb-2 opacity-30" />
                                    <p>لا توجد رسائل معلقة 🎉</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Bulk Actions Header (Only show if there are actual retry-able messages) */}
                                    {filteredPending.some(m => m.isRetry) && (
                                        <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                                يوجد {filteredPending.filter(m => m.isRetry).length} رسالة فاشلة بانتظار إعادة الإرسال
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    onClick={() => handleBulkAction('delete')}
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                                                >
                                                    <XCircle className="w-4 h-4 ml-2" /> حذف الكل
                                                </Button>
                                                <Button 
                                                    onClick={() => handleBulkAction('retry')}
                                                    size="sm"
                                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                                                >
                                                    <RefreshCw className="w-4 h-4 ml-2" /> إعادة إرسال الكل
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="divide-y">
                                        {filteredPending.map((msg, idx) => (
                                            <div
                                                key={`${msg.applicantId}-${msg.trigger}-${idx}`}
                                                className={`flex items-center justify-between p-4 transition-colors ${msg.isRetry ? 'bg-orange-50/30 hover:bg-orange-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${msg.isRetry ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {msg.applicant?.fullName?.charAt(0) || "ز"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900">{msg.applicant?.fullName || "زائر (اختبار تجريبي)"}</p>
                                                            {msg.isRetry && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">فشل الإرسال</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                            <span className="font-mono text-xs">{msg.applicant?.applicantCode || "VISITOR"}</span>
                                                            <span>•</span>
                                                            <span className={msg.isRetry ? 'text-orange-700 font-medium' : ''}>{msg.triggerLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {msg.isRetry && msg.createdAt && (
                                                         <span className="text-xs text-gray-400 hidden md:block" dir="ltr">
                                                             {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}
                                                         </span>
                                                    )}
                                                    
                                                    {!msg.isRetry && (
                                                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 shrink-0">
                                                            <Clock className="h-3 w-3 ml-1" /> جدولة
                                                        </Badge>
                                                    )}

                                                    {msg.isRetry && msg.messageLogId ? (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => handleSingleAction('delete', msg.messageLogId!)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
                                                                title="حذف"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleSingleAction('retry', msg.messageLogId!)}
                                                                size="sm"
                                                                className="h-8 gap-1 bg-orange-600 hover:bg-orange-700 font-bold px-3 text-xs"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> إعادة
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => handleDismissPending(msg.applicantId, msg.trigger)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
                                                                title="تخطي هذه الرسالة"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            <ContextualMessageButton
                                                                applicant={msg.applicant}
                                                                trigger={msg.trigger}
                                                                variant="inline"
                                                                label="إرسال"
                                                                onSuccess={fetchData}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Sent Messages Tab */}
                        <TabsContent value="sent" className="m-0">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : filteredMessages.filter(m => m.status === "SENT").length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                                    <p>لا توجد رسائل مُرسلة</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredMessages.filter(m => m.status === "SENT").map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                                                    {msg.applicant?.fullName?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{msg.applicant?.fullName || "زائر (اختبار تجريبي)"}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{TRIGGER_LABELS[msg.trigger] || msg.trigger}</span>
                                                        <span>•</span>
                                                        <span>{new Date(msg.sentAt).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 hidden md:block">
                                                    {new Date(msg.sentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                                    تم الإرسال
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* All Messages Tab */}
                        <TabsContent value="all" className="m-0">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : filteredMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                                    <p>لا توجد رسائل</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${msg.status === "SENT" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {msg.applicant?.fullName?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{msg.applicant?.fullName || "زائر (اختبار تجريبي)"}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{TRIGGER_LABELS[msg.trigger] || msg.trigger}</span>
                                                        <span>•</span>
                                                        <span>{new Date(msg.createdAt).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 hidden md:block">
                                                    {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        msg.status === "SENT"
                                                            ? "text-green-600 border-green-200 bg-green-50"
                                                            : msg.status === "FAILED"
                                                            ? "text-red-600 border-red-200 bg-red-50"
                                                            : "text-gray-600 border-gray-200 bg-gray-50"
                                                    }
                                                >
                                                    {msg.status === "SENT" ? (
                                                        <>
                                                            <CheckCircle2 className="h-3 w-3 ml-1" />
                                                            تم الإرسال
                                                        </>
                                                    ) : msg.status === "FAILED" ? (
                                                        <>
                                                            <XCircle className="h-3 w-3 ml-1" />
                                                            فشل
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-3 w-3 ml-1" />
                                                            {msg.status}
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Templates Tab */}
                        <TabsContent value="templates" className="m-0 border-t border-gray-100 bg-white">
                            <div className="p-2 md:p-6 min-h-[600px]">
                                <TemplatesManager />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, bg }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    bg: string;
}) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
