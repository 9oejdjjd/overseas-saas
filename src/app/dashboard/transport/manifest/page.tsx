"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bus, Users, UserCheck, XCircle, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePassengerManifest } from "@/hooks/manifest/usePassengerManifest";
import { DailyTripSheet } from "@/components/manifest/DailyTripSheet";
import { PassengerSearch } from "@/components/manifest/PassengerSearch";
import { SmartAuditor } from "@/components/manifest/SmartAuditor";

export default function TransportManifestPage() {
    const {
        activeTab,
        setActiveTab,
        date,
        setDate,
        loading,
        searchTerm,
        setSearchTerm,
        opSearchQuery,
        setOpSearchQuery,
        opSearchResult,
        opSearchLoading,
        opUpdateLoading,
        opError,
        handlePrint,
        handleUpdateStatus,
        stats,
        filteredTickets,
        handleOpSearch,
        updateOpTicketStatus,
        fetchManifest
    } = usePassengerManifest();

    return (
        <div className="p-6 space-y-6 text-right" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print bg-gradient-to-r from-blue-50/50 to-indigo-50/40 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        <Bus className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            إدارة النقل وقوائم الركاب
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">كشوفات الرحلات اليومية للمسافرين وتأكيد صعود الحافلات والتدقيق الذكي</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="no-print bg-slate-50 p-1.5 border border-slate-150 rounded-2xl w-fit">
                    <TabsList className="flex gap-1.5 h-auto bg-transparent border-none">
                        <TabsTrigger 
                            value="manifest" 
                            className="data-[state=active]:bg-white data-[state=active]:text-[#16539a] py-2 px-4 rounded-xl gap-2 font-bold text-xs text-slate-650 transition-all border border-transparent data-[state=active]:border-slate-100 data-[state=active]:shadow-sm"
                        >
                            كشف الرحلات اليومي
                        </TabsTrigger>
                        <TabsTrigger 
                            value="operations"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#16539a] py-2 px-4 rounded-xl gap-2 font-bold text-xs text-slate-650 transition-all border border-transparent data-[state=active]:border-slate-100 data-[state=active]:shadow-sm"
                        >
                            البحث والمدقق الذكي
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ==========================================
                                MANIFEST TAB
                   ========================================== */}
                <TabsContent value="manifest" className="space-y-6 m-0">
                    <PassengerSearch 
                        date={date}
                        setDate={setDate}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        handlePrint={handlePrint}
                        fetchManifest={fetchManifest}
                    />

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
                        <Card className="bg-white shadow-sm border border-slate-100 rounded-2xl hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">إجمالي مقاعد حجز اليوم</span>
                                <Users className="h-4.5 w-4.5 text-slate-400" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-black text-slate-800">{stats.total}</CardContent>
                        </Card>
                        <Card className="bg-emerald-50/20 shadow-sm border border-emerald-100/60 rounded-2xl hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                                <span className="text-xs font-extrabold text-emerald-700">تم الحضور (Used)</span>
                                <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-black text-emerald-800">{stats.confirmed}</CardContent>
                        </Card>
                        <Card className="bg-rose-50/20 shadow-sm border border-rose-100/60 rounded-2xl hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                                <span className="text-xs font-extrabold text-rose-700">تخلف عن السفر (No Show)</span>
                                <XCircle className="h-4.5 w-4.5 text-rose-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-black text-rose-800">{stats.absent}</CardContent>
                        </Card>
                    </div>

                    {/* Printable List */}
                    <div className="print:block">
                        <div className="hidden print:flex flex-col items-center mb-8 border-b pb-4 text-center">
                            <div className="text-2xl font-black mb-2">كشف رحلات ركاب النقل البري</div>
                            <div className="flex justify-center gap-8 text-md text-slate-600">
                                <span>تاريخ الرحلة المغادرة: {date}</span>
                                <span>إجمالي المسافرين: {stats.total}</span>
                            </div>
                        </div>

                        <DailyTripSheet 
                            tickets={filteredTickets}
                            loading={loading}
                            handleUpdateStatus={handleUpdateStatus}
                        />

                        {/* Print Footer */}
                        <div className="mt-12 pt-5 border-t hidden print:flex justify-between text-xs text-slate-400 font-bold">
                            <div>توقيع كابتن الحافلة: _________________</div>
                            <div>توقيع مشرف الرحلة: _________________</div>
                            <div>تاريخ طباعة التقرير: {new Date().toLocaleString('ar-SA')}</div>
                        </div>
                    </div>
                </TabsContent>

                {/* ==========================================
                                OPERATIONS TAB
                   ========================================== */}
                <TabsContent value="operations" className="m-0">
                    <SmartAuditor 
                        opSearchQuery={opSearchQuery}
                        setOpSearchQuery={setOpSearchQuery}
                        opSearchResult={opSearchResult}
                        opSearchLoading={opSearchLoading}
                        opUpdateLoading={opUpdateLoading}
                        opError={opError}
                        handleOpSearch={handleOpSearch}
                        updateOpTicketStatus={updateOpTicketStatus}
                    />
                </TabsContent>
            </Tabs>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    .no-print { display: none !important; }
                    body { background: white; -webkit-print-color-adjust: exact; color: #1e293b; }
                    nav, aside, header { display: none !important; }
                    .bg-emerald-600 { background-color: #059669 !important; color: white !important; }
                    .bg-rose-50/30 { background-color: #fff1f2 !important; }
                    .bg-emerald-50/30 { background-color: #ecfdf5 !important; }
                }
            `}</style>
        </div>
    );
}
