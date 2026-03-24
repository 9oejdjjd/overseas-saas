"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, XCircle, MoreVertical, FileDown, Trash2, Edit } from "lucide-react";
import { useApplicantData } from "@/hooks/useApplicantData";
import { ApplicantAdminDashboard } from "@/components/ApplicantAdminDashboard";
import { ApplicantProfileHero } from "@/components/applicants/ApplicantProfileHero";
import { ApplicantStatsGrid } from "@/components/applicants/ApplicantStatsGrid";
import { ExamStatusCard } from "@/components/applicants/ExamStatusCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ApplicantDetailPage() {
    const params = useParams();
    const router = useRouter();

    const {
        applicant,
        transactions,
        ticket,
        activityLogs,
        pricingPackages,
        transportRoute,
        cancellationPolicies,
        loading,
        refresh
    } = useApplicantData(params.id as string);

    // Loading State
    if (loading && !applicant) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
                    <p className="text-muted-foreground text-sm">جاري تحميل بيانات المتقدم...</p>
                </div>
            </div>
        );
    }

    // Not Found State
    if (!applicant && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">لم يتم العثور على المتقدم</h2>
                    <p className="text-sm text-muted-foreground">تأكد من صحة الرابط أو عد للقائمة الرئيسية</p>
                    <Button onClick={() => router.push("/applicants")} variant="outline" className="mt-2">
                        <ArrowRight className="h-4 w-4 ml-2" />
                        العودة للقائمة
                    </Button>
                </div>
            </div>
        );
    }

    // Calculate financials
    const totalPaid = transactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + Number(t.amount), 0);
    const remaining = Number(applicant?.totalAmount || 0) - totalPaid;

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="bg-card border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 lg:px-6 py-3">
                    <div className="flex items-center justify-between">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/applicants")}
                                className="text-muted-foreground hover:text-foreground -mr-2"
                            >
                                <ArrowRight className="h-4 w-4 ml-1" />
                                رجوع
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">المتقدمين</span>
                                <span className="text-border">/</span>
                                <span className="text-foreground font-medium truncate max-w-[200px]">
                                    {applicant?.fullName}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4 ml-1" />
                                    إجراءات
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem className="cursor-pointer">
                                    <Edit className="h-4 w-4 ml-2" />
                                    تعديل البيانات
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <FileDown className="h-4 w-4 ml-2" />
                                    تصدير PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف الملف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6 max-w-7xl">

                {/* Profile Hero */}
                {applicant && (
                    <ApplicantProfileHero
                        applicant={applicant}
                        ticket={ticket}
                        activityLogs={activityLogs}
                        onUpdate={refresh}
                    />
                )}

                {/* Stats Grid */}
                {applicant && (
                    <ApplicantStatsGrid
                        applicant={applicant}
                        ticket={ticket}
                        totalPaid={totalPaid}
                        remaining={remaining}
                    />
                )}

                {/* Exam Status Card (Quick Result Entry) */}
                {applicant && (
                    <ExamStatusCard
                        applicant={applicant}
                        onUpdate={refresh}
                    />
                )}

                {/* Tabs Dashboard */}
                {applicant && (
                    <ApplicantAdminDashboard
                        applicant={applicant}
                        transactions={transactions}
                        ticket={ticket}
                        activityLogs={activityLogs}
                        pricingPackages={pricingPackages}
                        transportRoute={transportRoute}
                        cancellationPolicies={cancellationPolicies}
                        onUpdate={refresh}
                    />
                )}
            </div>
        </div>
    );
}
