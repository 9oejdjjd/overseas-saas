"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ClientsTable } from "@/components/agent/clients/ClientsTable";
import { ExamsHistoryTable } from "@/components/agent/clients/ExamsHistoryTable";
import { SendExamWizard } from "@/components/agent/clients/wizard/SendExamWizard";
import { AgentClient, AgentExamOrder } from "@/types/agent";

export default function UnifiedClientsAndExamsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // Tab State: read from query param '?tab=exams' or default to 'clients'
    const initialTab = searchParams?.get("tab") === "exams" ? "exams" : "clients";
    const [activeTab, setActiveTab] = useState<"clients" | "exams">(initialTab);

    // Clients Table States
    const [clients, setClients] = useState<AgentClient[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);

    // Exams Table States
    const [exams, setExams] = useState<AgentExamOrder[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [examSearch, setExamSearch] = useState("");
    const [examStatusFilter, setExamStatusFilter] = useState("ALL");

    // Wizard Toggle State
    const [showWizard, setShowWizard] = useState(false);
    const [wizardPreselectedClient, setWizardPreselectedClient] = useState<any>(null);

    // Clipboard copy feedback states
    const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
    const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

    const handleCopyActiveExamLink = (link: string, clientName: string, profession: string, clientId: string) => {
        if (!link) return;
        const message = `مرحبا ${clientName} 👋

حرصاً منا على جاهزيتك التامة لاختبار الاعتماد المهني لمهنة ${profession}، قمنا بتجهيز اختبار تجريبي مخصص لك.

🔗 للدخول إلى الاختبار التجريبي والبدء بتدريبك، تفضل بالضغط على الرابط التالي:
${link}

كل التوفيق لك، ونحن دائماً هنا لدعمك ومساندتك!
#بوابة_الاعتماد_المهني
معك خطوة بخطوة نحو اعتمادك المهني  .`;

        navigator.clipboard.writeText(message);
        setCopiedClientId(clientId);
        setTimeout(() => setCopiedClientId(null), 2000);
    };

    const handleCopyExamOrResultLink = (link: string, examId: string) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopiedExamId(examId);
        setTimeout(() => setCopiedExamId(null), 2000);
    };

    // Sync tab with search parameters if changed
    useEffect(() => {
        const tabParam = searchParams?.get("tab");
        if (tabParam === "exams") {
            setActiveTab("exams");
        } else {
            setActiveTab("clients");
        }
    }, [searchParams]);

    // Fetch Clients list
    const fetchClientsList = async () => {
        try {
            setLoadingClients(true);
            const res = await fetch("/api/agent/clients");
            if (res.ok) {
                const data = await res.json();
                setClients(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching clients:", err);
        } finally {
            setLoadingClients(false);
        }
    };

    // Fetch Exams list
    const fetchExamsList = async () => {
        try {
            setLoadingExams(true);
            const params = new URLSearchParams();
            if (examStatusFilter !== "ALL") params.set("status", examStatusFilter);
            if (examSearch) params.set("search", examSearch);
            const res = await fetch(`/api/agent/exams?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setExams(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching exams:", err);
        } finally {
            setLoadingExams(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (status === "authenticated") {
            fetchClientsList();
            fetchExamsList();
        }
    }, [status, examStatusFilter, examSearch]);

    // Open Wizard from scratch
    const handleOpenNewWizard = () => {
        setWizardPreselectedClient(null);
        setShowWizard(true);
    };

    // Open Wizard with preselected client
    const handleSendExamForClient = (client: AgentClient) => {
        setWizardPreselectedClient(client);
        setShowWizard(true);
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#074388]/10 text-[#074388] rounded-2xl">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#074388] dark:text-white">العملاء والاختبارات</h2>
                        <p className="text-xs text-slate-400 font-bold">تسجيل عملاء جدد، تجديد الاشتراكات، وإرسال ومتابعة الاختبارات المهنية.</p>
                    </div>
                </div>

                {!showWizard && (
                    <Button
                        onClick={handleOpenNewWizard}
                        className="h-11 px-6 bg-[#55943b] hover:bg-[#4a8333] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#55943b]/20 transition-all text-xs"
                    >
                        <Plus size={16} /> إضافة عميل - طلب اختبارات
                    </Button>
                )}
            </div>

            {/* Inline Wizard Container */}
            <AnimatePresence>
                {showWizard && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-2 border-[#074388]/20 rounded-2xl relative shadow-md">
                            <button
                                onClick={() => {
                                    setShowWizard(false);
                                    fetchClientsList();
                                    fetchExamsList();
                                }}
                                className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors z-30"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <CardContent className="p-6 bg-white dark:bg-slate-800 rounded-2xl">
                                <SendExamWizard
                                    preselectedClient={wizardPreselectedClient}
                                    onClose={() => {
                                        setShowWizard(false);
                                        fetchClientsList();
                                        fetchExamsList();
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Selector & Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-px">
                <button
                    onClick={() => {
                        setActiveTab("clients");
                        router.push("/agent/clients?tab=clients");
                    }}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm border-b-2 transition-all",
                        activeTab === "clients"
                            ? "border-[#074388] text-[#074388]"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    قائمة العملاء
                </button>
                <button
                    onClick={() => {
                        setActiveTab("exams");
                        router.push("/agent/clients?tab=exams");
                    }}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm border-b-2 transition-all",
                        activeTab === "exams"
                            ? "border-[#074388] text-[#074388]"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    سجل الاختبارات المرسلة
                </button>
            </div>

            {/* Tab Contents */}
            <div>
                {activeTab === "clients" ? (
                    <ClientsTable
                        clients={clients}
                        loadingClients={loadingClients}
                        copiedClientId={copiedClientId}
                        onCopyActiveExamLink={handleCopyActiveExamLink}
                        onSendExamForClient={handleSendExamForClient}
                    />
                ) : (
                    <ExamsHistoryTable
                        exams={exams}
                        loadingExams={loadingExams}
                        copiedExamId={copiedExamId}
                        onCopyExamOrResultLink={handleCopyExamOrResultLink}
                        examStatusFilter={examStatusFilter}
                        setExamStatusFilter={setExamStatusFilter}
                        examSearch={examSearch}
                        setExamSearch={setExamSearch}
                    />
                )}
            </div>
        </div>
    );
}
