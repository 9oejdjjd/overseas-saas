"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export function ForcePasswordChange() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isMatch = newPassword === confirmPassword;
    const isLongEnough = newPassword.length >= 6;
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    const canSubmit = isMatch && isLongEnough && hasNumber && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/users/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            if (res.ok) {
                toast.success("تم تحديث كلمة المرور بنجاح! جاري تحويلك...");
                // Reload to refresh NextAuth session
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const data = await res.json();
                setError(data.error || "حدث خطأ ما أثناء التحديث");
            }
        } catch (err) {
            setError("عذراً، حدث خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center text-white relative">
                    <div className="absolute right-4 top-4 opacity-10">
                        <Lock className="w-24 h-24" />
                    </div>
                    <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold tracking-wide">إجراء أمني مطلوب</h2>
                    <p className="text-blue-100 text-xs mt-1">يجب تعيين كلمة مرور جديدة قوية لمتابعة الدخول</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Welcome Notice */}
                    <div className="bg-blue-50 border-r-4 border-blue-600 p-3 rounded-l-md text-xs text-blue-800 leading-relaxed text-right">
                        مرحباً بك في نظام الاعتماد المهني. نظراً لأنك تسجل الدخول للمرة الأولى أو تم إعادة تعيين حسابك من قبل الإدارة، يرجى إنشاء كلمة مرور جديدة خاصة بك لحماية بياناتك.
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 text-right">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-right">
                        {/* New Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 block">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pr-10 pl-10 text-left font-mono"
                                    placeholder="••••••••"
                                    required
                                    dir="ltr"
                                />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 block">تأكيد كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pr-10 pl-10 text-left font-mono"
                                    placeholder="••••••••"
                                    required
                                    dir="ltr"
                                />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Strength Checklist */}
                        <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-100">
                            <h4 className="text-[11px] font-bold text-gray-500 mb-1.5">شروط كلمة المرور القوية:</h4>
                            
                            <div className="flex items-center gap-1.5 text-[11px] justify-end">
                                <span className={isLongEnough ? "text-green-700" : "text-gray-400"}>6 أحرف أو أكثر</span>
                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLongEnough ? "text-green-600" : "text-gray-300"}`} />
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] justify-end">
                                <span className={hasNumber ? "text-green-700" : "text-gray-400"}>تحتوي على رقم واحد على الأقل</span>
                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasNumber ? "text-green-600" : "text-gray-300"}`} />
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] justify-end">
                                <span className={isMatch && confirmPassword.length > 0 ? "text-green-700" : "text-gray-400"}>كلمتا المرور متطابقتان</span>
                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isMatch && confirmPassword.length > 0 ? "text-green-600" : "text-gray-300"}`} />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 mt-4 gap-2 transition-all duration-200 rounded-xl"
                        >
                            تحديث كلمة المرور والدخول للنظام
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
