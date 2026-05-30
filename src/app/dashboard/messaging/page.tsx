"use client";

import { useState } from "react";
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
    Loader2,
    MessageSquare,
} from "lucide-react";

import { useMessagingDashboard } from "@/hooks/messaging/useMessagingDashboard";
import { QuickMessageSender } from "@/components/messaging/QuickMessageSender";
import { TemplatesManager } from "@/components/messaging/TemplatesManager";
import { MessagingStats } from "@/components/messaging/MessagingStats";
import { PendingMessagesTab } from "@/components/messaging/PendingMessagesTab";
import { SentMessagesTab } from "@/components/messaging/SentMessagesTab";
import { AllMessagesTab } from "@/components/messaging/AllMessagesTab";

export default function MessagingPage() {
    const {
        messages,
        pendingMessages,
        stats,
        loading,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        refresh,
        handleBulkAction,
        handleSingleAction,
        handleDismissPending
    } = useMessagingDashboard();

    const [quickMessageOpen, setQuickMessageOpen] = useState(false);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-2 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                        <MessageCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        مركز الرسائل والواتساب
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                        تتبع المراسلات التلقائية للعملاء، إدارة القوالب، وإرسال تنبيهات واتساب يدوية وسريعة.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button 
                        onClick={() => setQuickMessageOpen(true)} 
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all h-10.5 rounded-xl text-sm"
                    >
                        <Send className="h-4 w-4" />
                        إرسال رسالة سريعة
                    </Button>
                    <Button 
                        onClick={refresh} 
                        variant="outline" 
                        className="gap-2 h-10.5 rounded-xl hover:bg-slate-50 border-slate-200 dark:border-slate-800"
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>
            </div>

            {/* Quick Message Dialog Component */}
            <QuickMessageSender open={quickMessageOpen} onClose={() => setQuickMessageOpen(false)} />

            {/* Premium Stats Grid */}
            <MessagingStats stats={stats} />

            {/* Main Content Layout */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-900/60 p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-slate-800 dark:text-slate-200 font-bold text-base flex items-center gap-2">
                            سجل ومراقبة الرسائل
                        </CardTitle>
                        {activeTab !== "templates" && (
                            <div className="relative w-full md:w-72">
                                <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="ابحث بالاسم، الكود، أو المعرّف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl text-xs"
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50/20 dark:bg-slate-900/40">
                            <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-slate-100/70 dark:bg-slate-950 rounded-xl p-1 h-10.5">
                                <TabsTrigger value="pending" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 shadow-none">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>معلقة</span>
                                    {stats.pending > 0 && (
                                        <Badge variant="destructive" className="mr-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                            {stats.pending}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="sent" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>مُرسلة</span>
                                </TabsTrigger>
                                <TabsTrigger value="all" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>الكل</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="templates" 
                                    className="gap-1.5 rounded-lg text-xs font-bold transition-all text-emerald-600 dark:text-emerald-400 data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/40"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>قوالب الرسائل</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Loading Overlay */}
                        {loading && activeTab !== "templates" ? (
                            <div className="flex flex-col justify-center items-center py-20 gap-3">
                                <Loader2 className="h-9 w-9 animate-spin text-emerald-500" />
                                <span className="text-slate-400 text-xs">جاري تحميل سجلات الرسائل...</span>
                            </div>
                        ) : (
                            <div className="p-4 sm:p-5">
                                {/* Pending Tab Content */}
                                <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                    <PendingMessagesTab
                                        pendingMessages={pendingMessages}
                                        handleBulkAction={handleBulkAction}
                                        handleSingleAction={handleSingleAction}
                                        handleDismissPending={handleDismissPending}
                                        onSuccess={refresh}
                                    />
                                </TabsContent>

                                {/* Sent Tab Content */}
                                <TabsContent value="sent" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                    <SentMessagesTab messages={messages} />
                                </TabsContent>

                                {/* All Tab Content */}
                                <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                    <AllMessagesTab messages={messages} />
                                </TabsContent>

                                {/* Templates Tab Content */}
                                <TabsContent value="templates" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                    <TemplatesManager />
                                </TabsContent>
                            </div>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
