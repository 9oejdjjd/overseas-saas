import React from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecurityTabProps {
    currentPassword: string;
    setCurrentPassword: (pw: string) => void;
    newPassword: string;
    setNewPassword: (pw: string) => void;
    confirmPassword: string;
    setConfirmPassword: (pw: string) => void;
    showCurrentPw: boolean;
    setShowCurrentPw: (show: boolean) => void;
    showNewPw: boolean;
    setShowNewPw: (show: boolean) => void;
    changingPassword: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function SecurityTab({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPw,
    setShowCurrentPw,
    showNewPw,
    setShowNewPw,
    changingPassword,
    onSubmit
}: SecurityTabProps) {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-6">
                <form onSubmit={onSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور الحالية</label>
                        <div className="relative">
                            <Input 
                                required 
                                type={showCurrentPw ? "text" : "password"} 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                className="h-10 pl-10 rounded-xl text-xs font-semibold font-sans dir-ltr text-right bg-white" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                            >
                                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور الجديدة</label>
                        <div className="relative">
                            <Input 
                                required 
                                type={showNewPw ? "text" : "password"} 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                className="h-10 pl-10 rounded-xl text-xs font-semibold font-sans dir-ltr text-right bg-white" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                            >
                                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400">يجب ألا تقل عن 6 خانات وتتضمن حروفاً وأرقاماً.</p>
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور الجديدة</label>
                        <Input 
                            required 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            className="h-10 rounded-xl text-xs font-semibold font-sans dir-ltr text-right bg-white" 
                        />
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={changingPassword} 
                            className="h-10 px-6 bg-[#074388] hover:bg-[#063570] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                        >
                            {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                            تحديث كلمة المرور
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
