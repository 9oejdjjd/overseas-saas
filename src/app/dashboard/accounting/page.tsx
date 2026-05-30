"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountingDashboard } from "@/hooks/accounting/useAccountingDashboard";
import { KpiCard } from "@/components/accounting/KpiCard";
import { TransactionsTable } from "@/components/accounting/TransactionsTable";
import { LocationProfitsCard } from "@/components/accounting/LocationProfitsCard";
import { PendingExpensesTab } from "@/components/accounting/PendingExpensesTab";
import { QuickTransactionModal } from "@/components/accounting/QuickTransactionModal";
import { VoucherRefundModal } from "@/components/accounting/VoucherRefundModal";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    Plus,
    Filter,
    Download,
    RefreshCw,
    Loader2
} from "lucide-react";

export default function AccountingPage() {
    const {
        data,
        loading,
        period,
        setPeriod,
        locationId,
        setLocationId,
        showQuickTransaction,
        setShowQuickTransaction,
        showRefundModal,
        setShowRefundModal,
        refresh,
        silentRefresh
    } = useAccountingDashboard();

    const getPeriodLabel = (p: string) => {
        return { 
            all: "البيان بالكامل", 
            today: "اليوم", 
            week: "هذا الأسبوع", 
            month: "هذا الشهر" 
        }[p] || p;
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
                <Loader2 className="animate-spin text-emerald-500 h-9 w-9" />
                <p className="text-slate-500 dark:text-slate-400 text-xs">جاري تحميل بيانات المركز المالي...</p>
            </div>
        );
    }

    if (!data || !data.summary) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border rounded-2xl max-w-md mx-auto mt-20 animate-fade-in shadow-sm">
                <p className="text-rose-500 dark:text-rose-450 font-bold text-sm">فشل في تحميل التقارير المالية</p>
                <p className="text-xs text-slate-400 mt-1">يرجى التأكد من اتصال الخادم وقواعد البيانات والمحاولة مرة أخرى.</p>
                <Button onClick={refresh} variant="outline" className="mt-4 font-bold border-slate-200 rounded-xl h-9 px-4">
                    إعادة المحاولة
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-2 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                        <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        المركز المالي والحسابات
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                        مراقبة التدفقات النقدية، صافي الأرباح الموزعة بالمناطق، واعتماد المصروفات التشغيلية.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowRefundModal(true)} 
                        className="gap-1.5 text-orange-700 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 hover:bg-orange-100 dark:hover:bg-orange-950/40 font-bold h-10 rounded-xl text-xs"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        استرداد تعويض قسيمة
                    </Button>
                    <Button 
                        variant="outline" 
                        className="gap-1.5 h-10 rounded-xl hover:bg-slate-50 border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
                    >
                        <Download className="h-3.5 w-3.5" />
                        تصدير التقرير
                    </Button>
                    <Button 
                        onClick={() => setShowQuickTransaction(true)} 
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all h-10 rounded-xl text-xs"
                    >
                        <Plus className="h-4 w-4" />
                        سند قبض أو صرف
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[360px] bg-slate-100/70 dark:bg-slate-950 rounded-xl p-1 h-10.5 mb-6">
                    <TabsTrigger value="dashboard" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                        <TrendingUp className="h-3.5 w-3.5" />
                        المركز المالي
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-1.5 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 relative">
                        <TrendingDown className="h-3.5 w-3.5" /> 
                        مصروفات مستحقة
                        {data.pendingExpenses?.length > 0 && (
                            <span className="absolute top-1.5 left-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    
                    {/* Interactive Filter Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-900/60 shrink-0">
                            <Filter className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold">تصفية السجلات الماليّة:</span>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shrink-0">
                            {["all", "today", "week", "month"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                        period === p
                                            ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/30 dark:border-slate-850"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {getPeriodLabel(p)}
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        <div className="relative shrink-0">
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-48 p-2.5 pr-4 pl-8"
                            >
                                <option value="">جميع المناطق (الكل)</option>
                                {data?.locations?.map((loc) => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center px-1 text-slate-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Grid (KPIs with premium styles) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="إجمالي الإيرادات"
                            amount={data.summary.revenue}
                            icon={TrendingUp}
                            color="text-emerald-600 dark:text-emerald-400"
                            bg="bg-emerald-50 dark:bg-emerald-950/20"
                            trend="+12%"
                        />
                        <KpiCard
                            title="المصروفات التشغيلية"
                            amount={data.summary.expenses}
                            icon={TrendingDown}
                            color="text-rose-600 dark:text-rose-400"
                            bg="bg-rose-50 dark:bg-rose-950/20"
                        />
                        <KpiCard
                            title="المسحوبات / الاسترجاع"
                            amount={data.summary.withdrawals}
                            icon={Wallet}
                            color="text-orange-600 dark:text-orange-400"
                            bg="bg-orange-50 dark:bg-orange-950/20"
                        />
                        <KpiCard
                            title="صافي الربح"
                            amount={data.summary.netProfit}
                            icon={PiggyBank}
                            color="text-blue-600 dark:text-blue-400"
                            bg="bg-blue-50 dark:bg-blue-950/20"
                            highlight
                        />
                    </div>

                    {/* Financial Dashboard Tables Columns */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Right: Transactions Table (takes 2 cols) */}
                        <div className="xl:col-span-2">
                            <TransactionsTable transactions={data.transactions} />
                        </div>

                        {/* Left: Profit By Location Card (takes 1 col) */}
                        <div className="xl:col-span-1">
                            <LocationProfitsCard profitByLocation={data.profitByLocation} />
                        </div>
                    </div>

                </TabsContent>

                {/* Pending Expenses Tab */}
                <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0 mt-2">
                    <PendingExpensesTab 
                        pendingExpenses={data.pendingExpenses || []} 
                        onRefresh={silentRefresh} 
                    />
                </TabsContent>
            </Tabs>

            {/* Quick Transaction Modal ( قبض / صرف ) */}
            <QuickTransactionModal
                isOpen={showQuickTransaction}
                onClose={() => setShowQuickTransaction(false)}
                onSuccess={refresh}
            />

            {/* Voucher Refund Modal ( استرداد قسيمة ) */}
            <VoucherRefundModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
