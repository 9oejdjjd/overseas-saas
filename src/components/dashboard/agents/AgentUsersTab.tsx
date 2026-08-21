import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, KeyRound, Trash2, Users, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface AgentUsersTabProps {
    agentUsers: any[];
    onToggleUserActive: (userId: string, currentActive: boolean) => void;
    onDeleteUser: (userId: string) => void;
    onAddUserSubmit: (e: React.FormEvent, data: any) => Promise<boolean>;
    onResetPasswordSubmit: (e: React.FormEvent, userId: string, tempPass: string) => Promise<boolean>;
}

export function AgentUsersTab({
    agentUsers,
    onToggleUserActive,
    onDeleteUser,
    onAddUserSubmit,
    onResetPasswordSubmit
}: AgentUsersTabProps) {
    // Add User State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserIsOwner, setNewUserIsOwner] = useState(false);
    const [submittingUser, setSubmittingUser] = useState(false);

    // Reset Password State
    const [isResetPassOpen, setIsResetPassOpen] = useState(false);
    const [resetPassUser, setResetPassUser] = useState<any>(null);
    const [newTempPassword, setNewTempPassword] = useState("");
    const [submittingResetPass, setSubmittingResetPass] = useState(false);

    const generateRandomUserPass = () => {
        const pass = Math.random().toString(36).slice(-8);
        setNewUserPassword(pass);
    };

    const generateResetTempPass = () => {
        const pass = Math.random().toString(36).slice(-8);
        setNewTempPassword(pass);
    };

    const handleAddUserSubmitLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingUser(true);
        const success = await onAddUserSubmit(e, {
            name: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            isAgentOwner: newUserIsOwner
        });
        setSubmittingUser(false);
        if (success) {
            setIsAddUserOpen(false);
            setNewUserName("");
            setNewUserEmail("");
            setNewUserPassword("");
            setNewUserIsOwner(false);
        }
    };

    const handleResetPasswordSubmitLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPassUser) return;
        setSubmittingResetPass(true);
        const success = await onResetPasswordSubmit(e, resetPassUser.id, newTempPassword);
        setSubmittingResetPass(false);
        if (success) {
            setIsResetPassOpen(false);
            setResetPassUser(null);
            setNewTempPassword("");
        }
    };

    return (
        <div className="space-y-4 text-right" dir="rtl">
            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h3 className="text-xs font-black text-slate-800">حسابات موظفي البوابة</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">المستخدمون الذين يملكون حق الدخول وإرسال الاختبارات باسم هذه الوكالة.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setIsAddUserOpen(true);
                            generateRandomUserPass();
                        }}
                        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                        <Plus size={14} /> إضافة حساب موظف
                    </Button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                        <thead className="bg-slate-50 text-slate-400 font-black border-b text-[10px]">
                            <tr>
                                <th className="py-3.5 px-5">الاسم</th>
                                <th className="py-3.5 px-5">البريد الإلكتروني</th>
                                <th className="py-3.5 px-5">الصلاحية</th>
                                <th className="py-3.5 px-5 text-center">نشط للولوج</th>
                                <th className="py-3.5 px-5 text-center">تاريخ الإنشاء</th>
                                <th className="py-3.5 px-5 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {agentUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50">
                                    <td className="py-4 px-5 font-bold text-slate-900">{user.name}</td>
                                    <td className="py-4 px-5 font-sans">{user.email}</td>
                                    <td className="py-4 px-5">
                                        {user.isAgentOwner ? (
                                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50 text-[10px] font-black">
                                                مالك الوكالة (Owner)
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-150 text-[10px]">موظف مبيعات</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                        <Switch 
                                            checked={user.active} 
                                            onCheckedChange={() => onToggleUserActive(user.id, user.active)} 
                                        />
                                    </td>
                                    <td className="py-4 px-5 text-center text-[10px] text-slate-400 font-sans">{new Date(user.createdAt).toLocaleDateString("ar-YE")}</td>
                                    <td className="py-4 px-5 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => {
                                                    setResetPassUser(user);
                                                    setIsResetPassOpen(true);
                                                    generateResetTempPass();
                                                }}
                                                className="h-8 text-[10px] font-black text-indigo-650 hover:bg-indigo-50 px-2.5 rounded-lg flex items-center gap-1 bg-transparent"
                                            >
                                                <KeyRound size={12} /> تعيين كلمة مرور
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => onDeleteUser(user.id)}
                                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-0 bg-transparent flex items-center justify-center"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {agentUsers.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-bold">لا يوجد أي حسابات موظفين مسجلة لهذه الوكالة بعد.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Dialog: Add Agent User */}
            <Dialog.Root open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-2xl sm:rounded-2xl font-sans text-right animate-in fade-in zoom-in duration-200" dir="rtl">
                        <Dialog.Title className="text-base font-black text-gray-900 flex items-center gap-1.5"><Users size={18} className="text-indigo-600" /> إضافة حساب موظف للوكيل</Dialog.Title>
                        
                        <form onSubmit={handleAddUserSubmitLocal} className="space-y-4 pt-3 text-right">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-700">الاسم الكامل</label>
                                <Input required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="h-10 rounded-xl text-xs font-semibold bg-white border border-slate-250" placeholder="محمد صالح أحمد" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-700">البريد الإلكتروني للولوج</label>
                                <Input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="h-10 rounded-xl text-xs font-semibold font-sans text-left bg-white border border-slate-250" dir="ltr" placeholder="user@agency.com" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <button type="button" onClick={generateRandomUserPass} className="text-[10px] font-black text-indigo-650 hover:underline flex items-center gap-0.5 bg-transparent border-none">
                                        <RefreshCw size={10} /> توليد كلمة مرور
                                    </button>
                                    <label className="text-[11px] font-black text-slate-700">كلمة المرور الابتدائية</label>
                                </div>
                                <Input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="h-10 rounded-xl text-xs font-semibold font-sans text-left bg-slate-50 border border-slate-250" dir="ltr" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-150">
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[11px] font-black text-slate-800">منحه رتبة مالك للوكالة (Is Owner)</p>
                                    <p className="text-[9px] text-slate-400 font-bold">الحسابات بصلاحية مالك تملك حق التحكم الكامل وإدارة الحسابات الشخصية.</p>
                                </div>
                                <Switch checked={newUserIsOwner} onCheckedChange={setNewUserIsOwner} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Dialog.Close asChild>
                                    <Button type="button" variant="outline" className="h-10 rounded-xl text-xs font-bold bg-white border-slate-250">إلغاء</Button>
                                </Dialog.Close>
                                <Button type="submit" disabled={submittingUser} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/10">
                                    {submittingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة الحساب وتفعيله"}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Modal Dialog: Reset User Password */}
            <Dialog.Root open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-2xl sm:rounded-2xl font-sans text-right animate-in fade-in zoom-in duration-200" dir="rtl">
                        <Dialog.Title className="text-base font-black text-gray-900 flex items-center gap-1.5"><KeyRound size={18} className="text-indigo-600" /> إعادة تعيين كلمة المرور للموظف</Dialog.Title>
                        {resetPassUser && (
                            <p className="text-[11px] text-slate-400 font-bold">سيتم تعيين كلمة مرور مؤقتة جديدة للمستخدم: <strong className="text-slate-800">{resetPassUser.name}</strong></p>
                        )}
                        
                        <form onSubmit={handleResetPasswordSubmitLocal} className="space-y-4 pt-3 text-right">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <button type="button" onClick={generateResetTempPass} className="text-[10px] font-black text-indigo-650 hover:underline flex items-center gap-0.5 bg-transparent border-none">
                                        <RefreshCw size={10} /> توليد كلمة سر جديدة
                                    </button>
                                    <label className="text-[11px] font-black text-slate-700">كلمة المرور المؤقتة الجديدة</label>
                                </div>
                                <Input required value={newTempPassword} onChange={e => setNewTempPassword(e.target.value)} className="h-10 rounded-xl text-xs font-semibold font-sans text-left bg-slate-50 border border-slate-250" dir="ltr" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Dialog.Close asChild>
                                    <Button type="button" variant="outline" className="h-10 rounded-xl text-xs font-bold bg-white border-slate-250">إلغاء</Button>
                                </Dialog.Close>
                                <Button type="submit" disabled={submittingResetPass} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md">
                                    {submittingResetPass ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ وتعيين"}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
