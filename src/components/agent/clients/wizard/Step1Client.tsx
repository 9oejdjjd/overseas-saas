import React, { useState, useEffect } from "react";
import { Search, Loader2, User, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step1ClientProps {
    selectedClient: any;
    setSelectedClient: (client: any) => void;
    onSelectClient: (client: any) => void;
}

function validatePhoneNumber(code: string, phone: string): string | null {
    const cleaned = phone.replace(/\D/g, "");
    if (code === "+967") {
        if (cleaned.length !== 9) {
            return "رقم الهاتف اليمني يجب أن يتكون من 9 أرقام (مثال: 777123456)";
        }
        if (!cleaned.startsWith("7")) {
            return "رقم الهاتف اليمني يجب أن يبدأ بالرقم 7 (مثال: 7xxxxxxxx)";
        }
    } else if (code === "+966") {
        if (cleaned.length !== 9) {
            return "رقم الهاتف السعودي يجب أن يتكون من 9 أرقام (مثال: 555123456)";
        }
        if (!cleaned.startsWith("5")) {
            return "رقم الهاتف السعودي يجب أن يبدأ بالرقم 5 (مثال: 5xxxxxxxx)";
        }
    } else {
        if (cleaned.length < 7 || cleaned.length > 15) {
            return "رقم الهاتف المدخل غير صالح";
        }
    }
    return null;
}

export function Step1Client({
    selectedClient,
    setSelectedClient,
    onSelectClient
}: Step1ClientProps) {
    const [mode, setMode] = useState<"existing" | "new">("existing");

    // Existing Client State
    const [searchQuery, setSearchQuery] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // New Client State
    const [newClient, setNewClient] = useState({ fullName: "", whatsappNumber: "", email: "" });
    const [countryCode, setCountryCode] = useState("+967"); // Defaulted to Yemen (+967)
    const [error, setError] = useState("");

    useEffect(() => {
        fetchClients("");
    }, []);

    const fetchClients = async (query: string) => {
        setLoadingClients(true);
        try {
            const res = await fetch(`/api/agent/clients?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            const clientList = data.data || data.clients || (Array.isArray(data) ? data : []);
            setClients(clientList);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingClients(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (mode === "existing") fetchClients(searchQuery);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, mode]);

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!newClient.fullName || !newClient.whatsappNumber || !newClient.email) {
            setError("يرجى تعبئة الحقول الإلزامية");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newClient.email.trim())) {
            setError("البريد الإلكتروني المدخل غير صالح (مثال: client@domain.com)");
            return;
        }

        // Phone validation
        const phoneError = validatePhoneNumber(countryCode, newClient.whatsappNumber);
        if (phoneError) {
            setError(phoneError);
            return;
        }

        const fullWhatsAppNumber = countryCode + newClient.whatsappNumber.replace(/\D/g, "");

        // Set temporary local client object with isNew: true
        const tempClient = {
            isNew: true,
            fullName: newClient.fullName.trim(),
            phone: fullWhatsAppNumber,
            whatsappNumber: fullWhatsAppNumber,
            email: newClient.email.trim()
        };

        // Trigger selection and transition to Step 2 without saving to DB yet
        onSelectClient(tempClient);
    };

    // Dynamically set placeholder based on selected country code
    const getPhonePlaceholder = () => {
        if (countryCode === "+967") return "7xxxxxxxx";
        if (countryCode === "+966") return "5xxxxxxxx";
        return "رقم الهاتف";
    };

    return (
        <div className="space-y-6 text-right">
            <div className="flex flex-col text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">معلومات العميل</h2>
                <p className="text-gray-500 dark:text-slate-400">اختر عميلاً حالياً أو قم بإضافة عميل جديد</p>
            </div>

            <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg max-w-md mx-auto">
                <button
                    type="button"
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer",
                        mode === "existing" ? "bg-white dark:bg-slate-800 text-[#074388] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setMode("existing")}
                >
                    اختيار عميل حالي
                </button>
                <button
                    type="button"
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer",
                        mode === "new" ? "bg-white dark:bg-slate-800 text-[#074388] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setMode("new")}
                >
                    إضافة عميل جديد
                </button>
            </div>

            {mode === "existing" ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            className="pr-10 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="border border-slate-150 rounded-lg max-h-[250px] overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
                        {loadingClients ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                جاري البحث...
                            </div>
                        ) : clients.length > 0 ? (
                            <div className="divide-y dark:divide-slate-700">
                                {clients.map((client) => (
                                    <div
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className={cn(
                                            "p-4 cursor-pointer transition-colors flex justify-between items-center",
                                            selectedClient?.id === client.id ? "bg-[#074388]/10 border-r-4 border-[#074388]" : "hover:bg-gray-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#074388]/10 flex items-center justify-center text-[#074388]">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{client.fullName}</div>
                                                <div className="text-sm text-gray-500 dir-ltr text-right">{client.whatsappNumber || client.phone}</div>
                                            </div>
                                        </div>
                                        {selectedClient?.id === client.id && <CheckCircle2 className="w-5 h-5 text-[#074388]" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">لا يوجد عملاء مطابقين للبحث</div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={() => onSelectClient(selectedClient)}
                            disabled={!selectedClient}
                            className="bg-[#074388] hover:bg-[#074388]/90 text-white font-bold"
                        >
                            متابعة <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleAddClient} className="space-y-4 max-w-xl mx-auto text-right">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-650 rounded-md flex items-center gap-2 text-sm border border-red-100">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-slate-300">الاسم الكامل *</label>
                        <Input
                            required
                            value={newClient.fullName}
                            onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                            placeholder="الاسم الكامل للعميل"
                            className="bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-slate-300">رقم الواتساب *</label>
                        <div dir="ltr" className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="h-10 px-3 rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm font-semibold text-gray-800"
                            >
                                <option value="+967">🇾🇪 +967</option>
                                <option value="+966">🇸🇦 +966</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+965">🇰🇼 +965</option>
                                <option value="+968">🇴🇲 +968</option>
                                <option value="+973">🇧🇭 +973</option>
                                <option value="+974">🇶🇦 +974</option>
                                <option value="+20">🇪🇬 +20</option>
                            </select>
                            <Input
                                required
                                value={newClient.whatsappNumber}
                                onChange={(e) => setNewClient({ ...newClient, whatsappNumber: e.target.value })}
                                placeholder={getPhonePlaceholder()}
                                className="flex-1 text-left bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-slate-300">البريد الإلكتروني *</label>
                        <Input
                            required
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            placeholder="البريد الإلكتروني للعميل لتلقي النتائج (مثال: client@domain.com)"
                            className="dir-ltr text-right bg-white"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            className="bg-[#074388] hover:bg-[#074388]/90 text-white font-bold gap-2"
                        >
                            حفظ ومتابعة <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
