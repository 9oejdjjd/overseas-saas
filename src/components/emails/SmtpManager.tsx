"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/simple-toast";
import { 
    Mail, Plus, Trash2, Edit2, Play, AlertCircle, 
    CheckCircle, ShieldAlert, Loader2, Server, Power,
    Eye, EyeOff
} from "lucide-react";

export function SmtpManager() {
    const { toast } = useToast();
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        host: "smtp.gmail.com",
        port: 465,
        user: "",
        pass: "",
        senderName: "بوابة الاعتماد المهني",
        secure: true,
        isActive: true
    });

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/smtp");
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (err) {
            console.error("Failed to fetch SMTP configs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const resetForm = () => {
        setFormData({
            host: "smtp.gmail.com",
            port: 465,
            user: "",
            pass: "",
            senderName: "بوابة الاعتماد المهني",
            secure: true,
            isActive: true
        });
        setEditingConfig(null);
        setError("");
        setSuccessMsg("");
        setShowPassword(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowForm(true);
    };

    const handleOpenEdit = (config: any) => {
        setError("");
        setSuccessMsg("");
        setShowPassword(false);
        setEditingConfig(config);
        setFormData({
            host: config.host,
            port: config.port,
            user: config.user,
            pass: "", // clear password field for editing to allow safe input
            senderName: config.senderName,
            secure: config.secure,
            isActive: config.isActive
        });
        setShowForm(true);
    };

    const handleTestConnection = async () => {
        if (!formData.host || !formData.port || !formData.user || !formData.pass) {
            setError("يرجى إدخال كافة الحقول للتحقق من الاتصال.");
            return;
        }

        setIsTesting(true);
        setError("");
        setSuccessMsg("");

        try {
            const url = editingConfig ? `/api/settings/smtp/${editingConfig.id}` : "/api/settings/smtp";
            const method = editingConfig ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    testConnection: true
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "فشل الاتصال بخادم البريد.");
            }

            setSuccessMsg("نجح الاتصال! تم إرسال بريد تجريبي إلى " + formData.user);
            toast("نجح الاتصال! تم إرسال بريد إلكتروني تجريبي.", "success");
            fetchConfigs();
        } catch (err: any) {
            setError(err.message || "حدث خطأ أثناء اختبار الاتصال.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.host || !formData.port || !formData.user || (!editingConfig && !formData.pass)) {
            setError("يرجى ملء جميع الحقول المطلوبة.");
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            const url = editingConfig ? `/api/settings/smtp/${editingConfig.id}` : "/api/settings/smtp";
            const method = editingConfig ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "فشل حفظ إعدادات البريد.");
            }

            toast("تم حفظ إعدادات خادم البريد بنجاح.", "success");

            setShowForm(false);
            resetForm();
            fetchConfigs();
        } catch (err: any) {
            setError(err.message || "حدث خطأ أثناء حفظ الإعدادات.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من رغبتك في حذف إعداد خادم البريد هذا؟")) return;

        try {
            const res = await fetch(`/api/settings/smtp/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast("تم حذف خادم البريد بنجاح.", "success");
                fetchConfigs();
            } else {
                alert("فشل حذف خادم البريد.");
            }
        } catch (err) {
            console.error("Failed to delete config:", err);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 dark:border-slate-850 pb-5">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        ربط حسابات خوادم البريد الإلكتروني (SMTP)
                    </h2>
                    <p className="text-slate-550 dark:text-slate-400 text-xs font-semibold">
                        قم بربط حساب بريد إلكتروني أو أكثر ديناميكياً لإرسال قوالب الـ OTP، روابط الاختبار والنتائج بالتناوب.
                    </p>
                </div>
                {!showForm && (
                    <Button 
                        onClick={handleOpenAdd}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 text-xs"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة خادم جديد
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-650 p-4 rounded-xl flex items-start gap-2.5 text-xs font-bold border border-red-100 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {successMsg && (
                <div className="bg-emerald-50 text-emerald-650 p-4 rounded-xl flex items-start gap-2.5 text-xs font-bold border border-emerald-100 animate-fade-in">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                </div>
            )}

            {showForm ? (
                <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="host" className="text-xs font-bold text-slate-700 dark:text-slate-300">خادم SMTP (Host)</Label>
                            <Input
                                id="host"
                                placeholder="smtp.gmail.com"
                                value={formData.host}
                                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                className="h-10 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="port" className="text-xs font-bold text-slate-700 dark:text-slate-300">المنفذ (Port)</Label>
                            <Input
                                id="port"
                                type="number"
                                placeholder="465"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 465 })}
                                className="h-10 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user" className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني (Username)</Label>
                            <Input
                                id="user"
                                type="email"
                                placeholder="example@gmail.com"
                                value={formData.user}
                                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                className="h-10 text-xs rounded-xl text-left"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pass" className="text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور (App Password)</Label>
                            <div className="relative">
                                <Input
                                    id="pass"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={editingConfig ? "••••••••" : "رمز المرور الخاص بالتطبيق"}
                                    value={formData.pass}
                                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                                    className="h-10 text-xs rounded-xl text-left pl-10"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senderName" className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم المرسل (Sender Name)</Label>
                            <Input
                                id="senderName"
                                placeholder="بوابة الاعتماد المهني"
                                value={formData.senderName}
                                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                className="h-10 text-xs rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                    id="secure"
                                    checked={formData.secure}
                                    onCheckedChange={(checked) => setFormData({ ...formData, secure: !!checked })}
                                    className="rounded-md"
                                />
                                <Label htmlFor="secure" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    اتصال مشفر (SSL/TLS)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                                    className="rounded-md"
                                />
                                <Label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    خادم بريد نشط ومستعمل
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForm(false)}
                            className="h-10 rounded-xl text-xs font-bold"
                            disabled={isSaving || isTesting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="button"
                            onClick={handleTestConnection}
                            className="h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold gap-2"
                            disabled={isSaving || isTesting}
                        >
                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            اختبار الاتصال
                        </Button>
                        <Button
                            type="submit"
                            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2"
                            disabled={isSaving || isTesting}
                        >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editingConfig ? "تحديث خادم البريد" : "حفظ خادم البريد"}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center py-10 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="text-xs text-slate-400">جاري تحميل خوادم البريد...</span>
                        </div>
                    ) : configs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center gap-3">
                            <Server className="h-10 w-10 text-slate-300" />
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد خوادم SMTP مرتبطة</h3>
                                <p className="text-[11px] text-slate-400">
                                    قم بربط حساب SMTP واحد على الأقل ليتمكن النظام من إرسال قوالب التنبيه والنتائج والرموز للمتقدمين.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {configs.map((c) => (
                                <div 
                                    key={c.id} 
                                    className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-md transition-all bg-white dark:bg-slate-950"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.senderName}</span>
                                                {c.isActive ? (
                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                                                        <Power className="h-2 w-2" /> نشط
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-50 text-slate-500 border border-slate-100 rounded-full px-2 py-0.5 text-[9px] font-bold">
                                                        غير نشط
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-semibold">{c.user}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{c.host}:{c.port} | {c.secure ? "Secure (SSL)" : "Non-Secure"}</p>
                                        </div>
                                        <Server className="h-6 w-6 text-slate-300" />
                                    </div>

                                    <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-900 pt-3">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleOpenEdit(c)}
                                            className="h-8 text-[11px] font-bold rounded-lg text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 gap-1.5"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            تعديل
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(c.id)}
                                            className="h-8 text-[11px] font-bold rounded-lg text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
