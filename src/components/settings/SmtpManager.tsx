"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Mail, Plus, Trash2, Edit2, Play, AlertCircle, 
    CheckCircle, ShieldAlert, Loader2, Server, Power,
    Eye, EyeOff
} from "lucide-react";


export function SmtpManager() {
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
            pass: config.pass, // will be masked "••••••••"
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
            fetchConfigs();
        } catch (err: any) {
            setError(err.message || "حدث خطأ أثناء اختبار الاتصال.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.host || !formData.port || !formData.user || !formData.pass) {
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
                fetchConfigs();
            } else {
                alert("فشل حذف خادم البريد.");
            }
        } catch (err) {
            console.error("Failed to delete config:", err);
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-5">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        ربط حسابات خوادم البريد الإلكتروني (SMTP)
                    </h2>
                    <p className="text-slate-550 text-xs font-semibold">
                        قم بربط حساب بريد إلكتروني أو أكثر ديناميكياً لإرسال قوالب الـ OTP، روابط الاختبار والنتائج بالتناوب.
                    </p>
                </div>
                {!showForm && (
                    <Button 
                        onClick={handleOpenAdd}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl h-10 font-bold text-xs gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        ربط حساب SMTP جديد
                    </Button>
                )}
            </div>

            {showForm ? (
                <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-slate-50/50 p-6 rounded-2xl border border-slate-100 animate-in fade-in-50 duration-300">
                    <h3 className="font-bold text-slate-800 text-sm border-r-4 border-indigo-600 pr-2.5">
                        {editingConfig ? "تعديل إعدادات خادم البريد" : "إضافة وربط خادم بريد إلكتروني SMTP"}
                    </h3>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-650 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100/50">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-green-100/50">
                            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-600 font-bold">اسم المرسل الظاهر للمتقدمين</Label>
                            <Input 
                                value={formData.senderName}
                                onChange={e => setFormData({...formData, senderName: e.target.value})}
                                placeholder="مثال: بوابة الاعتماد المهني"
                                className="h-10 text-xs rounded-lg border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-600 font-bold">عنوان خادم البريد (SMTP Host)</Label>
                            <Input 
                                value={formData.host}
                                onChange={e => setFormData({...formData, host: e.target.value})}
                                placeholder="مثال: smtp.gmail.com"
                                className="h-10 text-xs rounded-lg border-slate-200"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-600 font-bold">منفذ الاتصال (Port)</Label>
                            <Input 
                                type="number"
                                value={formData.port}
                                onChange={e => setFormData({...formData, port: Number(e.target.value)})}
                                placeholder="مثال: 465"
                                className="h-10 text-xs rounded-lg border-slate-200"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-600 font-bold">بريد الإرسال (SMTP Username)</Label>
                            <Input 
                                type="email"
                                value={formData.user}
                                onChange={e => setFormData({...formData, user: e.target.value})}
                                placeholder="name@domain.com"
                                className="h-10 text-xs rounded-lg border-slate-200 text-left"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-600 font-bold">كلمة المرور أو كلمة مرور التطبيقات (App Password)</Label>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"}
                                    value={formData.pass}
                                    onChange={e => setFormData({...formData, pass: e.target.value})}
                                    placeholder="••••••••••••••••"
                                    className="h-10 text-xs rounded-lg border-slate-200 text-left pl-10 pr-3"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 items-center pt-2">
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="secure" 
                                checked={formData.secure} 
                                onCheckedChange={(checked) => setFormData({...formData, secure: !!checked})} 
                                className="w-4 h-4 rounded data-[state=checked]:bg-indigo-600"
                            />
                            <Label htmlFor="secure" className="text-xs text-slate-600 font-bold cursor-pointer">
                                اتصال آمن SSL/TLS (موصى به للمنفذ 465)
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="isActive" 
                                checked={formData.isActive} 
                                onCheckedChange={(checked) => setFormData({...formData, isActive: !!checked})} 
                                className="w-4 h-4 rounded data-[state=checked]:bg-indigo-600"
                            />
                            <Label htmlFor="isActive" className="text-xs text-slate-600 font-bold cursor-pointer">
                                تفعيل هذا الحساب للإرسال الفوري
                            </Label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200/50">
                        <Button 
                            type="button" 
                            onClick={handleTestConnection}
                            disabled={isTesting || isSaving}
                            variant="outline"
                            className="text-xs font-bold border-slate-200 h-10 rounded-xl gap-2 hover:bg-slate-50 cursor-pointer"
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-455" />
                                    جاري اختبار الاتصال...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                                    اختبار الاتصال
                                </>
                            )}
                        </Button>
                        <div className="flex-1"></div>
                        <Button 
                            type="button" 
                            onClick={() => setShowForm(false)} 
                            variant="ghost"
                            className="text-xs font-bold h-10 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                            إلغاء
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSaving || isTesting}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl h-10 font-bold text-xs gap-2"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الإعدادات"}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="text-xs font-bold">جاري تحميل خوادم الـ SMTP النشطة...</p>
                        </div>
                    ) : configs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                            <Server className="h-10 w-10 text-slate-350 mb-3" />
                            <p className="text-sm font-bold text-slate-700 mb-1">لا توجد خوادم بريد مضافة</p>
                            <p className="text-xs text-slate-455 max-w-sm leading-relaxed mb-4">
                                لن يتمكن النظام من إرسال رسائل البريد الإلكتروني (OTP، النتائج، الروابط) حتى تقوم بإضافة وتفعيل خادم SMTP من هنا.
                            </p>
                            <Button 
                                onClick={handleOpenAdd}
                                variant="outline"
                                className="text-xs font-bold border-indigo-200 text-indigo-650 hover:bg-indigo-50/30 rounded-xl h-9 px-4 gap-2"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                إضافة خادم SMTP
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                                        <th className="p-4">حساب الإرسال</th>
                                        <th className="p-4">الخادم والمنفذ</th>
                                        <th className="p-4">اسم المرسل</th>
                                        <th className="p-4 text-center">الحالة</th>
                                        <th className="p-4 text-center">أدوات التحكم</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configs.map((config) => (
                                        <tr key={config.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 text-xs text-slate-650 transition-colors">
                                            <td className="p-4 font-bold text-slate-800 font-mono" dir="ltr">{config.user}</td>
                                            <td className="p-4 font-mono" dir="ltr">{config.host}:{config.port} ({config.secure ? "SSL" : "TLS"})</td>
                                            <td className="p-4 font-semibold">{config.senderName}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Power className="h-3 w-3" />
                                                    {config.isActive ? "نشط" : "معطل"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center items-center gap-1">
                                                    <Button 
                                                        onClick={() => handleOpenEdit(config)}
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-indigo-650 hover:bg-indigo-50/40"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleDelete(config.id)}
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 rounded-lg text-slate-455 hover:text-red-650 hover:bg-red-50/40"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
