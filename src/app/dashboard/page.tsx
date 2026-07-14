"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDashboardAnalytics } from "@/hooks/dashboard/useDashboardAnalytics";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart";
import { ExamScheduleList } from "@/components/dashboard/ExamScheduleList";
import { TransportMovement } from "@/components/dashboard/TransportMovement";
import { RegionsChart } from "@/components/dashboard/RegionsChart";
import { ActivityLogList } from "@/components/dashboard/ActivityLogList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus } from "lucide-react";
import { ApplicantDashboardView } from "@/components/dashboard/ApplicantDashboardView";

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="p-6 space-y-8 animate-pulse text-right max-w-7xl mx-auto" dir="rtl">
                <div className="flex justify-between items-center pb-4 border-b">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
            </div>
        );
    }

    // Role-based routing: Render Applicant view if session role is APPLICANT
    if (session?.user?.role === "APPLICANT") {
        return <ApplicantDashboardView />;
    }

    // Otherwise, render full ERP Administrative dashboard
    return <AdminDashboardPageContent />;
}

function AdminDashboardPageContent() {
    const { data: session } = useSession();
    const {
        data,
        loading,
        examDate,
        transportDate,
        changeDate,
        changeTransportDate,
        passRate,
        greeting,
        getActivityLabel
    } = useDashboardAnalytics();

    // Skeletons when initial loading
    if (loading && !data) {
        return (
            <div className="p-6 space-y-8 animate-pulse text-right max-w-7xl mx-auto" dir="rtl">
                <div className="flex justify-between items-center pb-4 border-b">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Skeleton className="xl:col-span-2 h-[380px] rounded-2xl" />
                    <Skeleton className="xl:col-span-1 h-[380px] rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center text-rose-600 font-bold text-xs bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-12 animate-in fade-in" dir="rtl">
                فشل في تحميل بيانات لوحة التحكم الرئيسية من الخادم. يرجى التحقق من الاتصال بالخادم.
            </div>
        );
    }

    if (data.error) {
        return (
            <div className="p-8 text-center text-rose-600 font-bold text-xs bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-12 animate-in fade-in" dir="rtl">
                حدث خطأ أثناء تحميل لوحة التحليلات: {data.error}
            </div>
        );
    }

    if (!data.overview) {
        return (
            <div className="p-8 text-center text-amber-600 font-bold text-xs bg-amber-50 border border-amber-100 rounded-2xl max-w-md mx-auto mt-12 animate-in fade-in" dir="rtl">
                بيانات لوحة التحليلات المسترجعة غير مكتملة أو تفتقر للتنظيم الإحصائي.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-6 max-w-7xl mx-auto text-right" dir="rtl">
            
            {/* Elegant Premium Welcome Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {greeting}، {session?.user?.name || 'مستشار الاعتماد'} 👋
                    </h1>
                    <p className="text-slate-500 text-xs">
                        متابعة حركة التسجيل، مؤشرات أداء الاختبارات المهنية، وجداول حركة النقل اليومية.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/dashboard/applicants/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-xl h-10 shadow-md shadow-indigo-100 font-bold text-xs px-4">
                            <Plus className="h-4 w-4" />
                            إضافة متقدم جديد بالنظام
                        </Button>
                    </Link>
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 shadow-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-450" />
                        {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Top 4 KPI Metrics Grid */}
            <DashboardStats 
                overview={data.overview}
                transportStats={data.transportStats}
                transportDate={transportDate}
                passRate={passRate}
            />

            {/* Middle Section: Chart + Schedule */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Registrations trends area chart */}
                <div className="xl:col-span-2">
                    <WeeklyActivityChart trendData={data.trendData} />
                </div>

                {/* Exam schedule list widget */}
                <div className="xl:col-span-1">
                    <ExamScheduleList 
                        examSchedule={data.examSchedule}
                        examDate={examDate}
                        changeDate={changeDate}
                        loading={loading}
                    />
                </div>

            </div>

            {/* Bottom Row: Transport stats, Regions Pie Chart, and Recent Activities list */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Daily Transport movements */}
                <div className="xl:col-span-1">
                    <TransportMovement 
                        transportStats={data.transportStats}
                        transportDate={transportDate}
                        changeTransportDate={changeTransportDate}
                    />
                </div>

                {/* Regions Pie Chart and Activity logs */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Geographic Regions Distribution */}
                    <RegionsChart locationData={data.locationData} />

                    {/* Timeline of administrative actions */}
                    <ActivityLogList 
                        recentActivity={data.recentActivity}
                        getActivityLabel={getActivityLabel}
                    />

                </div>

            </div>

        </div>
    );
}

