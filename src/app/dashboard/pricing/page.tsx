"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Settings, FileText } from "lucide-react";
import { LocationsManagement } from "@/components/pricing/LocationsManagement";
import { ServicesList } from "@/components/pricing/ServicesList";
import { PoliciesList } from "@/components/pricing/PoliciesList";

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState("locations");

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">إدارة الرسوم والسياسات</h1>
                    <p className="text-gray-500 mt-2">نظام الإدارة المركزي لرسوم التسجيل وسياسات النظام</p>
                </div>
            </div>

            <Tabs defaultValue="locations" className="w-full" onValueChange={setActiveTab}>
                {/* Removed the transport tab based on user request */}
                <TabsList className="grid w-full grid-cols-3 lg:w-[450px] mb-8">
                    <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> المواقع</TabsTrigger>
                    <TabsTrigger value="services" className="gap-2"><Settings className="h-4 w-4" /> الخدمات</TabsTrigger>
                    <TabsTrigger value="policies" className="gap-2"><FileText className="h-4 w-4" /> السياسات</TabsTrigger>
                </TabsList>

                <TabsContent value="locations">
                    <LocationsManagement />
                </TabsContent>

                <TabsContent value="services">
                    <ServicesList />
                </TabsContent>

                <TabsContent value="policies">
                    <PoliciesList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
