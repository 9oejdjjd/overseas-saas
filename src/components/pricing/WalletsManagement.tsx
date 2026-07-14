"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit3, Settings2, Wallet, ToggleLeft, ToggleRight, X, Loader2, Sparkles, Upload, Check } from "lucide-react";

interface WalletAccount {
    id: string;
    name: string;
    nameEn: string | null;
    accountNumber: string | null;
    accountName: string | null;
    isActive: boolean;
    icon: string | null;
    instructions: string | null;
    accounts: any;
    createdAt: string;
}

export function WalletsManagement() {
    const [wallets, setWallets] = useState<WalletAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<WalletAccount | null>(null);
    
    // Form fields
    const [name, setName] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [icon, setIcon] = useState("generic");
    const [instructions, setInstructions] = useState("");

    // Multiple accounts list state
    const [accountsList, setAccountsList] = useState<any[]>([]);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [accountType, setAccountType] = useState<"unified" | "multi">("unified");

    // Temp currency account inputs
    const [tempCurrency, setTempCurrency] = useState("YER");
    const [tempAccountNumber, setTempAccountNumber] = useState("");
    const [tempAccountName, setTempAccountName] = useState("بوابة الاعتماد المهني");
    const [tempInstructions, setTempInstructions] = useState("");

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payments/wallets?all=true");
            if (res.ok) {
                const data = await res.json();
                setWallets(data);
            }
        } catch (error) {
            console.error("Error fetching wallets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleOpenAddModal = () => {
        setEditingWallet(null);
        setName("");
        setNameEn("");
        setAccountNumber("");
        setAccountName("بوابة الاعتماد المهني");
        setIsActive(true);
        setIcon("generic");
        setInstructions("");
        setAccountsList([]);
        setAccountType("unified");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (wallet: WalletAccount) => {
        setEditingWallet(wallet);
        setName(wallet.name);
        setNameEn(wallet.nameEn || "");
        setAccountNumber(wallet.accountNumber || "");
        setAccountName(wallet.accountName || "");
        setIsActive(wallet.isActive);
        setIcon(wallet.icon || "generic");
        setInstructions(wallet.instructions || "");
        
        let parsed: any[] = [];
        if (wallet.accounts) {
            try {
                parsed = typeof wallet.accounts === "string" ? JSON.parse(wallet.accounts) : wallet.accounts;
            } catch (e) {
                parsed = [];
            }
        }
        const parsedAccounts = Array.isArray(parsed) ? parsed : [];
        setAccountsList(parsedAccounts);
        setAccountType(parsedAccounts.length > 0 ? "multi" : "unified");
        setIsModalOpen(true);
    };

    const handleToggleActive = async (wallet: WalletAccount) => {
        try {
            const res = await fetch(`/api/payments/wallets/${wallet.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !wallet.isActive }),
            });
            if (res.ok) {
                fetchWallets();
            }
        } catch (error) {
            console.error("Error toggling active status:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من رغبتك في حذف هذه المحفظة نهائياً؟")) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/payments/wallets/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchWallets();
            }
        } catch (error) {
            console.error("Error deleting wallet:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/payments/wallets/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIcon(data.url);
            } else {
                alert(data.error || "فشل رفع شعار المحفظة");
            }
        } catch (error) {
            console.error("Logo upload error:", error);
            alert("حدث خطأ أثناء رفع الصورة");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleAddAccount = () => {
        if (!tempAccountNumber.trim() || !tempAccountName.trim()) {
            alert("يرجى ملء رقم الحساب واسم صاحب الحساب");
            return;
        }

        // Check if currency already exists in list
        if (accountsList.some(acc => acc.currency === tempCurrency)) {
            if (!confirm(`يوجد حساب بالفعل لعملة ${tempCurrency}، هل تريد إضافة حساب آخر لنفس العملة؟`)) {
                return;
            }
        }

        const newAcc = {
            id: Date.now().toString(),
            currency: tempCurrency,
            accountNumber: tempAccountNumber.trim(),
            accountName: tempAccountName.trim(),
            instructions: tempInstructions.trim()
        };

        setAccountsList([...accountsList, newAcc]);
        setTempAccountNumber("");
        setTempInstructions("");
    };

    const handleRemoveAccount = (id: string) => {
        setAccountsList(accountsList.filter(acc => acc.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("اسم المحفظة مطلوب");
            return;
        }

        setActionLoading(true);

        // Map first account to default schema fields for legacy support
        const defaultAcc = accountsList[0];
        const finalAccountNumber = accountType === "unified" ? accountNumber : (defaultAcc ? defaultAcc.accountNumber : "");
        const finalAccountName = accountType === "unified" ? accountName : (defaultAcc ? defaultAcc.accountName : "");

        const payload = {
            name,
            nameEn: nameEn || null,
            accountNumber: finalAccountNumber || null,
            accountName: finalAccountName || null,
            isActive,
            icon,
            instructions: instructions || null,
            accounts: accountType === "unified" ? [] : accountsList
        };

        try {
            let res;
            if (editingWallet) {
                res = await fetch(`/api/payments/wallets/${editingWallet.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/payments/wallets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                setIsModalOpen(false);
                fetchWallets();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "حدث خطأ أثناء حفظ البيانات");
            }
        } catch (error) {
            console.error("Error submitting wallet:", error);
            alert("فشل في الاتصال بالخادم");
        } finally {
            setActionLoading(false);
        }
    };

    const getIconBadgeColor = (iconName: string | null) => {
        switch (iconName) {
            case "kuraimi": return "bg-[#5c9e45]/10 border-[#5c9e45]/20 text-[#5c9e45]";
            case "onecash": return "bg-orange-50 border-orange-100 text-orange-600";
            case "jawwalpay": return "bg-blue-50 border-blue-100 text-blue-600";
            default: return "bg-slate-50 border-slate-100 text-slate-600";
        }
    };

    const getAccountsList = (wallet: WalletAccount) => {
        if (!wallet.accounts) return [];
        try {
            const parsed = typeof wallet.accounts === "string" ? JSON.parse(wallet.accounts) : wallet.accounts;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    return (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden text-right" dir="rtl">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-[#16539a] to-[#5c9e45] rounded-xl text-white shadow-lg shadow-blue-100/50">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">إدارة محافظ استقبال المدفوعات</CardTitle>
                        <CardDescription className="text-sm text-slate-500 mt-1">إضافة وإدارة محافظ وحسابات السداد المتعددة واستقبال تحويلات العملاء بعملات مختلفة</CardDescription>
                    </div>
                </div>
                
                <Button 
                    onClick={handleOpenAddModal} 
                    className="bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white rounded-xl px-5 h-11 text-xs font-bold hover:shadow-md hover:shadow-blue-500/10 active:scale-98 transition-all"
                >
                    <Plus className="h-4 w-4 ml-1.5" /> إضافة محفظة جديدة
                </Button>
            </CardHeader>
            <CardContent className="p-6">
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-[#16539a] mb-2" />
                        <span className="text-xs font-bold">جاري تحميل المحافظ...</span>
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                        <Wallet className="h-12 w-12 text-slate-350 mb-3" />
                        <h3 className="font-bold text-slate-700 text-sm mb-1">لا توجد محافظ مضافة حالياً</h3>
                        <p className="text-xs text-slate-400 max-w-sm mb-4">قم بإضافة محفظة الكريمي أو ون كاش أو بنك مسقط لإظهارها للمشتركين بصفحة السداد.</p>
                        <Button onClick={handleOpenAddModal} variant="outline" className="rounded-xl text-xs font-bold border-slate-200">
                            <Plus className="h-4 w-4 ml-1.5" /> إضافة أول محفظة
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wallets.map((wallet) => (
                            <Card 
                                key={wallet.id} 
                                className={`border rounded-[1.8rem] transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md flex flex-col ${
                                    wallet.isActive ? "border-slate-200/80 bg-white" : "border-slate-100 bg-slate-50/60 opacity-75"
                                }`}
                            >
                                <div className={`h-1.5 w-full ${
                                    wallet.isActive 
                                        ? (wallet.icon && wallet.icon.startsWith("http")) ? "bg-[#16539a]" : wallet.icon === 'kuraimi' ? 'bg-[#5c9e45]' : wallet.icon === 'onecash' ? 'bg-orange-500' : 'bg-[#16539a]'
                                        : 'bg-slate-300'
                                }`} />

                                <CardContent className="p-5 flex flex-col justify-between flex-1 min-h-[260px]">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                {wallet.icon && (wallet.icon.startsWith("http") || wallet.icon.startsWith("/")) ? (
                                                    <div className="w-7 h-7 rounded-lg border border-slate-150 overflow-hidden flex items-center justify-center bg-white">
                                                        <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className={`px-2 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 ${getIconBadgeColor(wallet.icon)}`}>
                                                        <Wallet size={11} />
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{wallet.name}</span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleToggleActive(wallet)}
                                                title={wallet.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                                                className="text-slate-400 hover:text-slate-655 transition-colors"
                                            >
                                                {wallet.isActive ? (
                                                    <ToggleRight className="h-7 w-7 text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft className="h-7 w-7 text-slate-300" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            {getAccountsList(wallet).length > 0 ? (
                                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                                                    {getAccountsList(wallet).map((acc: any, idx: number) => (
                                                        <div key={idx} className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 space-y-0.5">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[8px] font-black text-[#16539a] bg-blue-50/60 px-1.5 py-0.5 rounded">{acc.currency}</span>
                                                                <span className="text-xs font-mono font-bold text-slate-800">{acc.accountNumber}</span>
                                                            </div>
                                                            <div className="text-[9px] text-slate-450 truncate">الاسم: {acc.accountName}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    {wallet.accountNumber && (
                                                        <div className="flex justify-between items-baseline border-b border-slate-50 pb-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold">رقم الحساب:</span>
                                                            <span className="text-xs font-black text-slate-800 font-mono tracking-wide">{wallet.accountNumber}</span>
                                                        </div>
                                                    )}
                                                    {wallet.accountName && (
                                                        <div className="flex justify-between items-baseline border-b border-slate-50 pb-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold">الاسم:</span>
                                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{wallet.accountName}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {wallet.instructions && (
                                                <div className="mt-2">
                                                    <p className="text-[9px] text-slate-400 font-bold mb-0.5">التعليمات:</p>
                                                    <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">{wallet.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 mt-4">
                                        <Button 
                                            onClick={() => handleOpenEditModal(wallet)}
                                            variant="outline" 
                                            className="flex-1 h-9 rounded-xl text-[10px] font-bold border-slate-200 text-slate-655 hover:bg-slate-50"
                                        >
                                            <Edit3 className="h-3.5 w-3.5 ml-1" /> تعديل المحفظة
                                        </Button>
                                        <Button 
                                            onClick={() => handleDelete(wallet.id)}
                                            variant="ghost" 
                                            className="h-9 w-9 p-0 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Custom Modal for Add/Edit Wallet */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden text-right animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" dir="rtl">
                            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <Settings2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">{editingWallet ? "تعديل تفاصيل المحفظة" : "إضافة محفظة دفع جديدة"}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">تحديد خيارات استقبال المدفوعات والعملات المتعددة</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-right">

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-655">اسم المحفظة / البنك باللغة العربية *</label>
                                        <Input 
                                            value={name} 
                                            onChange={e => setName(e.target.value)} 
                                            placeholder="مثال: محفظة الكريمي" 
                                            className="rounded-xl border-slate-200 text-xs h-10"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-655">اسم المحفظة باللغة الإنجليزية</label>
                                        <Input 
                                            value={nameEn} 
                                            onChange={e => setNameEn(e.target.value)} 
                                            placeholder="Example: Kuraimi Wallet" 
                                            className="rounded-xl border-slate-200 text-xs h-10 text-left font-sans"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Custom Logo Upload */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-655">شعار المحفظة (اللوجو)</label>
                                    <div className="flex items-center gap-4 border border-slate-200 p-3.5 rounded-2xl bg-slate-50/50">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-150 flex items-center justify-center overflow-hidden shrink-0">
                                            {icon && (icon.startsWith("http") || icon.startsWith("/")) ? (
                                                <img src={icon} alt="شعار المحفظة" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="font-sans text-[10px] font-black text-slate-400">
                                                    شعار المحفظة
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1 flex-1">
                                            <div className="text-[10px] text-slate-500 font-semibold">يرجى رفع صورة شعار مخصص للمحفظة لاستقبال مدفوعاتك بشكل احترافي.</div>
                                            <div className="flex items-center gap-2">
                                                <label className="bg-[#16539a] hover:bg-blue-800 text-white text-[10px] font-bold py-2 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 active:scale-97 transition-all shrink-0">
                                                    {uploadingLogo ? (
                                                        <Loader2 size={12} className="animate-spin text-white" />
                                                    ) : (
                                                        <Upload size={12} />
                                                    )}
                                                    <span>رفع شعار مخصص</span>
                                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Number Type Toggle */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-655 block">نوع إعداد رقم الحساب</label>
                                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setAccountType("unified")}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                accountType === "unified"
                                                    ? "bg-white text-slate-800 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        >
                                            رقم حساب موحد لجميع العملات
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAccountType("multi")}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                accountType === "multi"
                                                    ? "bg-white text-slate-800 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            }`}
                                        >
                                            أرقام حسابات متعددة حسب العملة
                                        </button>
                                    </div>
                                </div>

                                {accountType === "unified" ? (
                                    /* Unified Account Section */
                                    <div className="border border-slate-250 rounded-2xl p-4 bg-slate-50/20 space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <span className="text-xs font-black text-slate-800">بيانات الحساب الموحد</span>
                                            <span className="text-[9px] text-slate-400 font-bold">يستخدم نفس رقم الحساب لجميع العملات</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-655">رقم الحساب / الهاتف الموحد *</label>
                                                <Input
                                                    value={accountNumber}
                                                    onChange={e => setAccountNumber(e.target.value)}
                                                    placeholder="مثال: 777XXXXXX أو رقم الحساب"
                                                    className="rounded-xl border-slate-200 text-xs h-10 font-mono font-bold"
                                                    required={accountType === "unified"}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-655">اسم صاحب الحساب الموحد *</label>
                                                <Input
                                                    value={accountName}
                                                    onChange={e => setAccountName(e.target.value)}
                                                    placeholder="الاسم المسجل للتحويل"
                                                    className="rounded-xl border-slate-200 text-xs h-10"
                                                    required={accountType === "unified"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Dynamic Currency Accounts Section */
                                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20 space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <span className="text-xs font-black text-slate-800">حسابات المحفظة حسب العملة المتاحة</span>
                                            <span className="text-[9px] text-slate-400 font-bold">يمكن إضافة حساب لكل عملة (مثل ريال يمني YER، ريال سعودي SAR)</span>
                                        </div>

                                        {/* Existing currency accounts list */}
                                        {accountsList.length > 0 ? (
                                            <div className="space-y-2">
                                                {accountsList.map((acc, idx) => (
                                                    <div key={acc.id || idx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-4">
                                                        <div className="space-y-0.5 text-right flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{acc.currency}</span>
                                                                <span className="text-xs font-mono font-bold text-slate-800">{acc.accountNumber}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">الاسم: {acc.accountName}</div>
                                                            {acc.instructions && <div className="text-[9px] text-slate-400 line-clamp-1">ملاحظات: {acc.instructions}</div>}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleRemoveAccount(acc.id || idx)}
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-[10px] text-slate-400 font-semibold bg-white border border-slate-100 border-dashed rounded-xl">
                                                لا توجد حسابات مخصصة مضافة حالياً. أضف حساباً أدناه.
                                            </div>
                                        )}

                                        {/* Add account form */}
                                        <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-3">
                                            <span className="text-[10px] font-bold text-slate-655 block">إضافة حساب عملة جديد:</span>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400">العملة *</label>
                                                    <select 
                                                        value={tempCurrency}
                                                        onChange={e => setTempCurrency(e.target.value)}
                                                        className="w-full rounded-lg border border-slate-200 text-[10px] bg-white h-8 px-2 focus:outline-none"
                                                    >
                                                        <option value="YER">ريال يمني (YER)</option>
                                                        <option value="SAR">ريال سعودي (SAR)</option>
                                                        <option value="USD">دولار أمريكي (USD)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <label className="text-[9px] font-bold text-slate-400">رقم الحساب / الهاتف للتحويل *</label>
                                                    <Input 
                                                        value={tempAccountNumber}
                                                        onChange={e => setTempAccountNumber(e.target.value)}
                                                        placeholder="مثال: 777XXXXXX"
                                                        className="rounded-lg border-slate-200 text-[10px] h-8 font-mono font-bold"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400">اسم صاحب الحساب / التاجر للعملة *</label>
                                                <Input 
                                                    value={tempAccountName}
                                                    onChange={e => setTempAccountName(e.target.value)}
                                                    placeholder="الاسم المسجل للتحويل"
                                                    className="rounded-lg border-slate-200 text-[10px] h-8"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400">تعليمات إضافية خاصة بالعملة (اختياري)</label>
                                                <Input 
                                                    value={tempInstructions}
                                                    onChange={e => setTempInstructions(e.target.value)}
                                                    placeholder="مثال: يرجى التحويل عبر خدمة إم فلوس حصراً..."
                                                    className="rounded-lg border-slate-200 text-[10px] h-8"
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={handleAddAccount}
                                                className="w-full bg-[#16539a] hover:bg-blue-800 text-white rounded-lg h-8 text-[10px] font-bold flex items-center justify-center gap-1 mt-1"
                                            >
                                                <Plus size={12} />
                                                <span>إضافة حساب العملة المذكور للمحفظة</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <div className="flex items-center justify-between border border-slate-200 p-2.5 rounded-xl h-10 bg-white">
                                            <span className="text-xs font-bold text-slate-655">حالة التفعيل للمحفظة</span>
                                            <button 
                                                type="button"
                                                onClick={() => setIsActive(!isActive)}
                                                className="focus:outline-none transition-colors"
                                            >
                                                {isActive ? (
                                                    <ToggleRight className="h-7 w-7 text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft className="h-7 w-7 text-slate-300" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-655">تعليمات عامة للدفع والتحويل (تظهر للعميل بصفحة السداد) *</label>
                                    <textarea 
                                        value={instructions} 
                                        onChange={e => setInstructions(e.target.value)} 
                                        placeholder="مثلاً: يرجى إتمام التحويل المالي للمبلغ بالعملة المختارة، ثم سيقوم النظام بالتحقق تلقائياً..." 
                                        className="w-full rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none p-3 text-xs bg-white min-h-[80px]"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6 shrink-0">
                                    <Button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        variant="outline" 
                                        className="text-slate-500 rounded-xl px-5 h-11 text-xs font-bold border-slate-200 hover:bg-slate-100"
                                        disabled={actionLoading}
                                    >
                                        إلغاء
                                    </Button>
                                    
                                    <Button 
                                        type="submit" 
                                        className="rounded-xl px-8 h-11 text-xs font-bold bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white shadow-lg shadow-blue-100 hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {editingWallet ? "حفظ التعديلات" : "إضافة الحساب المالي"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
