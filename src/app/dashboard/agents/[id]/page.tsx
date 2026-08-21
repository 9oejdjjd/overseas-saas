"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    Briefcase, Users, FileText, Wallet, ArrowRight, Loader2, 
    ShieldAlert, Calendar, Info, Save, Phone, Mail, MapPin, 
    CheckCircle2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import { hasAccess } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AgentDepositDialog } from "@/components/dashboard/agents/AgentDepositDialog";
import { AgentClientsTab } from "@/components/dashboard/agents/AgentClientsTab";
import { AgentOrdersTab } from "@/components/dashboard/agents/AgentOrdersTab";
import { AgentWalletTab } from "@/components/dashboard/agents/AgentWalletTab";
import { AgentUsersTab } from "@/components/dashboard/agents/AgentUsersTab";
import { AgentPricingTab } from "@/components/dashboard/agents/AgentPricingTab";
import { TravelAgent as Agent, AgentClient as Client, AgentExamOrder as Order, AgentWalletTransaction as Transaction, AgentUser } from "@/types/agent";

export default function AgentDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status: authStatus } = useSession();

    const [agent, setAgent] = useState<Agent | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [agentUsers, setAgentUsers] = useState<AgentUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Deposit state
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositDescription, setDepositDescription] = useState("");
    const [depositType, setDepositType] = useState("DEPOSIT");
    const [submittingDeposit, setSubmittingDeposit] = useState(false);

    // Debt states
    const [allowDebt, setAllowDebt] = useState(false);
    const [debtLimit, setDebtLimit] = useState("0");
    const [savingDebtConfig, setSavingDebtConfig] = useState(false);

    // Pricing States
    const [pricingData, setPricingData] = useState<any>(null);
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [savingPricing, setSavingPricing] = useState(false);
    const [customSingleExamPrice, setCustomSingleExamPrice] = useState("");
    const [customPackages, setCustomPackages] = useState<any[]>([]);

    useEffect(() => {
        if (authStatus === "loading") return;
        if (!session || !hasAccess(session.user, "agents.access")) {
            return;
        }
        if (id) {
            loadAgentData();
        }
    }, [authStatus, session, id]);

    const loadAgentData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchAgentDetails(),
                fetchAgentClients(),
                fetchAgentOrders(),
                fetchAgentTransactions(),
                fetchAgentUsers(),
                fetchAgentPricing()
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgentDetails = async () => {
        const res = await fetch(`/api/agents/${id}`);
        if (res.ok) {
            const json = await res.json();
            setAgent(json.data);
            setAllowDebt(json.data.allowDebt);
            setDebtLimit(String(json.data.debtLimit));
        }
    };

    const fetchAgentClients = async () => {
        const res = await fetch(`/api/agents/${id}/clients`);
        if (res.ok) {
            const json = await res.json();
            setClients(json.data || []);
        }
    };

    const fetchAgentOrders = async () => {
        const res = await fetch(`/api/agents/${id}/orders`);
        if (res.ok) {
            const json = await res.json();
            setOrders(json.data || []);
        }
    };

    const fetchAgentTransactions = async () => {
        const res = await fetch(`/api/agents/${id}/wallet`);
        if (res.ok) {
            const json = await res.json();
            setTransactions(json.data || []);
        }
    };

    const fetchAgentUsers = async () => {
        const res = await fetch(`/api/agents/${id}/users`);
        if (res.ok) {
            const json = await res.json();
            setAgentUsers(json.data || []);
        }
    };

    const fetchAgentPricing = async () => {
        try {
            setLoadingPricing(true);
            const res = await fetch(`/api/agents/${id}/pricing`);
            if (res.ok) {
                const json = await res.json();
                setPricingData(json);
                setCustomSingleExamPrice(json.pricing?.singleExam?.customPrice !== null && json.pricing?.singleExam?.customPrice !== undefined ? String(json.pricing.singleExam.customPrice) : "");
                setCustomPackages(json.pricing?.packages || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPricing(false);
        }
    };

    const handleSavePricing = async () => {
        setSavingPricing(true);
        try {
            const res = await fetch(`/api/agents/${id}/pricing`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customSingleExamPrice: customSingleExamPrice === "" ? null : Number(customSingleExamPrice),
                    packages: customPackages.map(p => ({
                        packageId: p.packageId,
                        isEnabled: p.isEnabled,
                        customPrice: p.customPrice === "" || p.customPrice === null ? null : Number(p.customPrice)
                    }))
                })
            });
            if (res.ok) {
                alert("تم تحديث أسعار الوكيل بنجاح!");
                fetchAgentPricing();
            } else {
                const json = await res.json();
                alert(json.error || "فشل تحديث الأسعار");
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء حفظ الأسعار");
        } finally {
            setSavingPricing(false);
        }
    };

    const handleSaveDebtConfig = async () => {
        setSavingDebtConfig(true);
        try {
            const res = await fetch(`/api/agents/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    allowDebt,
                    debtLimit: Number(debtLimit)
                })
            });
            if (res.ok) {
                alert("تم تحديث إعدادات الشراء بالدين بنجاح!");
                fetchAgentDetails();
            } else {
                alert("فشل تحديث إعدادات الدين");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingDebtConfig(false);
        }
    };

    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingDeposit(true);
        try {
            const res = await fetch(`/api/agents/${id}/wallet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: depositType === "ADJUSTMENT_NEG" ? "ADJUSTMENT" : depositType,
                    amount: depositType === "ADJUSTMENT_NEG" ? -Number(depositAmount) : Number(depositAmount),
                    description: depositDescription
                })
            });
            if (res.ok) {
                alert("تم تحديث رصيد المحفظة بنجاح!");
                setIsDepositOpen(false);
                setDepositAmount("");
                setDepositDescription("");
                fetchAgentDetails();
                fetchAgentTransactions();
            } else {
                alert("فشل إجراء العملية المالية");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingDeposit(false);
        }
    };

    const handleAddUserSubmit = async (e: React.FormEvent, userData: any): Promise<boolean> => {
        try {
            const res = await fetch(`/api/agents/${id}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                alert("تم إضافة مستخدم البوابة وتفعيل حسابه بنجاح!");
                fetchAgentUsers();
                return true;
            } else {
                const json = await res.json();
                alert(json.error || "فشل إضافة مستخدم جديد");
                return false;
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ ما");
            return false;
        }
    };

    const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/agents/${id}/users`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    active: !currentActive
                })
            });
            if (res.ok) {
                fetchAgentUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟")) return;
        try {
            const res = await fetch(`/api/agents/${id}/users?userId=${userId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("تم حذف مستخدم البوابة بنجاح.");
                fetchAgentUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent, userId: string, tempPass: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/agents/${id}/users`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    password: tempPass
                })
            });
            if (res.ok) {
                alert(`تم تحديث كلمة المرور بنجاح للموظف! كلمة المرور الجديدة هي: ${tempPass}`);
                return true;
            } else {
                alert("فشل تعيين كلمة المرور");
                return false;
            }
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    if (authStatus === "loading" || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-650" />
                    <span className="text-xs font-black text-slate-500 animate-pulse">جاري تحميل ملف الشريك المالي...</span>
                </div>
            </div>
        );
    }

    if (!session || !hasAccess(session.user, "agents.access")) {
        return (
            <div className="flex h-screen items-center justify-center p-6 bg-slate-50 text-center" dir="rtl">
                <div className="bg-white p-8 rounded-2xl border max-w-sm space-y-4 shadow-sm">
                    <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
                    <h3 className="text-base font-black text-slate-800">صلاحية وصول مرفوضة</h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">عذراً، حسابك لا يملك الصلاحيات الكافية للوصول إلى تفاصيل وتهيئة الوكلاء الماليين.</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return <div className="text-center py-20 font-bold" dir="rtl">عذراً، لم يتم العثور على بيانات هذا الوكيل.</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-6 max-w-7xl mx-auto text-right" dir="rtl">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                <Button 
                    variant="ghost" 
                    onClick={() => router.push("/dashboard/agents")}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-white flex items-center gap-1 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                    <ArrowRight size={14} /> العودة لقائمة الشركاء
                </Button>

                <AgentDepositDialog
                    isOpen={isDepositOpen}
                    setIsOpen={setIsDepositOpen}
                    depositAmount={depositAmount}
                    setDepositAmount={setDepositAmount}
                    depositDescription={depositDescription}
                    setDepositDescription={setDepositDescription}
                    depositType={depositType}
                    setDepositType={setDepositType}
                    submittingDeposit={submittingDeposit}
                    onSubmit={handleDepositSubmit}
                />
            </div>

            {/* Profile Info and Debt Limits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
                {/* Agency Details info */}
                <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 h-fit">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex items-center justify-between py-4">
                        <CardTitle className="text-xs font-black flex items-center gap-2"><Info className="h-4.5 w-4.5 text-indigo-500" /> بيانات شريك السفر</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-black text-slate-800 dark:text-white">{agent.companyName}</h3>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">المسؤول الأول: {agent.ownerName}</span>
                        </div>
                        <div className="space-y-3 text-xs font-bold text-slate-650 dark:text-slate-300">
                            <div className="flex items-center gap-2"><Phone size={14} className="text-slate-450 dark:text-slate-400" /> <span>الهاتف:</span> <span className="font-sans mr-auto" dir="ltr">{agent.phone}</span></div>
                            {agent.whatsappNumber && <div className="flex items-center gap-2"><Phone size={14} className="text-emerald-500" /> <span>واتساب:</span> <span className="font-sans mr-auto" dir="ltr">{agent.whatsappNumber}</span></div>}
                            <div className="flex items-center gap-2"><Mail size={14} className="text-slate-450 dark:text-slate-400" /> <span>البريد:</span> <span className="font-sans mr-auto" dir="ltr">{agent.email}</span></div>
                            {agent.licenseNumber && <div className="flex items-center gap-2"><FileText size={14} className="text-slate-450 dark:text-slate-400" /> <span>الترخيص:</span> <span className="mr-auto">{agent.licenseNumber}</span></div>}
                            {agent.city && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-450 dark:text-slate-400" /> <span>المدينة:</span> <span className="mr-auto">{agent.city}</span></div>}
                            <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-450 dark:text-slate-400" /> <span>التسجيل:</span> <span className="font-sans mr-auto">{new Date(agent.createdAt).toLocaleDateString("ar-YE")}</span></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary and Debt Control */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                            <CardContent className="p-5 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 block">رصيد المحفظة الحالي</span>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white font-sans">{Number(agent.walletBalance).toLocaleString("ar-YE")} <span className="text-xs text-slate-400 font-bold">ريال</span></h3>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-450 px-2 py-0.5 rounded-md">متاح للشراء</span>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                            <CardContent className="p-5 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 block">إجمالي عمليات الشحن</span>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white font-sans">{Number(agent.totalDeposited).toLocaleString("ar-YE")} <span className="text-xs text-slate-400 font-bold">ريال</span></h3>
                                <span className="text-[10px] font-bold text-slate-400">إيداع نقدي وافتتاحي</span>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                            <CardContent className="p-5 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 block">إجمالي المستهلك لشراء اختبارات</span>
                                <h3 className="text-xl font-black text-rose-600 font-sans">{Number(agent.totalSpent).toLocaleString("ar-YE")} <span className="text-xs text-rose-400 font-bold">ريال</span></h3>
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-450 px-2 py-0.5 rounded-md">مبيعات الجلسات</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Debt Configuration Card */}
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <CardTitle className="text-xs font-black flex items-center gap-2"><Wallet className="h-4.5 w-4.5 text-amber-500" /> إعدادات الشراء بالدين (الذمم المدينة)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5 text-right">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">تفعيل الشراء بالدين (Allow Debt)</p>
                                    <p className="text-[10px] text-slate-400 font-bold">السماح للوكيل بالاستمرار في إصدار الاختبارات وتجاوز الرصيد بالماينس.</p>
                                </div>
                                <Switch checked={allowDebt} onCheckedChange={setAllowDebt} />
                            </div>

                            {allowDebt && (
                                <div className="space-y-1.5 max-w-sm">
                                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-300">الحد الأقصى للمديونية (ريال يمني)</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            value={debtLimit} 
                                            onChange={e => setDebtLimit(e.target.value)} 
                                            className="h-10 rounded-xl text-xs font-bold font-sans bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold">تحديد حد للدين يمنع الوكيل من إرسال أي اختبارات بعد بلوغه.</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Button 
                                    onClick={handleSaveDebtConfig} 
                                    disabled={savingDebtConfig}
                                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none"
                                >
                                    {savingDebtConfig ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} /> حفظ إعدادات الدين</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Premium UI Tabs */}
            <Tabs defaultValue="clients" className="w-full">
                <TabsList className="flex w-full md:w-fit bg-slate-100/80 dark:bg-slate-800 p-1 rounded-2xl mb-8 gap-1" dir="rtl">
                    <TabsTrigger value="clients" className="rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer">
                        عملاء الوكيل ({clients.length})
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer">
                        طلبات الاختبارات ({orders.length})
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer">
                        حركات المحفظة ({transactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer">
                        ⚙️ تسعير الوكيل
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer">
                        فريق العمل والوصول ({agentUsers.length})
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Clients */}
                <TabsContent value="clients" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-300">
                    <AgentClientsTab clients={clients} />
                </TabsContent>

                {/* Tab: Orders */}
                <TabsContent value="orders" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-300">
                    <AgentOrdersTab orders={orders} />
                </TabsContent>

                {/* Tab: Wallet transactions */}
                <TabsContent value="wallet" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-300">
                    <AgentWalletTab transactions={transactions} />
                </TabsContent>

                {/* Tab: Pricing */}
                <TabsContent value="pricing" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-300">
                    <AgentPricingTab
                        loadingPricing={loadingPricing}
                        pricingData={pricingData}
                        customSingleExamPrice={customSingleExamPrice}
                        setCustomSingleExamPrice={setCustomSingleExamPrice}
                        customPackages={customPackages}
                        setCustomPackages={setCustomPackages}
                        savingPricing={savingPricing}
                        onSavePricing={handleSavePricing}
                    />
                </TabsContent>

                {/* Tab: Agency Users (Team) */}
                <TabsContent value="users" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-300">
                    <AgentUsersTab
                        agentUsers={agentUsers}
                        onToggleUserActive={handleToggleUserActive}
                        onDeleteUser={handleDeleteUser}
                        onAddUserSubmit={handleAddUserSubmit}
                        onResetPasswordSubmit={handleResetPasswordSubmit}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
