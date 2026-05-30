"use client";

import { User } from "@/hooks/settings/useSettingsManagement";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Key, Lock, AlertTriangle, Check, Copy, CheckCircle2
} from "lucide-react";

type PasswordResetDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedUser: User | null;
    generatedPassword: string;
    copied: boolean;
    handleCopy: () => void;
};

export function PasswordResetDialog({
    open,
    onOpenChange,
    selectedUser,
    generatedPassword,
    copied,
    handleCopy
}: PasswordResetDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden p-0 text-right" dir="rtl">
                
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-center text-white relative">
                    <div className="absolute right-4 top-4 opacity-10">
                        <Key className="w-20 h-20" />
                    </div>
                    <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <DialogTitle className="text-lg font-black tracking-wide text-white">
                        توليد كلمة مرور مؤقتة آمنة
                    </DialogTitle>
                    <p className="text-amber-100 text-[10px] font-bold mt-1">تمت إعادة تعيين أمان الموظف بنجاح</p>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Warning Arabic Alert */}
                    <div className="bg-amber-50 border-r-4 border-amber-600 p-4 rounded-l-xl text-xs text-amber-900 leading-relaxed text-right flex gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                        <div className="space-y-1">
                            <p className="font-black text-amber-800">تنبيه أمني هام جداً:</p>
                            <p className="text-[11px] leading-relaxed">
                                يرجى نسخ كلمة المرور الموضحة بالأسفل وإرسالها للموظف <span className="font-extrabold text-slate-800">"{selectedUser?.name}"</span> بشكل آمن وسري.
                            </p>
                            <span className="font-black block mt-1 text-[11px] text-rose-700">
                                🛑 لن تظهر كلمة المرور هذه مرة أخرى في النظام بعد إغلاق هذه النافذة.
                            </span>
                            <p className="text-[10px] text-amber-800/80 leading-relaxed">
                                سيجبر النظام الموظف على تعيين كلمته الشخصية الخاصة به فور استخدامه لهذه الكلمة في تسجيل الدخول.
                            </p>
                        </div>
                    </div>

                    {/* Dark Code Block */}
                    <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-black text-slate-400 block">كلمة المرور المؤقتة الجديدة:</label>
                        <div className="relative flex items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner group">
                            <code className="flex-1 font-mono text-center text-amber-400 font-extrabold text-base select-all" dir="ltr">
                                {generatedPassword}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg transition-all absolute left-2"
                                title="نسخ كلمة المرور للحافظة"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all duration-200 gap-2 text-xs h-11"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        حفظ وإغلاق نافذة الأمان
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
