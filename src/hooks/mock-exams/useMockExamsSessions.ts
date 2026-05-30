/**
 * @file useMockExamsSessions.ts
 * @description خطاف مخصص (Custom Hook) لإدارة وعمليات جلسات الاختبارات التجريبية.
 * يستخلص عمليات الحسابات الإحصائية وإجراءات الحظر ومنح المحاولات وعمليات جلب مراجعة الاختبارات والتصفية الذكية من المكونات الرسومية إلى منطق مستقل ومقروء.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { useState, useEffect, useMemo } from "react";

export type SuspicionFilterType = "ALL" | "ANY" | "WATCH" | "SUSPICIOUS" | "CRITICAL";

export function useMockExamsSessions() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [suspicionFilter, setSuspicionFilter] = useState<SuspicionFilterType>("ALL");
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    // حالات نافذة المراجعة الفردية
    const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<any>(null);
    const [reviewSessionMeta, setReviewSessionMeta] = useState<any>(null);
    const [loadingReview, setLoadingReview] = useState(false);

    /**
     * تبديل حالة فتح/طي مجموعة جلسات المتقدم الفردي
     */
    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    /**
     * جلب سجل الجلسات بالكامل مع البحث والترشيح
     */
    const fetchSessions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            
            const res = await fetch(`/api/mock/admin/sessions?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSessions(data);
            }
        } catch (error) {
            console.error("[useMockExamsSessions] Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * جلب تفاصيل مراجعة إجابات اختبار معين
     */
    const fetchReview = async (sessionId: string, sessionMeta?: any) => {
        setReviewSessionId(sessionId);
        setReviewSessionMeta(sessionMeta || null);
        setLoadingReview(true);
        setReviewData(null);
        try {
            const res = await fetch(`/api/mock/admin/sessions/review?sessionId=${sessionId}`);
            const data = await res.json();
            if (data.session) {
                setReviewData(data);
            }
        } catch (error) {
            console.error("[useMockExamsSessions] Failed to fetch session review:", error);
        } finally {
            setLoadingReview(false);
        }
    };

    /**
     * منح محاولة إضافية للمتقدم (الخاص أو العام)
     */
    const grantAttempt = async (group: any, session?: any) => {
        if (!confirm("هل أنت متأكد من منح محاولة إضافية للمتقدم؟")) return;
        try {
            const s = session || group.sessions?.[0];
            const payload: any = { professionId: s.professionId, grantExtraAttempt: true };
            
            if (s.type === "PUBLIC") {
                payload.visitorPhone = group.displayPhone || s.visitorPhone;
                payload.visitorName = group.displayName || s.visitorName;
            } else {
                payload.applicantId = s.applicantId;
            }

            const res = await fetch("/api/mock/admin/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("تم إصدار محاولة إضافية بنجاح.");
                fetchSessions();
            } else {
                alert("حدث خطأ أثناء منح المحاولة.");
            }
        } catch (error) {
            console.error("[useMockExamsSessions] Failed to grant attempt:", error);
        }
    };

    /**
     * فرض حظر شامل لجلسة ممتحن معينة (حظر الجهاز والبصمة والاتصال)
     */
    const stopAttempts = async (session: any) => {
        if (!confirm("هل أنت متأكد من حظر هذا الجهاز/الرقم بشكل قطعي؟ سيتم حظر كل الجلسات المرتبطة.")) return;
        try {
            const res = await fetch("/api/mock/admin/sessions", {
                method: "PATCH", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ sessionId: session.id, status: "EXPIRED" })
            });

            if (res.ok) {
                alert("تم تفعيل الحظر الشامل بنجاح (الجهاز + الرقم).");
                fetchSessions();
            } else {
                alert("حدث خطأ أثناء محاولة الإيقاف الحظر.");
            }
        } catch (error) {
            console.error("[useMockExamsSessions] Failed to stop attempts:", error);
        }
    };

    // جلب البيانات مع تأخير البحث (Debounce) لمنع التكرار المستمر
    useEffect(() => {
        const debounce = setTimeout(() => fetchSessions(), 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    // حساب الإحصائيات الفورية من البيانات الكلية للجلسات بشكل استباقي ومحسن بالأداء
    const stats = useMemo(() => {
        const total = sessions.reduce((acc, g) => acc + g.totalAttempts, 0);
        const passed = sessions.filter(g => g.isPassed).length;
        const failed = sessions.filter(g => !g.isPassed && ["SUBMITTED", "TIMEOUT", "EXPIRED"].includes(g.status)).length;
        const pending = sessions.reduce((acc, g) => acc + g.sessions.filter((s: any) => s.status === "STARTED" || s.status === "RESUMED").length, 0);
        const suspiciousCount = sessions.filter(g => g.suspicionLevel && g.suspicionLevel !== "CLEAN").length;
        const criticalCount = sessions.filter(g => g.suspicionLevel === "CRITICAL").length;
        const passRate = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;

        return {
            total,
            passed,
            failed,
            pending,
            suspiciousCount,
            criticalCount,
            passRate
        };
    }, [sessions]);

    // تصفية الجلسات محلياً حسب مستويات الاشتباه المحددة
    const filteredSessions = useMemo(() => {
        if (suspicionFilter === "ALL") return sessions;
        if (suspicionFilter === "ANY") {
            return sessions.filter(g => g.suspicionLevel !== "CLEAN");
        }
        return sessions.filter(g => g.suspicionLevel === suspicionFilter);
    }, [sessions, suspicionFilter]);

    return {
        sessions,
        filteredSessions,
        loading,
        searchTerm,
        setSearchTerm,
        suspicionFilter,
        setSuspicionFilter,
        expandedGroups,
        toggleGroup,
        
        // تفاصيل المراجعة
        reviewSessionId,
        setReviewSessionId,
        reviewData,
        reviewSessionMeta,
        loadingReview,
        fetchReview,
        
        // العمليات الإدارية
        grantAttempt,
        stopAttempts,
        fetchSessions,
        stats
    };
}
