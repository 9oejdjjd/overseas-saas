/**
 * @file page.tsx
 * @description الملف الرئيسي المنظف والمبسط لصفحة إدارة الاختبارات التجريبية (page.tsx).
 * يستعين هذا الملف بالخطاف المخصص (useMockExamsSessions) ومكونات الواجهات الفرعية المحدثة ليعيد ربط لوحة المتقدمين والأسئلة والمهن بأعلى كفاءة.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, RefreshCw, ShieldAlert } from "lucide-react";
import { hasAccess } from "@/lib/rbac";
import { useMockExamsSessions } from "@/hooks/mock-exams/useMockExamsSessions";

// مكونات الجلسات والنتائج المستخلصة حديثاً
import { MockExamsStats } from "@/components/mock/admin/sessions/MockExamsStats";
import { SessionsFilters } from "@/components/mock/admin/sessions/SessionsFilters";
import { SessionsTable } from "@/components/mock/admin/sessions/SessionsTable";
import { SessionReviewModal } from "@/components/mock/admin/sessions/SessionReviewModal";

// المكونات الفرعية للأقسام الأخرى
import { ProfessionsManager } from "@/components/mock/admin/ProfessionsManager";
import { QuestionsManager } from "@/components/mock/admin/QuestionsManager";

/**
 * مكون عرض الخطأ في صلاحيات الدخول
 */
function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-gray-100 rounded-2xl shadow-sm w-full" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-gray-500 text-sm max-w-md">
                ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو هذا القسم. يرجى مراجعة مدير النظام للحصول على الصلاحيات اللازمة.
            </p>
        </div>
    );
}

export default function MockExamsAdminPage() {
    const { data: loginSession, status } = useSession();
    
    // توظيف الخطاف المخصص للتحكم بجلسات ونتائج الاختبارات التجريبية
    const sessionsHook = useMockExamsSessions();
    const {
        filteredSessions,
        loading,
        searchTerm,
        setSearchTerm,
        suspicionFilter,
        setSuspicionFilter,
        expandedGroups,
        toggleGroup,
        reviewSessionId,
        setReviewSessionId,
        reviewData,
        reviewSessionMeta,
        loadingReview,
        fetchReview,
        grantAttempt,
        stopAttempts,
        fetchSessions,
        stats
    } = sessionsHook;

    // شاشات الانتظار عند قراءة الجلسة
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // التحقق من الصلاحيات الإدارية لقسم الاختبارات
    if (!loginSession || !hasAccess(loginSession.user, "mockExams.access")) {
        return <AccessDenied />;
    }

    const canAccessSessions = hasAccess(loginSession.user, "mockExams.sessions");
    const canAccessProfessions = hasAccess(loginSession.user, "mockExams.professions");
    const canAccessQuestions = hasAccess(loginSession.user, "mockExams.questions");
    const canManageActions = hasAccess(loginSession.user, "mockExams.manageActions");

    // تحديد التبويب الافتراضي الفوري بناءً على الصلاحيات البرمجية للمستخدم الحالي
    const defaultTab = canAccessSessions 
        ? "sessions" 
        : canAccessProfessions 
            ? "professions" 
            : canAccessQuestions 
                ? "questions" 
                : "";

    if (!defaultTab) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* رأس الصفحة الرئيسي */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-right">
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
                        <GraduationCap className="h-7 w-7 text-indigo-600 animate-bounce" />
                        إدارة الاختبارات التجريبية
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 font-medium">متابعة شؤون المتقدمين، ومعاينة تفاصيل وجلسات ونتائج الامتحانات.</p>
                </div>
                <Button 
                    onClick={fetchSessions} 
                    variant="outline" 
                    className="gap-2 text-xs font-bold border-gray-200 bg-white h-9 shadow-sm"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    تحديث الجلسات
                </Button>
            </div>

            {/* التبويبات الفنية الأساسية */}
            <Tabs defaultValue={defaultTab} className="space-y-6 w-full">
                <TabsList className="bg-white border rounded-xl p-1 mb-2 w-full justify-start h-auto flex-wrap gap-1 shadow-sm">
                    {canAccessSessions && (
                        <TabsTrigger 
                            value="sessions" 
                            className="py-2 px-5 rounded-lg text-xs font-black data-[state=active]:bg-indigo-50/50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all"
                        >
                            الجلسات والنتائج
                        </TabsTrigger>
                    )}
                    {canAccessProfessions && (
                        <TabsTrigger 
                            value="professions" 
                            className="py-2 px-5 rounded-lg text-xs font-black data-[state=active]:bg-indigo-50/50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all"
                        >
                            المهن والتخصصات
                        </TabsTrigger>
                    )}
                    {canAccessQuestions && (
                        <TabsTrigger 
                            value="questions" 
                            className="py-2 px-5 rounded-lg text-xs font-black data-[state=active]:bg-indigo-50/50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all"
                        >
                            بنك الأسئلة والمحاور
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* تبويب الجلسات والنتائج */}
                {canAccessSessions && (
                    <TabsContent value="sessions" className="space-y-6 outline-none focus:outline-none">
                        {/* كروت الإحصائيات الست المستخلصة */}
                        <MockExamsStats stats={stats} />

                        {/* بطاقة السجلات الرئيسية للطلاب */}
                        <Card className="border border-gray-150 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                                <CardTitle className="text-sm font-black text-gray-900">سجل الجلسات والمشتبه بهم</CardTitle>
                                
                                {/* مكون الفلاتر الفرعي المستخلص */}
                                <SessionsFilters
                                    suspicionFilter={suspicionFilter}
                                    setSuspicionFilter={setSuspicionFilter}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    suspiciousCount={stats.suspiciousCount}
                                    criticalCount={stats.criticalCount}
                                />
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* مكون جدول الجلسات الفرعي المستخلص */}
                                <SessionsTable
                                    filteredSessions={filteredSessions}
                                    loading={loading}
                                    suspicionFilter={suspicionFilter}
                                    expandedGroups={expandedGroups}
                                    toggleGroup={toggleGroup}
                                    stopAttempts={stopAttempts}
                                    grantAttempt={grantAttempt}
                                    fetchReview={fetchReview}
                                    canManageActions={canManageActions}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* تبويب المهن والتخصصات */}
                {canAccessProfessions && (
                    <TabsContent value="professions" className="outline-none focus:outline-none">
                        <ProfessionsManager />
                    </TabsContent>
                )}

                {/* تبويب بنك الأسئلة */}
                {canAccessQuestions && (
                    <TabsContent value="questions" className="outline-none focus:outline-none">
                        <QuestionsManager />
                    </TabsContent>
                )}
            </Tabs>

            {/* نافذة تقرير مراجعة الأسئلة المستخلصة */}
            <SessionReviewModal
                reviewSessionId={reviewSessionId}
                setReviewSessionId={setReviewSessionId}
                reviewData={reviewData}
                reviewSessionMeta={reviewSessionMeta}
                loadingReview={loadingReview}
            />
        </div>
    );
}
