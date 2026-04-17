"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, CheckCircle2, XCircle, Clock, GraduationCap, Users, RefreshCw, Eye, MoreHorizontal, Ban, PlusCircle, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProfessionsManager } from "@/components/mock/admin/ProfessionsManager";
import { QuestionsManager } from "@/components/mock/admin/QuestionsManager";

export default function MockExamsAdminPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<any>(null);
    const [loadingReview, setLoadingReview] = useState(false);

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
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReview = async (sessionId: string) => {
        setReviewSessionId(sessionId);
        setLoadingReview(true);
        setReviewData(null);
        try {
            const res = await fetch(`/api/mock/admin/sessions/review?sessionId=${sessionId}`);
            const data = await res.json();
            if (data.session) {
                setReviewData(data);
            }
        } catch (error) {
            console.error("Failed to fetch session review", error);
        } finally {
            setLoadingReview(false);
        }
    };

    const grantAttempt = async (session: any) => {
        if (!confirm("هل أنت متأكد من منح محاولة إضافية للمتقدم؟")) return;
        try {
            const payload: any = { professionId: session.professionId, grantExtraAttempt: true };
            if (session.type === "PUBLIC") {
                payload.visitorPhone = session.visitorPhone;
                payload.visitorName = session.visitorName;
            } else {
                payload.applicantId = session.applicantId;
            }
            const res = await fetch("/api/mock/admin/sessions", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("تم إصدار محاولة إضافية بنجاح.");
                fetchSessions();
            } else {
                alert("حدث خطأ أثناء منح المحاولة.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const stopAttempts = async (session: any) => {
        if (!confirm("هل أنت متأكد من إيقاف الجلسة الحالية؟")) return;
        try {
            const res = await fetch("/api/mock/admin/sessions", {
                method: "PATCH", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ sessionId: session.id, status: "EXPIRED" })
            });
            if (res.ok) {
                alert("تم إيقاف الجلسة بنجاح.");
                fetchSessions();
            } else {
                alert("حدث خطأ أثناء محاولة الإيقاف.");
            }
        } catch(error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => fetchSessions(), 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    // Stats
    const total = sessions.reduce((acc, g) => acc + g.totalAttempts, 0);
    const passed = sessions.filter(g => g.isPassed).length;
    const failed = sessions.filter(g => !g.isPassed && g.status === "SUBMITTED").length;
    const pending = sessions.reduce((acc, g) => acc + g.sessions.filter((s:any) => s.status === "STARTED" || s.status === "RESUMED").length, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-indigo-600" />
                        إدارة الاختبارات التجريبية
                    </h1>
                    <p className="text-gray-500 mt-1">متابعة المتقدمين، النتائج، وجلسات الاختبار</p>
                </div>
                <Button onClick={fetchSessions} variant="outline" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    تحديث البيانات
                </Button>
            </div>

            <Tabs defaultValue="sessions" className="space-y-6 w-full">
                <TabsList className="bg-white border rounded-xl p-1 mb-2 w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="sessions" className="py-2.5 px-6 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">الجلسات والنتائج</TabsTrigger>
                    <TabsTrigger value="professions" className="py-2.5 px-6 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">المهن والتخصصات</TabsTrigger>
                    <TabsTrigger value="questions" className="py-2.5 px-6 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">بنك الأسئلة</TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-6 outline-none focus:outline-none focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">إجمالي الجلسات</p>
                            <p className="text-2xl font-bold text-gray-900">{total}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">الناجحين</p>
                            <p className="text-2xl font-bold text-green-600">{passed}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">لم يجتز</p>
                            <p className="text-2xl font-bold text-red-600">{failed}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">قيد التنفيذ</p>
                            <p className="text-2xl font-bold text-orange-600">{pending}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg">سجل الجلسات</CardTitle>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="بحث بالاسم أو الرقم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-9"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto" dir="rtl">
                        <table className="w-full text-sm text-right rtl:text-right">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">المتقدم</th>
                                    <th className="px-6 py-4 font-medium">المهنة</th>
                                    <th className="px-6 py-4 font-medium">الحالة</th>
                                    <th className="px-6 py-4 font-medium">النتيجة</th>
                                    <th className="px-6 py-4 font-medium">النوع والمحاولة</th>
                                    <th className="px-6 py-4 font-medium">التاريخ</th>
                                    <th className="px-6 py-4 font-medium">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                        </td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-500">
                                            لا توجد جلسات اختبار حالياً
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((group) => {
                                        const isExpanded = expandedGroups.includes(group.id);

                                        return (
                                            <React.Fragment key={group.id}>
                                                <tr className={`hover:bg-gray-50/50 transition-colors border-l-4 ${group.isSuspicious ? 'border-red-400' : 'border-transparent'}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                                {group.displayName}
                                                                {group.isSuspicious && <span title="عدة أسماء أو أرقام من نفس الجهاز"><AlertCircle className="w-4 h-4 text-red-500" /></span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{group.displayPhone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                                                            {group.profession?.name || "غير محدد"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.status === "SUBMITTED" ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مكتمل</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">الأخيرة قيد الاختبار</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="text-gray-500 text-xs">أفضل:</span>
                                                                <span className={`font-bold ${group.isPassed ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {group.bestScore}%
                                                                </span>
                                                            </div>
                                                            {group.totalAttempts > 1 && (
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-gray-400">أحدث:</span>
                                                                    <span className="text-gray-600">{group.lastScore}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2 items-center">
                                                            <Badge variant="secondary" className="text-[10px]">{group.type === "PUBLIC" ? "عام" : "خاص"}</Badge>
                                                            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                                                {group.totalAttempts} / {group.profession?.maxAttempts || 3}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs text-left" dir="ltr">
                                                        {new Date(group.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="outline" size="sm" onClick={() => toggleGroup(group.id)} className="gap-2 text-xs">
                                                            <Eye className="w-3 h-3" /> التقييمات {group.totalAttempts}
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {isExpanded && group.sessions.map((session: any) => {
                                                    const sPassed = session.status === "SUBMITTED" && session.score >= session.passingScore;
                                                    const sName = session.applicant?.fullName || session.visitorName || "غير معروف";
                                                    const sPhone = session.applicant?.whatsappNumber || session.visitorPhone || "لا يوجد";
                                                    
                                                    return (
                                                        <tr key={session.id} className="bg-slate-50/70 border-b border-slate-100">
                                                            <td className="px-6 py-3 pl-8 text-xs relative">
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-200"></div>
                                                                <span className="text-gray-400 block mb-1">الاسم: {sName}</span>
                                                                <span className="text-gray-400">الرقم: {sPhone}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-xs">
                                                                <span className="bg-slate-100/50 text-slate-600 px-2 py-1 rounded truncate max-w-[120px] inline-block">
                                                                    {session.profession?.name || group.profession?.name || "غير محدد"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                {session.status === "SUBMITTED" ? (
                                                                    <span className="text-xs text-green-600 font-medium">مكتمل</span>
                                                                ) : (
                                                                    <span className="text-xs text-orange-500 font-medium">جاري</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                {session.status === "SUBMITTED" ? (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <span className={`font-bold ${sPassed ? 'text-green-600' : 'text-red-500'}`}>
                                                                            {session.score}%
                                                                        </span>
                                                                    </div>
                                                                ) : <span className="text-gray-400">-</span>}
                                                            </td>
                                                            <td className="px-6 py-3 text-xs text-gray-500">
                                                                <Badge variant="secondary" className="text-[10px] ml-2 font-normal scale-90 origin-right">{session.type === "PUBLIC" ? "عام" : "خاص"}</Badge>
                                                                رقم: {session.attemptNumber}
                                                            </td>
                                                            <td className="px-6 py-3 text-left text-xs text-gray-400" dir="ltr">
                                                                {new Date(session.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-7 px-2">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="text-right">
                                                                        <DropdownMenuItem onClick={() => fetchReview(session.id)} disabled={session.status !== "SUBMITTED"} className="flex justify-end gap-2 cursor-pointer">
                                                                            المراجعة والتفاصيل <Eye className="h-4 w-4 text-blue-600" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => grantAttempt(session)} className="flex justify-end gap-2 text-green-600 cursor-pointer">
                                                                            منح محاولة إضافية <PlusCircle className="h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => stopAttempts(session)} className="flex justify-end gap-2 text-red-600 cursor-pointer">
                                                                            إيقاف المحاولات <Ban className="h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="professions" className="outline-none focus:outline-none focus-visible:outline-none">
                <ProfessionsManager />
            </TabsContent>

            <TabsContent value="questions" className="outline-none focus:outline-none focus-visible:outline-none">
                <QuestionsManager />
            </TabsContent>
            </Tabs>

            {/* Review Modal */}
            {reviewSessionId && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 min-h-screen">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                تقرير مراجعة الاختبار
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setReviewSessionId(null)} className="hover:bg-gray-20 rounded-full">
                                <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                            {loadingReview ? (
                                <div className="flex flex-col justify-center items-center h-40 gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p className="text-sm text-gray-500">جاري تحميل تقرير الاختبار...</p>
                                </div>
                            ) : reviewData ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
                                            <p className="text-xs text-gray-500 mb-1">إجمالي الأسئلة</p>
                                            <p className="text-2xl font-bold text-gray-900">{reviewData.summary.total}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-green-500"></div>
                                            <p className="text-xs text-green-700 mb-1">إجابات صحيحة</p>
                                            <p className="text-2xl font-bold text-green-700">{reviewData.summary.correct}</p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
                                            <p className="text-xs text-red-700 mb-1">إجابات خاطئة</p>
                                            <p className="text-2xl font-bold text-red-700">{reviewData.summary.wrong}</p>
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100 text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
                                            <p className="text-xs text-orange-700 mb-1">لم يُجب عليها</p>
                                            <p className="text-2xl font-bold text-orange-700">{reviewData.summary.unanswered}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-800 text-lg sticky top-0 bg-slate-50/90 backdrop-blur pb-2 z-10 pt-2 border-b">
                                            تفاصيل الإجابات ({reviewData.session.score}%)
                                        </h3>
                                        {reviewData.questions.map((q: any) => (
                                            <div key={q.number} className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex gap-3 items-start mb-4">
                                                    <div className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                                                        ${q.isCorrect ? "bg-green-500" : q.isAnswered ? "bg-red-500" : "bg-orange-400"}`}>
                                                        {q.number}
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 leading-relaxed text-[15px]">{q.text}</h3>
                                                </div>
                                                <div className="space-y-2.5 mt-4 pr-10">
                                                    {q.options.map((opt: any) => {
                                                        const isSelected = opt.isSelected;
                                                        const isCorrect = opt.isCorrect;
                                                        let bgClass = "bg-gray-50 border-gray-100 text-gray-600";
                                                        
                                                        if (isSelected && isCorrect) bgClass = "bg-green-50 border-green-200 text-green-900 ring-1 ring-green-500 shadow-sm";
                                                        else if (isSelected && !isCorrect) bgClass = "bg-red-50 border-red-200 text-red-900 ring-1 ring-red-500 shadow-sm";
                                                        else if (!isSelected && isCorrect) bgClass = "bg-green-50/40 border-green-200 border-dashed text-green-800";
                                                        
                                                        return (
                                                            <div key={opt.id} className={`p-3.5 rounded-lg border text-sm flex items-center justify-between transition-colors ${bgClass}`}>
                                                                <span className="leading-snug">{opt.text}</span>
                                                                {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                                                                {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                                                {!isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500/60 shrink-0" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                                    <XCircle className="h-12 w-12 text-gray-300 mb-3" />
                                    <p>تعذر تحميل تقرير المراجعة، يرجى المحاولة مرة أخرى.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
