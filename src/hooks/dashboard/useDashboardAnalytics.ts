"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import {
    Users, DollarSign, Calendar, CheckCircle2, XCircle, Printer, Bus, Activity
} from "lucide-react";

export interface DashboardData {
    error?: string;
    overview: {
        totalApplicants: number;
        totalRevenue: number;
        passedCount: number;
        failedCount: number;
        othersCount: number;
    };
    examSchedule: {
        date: string;
        count: number;
        list: {
            id: string;
            fullName: string;
            examLocation: string;
            examTime: string;
            status: string;
        }[];
    };
    transportStats: {
        totalPassengers: number;
        activeBuses: number;
        routes: Record<string, number>;
    };
    trendData: { name: string; applicants: number }[];
    locationData: { name: string; value: number }[];
    recentActivity: any[];
}

export function useDashboardAnalytics() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [examDate, setExamDate] = useState<Date>(addDays(new Date(), 1)); // Default tomorrow
    const [transportDate, setTransportDate] = useState<Date>(new Date()); // Default today

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const examDateStr = format(examDate, 'yyyy-MM-dd');
            const transportDateStr = format(transportDate, 'yyyy-MM-dd');
            
            const res = await fetch(`/api/dashboard/analytics?examDate=${examDateStr}&transportDate=${transportDateStr}`);
            if (res.ok) {
                const analyticsData: DashboardData = await res.json();
                setData(analyticsData);
            } else {
                console.error("Failed to fetch dashboard analytics");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [examDate, transportDate]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const changeDate = useCallback((days: number) => {
        setExamDate(prev => addDays(prev, days));
    }, []);

    const changeTransportDate = useCallback((days: number) => {
        setTransportDate(prev => addDays(prev, days));
    }, []);

    // Dynamically calculate pass rate
    const passRate = useMemo(() => {
        if (!data || !data.overview || data.overview.totalApplicants === 0) return 0;
        const total = data.overview.passedCount + data.overview.failedCount;
        return total > 0 ? Math.round((data.overview.passedCount / total) * 100) : 0;
    }, [data]);

    // Calculate Arabic greeting based on local time hour
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 17) {
            return "صباح الخير";
        }
        return "مساء الخير";
    }, []);

    // Get activity logging parameters
    const getActivityLabel = useCallback((action: string) => {
        switch (action) {
            case "APPLICANT_CREATED": 
                return { title: "تسجيل متقدم جديد", icon: Users, color: "text-indigo-650", bg: "bg-indigo-50 border border-indigo-100/60" };
            case "PAYMENT_ADDED": 
                return { title: "إضافة دفعة مالية", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 border border-emerald-100/60" };
            case "TICKET_ISSUED": 
                return { title: "إصدار تذكرة سفر", icon: Printer, color: "text-amber-600", bg: "bg-amber-50 border border-amber-100/60" };
            case "EXAM_SCHEDULED": 
                return { title: "حجز موعد اختبار قياسي", icon: Calendar, color: "text-violet-650", bg: "bg-violet-50 border border-violet-100/60" };
            case "RESULT_UPDATE": 
                return { title: "تحديث النتيجة المهنية", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 border border-blue-100/60" };
            case "TICKET_USED": 
                return { title: "تأكيد مغادرة رحلة", icon: Bus, color: "text-teal-600", bg: "bg-teal-50 border border-teal-100/60" };
            case "TICKET_NO_SHOW": 
                return { title: "تسجيل غياب عن رحلة", icon: XCircle, color: "text-rose-650", bg: "bg-rose-50 border border-rose-100/60" };
            default: 
                return { title: action, icon: Activity, color: "text-slate-500", bg: "bg-slate-50 border border-slate-100" };
        }
    }, []);

    return {
        data,
        loading,
        examDate,
        setExamDate,
        transportDate,
        setTransportDate,
        changeDate,
        changeTransportDate,
        passRate,
        greeting,
        fetchAnalytics,
        getActivityLabel
    };
}
