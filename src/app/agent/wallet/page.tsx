"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Wallet, RefreshCw, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WalletKPICards } from "@/components/agent/wallet/WalletKPICards";
import { WalletTransactionsTable } from "@/components/agent/wallet/WalletTransactionsTable";
import { TopUpModal } from "@/components/agent/wallet/TopUpModal";
import { AgentWalletTransaction } from "@/types/agent";

interface WalletData {
    walletBalance: number;
    totalDeposited: number;
    totalSpent: number;
    allowDebt: boolean;
    debtLimit: number;
    currency: string;
    commissionRate: number;
    customSingleExamPrice: number | null;
    companyName?: string;
    transactions: AgentWalletTransaction[];
}

export default function WalletPage() {
    const { data: session } = useSession();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<AgentWalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    const fetchWalletData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams();
            if (typeFilter !== "ALL") params.set("type", typeFilter);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());

            const res = await fetch(`/api/agent/wallet?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setWallet(json.data);
                    setTransactions(json.data.transactions || []);
                }
            }
        } catch (err) {
            console.error("Failed to load wallet data", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchWalletData();
        }
    }, [session, typeFilter]);

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (session) fetchWalletData();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const balance = wallet?.walletBalance || 0;
    const isNegative = balance < 0;
    const currency = wallet?.currency === "SAR" ? "ر.س" : "ريال";
    const userName = session?.user?.name || "الوكيل";

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#074388]/10 text-[#074388] rounded-2xl">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-[#074388] dark:text-white">المحفظة المالية للوكيل</h2>
                        <p className="text-xs text-slate-400 font-bold">متابعة الرصيد المالي، سجل الإيداعات، ومصروفات شراء الاختبارات والعمولات.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchWalletData(true)}
                        disabled={refreshing || loading}
                        className="h-10 px-3.5 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 gap-1.5 rounded-xl font-bold text-xs bg-white"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-[#074388]")} />
                        تحديث
                    </Button>
                    <Button
                        onClick={() => setShowTopUpModal(true)}
                        className="h-10 px-5 bg-[#55943b] hover:bg-[#4a8333] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#55943b]/20 transition-all text-xs"
                    >
                        <PlusCircle size={15} /> طلب شحن رصيد
                    </Button>
                </div>
            </div>

            {/* Main Financial KPI Cards */}
            <div className="animate-fade-in">
                <WalletKPICards
                    balance={balance}
                    isNegative={isNegative}
                    currency={currency}
                    wallet={wallet}
                    transactionsCount={transactions.length}
                />
            </div>

            {/* Transactions Section */}
            <div className="animate-fade-in">
                <WalletTransactionsTable
                    transactions={transactions}
                    loading={loading}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    currency={currency}
                />
            </div>

            {/* Top-up Request Modal / Dialog */}
            <TopUpModal
                isOpen={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
                wallet={wallet}
                balance={balance}
                userName={userName}
            />
        </div>
    );
}
