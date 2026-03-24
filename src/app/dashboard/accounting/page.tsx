"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { QuickTransactionModal } from "@/components/accounting/QuickTransactionModal";
import { VoucherRefundModal } from "@/components/accounting/VoucherRefundModal";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    PiggyBank,
    Plus,
    Filter,
    Search,
    Download,
    Ticket,
    X,
    RefreshCw
} from "lucide-react";

type AccountingData = {
    summary: {
        revenue: number;
        expenses: number;
        withdrawals: number;
        netProfit: number;
    };
    transactions: any[];
    applicantProfits: any[];
    profitByLocation: any[];
    locations: { id: string; name: string }[];
};

// ... inside component ...

export default function AccountingPage() {
    const [data, setData] = useState<AccountingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [locationId, setLocationId] = useState("");
    const [showQuickTransaction, setShowQuickTransaction] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false); // New State

    // ...



    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (period) params.append("period", period);
            if (locationId) params.append("locationId", locationId);

            const res = await fetch(`/api/accounting?${params}`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, locationId]);

    const getPeriodLabel = (p: string) => {
        return { today: "اليوم", week: "هذا الأسبوع", month: "هذا الشهر" }[p] || p;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل بيانات المحاسبة...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.summary) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">فشل في تحميل البيانات</p>
                <Button onClick={fetchData} variant="outline" className="mt-4">إعادة المحاولة</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">المركز المالي</h1>
                    <p className="text-gray-500 mt-1">نظرة شاملة على التدفقات المالية، الأرباح، والمصروفات.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowRefundModal(true)} className="gap-2 text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:text-orange-800">
                        <RefreshCw className="h-4 w-4" />
                        استرداد قسيمة
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        تصدير تقرير
                    </Button>
                    <Button onClick={() => setShowQuickTransaction(true)} className="gap-2 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                        <Plus className="h-4 w-4" />
                        تسجيل عملية سريعة
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-1 lg:w-[200px] mb-8">
                    <TabsTrigger value="dashboard" className="gap-2"><TrendingUp className="h-4 w-4" /> المركز المالي</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-8">
                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <Filter className="h-4 w-4" />
                            <span className="text-sm font-medium">تصفية حسب:</span>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {["today", "week", "month"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${period === p
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {getPeriodLabel(p)}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <div className="relative">
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2 pr-4"
                            >
                                <option value="">جميع المناطق (الكل)</option>
                                {data?.locations?.map((loc) => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary Cards (KPIs) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KpiCard
                            title="إجمالي الإيرادات"
                            amount={data.summary.revenue}
                            icon={TrendingUp}
                            color="text-green-600"
                            bg="bg-green-50"
                            trend="+12%"
                        />
                        <KpiCard
                            title="المصروفات التشغيلية"
                            amount={data.summary.expenses}
                            icon={TrendingDown}
                            color="text-red-600"
                            bg="bg-red-50"
                        />
                        <KpiCard
                            title="المسحوبات / الاسترجاع"
                            amount={data.summary.withdrawals}
                            icon={Wallet}
                            color="text-orange-600"
                            bg="bg-orange-50"
                        />
                        <KpiCard
                            title="صافي الربح"
                            amount={data.summary.netProfit}
                            icon={PiggyBank}
                            color="text-blue-600"
                            bg="bg-blue-50"
                            highlight
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Right Column: Transactions Table */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">سجل العمليات المالية</h3>
                                    <div className="relative w-64">
                                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input placeholder="بحث في العمليات..." className="pr-9 h-9 text-xs" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50/50 text-gray-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">التاريخ</th>
                                                <th className="px-6 py-3 font-medium">النوع</th>
                                                <th className="px-6 py-3 font-medium">الوصف</th>
                                                <th className="px-6 py-3 font-medium">المبلغ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.transactions.length === 0 ? (
                                                <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد معاملات في هذه الفترة</td></tr>
                                            ) : (
                                                data.transactions.slice(0, 15).map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                            {new Date(tx.date).toLocaleDateString("ar-EG")}
                                                            <span className="block text-xs text-gray-400 mt-0.5">{new Date(tx.date).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant={
                                                                tx.type === "PAYMENT" ? "outline" : tx.type === "EXPENSE" ? "destructive" : "secondary"
                                                            } className={
                                                                tx.type === "PAYMENT" ? "text-green-700 bg-green-50 border-green-200" :
                                                                    tx.type === "EXPENSE" ? "text-red-700 bg-red-50 border-red-200" : ""
                                                            }>
                                                                {tx.type === "PAYMENT" ? "قبض" : tx.type === "EXPENSE" ? "صرف" : "مسحوب"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-medium text-gray-900 line-clamp-1">{tx.description || "-"}</p>
                                                            {tx.applicant && <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><UserIcon className="h-3 w-3" /> {tx.applicant.fullName}</p>}
                                                        </td>
                                                        <td className={`px-6 py-4 font-bold whitespace-nowrap ${tx.type === "PAYMENT" ? "text-green-600" : "text-red-500"}`}>
                                                            {tx.type === "PAYMENT" ? "+" : "-"} {Number(tx.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Left Column: Profit Stats */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                                    <h3 className="font-bold text-gray-900 text-sm">أداء المناطق (الأرباح)</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {data.profitByLocation.map((loc) => (
                                        <div key={loc.locationId} className="p-5 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-800">{loc.locationName}</h4>
                                                <Badge variant="outline" className={Number(loc.profitMargin) > 20 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}>
                                                    هامش {loc.profitMargin}%
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">الإيرادات</span>
                                                    <span className="font-medium">{Number(loc.revenue).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">التكاليف المقدرة</span>
                                                    <span className="font-medium text-red-500">{Number(loc.cost).toLocaleString()}</span>
                                                </div>
                                                <div className="pt-2 border-t border-dashed mt-2 flex justify-between text-sm font-bold">
                                                    <span>الربح الصافي</span>
                                                    <span className="text-blue-600">{Number(loc.profit).toLocaleString()} ر.ي</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Transaction Modal */}
            <QuickTransactionModal
                isOpen={showQuickTransaction}
                onClose={() => setShowQuickTransaction(false)}
                onSuccess={() => {
                    fetchData(); // Refresh data
                }}
            />

            <VoucherRefundModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onSuccess={() => {
                    fetchData(); // Refresh data to show new withdrawal
                }}
            />
        </div >
    );
}

// End of helper components

// Helper Components
function KpiCard({ title, amount, icon: Icon, color, bg, trend, highlight }: any) {
    return (
        <div className={`p-6 rounded-xl border transition-all ${highlight ? 'bg-slate-900 text-white border-slate-800 shadow-md' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${highlight ? 'bg-slate-800' : bg}`}>
                    <Icon className={`h-6 w-6 ${highlight ? 'text-blue-400' : color}`} />
                </div>
                {trend && <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <h3 className={`text-sm font-medium ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
            <p className="text-3xl font-bold mt-2 tracking-tight">
                {amount.toLocaleString()} <span className={`text-sm font-normal ${highlight ? 'text-gray-500' : 'text-gray-400'}`}>ر.ي</span>
            </p>
        </div>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
