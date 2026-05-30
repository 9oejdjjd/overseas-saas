"use client";

import { useVouchersManagement } from "@/hooks/pricing/useVouchersManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    PublicVouchers 
} from "@/components/vouchers/PublicVouchers";
import { 
    PersonalVouchers 
} from "@/components/vouchers/PersonalVouchers";
import { 
    CompensationVouchers 
} from "@/components/vouchers/CompensationVouchers";
import {
    Ticket,
    Tag,
    User,
    RefreshCw,
    CheckCircle2,
    History,
    ShieldAlert,
    Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/rbac";
import { useState } from "react";

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-slate-100 rounded-3xl shadow-sm w-full animate-in fade-in-50">
            <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed">
                ليس لديك الصلاحيات الكافية للوصول إلى نظام إدارة القسائم وأكواد الخصم. يرجى مراجعة مدير النظام للحصول على الصلاحيات المطلوبة.
            </p>
        </div>
    );
}

export default function VouchersPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("public");

    const {
        vouchers,
        locations,
        stats,
        loading,
        creating,
        showCreateModal,
        setShowCreateModal,
        newVoucher,
        personalSearchTerm,
        setPersonalSearchTerm,
        foundApplicants,
        selectedApplicant,
        setSelectedApplicant,
        personalVoucherType,
        setPersonalVoucherType,
        personalNotes,
        setPersonalNotes,
        personalDiscount,
        setPersonalDiscount,
        personalLocationId,
        setPersonalLocationId,
        fetchVouchers,
        handleCreateVoucher,
        generateRandomCode,
        handlePersonalSearch,
        handleCreatePersonalVoucher,
        updateNewVoucherField
    } = useVouchersManagement();

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-400 text-xs animate-pulse font-bold">جاري تحميل الجلسة والتحقق من الصلاحيات...</p>
            </div>
        );
    }

    if (!session || !hasAccess(session.user, "pricing.access")) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto text-right animate-in fade-in-50 duration-500" dir="rtl">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظام القسائم وأكواد الخصم المتقدم</h1>
                    <p className="text-slate-500 text-xs">إدارة القسائم الشخصية المعتمدة، الأكواد التسويقية العامة، ومحافظ التعويضات التلقائية.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={fetchVouchers} 
                        variant="outline" 
                        size="icon"
                        className="rounded-xl border-slate-200 h-10 w-10 hover:bg-slate-50 transition-colors shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Premium Stats KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active Vouchers */}
                <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">القسائم والأكواد النشطة</span>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.active}</span>
                            <p className="text-[10px] text-slate-400 font-bold block">قسيمة جاهزة ومتاحة للاستخدام</p>
                        </div>
                        <span className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                            <Ticket className="h-6 w-6" />
                        </span>
                    </CardContent>
                </Card>

                {/* Used Vouchers */}
                <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">القسائم المستعملة</span>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.used}</span>
                            <p className="text-[10px] text-slate-400 font-bold block">قسيمة تم صرفها وإدماجها بالطلبات</p>
                        </div>
                        <span className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                            <CheckCircle2 className="h-6 w-6" />
                        </span>
                    </CardContent>
                </Card>

                {/* Compensation Value */}
                <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-125" />
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">رصيد محافظ التعويضات</span>
                            <span className="text-2xl font-black text-amber-600 tracking-tight">{stats.totalAmount.toLocaleString()} <span className="text-xs font-bold text-amber-500">ر.ي</span></span>
                            <p className="text-[10px] text-slate-400 font-bold block">إجمالي رصيد الإلغاءات المسترجع للعملاء</p>
                        </div>
                        <span className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                            <History className="h-6 w-6" />
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="public" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="flex w-full md:w-fit bg-slate-100/80 p-1 rounded-2xl mb-8 gap-1">
                    <TabsTrigger value="public" className="gap-2 rounded-xl text-xs font-bold px-6 py-3 transition-all">
                        <Tag className="h-4 w-4" />
                        الأكواد الترويجية العامة
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="gap-2 rounded-xl text-xs font-bold px-6 py-3 transition-all">
                        <User className="h-4 w-4" />
                        القسائم الشخصية المعتمدة
                    </TabsTrigger>
                    <TabsTrigger value="compensation" className="gap-2 rounded-xl text-xs font-bold px-6 py-3 transition-all">
                        <History className="h-4 w-4" />
                        التعويضات ومحافظ الإلغاء
                    </TabsTrigger>
                </TabsList>

                {/* Tab content 1: Public Vouchers */}
                <TabsContent value="public" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <PublicVouchers 
                        vouchers={vouchers}
                        showCreateModal={showCreateModal}
                        setShowCreateModal={setShowCreateModal}
                        newVoucher={newVoucher}
                        updateNewVoucherField={updateNewVoucherField}
                        handleCreateVoucher={handleCreateVoucher}
                        generateRandomCode={generateRandomCode}
                        creating={creating}
                    />
                </TabsContent>

                {/* Tab content 2: Personal Vouchers */}
                <TabsContent value="personal" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <PersonalVouchers 
                        vouchers={vouchers}
                        locations={locations}
                        personalSearchTerm={personalSearchTerm}
                        setPersonalSearchTerm={setPersonalSearchTerm}
                        foundApplicants={foundApplicants}
                        selectedApplicant={selectedApplicant}
                        setSelectedApplicant={setSelectedApplicant}
                        personalVoucherType={personalVoucherType}
                        setPersonalVoucherType={setPersonalVoucherType}
                        personalNotes={personalNotes}
                        setPersonalNotes={setPersonalNotes}
                        personalDiscount={personalDiscount}
                        setPersonalDiscount={setPersonalDiscount}
                        personalLocationId={personalLocationId}
                        setPersonalLocationId={setPersonalLocationId}
                        handlePersonalSearch={handlePersonalSearch}
                        handleCreatePersonalVoucher={handleCreatePersonalVoucher}
                        creating={creating}
                    />
                </TabsContent>

                {/* Tab content 3: Compensation Vouchers */}
                <TabsContent value="compensation" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <CompensationVouchers 
                        vouchers={vouchers}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
