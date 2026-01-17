"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { arSA } from "date-fns/locale";
import {
    Users, DollarSign, TrendingUp, Calendar,
    ArrowUpRight, ArrowDownRight, MoreHorizontal, FileText,
    MapPin, Activity, CheckCircle2, XCircle, Printer, Bus, ChevronLeft, ChevronRight, Clock
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

// --- Types ---
interface DashboardData {
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

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [examDate, setExamDate] = useState<Date>(addDays(new Date(), 1)); // Default tomorrow
    const [transportDate, setTransportDate] = useState<Date>(new Date()); // Default today

    const fetchAnalytics = () => {
        setLoading(true);
        const examDateStr = format(examDate, 'yyyy-MM-dd');
        const transportDateStr = format(transportDate, 'yyyy-MM-dd');

        fetch(`/api/dashboard/analytics?examDate=${examDateStr}&transportDate=${transportDateStr}`)
            .then(res => res.json())
            .then(data => setData(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAnalytics();
    }, [examDate, transportDate]); // Re-fetch when any date changes

    // --- Chart Colors ---
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // --- Helper Functions ---
    const changeDate = (days: number) => {
        setExamDate(prev => addDays(prev, days));
    };

    const changeTransportDate = (days: number) => {
        setTransportDate(prev => addDays(prev, days));
    };

    const getActivityLabel = (action: string) => {
        switch (action) {
            case "APPLICANT_CREATED": return { title: "تسجيل جديد", icon: Users, color: "text-blue-500", bg: "bg-blue-100" };
            case "PAYMENT_ADDED": return { title: "إضافة دفعة مالية", icon: DollarSign, color: "text-green-500", bg: "bg-green-100" };
            case "TICKET_ISSUED": return { title: "إصدار تذكرة", icon: Printer, color: "text-orange-500", bg: "bg-orange-100" };
            case "EXAM_SCHEDULED": return { title: "حجز موعد اختبار", icon: Calendar, color: "text-purple-500", bg: "bg-purple-100" };
            case "RESULT_UPDATE": return { title: "تحديث نتيجة", icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-100" };
            case "TICKET_USED": return { title: "مغادرة رحلة", icon: Bus, color: "text-teal-500", bg: "bg-teal-100" };
            case "TICKET_NO_SHOW": return { title: "غياب عن رحلة", icon: XCircle, color: "text-red-500", bg: "bg-red-100" };
            default: return { title: action, icon: Activity, color: "text-gray-500", bg: "bg-gray-100" };
        }
    };

    if (loading && !data) {
        return <div className="p-8 space-y-6"><Skeleton className="h-12 w-64" /><div className="grid grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-96" /></div>;
    }

    if (!data) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;
    if (data.error) return <div className="p-8 text-center text-red-500">حدث خطأ: {data.error}</div>;
    if (!data.overview) return <div className="p-8 text-center text-orange-500">البيانات غير مكتملة</div>;

    const passRate = data.overview.totalApplicants > 0
        ? Math.round((data.overview.passedCount / (data.overview.passedCount + data.overview.failedCount || 1)) * 100)
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        صباح الخير، {session?.user?.name || 'مستخدم'} 
                    </h1>
                    <p className="text-gray-500 mt-1">إليك نظرة سريعة على ما يحدث في نظامك اليوم.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 shadow-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="إجمالي المتقدمين"
                    value={data.overview.totalApplicants}
                    icon={Users}
                    trend="+12%"
                    trendUp={true}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <KpiCard
                    title={`الركاب (${format(transportDate, 'MM/dd')})`}
                    value={data.transportStats.totalPassengers}
                    icon={Bus}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    footer={
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="secondary" className="font-normal">{data.transportStats.activeBuses} باصات</Badge>
                            <span>نشطة في هذا اليوم</span>
                        </div>
                    }
                />
                <KpiCard
                    title="الإيرادات الكلية"
                    value={Number(data.overview.totalRevenue).toLocaleString()}
                    suffix=" ر.ي"
                    icon={DollarSign}
                    trend="+5.2%"
                    trendUp={true}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <KpiCard
                    title="نسبة النجاح"
                    value={`${passRate}%`}
                    icon={CheckCircle2}
                    trend="-2%"
                    trendUp={false}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Main Chart */}
                <Card className="xl:col-span-2 shadow-sm border-gray-100">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">نشاط التسجيل الأسبوعي</CardTitle>
                                <CardDescription>متابعة أعداد المسجلين الجدد يومياً</CardDescription>
                            </div>
                            <SelectPeriod />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="applicants" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorApplicants)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Exam Schedule Widget */}
                <Card className="xl:col-span-1 shadow-sm border-gray-100 flex flex-col h-[420px]">
                    <CardHeader className="pb-2 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                جدول الاختبارات
                            </CardTitle>
                        </div>
                        {/* Date Navigation */}
                        <div className="flex items-center justify-between bg-white border rounded-lg p-1 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeDate(-1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold w-32 text-center select-none">
                                {isSameDay(examDate, new Date()) ? 'اليوم' :
                                    isSameDay(examDate, addDays(new Date(), 1)) ? 'غداً' :
                                        format(examDate, 'yyyy-MM-dd')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeDate(1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-3 border-b z-10 flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span>إجمالي المتقدمين: {data.examSchedule.count}</span>
                            {/* Hidden Date Picker Trigger could go here */}
                        </div>

                        {loading ? (
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
                            </div>
                        ) : data.examSchedule.list.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <Calendar className="h-10 w-10 mb-2 opacity-20" />
                                <p>لا توجد اختبارات في هذا التاريخ</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {data.examSchedule.list.map((exam) => (
                                    <div key={exam.id} className="p-3 hover:bg-indigo-50/30 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {exam.fullName.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm line-clamp-1">{exam.fullName}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.examTime}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {exam.examLocation}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/applicants/${exam.id}`}>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-4 w-4 text-gray-400 hover:text-indigo-600" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-3 border-t bg-gray-50/50 text-center">
                        <Link href="/transport/manifest"> {/* Maybe link to Exam List later */}
                            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed">
                                طباعة الكشف الكامل
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Transport Summary (Dynamic Date) */}
                <Card className="col-span-1 shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Bus className="h-5 w-5 text-orange-500" />
                                حركة النقل
                            </CardTitle>
                        </div>
                        {/* Transport Date Navigation */}
                        <div className="flex items-center justify-between bg-white border rounded-lg p-1 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeTransportDate(-1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold w-32 text-center select-none">
                                {isSameDay(transportDate, new Date()) ? 'اليوم' :
                                    isSameDay(transportDate, addDays(new Date(), 1)) ? 'غداً' :
                                        format(transportDate, 'yyyy-MM-dd')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeTransportDate(1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data.transportStats.totalPassengers === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                لا توجد رحلات مجدولة في {isSameDay(transportDate, new Date()) ? 'اليوم' : format(transportDate, 'yyyy-MM-dd')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                                    <div className="bg-orange-50 rounded-lg p-2">
                                        <p className="text-xl font-bold text-orange-700">{data.transportStats.totalPassengers}</p>
                                        <p className="text-xs text-orange-600">راكب مسافر</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-2">
                                        <p className="text-xl font-bold text-blue-700">{data.transportStats.activeBuses}</p>
                                        <p className="text-xs text-blue-600">باصات</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(data.transportStats.routes).slice(0, 3).map(([route, count]) => (
                                        <div key={route} className="flex justify-between items-center text-sm p-2 border rounded-md">
                                            <span className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="h-3 w-3" /> {route}
                                            </span>
                                            <Badge variant="secondary">{count}</Badge>
                                        </div>
                                    ))}
                                </div>
                                <Link href={`/transport/manifest?date=${format(transportDate, 'yyyy-MM-dd')}`}>
                                    <Button className="w-full mt-2 bg-slate-800 hover:bg-slate-700">عرض الكشف وتأكيد الحضور</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart & Activity */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Locations Pie */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader><CardTitle className="text-sm font-bold text-gray-500">توزيع الممناطق</CardTitle></CardHeader>
                        <CardContent className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.locationData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                        {data.locationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="shadow-sm border-gray-100 flex flex-col">
                        <CardHeader><CardTitle className="text-lg font-bold text-gray-800">سجل الأنشطة</CardTitle></CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[300px]">
                            <div className="space-y-4">
                                {data.recentActivity.map((log) => {
                                    const info = getActivityLabel(log.action);
                                    const Icon = info.icon;
                                    return (
                                        <div key={log.id} className="flex gap-4 items-start group">
                                            <div className={`h-8 w-8 rounded-full ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                <Icon className={`h-4 w-4 ${info.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-bold text-gray-800">{info.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded">
                                                        {new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {log.details || `تم ${info.title}`}
                                                    {log.applicant && <span className="text-blue-600 font-medium"> • {log.applicant.fullName}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---
function KpiCard({ title, value, icon: Icon, suffix, trend, trendUp, color, bg, footer }: any) {
    return (
        <Card className="shadow-sm border-none shadow-blue-900/5 overflow-hidden relative group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {value}
                            {suffix && <span className="text-lg font-normal text-gray-400 ml-1">{suffix}</span>}
                        </h3>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mt-1`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                </div>
                {trend ? (
                    <div className="mt-4 flex items-center text-sm">
                        <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                            {trendUp ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                            {trend}
                        </span>
                        <span className="text-gray-400 ml-2 text-xs">مقارنة بالشهر الماضي</span>
                    </div>
                ) : (
                    <div className="mt-4">
                        {footer}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SelectPeriod() {
    return (
        <div className="text-xs bg-gray-50 rounded-md p-1 flex">
            <button className="px-2 py-1 bg-white shadow-sm rounded text-gray-800 font-medium">أسبوعي</button>
            <button className="px-2 py-1 text-gray-500 hover:text-gray-800">شهري</button>
        </div>
    )
}
