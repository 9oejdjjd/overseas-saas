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
}

interface Stats {
    total: number;
    sent: number;
    pending: number;
    sentToday: number;
}

const TRIGGER_LABELS: Record<string, string> = {
    "ON_ACCOUNT_CREATED": "رسالة الترحيب",
    "ON_EXAM_SCHEDULED": "تأكيد موعد الاختبار",
    "ON_TICKET_ISSUED": "تفاصيل التذكرة",
    "ON_TICKET_MODIFIED": "تعديل التذكرة",
    "ON_TICKET_CANCELLED": "إلغاء التذكرة",
    "ON_PASS": "تهنئة بالنجاح",
    "ON_FAIL": "رسالة تشجيع",
    "ON_EXAM_REMINDER": "تذكير بالاختبار",
    "ON_TRAVEL_REMINDER": "تذكير بالسفر",
    "ON_REGISTRATION": "تأكيد التسجيل",
};

export default function MessagingPage() {
    const [messages, setMessages] = useState<MessageLog[]>([]);
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, pending: 0, sentToday: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch sent messages
            const messagesRes = await fetch("/api/messages");
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages || []);
            setStats(prev => ({
                ...prev,
                total: messagesData.stats?.total || 0,
                sent: messagesData.stats?.sent || 0,
                sentToday: messagesData.stats?.sentToday || 0,
            }));

            // Fetch pending messages
            const pendingRes = await fetch("/api/messages/pending");
            const pendingData = await pendingRes.json();
            setPendingMessages(pendingData.pending || []);
            setStats(prev => ({
                ...prev,
                pending: pendingData.count || 0,
            }));
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredMessages = messages.filter(m =>
        m.applicant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.trigger?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPending = pendingMessages.filter(m =>
        m.applicant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.triggerLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Button onClick={fetchData} variant="outline" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    تحديث
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <TabsList className="grid w-full max-w-md grid-cols-3">
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
                                <div className="divide-y">
                                    {filteredPending.map((msg, idx) => (
                                        <div
                                            key={`${msg.applicantId}-${msg.trigger}-${idx}`}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                                    {msg.applicant.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{msg.applicant.fullName}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span className="font-mono text-xs">{msg.applicant.applicantCode}</span>
                                                        <span>•</span>
                                                        <span>{msg.triggerLabel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                    <Clock className="h-3 w-3 ml-1" />
                                                    معلق
                                                </Badge>
                                                <ContextualMessageButton
                                                    applicant={msg.applicant}
                                                    trigger={msg.trigger}
                                                    variant="inline"
                                                    label="إرسال"
                                                    onSuccess={fetchData}
                                                />
                                            </div>
                                        </div>
                                    ))}
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
                                                    <p className="font-medium text-gray-900">{msg.applicant?.fullName}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{TRIGGER_LABELS[msg.trigger] || msg.trigger}</span>
                                                        <span>•</span>
                                                        <span>{new Date(msg.sentAt).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                <CheckCircle2 className="h-3 w-3 ml-1" />
                                                تم الإرسال
                                            </Badge>
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
                                                    <p className="font-medium text-gray-900">{msg.applicant?.fullName}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{TRIGGER_LABELS[msg.trigger] || msg.trigger}</span>
                                                        <span>•</span>
                                                        <span>{new Date(msg.createdAt).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    msg.status === "SENT"
                                                        ? "text-green-600 border-green-200 bg-green-50"
                                                        : "text-gray-600 border-gray-200 bg-gray-50"
                                                }
                                            >
                                                {msg.status === "SENT" ? (
                                                    <>
                                                        <CheckCircle2 className="h-3 w-3 ml-1" />
                                                        تم الإرسال
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3 w-3 ml-1" />
                                                        {msg.status}
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
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
