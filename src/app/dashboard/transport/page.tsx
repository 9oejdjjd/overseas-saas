"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, MapPin, Map, DollarSign, Calendar, Settings, ShieldAlert, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/rbac";

// Transport Components
import { DestinationsManagement } from "@/components/transport/DestinationsManagement";
import { RoutesManagement } from "@/components/transport/RoutesManagement";
import { RoutePricingManagement } from "@/components/transport/RoutePricingManagement";
import { ScheduleManagement } from "@/components/transport/ScheduleManagement";
import { TripTemplatesManagement } from "@/components/transport/TripTemplatesManagement";

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-gray-100 rounded-2xl shadow-sm w-full animate-in fade-in duration-300">
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

export default function TransportManagementPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16539a]"></div>
                <p className="text-sm text-gray-500 font-medium">جاري تحميل إدارة وجدولة النقل البري...</p>
            </div>
        );
    }

    if (!session || !hasAccess(session.user, "transport.access")) {
        return <AccessDenied />;
    }

    const canAccessSchedule = hasAccess(session.user, "transport.schedule");
    const canAccessDestinations = hasAccess(session.user, "transport.destinations");
    const canAccessRoutes = hasAccess(session.user, "transport.routes");
    const canAccessPricing = hasAccess(session.user, "transport.pricing");
    const canAccessTemplates = hasAccess(session.user, "transport.templates");

    const defaultTab = canAccessSchedule
        ? "schedule"
        : canAccessDestinations
        ? "destinations"
        : canAccessRoutes
        ? "routes"
        : canAccessPricing
        ? "pricing"
        : canAccessTemplates
        ? "templates"
        : "";

    if (!defaultTab) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 text-right" dir="rtl">
            
            {/* Consistent Modern Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Bus className="h-8 w-8 text-[#16539a]" />
                        إدارة وجدولة النقل البري
                    </h1>
                    <p className="text-gray-500 mt-1.5 text-sm">إضافة الوجهات، المسارات، تسعير التذاكر، وجدولة الرحلات والمخطط اليومي</p>
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                {/* Modern Responsive Tabs Container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-2 mb-6 shadow-sm">
                    <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start border-none">
                        {canAccessSchedule && (
                            <TabsTrigger 
                                value="schedule" 
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-[#16539a] py-3 px-4 rounded-xl gap-2 font-bold text-sm text-slate-600 transition-all border border-transparent data-[state=active]:border-blue-100"
                            >
                                <Calendar className="h-4 w-4 text-[#16539a]" />
                                الجدولة والرحلات
                            </TabsTrigger>
                        )}
                        {canAccessDestinations && (
                            <TabsTrigger 
                                value="destinations" 
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-[#16539a] py-3 px-4 rounded-xl gap-2 font-bold text-sm text-slate-600 transition-all border border-transparent data-[state=active]:border-blue-100"
                            >
                                <MapPin className="h-4 w-4 text-[#16539a]" />
                                الوجهات الجغرافية
                            </TabsTrigger>
                        )}
                        {canAccessRoutes && (
                            <TabsTrigger 
                                value="routes" 
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-[#16539a] py-3 px-4 rounded-xl gap-2 font-bold text-sm text-slate-600 transition-all border border-transparent data-[state=active]:border-blue-100"
                            >
                                <Map className="h-4 w-4 text-[#16539a]" />
                                مسارات الرحلات
                            </TabsTrigger>
                        )}
                        {canAccessPricing && (
                            <TabsTrigger 
                                value="pricing" 
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-[#16539a] py-3 px-4 rounded-xl gap-2 font-bold text-sm text-slate-600 transition-all border border-transparent data-[state=active]:border-blue-100"
                            >
                                <DollarSign className="h-4 w-4 text-[#16539a]" />
                                تسعير المسارات
                            </TabsTrigger>
                        )}
                        {canAccessTemplates && (
                            <TabsTrigger 
                                value="templates" 
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-[#16539a] py-3 px-4 rounded-xl gap-2 font-bold text-sm text-slate-600 transition-all border border-transparent data-[state=active]:border-blue-100"
                            >
                                <Settings className="h-4 w-4 text-[#16539a]" />
                                قوالب الجدولة
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* Content Panel Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
                    {canAccessSchedule && (
                        <TabsContent value="schedule" className="m-0 mt-0">
                            <ScheduleManagement />
                        </TabsContent>
                    )}
                    {canAccessDestinations && (
                        <TabsContent value="destinations" className="m-0 mt-0">
                            <DestinationsManagement />
                        </TabsContent>
                    )}
                    {canAccessRoutes && (
                        <TabsContent value="routes" className="m-0 mt-0">
                            <RoutesManagement />
                        </TabsContent>
                    )}
                    {canAccessPricing && (
                        <TabsContent value="pricing" className="m-0 mt-0">
                            <RoutePricingManagement />
                        </TabsContent>
                    )}
                    {canAccessTemplates && (
                        <TabsContent value="templates" className="m-0 mt-0">
                            <TripTemplatesManagement />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
