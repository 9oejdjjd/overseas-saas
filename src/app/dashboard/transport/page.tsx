"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, MapPin, Map, DollarSign, Calendar, Settings } from "lucide-react";

// Transport Components
import { DestinationsManagement } from "@/components/transport/DestinationsManagement";
import { RoutesManagement } from "@/components/transport/RoutesManagement";
import { RoutePricingManagement } from "@/components/transport/RoutePricingManagement";
import { ScheduleManagement } from "@/components/transport/ScheduleManagement";
import { PricingRulesManagement } from "@/components/transport/PricingRulesManagement";
import { TripTemplatesManagement } from "@/components/transport/TripTemplatesManagement";

export default function TransportManagementPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bus className="h-7 w-7 text-blue-600" />
                    إدارة وجدولة النقل
                </h1>
                <p className="text-gray-500 mt-1">إضافة الوجهات، المسارات، تسعير التذاكر، وجدولة الرحلات</p>
            </div>

            <Tabs defaultValue="schedule" className="w-full">
                <div className="bg-white border rounded-xl p-2 mb-6">
                    <TabsList className="grid grid-cols-2 lg:grid-cols-7 h-auto gap-2 bg-transparent justify-start">
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <Calendar className="h-4 w-4" />
                            الجدولة
                        </TabsTrigger>
                        <TabsTrigger value="destinations" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <MapPin className="h-4 w-4" />
                            الوجهات
                        </TabsTrigger>
                        <TabsTrigger value="routes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <Map className="h-4 w-4" />
                            المسارات
                        </TabsTrigger>
                        <TabsTrigger value="pricing" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <DollarSign className="h-4 w-4" />
                            التسعير
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <DollarSign className="h-4 w-4" />
                            قواعد التسعير
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-3 gap-2">
                            <Settings className="h-4 w-4" />
                            قوالب الرحلات
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="bg-white border rounded-xl p-6 shadow-sm min-h-[600px]">
                    <TabsContent value="schedule" className="m-0 mt-2">
                        <ScheduleManagement />
                    </TabsContent>
                    <TabsContent value="destinations" className="m-0 mt-2">
                        <DestinationsManagement />
                    </TabsContent>
                    <TabsContent value="routes" className="m-0 mt-2">
                        <RoutesManagement />
                    </TabsContent>
                    <TabsContent value="pricing" className="m-0 mt-2">
                        <RoutePricingManagement />
                    </TabsContent>
                    <TabsContent value="rules" className="m-0 mt-2">
                        <PricingRulesManagement />
                    </TabsContent>
                    <TabsContent value="templates" className="m-0 mt-2">
                        <TripTemplatesManagement />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
