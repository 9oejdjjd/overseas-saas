"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

export interface MessageLog {
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

export interface PendingMessage {
    messageLogId?: string;
    applicantId: string;
    applicant: {
        id?: string;
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

export interface Stats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    sentToday: number;
}

export function useMessagingDashboard() {
    const { toast } = useToast();
    const [messages, setMessages] = useState<MessageLog[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0, sentToday: 0 });
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const messagesRes = await fetch("/api/messages");
            const messagesData = await messagesRes.json();
            
            // Set message logs and statistics
            setMessages(messagesData.messages || []);
            setStats(prev => ({ ...prev, ...messagesData.stats }));

            const pendingRes = await fetch("/api/messages/pending");
            const pendingData = await pendingRes.json();
            
            setPendingMessages(pendingData.pending || []);
            setStats(prev => ({ ...prev, pending: pendingData.count || 0 }));
        } catch (e) {
            console.error("Failed to fetch messaging dashboard data:", e);
            toast("حدث خطأ أثناء تحديث البيانات", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBulkAction = async (action: 'retry' | 'delete') => {
        setLoading(true);
        try {
            const method = action === 'retry' ? 'POST' : 'DELETE';
            const body = action === 'retry' ? JSON.stringify({ retryAll: true }) : undefined;
            const url = action === 'delete' ? '/api/messages/retry?all=true' : '/api/messages/retry';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });
            
            if (response.ok) {
                toast(
                    action === 'retry' 
                        ? "تم تشغيل عملية إعادة إرسال جميع الرسائل الفاشلة" 
                        : "تم حذف جميع الرسائل المعلقة بنجاح", 
                    "success"
                );
            } else {
                throw new Error("Bulk action failed");
            }
            await fetchData();
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            toast("فشلت العملية الجماعية", "error");
            setLoading(false);
        }
    };

    const handleSingleAction = async (action: 'retry' | 'delete', messageLogId: string) => {
        try {
            const method = action === 'retry' ? 'POST' : 'DELETE';
            const body = action === 'retry' ? JSON.stringify({ messageLogId }) : undefined;
            const url = action === 'delete' ? `/api/messages/retry?id=${messageLogId}` : '/api/messages/retry';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (response.ok) {
                toast(
                    action === 'retry' 
                        ? "جاري إعادة إرسال الرسالة..." 
                        : "تم إزالة الرسالة من الطابور المعلق", 
                    "success"
                );
                // Refresh data silently
                fetchData(true);
            } else {
                throw new Error("Action failed");
            }
        } catch (error) {
            console.error(`Single ${action} failed:`, error);
            toast("فشلت العملية على الرسالة", "error");
        }
    };

    const handleDismissPending = async (applicantId: string, trigger: string) => {
        try {
            const response = await fetch('/api/messages', {
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

            if (response.ok) {
                toast("تم تخطي وإسقاط الرسالة المعلقة بنجاح", "success");
                fetchData(true);
            } else {
                throw new Error("Dismiss failed");
            }
        } catch (error) {
            console.error('Dismiss pending failed:', error);
            toast("فشل تخطي الرسالة", "error");
        }
    };

    // Filter logic
    const filteredMessages = messages.filter(m =>
        (m.applicant?.fullName || "زائر (اختبار تجريبي)").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.trigger?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPending = pendingMessages.filter(m =>
        (m.applicant?.fullName || "زائر (اختبار تجريبي)").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.triggerLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        messages: filteredMessages,
        pendingMessages: filteredPending,
        allMessagesCount: messages.length,
        stats,
        loading,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        refresh: () => fetchData(false),
        handleBulkAction,
        handleSingleAction,
        handleDismissPending
    };
}
