"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
    Briefcase, Users, DollarSign, FileText, Plus, Search, 
    Filter, Eye, Wallet, Ban, 
    CheckCircle, Clock, ShieldAlert, Loader2, RefreshCw, Copy, Check, X, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { hasAccess } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Interfaces
interface Agent {
    id: string;
    companyName: string;
    ownerName: string;
    phone: string;
    email: string;
    status: "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
    walletBalance: number | string;
    allowDebt: boolean;
    debtLimit: number | string;
    _count?: {
        clients: number;
        examOrders: number;
    };
}

interface AgentsStats {
    totalAgents: number;
    activeAgents: number;
    totalBalance: number;
    sentExams: number;
}

// AccessDenied Component
function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-gray-100 rounded-2xl shadow-sm w-full animate-in fade-in duration-300" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-red-650" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-gray-500 text-xs max-w-md">
                ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو هذا القسم. يرجى مراجعة مدير النظام للحصول على الصلاحيات اللازمة.
            </p>
        </div>
    );
}

export default function AgentsPage() {
    const { data: session, status } = useSession();
    
    const [agents, setAgents] = useState<Agent[]>([]);
    const [stats, setStats] = useState<AgentsStats>({ totalAgents: 0, activeAgents: 0, totalBalance: 0, sentExams: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        companyName: "",
        ownerName: "",
        phone: "",
        email: "",
        whatsappNumber: "",
        address: "",
        city: "",
        licenseNumber: "",
        password: ""
    });
    const [initialBalance, setInitialBalance] = useState("0");

    // Success registration details
    const [createdAgentInfo, setCreatedAgentInfo] = useState<{
        companyName: string;
        ownerName: string;
        email: string;
        password?: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === "authenticated" && session?.user && hasAccess(session.user, "agents.access")) {
            fetchAgents();
        }
    }, [status, session]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/agents");
            if (res.ok) {
                const json = await res.json();
                setAgents(json.data || []);

                // Fetch statistics
                const statsRes = await fetch("/api/agents/stats");
                if (statsRes.ok) {
                    const statsJson = await statsRes.json();
                    const s = statsJson.data;
                    setStats({
                        totalAgents: s.totalAgents || 0,
                        activeAgents: s.activeAgents || 0,
                        totalBalance: Number(s.totalWalletBalance || 0),
                        sentExams: s.totalExamsSent || 0
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch agents", error);
        } finally {
            setLoading(false);
        }
    };

    const generateRandomPass = () => {
        const pass = Math.random().toString(36).slice(-8) + "A1!";
        setFormData(prev => ({ ...prev, password: pass }));
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    initialBalance: Number(initialBalance)
                })
            });
            if (res.ok) {
                const json = await res.json();
                setCreatedAgentInfo({
                    companyName: formData.companyName,
                    ownerName: formData.ownerName,
                    email: formData.email,
                    password: json.data.password || formData.password
                });
                fetchAgents();
                // Reset form fields
                setFormData({
                    companyName: "", ownerName: "", phone: "", email: "", whatsappNumber: "", 
                    address: "", city: "", licenseNumber: "", password: ""
                });
                setInitialBalance("0");
            } else {
                const errJson = await res.json();
                alert(errJson.error || "حدث خطأ أثناء إضافة الوكيل");
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء الاتصال بالخادم");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
        const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        if (!confirm(`هل أنت متأكد من تغيير حالة الوكيل إلى ${nextStatus === "ACTIVE" ? "نشط" : "معلق"}؟`)) return;

        try {
            const res = await fetch(`/api/agents/${agentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
                fetchAgents();
            } else {
                alert("فشل تغيير حالة الوكيل");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCopy = () => {
        if (!createdAgentInfo) return;
        const baseUrl = window.location.origin;
        const message = `مرحباً ${createdAgentInfo.ownerName}،

تم إنشاء وتفعيل حساب الوكيل الخاص بكم بنجاح على منصة بوابة الاعتماد المهني.

بيانات تسجيل الدخول الخاصة بكم:
- اسم الوكالة: ${createdAgentInfo.companyName}
- رابط البوابة: ${baseUrl}/login
- البريد الإلكتروني: ${createdAgentInfo.email}
- كلمة المرور الافتراضية: ${createdAgentInfo.password}

يرجى تسجيل الدخول وتغيير كلمة المرور الافتراضية من الإعدادات لضمان أمان حسابكم.
تحياتنا لكم.`;

        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
            </div>
        );
    }

    if (!session || !hasAccess(session.user, "agents.access")) {
        return <AccessDenied />;
    }

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = 
            agent.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            agent.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.phone.includes(searchTerm);
        
        const matchesStatus = statusFilter === "ALL" || agent.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "ACTIVE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> نشط</span>;
            case "PENDING_APPROVAL":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100"><Clock className="w-3.5 h-3.5" /> بانتظار الموافقة</span>;
            case "SUSPENDED":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-100"><Ban className="w-3.5 h-3.5" /> معلق</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-55 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-6 max-w-7xl mx-auto text-right" dir="rtl">
            
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="text-right space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Briefcase className="h-7 w-7 text-indigo-600" />
                        إدارة وكلاء السفر والشركاء
                    </h1>
                    <p className="text-xs text-slate-500 font-bold mt-1">تفعيل وإدارة مكاتب السفريات، شحن المحافظ المالية، تتبع عمليات الشراء والتحقق من حسابات الموظفين.</p>
                </div>
                
                <Button 
                    onClick={() => {
                        setCreatedAgentInfo(null);
                        setIsAddModalOpen(true);
                        // Trigger auto-pass generation on open
                        const pass = Math.random().toString(36).slice(-8) + "A1!";
                        setFormData(prev => ({ ...prev, password: pass }));
                    }}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md rounded-xl h-11 px-6 text-xs transition-all hover:scale-[1.01]"
                >
                    <Plus className="h-4 w-4" />
                    إضافة وكيل سفر جديد
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "إجمالي الوكلاء الشركاء", value: stats.totalAgents, icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100/50" },
                    { title: "الوكالات النشطة حالياً", value: stats.activeAgents, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-100/50" },
                    { title: "إجمالي أرصدة المحافظ", value: stats.totalBalance.toLocaleString("ar-YE") + " ريال", icon: DollarSign, color: "text-purple-600 bg-purple-50 border-purple-100/50" },
                    { title: "إجمالي الاختبارات المصدرة", value: stats.sentExams, icon: FileText, color: "text-orange-600 bg-orange-50 border-orange-100/50" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                    >
                        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl shrink-0 border", stat.color)}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="truncate text-right">
                                    <p className="text-[10px] text-slate-400 font-black truncate">{stat.title}</p>
                                    <h3 className="text-lg md:text-xl font-black text-slate-800 truncate font-sans mt-0.5">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Search and Filters */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="بحث برقم الهاتف، الايميل أو اسم الوكالة..."
                            className="w-full pl-4 pr-10 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-slate-50 focus:bg-white border-slate-200 transition-all h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            className="w-full md:w-48 py-2 px-3 border rounded-xl text-xs font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white h-10 border-slate-200"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">الكل (حالة الوكيل)</option>
                            <option value="ACTIVE">نشط</option>
                            <option value="PENDING_APPROVAL">بانتظار الموافقة</option>
                            <option value="SUSPENDED">معلق</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Agents Table List */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden rounded-2xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50/80 text-slate-450 font-black border-b border-slate-100 text-[10px]">
                            <tr>
                                <th className="px-5 py-3.5">اسم الوكالة / المكتب</th>
                                <th className="px-5 py-3.5">المسؤول الرئيسي</th>
                                <th className="px-5 py-3.5">رقم الهاتف</th>
                                <th className="px-5 py-3.5 text-center">الرصيد المالي</th>
                                <th className="px-5 py-3.5 text-center">الدين المسموح</th>
                                <th className="px-5 py-3.5 text-center">الحالة</th>
                                <th className="px-5 py-3.5 text-center">العملاء</th>
                                <th className="px-5 py-3.5 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                            <span className="text-[10px] text-slate-400 font-bold">جاري تحميل البيانات...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-black">
                                        لا يوجد وكلاء مطابقين لخيارات البحث المحددة.
                                    </td>
                                </tr>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-900">{agent.companyName}</td>
                                        <td className="px-5 py-4 text-slate-650">{agent.ownerName}</td>
                                        <td className="px-5 py-4 text-slate-650 font-sans font-bold" dir="ltr">{agent.phone}</td>
                                        <td className="px-5 py-4 text-center font-black text-slate-800 font-sans">{Number(agent.walletBalance || 0).toLocaleString("ar-YE")} ريال</td>
                                        <td className="px-5 py-4 text-center font-bold text-slate-800 font-sans">
                                            {agent.allowDebt ? (
                                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50 text-[10px]">
                                                    مفتوح ({Number(agent.debtLimit || 0).toLocaleString("ar-YE")} ريال)
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-150 text-[10px]">مغلق</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={agent.status} />
                                        </td>
                                        <td className="px-5 py-4 text-center text-slate-600 font-sans font-bold">{agent._count?.clients || 0}</td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link href={`/dashboard/agents/${agent.id}`}>
                                                    <Button size="sm" className="h-8 px-3 border-slate-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border bg-white rounded-lg text-[10px] font-black shadow-sm">
                                                        <Eye className="w-3.5 h-3.5 ml-1" /> ملف وتفاصيل
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    onClick={() => toggleAgentStatus(agent.id, agent.status)} 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className={cn(
                                                        "h-8 px-2 rounded-lg text-[10px] font-black",
                                                        agent.status === "ACTIVE" 
                                                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                                                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    )}
                                                >
                                                    {agent.status === "ACTIVE" ? <><Ban className="w-3.5 h-3.5 ml-1" /> تعليق</> : <><CheckCircle className="w-3.5 h-3.5 ml-1" /> تفعيل</>}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Slider Drawer (Sheet) for Add Agent */}
            <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-50 p-0 text-right font-sans animate-in slide-in-from-left duration-300" dir="rtl">
                    
                    {/* Drawer Header with beautiful Dark Gradient */}
                    <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-800 text-white p-6 border-b border-slate-700">
                        <SheetHeader className="space-y-1">
                            <SheetTitle className="text-lg font-black text-white flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-300" />
                                إضافة شريك وكيل سفر جديد
                            </SheetTitle>
                            <SheetDescription className="text-slate-300 text-xs">
                                تهيئة إعدادات حساب الوكالة الجديد، شحن الرصيد المالي المبدئي وتوليد مفاتيح الوصول الخاصة بالبوابة.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {!createdAgentInfo ? (
                        /* Registration Form */
                        <form onSubmit={handleCreateAgent} className="space-y-6 p-6">
                            
                            {/* Card: Agency Info */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2 pb-0.5">معلومات الوكالة والمالك</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 text-right">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">اسم الوكالة / المكتب الرسمي *</label>
                                        <Input 
                                            required 
                                            type="text" 
                                            className="h-10 rounded-xl text-xs font-semibold border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            value={formData.companyName} 
                                            onChange={e => setFormData({...formData, companyName: e.target.value})} 
                                            placeholder="مثال: وكالة البراق للسفريات" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">اسم المالك / المسؤول المباشر *</label>
                                        <Input 
                                            required 
                                            type="text" 
                                            className="h-10 rounded-xl text-xs font-semibold border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            value={formData.ownerName} 
                                            onChange={e => setFormData({...formData, ownerName: e.target.value})} 
                                            placeholder="مثال: صالح محمد اليافعي" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">البريد الإلكتروني المهني (لتسجيل الدخول) *</label>
                                        <Input 
                                            required 
                                            type="email" 
                                            className="h-10 rounded-xl text-xs font-semibold font-sans text-left border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            dir="ltr" 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})} 
                                            placeholder="agent@agency.com" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">رقم الهاتف الجوال *</label>
                                        <Input 
                                            required 
                                            type="tel" 
                                            className="h-10 rounded-xl text-xs font-semibold font-sans text-left border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            dir="ltr" 
                                            value={formData.phone} 
                                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                                            placeholder="777123456" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">رقم الواتساب للتواصل والخدمات</label>
                                        <Input 
                                            type="tel" 
                                            className="h-10 rounded-xl text-xs font-semibold font-sans text-left border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            dir="ltr" 
                                            value={formData.whatsappNumber} 
                                            onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} 
                                            placeholder="967777123456" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">المدينة</label>
                                        <Input 
                                            type="text" 
                                            className="h-10 rounded-xl text-xs font-semibold border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            value={formData.city} 
                                            onChange={e => setFormData({...formData, city: e.target.value})} 
                                            placeholder="مثال: عدن" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs font-semibold text-slate-700 text-right">
                                    <label className="font-bold text-slate-800">العنوان الجغرافي الكامل</label>
                                    <Input 
                                        type="text" 
                                        className="h-10 rounded-xl text-xs font-semibold border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                        value={formData.address} 
                                        onChange={e => setFormData({...formData, address: e.target.value})} 
                                        placeholder="شارع...، بجوار..." 
                                    />
                                </div>
                            </div>

                            {/* Card: Financial Config & Password */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2 pb-0.5">الإعدادات المالية وبوابات الحماية</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 text-right">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-800">شحن الرصيد الابتدائي (بالريال اليمني)</label>
                                        <Input 
                                            type="number" 
                                            min="0"
                                            className="h-10 rounded-xl text-xs font-semibold font-sans border-slate-250 focus-visible:ring-indigo-500 bg-white" 
                                            value={initialBalance} 
                                            onChange={e => setInitialBalance(e.target.value)} 
                                            placeholder="مثال: 50000" 
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold block mt-1">سيتم رصده كإيداع أولي في المحفظة المالية للوكيل مباشرة.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <button 
                                                type="button" 
                                                onClick={generateRandomPass}
                                                className="text-[10px] font-black text-indigo-650 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                توليد كلمة مرور عشوائية
                                            </button>
                                            <label className="font-bold text-slate-800">كلمة المرور الافتراضية للوكيل *</label>
                                        </div>
                                        <Input 
                                            required
                                            type="text" 
                                            className="h-10 rounded-xl text-xs font-semibold font-sans text-left border-slate-250 focus-visible:ring-indigo-500 bg-slate-50" 
                                            dir="ltr" 
                                            value={formData.password} 
                                            onChange={e => setFormData({...formData, password: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-250 bg-white">
                                    إلغاء
                                </Button>
                                <Button type="submit" disabled={submitting} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/10">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء وتفعيل حساب الوكيل"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        /* Success Registration details view */
                        <div className="p-6 space-y-6 text-right">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center text-emerald-800 space-y-3">
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h3 className="text-base font-black">تم تفعيل حساب الوكيل بنجاح! 🎉</h3>
                                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
                                    تم تسجيل حساب الوكالة الجديد ورصد الرصيد الابتدائي بالمحفظة. يمكنك الآن نسخ بطاقة التفعيل وإرسالها للوكيل مباشرة.
                                </p>
                            </div>

                            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-500">بطاقة التفعيل وبيانات الدخول للوكيل</span>
                                    <Button 
                                        onClick={handleCopy} 
                                        className={cn(
                                            "h-8 text-[10px] font-black px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm",
                                            copied ? "bg-emerald-600 text-white" : "bg-indigo-650 hover:bg-indigo-700 text-white"
                                        )}
                                    >
                                        {copied ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ القالب</>}
                                    </Button>
                                </div>
                                <CardContent className="p-5">
                                    <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs text-right whitespace-pre-wrap leading-relaxed select-all" dir="rtl">
                                        {`مرحباً ${createdAgentInfo.ownerName}،

تم إنشاء وتفعيل حساب الوكيل الخاص بكم بنجاح على منصة الاعتماد المهني.

بيانات تسجيل الدخول الخاصة بكم:
- اسم الوكالة: ${createdAgentInfo.companyName}
- رابط البوابة: ${window.location.origin}/login
- البريد الإلكتروني: ${createdAgentInfo.email}
- كلمة المرور الافتراضية: ${createdAgentInfo.password}

يرجى تسجيل الدخول وتغيير كلمة المرور الافتراضية من الإعدادات لضمان أمان حسابكم.`}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                                <Button onClick={() => setIsAddModalOpen(false)} className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold">
                                    إغلاق
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
