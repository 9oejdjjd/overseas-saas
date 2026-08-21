"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Loader2, CheckCircle2, Building2, KeyRound, 
    AlertCircle, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ProfileTab } from "@/components/agent/settings/ProfileTab";
import { SecurityTab } from "@/components/agent/settings/SecurityTab";

export default function AgentSettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
    const [loading, setLoading] = useState(true);
    const [changingPassword, setChangingPassword] = useState(false);
    
    // Feedback alerts
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Agency Profile fields
    const [companyName, setCompanyName] = useState("");
    const [companyNameEn, setCompanyNameEn] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [createdAt, setCreatedAt] = useState("");

    // Contact & Location fields
    const [phone, setPhone] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");

    // Security & Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    useEffect(() => {
        if (!session) return;
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/agent/profile");
                if (!res.ok) throw new Error();
                const json = await res.json();
                const d = json.data;
                
                setCompanyName(d.companyName || "");
                setCompanyNameEn(d.companyNameEn || "");
                setOwnerName(d.ownerName || "");
                setStatus(d.status || "ACTIVE");
                setCreatedAt(d.createdAt || "");

                setPhone(d.phone || "");
                setWhatsappNumber(d.whatsappNumber || "");
                setEmail(d.email || "");
                setAddress(d.address || "");
                setCity(d.city || "");
            } catch (err: any) {
                setErrorMessage("فشل تحميل بيانات الملف الشخصي");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [session]);

    const showNotification = (msg: string, isError = false) => {
        if (isError) {
            setErrorMessage(msg);
            setSuccessMessage("");
        } else {
            setSuccessMessage(msg);
            setErrorMessage("");
        }
        setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 4000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { 
            showNotification("كلمتا المرور الجديدتان غير متطابقتين", true);
            return; 
        }
        if (newPassword.length < 6) { 
            showNotification("كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل", true);
            return; 
        }
        try {
            setChangingPassword(true);
            const res = await fetch("/api/agent/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "فشل تغيير كلمة المرور");
            
            showNotification("تم تغيير كلمة المرور بنجاح");
            setCurrentPassword(""); 
            setNewPassword(""); 
            setConfirmPassword("");
        } catch (err: any) { 
            showNotification(err.message || "فشل تغيير كلمة المرور", true);
        } finally { 
            setChangingPassword(false); 
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#074388]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
            {/* Top Profile Summary Banner (Accreditation pricing block removed completely) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm text-right">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#074388] to-[#042852] text-white flex items-center justify-center text-xl font-black shadow-md shadow-[#074388]/20 font-sans">
                            {companyName ? companyName.charAt(0) : "و"}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-800 dark:text-white">{companyName || "وكالة معتمدة"}</h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40">
                                    <ShieldCheck size={11} /> معتمد ونشط
                                </span>
                            </div>
                            <p className="text-xs text-slate-550 font-semibold">المسؤول: {ownerName || "مالك الحساب"}</p>
                            {createdAt && (
                                <p className="text-[10px] text-slate-400 font-sans">تاريخ الانضمام: {new Date(createdAt).toLocaleDateString("ar-YE")}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Messages */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in text-right">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in text-right">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <button
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                        activeTab === "profile"
                            ? "bg-white dark:bg-slate-700 text-[#074388] dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                >
                    <Building2 size={14} /> بيانات الوكالة
                </button>
                <button
                    onClick={() => setActiveTab("security")}
                    className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                        activeTab === "security"
                            ? "bg-white dark:bg-slate-700 text-[#074388] dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                >
                    <KeyRound size={14} /> الأمان وكلمة المرور
                </button>
            </div>

            {/* Tab Contents */}
            <div>
                {activeTab === "profile" && (
                    <ProfileTab
                        companyName={companyName}
                        companyNameEn={companyNameEn}
                        ownerName={ownerName}
                        phone={phone}
                        whatsappNumber={whatsappNumber}
                        email={email}
                        city={city}
                        address={address}
                    />
                )}

                {activeTab === "security" && (
                    <SecurityTab
                        currentPassword={currentPassword}
                        setCurrentPassword={setCurrentPassword}
                        newPassword={newPassword}
                        setNewPassword={setNewPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        showCurrentPw={showCurrentPw}
                        setShowCurrentPw={setShowCurrentPw}
                        showNewPw={showNewPw}
                        setShowNewPw={setShowNewPw}
                        changingPassword={changingPassword}
                        onSubmit={handleChangePassword}
                    />
                )}
            </div>
        </div>
    );
}
