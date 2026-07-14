"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Settings, FileText, Beaker, ShieldAlert, Loader2, Wallet } from "lucide-react";
import { LocationsManagement } from "@/components/pricing/LocationsManagement";
import { ServicesList } from "@/components/pricing/ServicesList";
import { PoliciesList } from "@/components/pricing/PoliciesList";
import { MockExamPackages } from "@/components/pricing/MockExamPackages";
import { WalletsManagement } from "@/components/pricing/WalletsManagement";
import { PricingStats } from "@/components/pricing/PricingStats";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/rbac";

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-gray-100 rounded-2xl shadow-sm w-full animate-in fade-in-50">
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

export default function PricingPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("");

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!session || !hasAccess(session.user, "pricing.access")) {
        return <AccessDenied />;
    }

    const canAccessLocations = hasAccess(session.user, "pricing.locations");
    const canAccessServices = hasAccess(session.user, "pricing.services");
    const canAccessPolicies = hasAccess(session.user, "pricing.policies");
    const canAccessMockPackages = hasAccess(session.user, "pricing.mockPackages");
    const canAccessWallets = session.user.role === "ADMIN";

    const defaultTab = canAccessLocations
        ? "locations"
        : canAccessServices
        ? "services"
        : canAccessPolicies
        ? "policies"
        : canAccessMockPackages
        ? "mock-packages"
        : canAccessWallets
        ? "wallets"
        : "";

    if (!defaultTab) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto text-right" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">إدارة الرسوم والأسعار والسياسات</h1>
                    <p className="text-slate-500 text-xs">نظام الإدارة المركزي لرسوم التسجيل وسياسات النظام وباقات الاختبارات</p>
                </div>
            </div>

            {/* Central KPI Stats Dashboard */}
            <PricingStats />

            <Tabs defaultValue={defaultTab} className="w-full" onValueChange={setActiveTab}>
                <TabsList className="flex w-full md:w-fit bg-slate-100/80 p-1 rounded-2xl mb-8 gap-1">
                    {canAccessLocations && (
                        <TabsTrigger value="locations" className="gap-2 rounded-xl text-xs font-bold px-5 py-2.5 transition-all"><MapPin className="h-4 w-4" /> مراكز الاختبار والمدن</TabsTrigger>
                    )}
                    {canAccessServices && (
                        <TabsTrigger value="services" className="gap-2 rounded-xl text-xs font-bold px-5 py-2.5 transition-all"><Settings className="h-4 w-4" /> الخدمات الأساسية</TabsTrigger>
                    )}
                    {canAccessPolicies && (
                        <TabsTrigger value="policies" className="gap-2 rounded-xl text-xs font-bold px-5 py-2.5 transition-all"><FileText className="h-4 w-4" /> سياسات الإلغاء والتعديل</TabsTrigger>
                    )}
                    {canAccessMockPackages && (
                        <TabsTrigger value="mock-packages" className="gap-2 rounded-xl text-xs font-bold px-5 py-2.5 transition-all"><Beaker className="h-4 w-4" /> باقات الاختبارات التجريبية</TabsTrigger>
                    )}
                    {canAccessWallets && (
                        <TabsTrigger value="wallets" className="gap-2 rounded-xl text-xs font-bold px-5 py-2.5 transition-all"><Wallet className="h-4 w-4" /> إعداد محافظ الاستقبال</TabsTrigger>
                    )}
                </TabsList>

                {canAccessLocations && (
                    <TabsContent value="locations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <LocationsManagement />
                    </TabsContent>
                )}

                {canAccessServices && (
                    <TabsContent value="services" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <ServicesList />
                    </TabsContent>
                )}

                {canAccessPolicies && (
                    <TabsContent value="policies" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <PoliciesList />
                    </TabsContent>
                )}

                {canAccessMockPackages && (
                    <TabsContent value="mock-packages" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <MockExamPackages />
                    </TabsContent>
                )}

                {canAccessWallets && (
                    <TabsContent value="wallets" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <WalletsManagement />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

