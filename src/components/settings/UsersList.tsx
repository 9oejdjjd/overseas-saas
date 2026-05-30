"use client";

import { User } from "@/hooks/settings/useSettingsManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/lib/rbac";
import {
    Users, Search, Mail, Shield, CheckCircle2, UserX, AlertTriangle, Lock, Pencil, KeyRound, Loader2, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

type UsersListProps = {
    filteredUsers: User[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleEdit: (user: User) => void;
    handleResetPassword: (user: User) => void;
    handleDelete: (user: User) => void;
    isResetting: boolean;
    selectedUser: User | null;
    currentUserId?: string;
};

export function UsersList({
    filteredUsers,
    searchTerm,
    setSearchTerm,
    handleEdit,
    handleResetPassword,
    handleDelete,
    isResetting,
    selectedUser,
    currentUserId
}: UsersListProps) {
    return (
        <Card className="border border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl shadow-inner">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                        <CardTitle className="text-sm font-bold text-slate-800">سجل المستخدمين والمشرفين الحاليين</CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-0.5">
                            ابحث وقم بإدارة الحسابات، صلاحيات وصولهم الدقيقة ومستويات الأمان
                        </CardDescription>
                    </div>
                </div>
                
                {/* Debounced / Instant Search Field */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="ابحث بالاسم، البريد الإلكتروني أو الدور الوظيفي..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-indigo-500 focus:bg-white transition-all text-right h-10"
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="w-full text-sm text-right">
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 border-b border-slate-150 hover:bg-slate-50/50">
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-right">الاسم الكامل والموظف</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-right">البريد الإلكتروني للعمل</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-right">الدور والوظيفة</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-right">حالة التنشيط</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-right">أمان وحالة الحساب</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-xs text-slate-650 text-center">خيارات التحكم المتاحة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-150">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                                        
                                        {/* Avatar and Name */}
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner">
                                                    {user.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-800 text-xs">{user.name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        تاريخ الإنشاء: {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Email */}
                                        <TableCell className="px-6 py-4 text-slate-600 font-semibold text-xs">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className="font-mono text-[11px] text-slate-500">{user.email}</span>
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                            </div>
                                        </TableCell>

                                        {/* Role Badge */}
                                        <TableCell className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                                user.role === "ADMIN" 
                                                    ? "bg-purple-50 text-purple-700 border-purple-100" 
                                                    : user.role === "REGISTRATION_STAFF"
                                                    ? "bg-blue-50 text-indigo-700 border-blue-100"
                                                    : user.role === "ACCOUNTANT"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                <Shield className="h-3 w-3" />
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </TableCell>

                                        {/* Active State */}
                                        <TableCell className="px-6 py-4">
                                            {user.active ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50/50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    حساب نشط
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                    <UserX className="h-3.5 w-3.5" />
                                                    غير نشط
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Password Security State */}
                                        <TableCell className="px-6 py-4">
                                            {user.requirePasswordChange ? (
                                                <span 
                                                    className="inline-flex items-center gap-1 text-amber-600 font-bold text-[10px] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 animate-pulse" 
                                                    title="يلزم المشرف بتزويده بكلمة مرور مؤقتة ويجب تغييرها فور دخوله القادم"
                                                >
                                                    <AlertTriangle className="h-3 w-3" />
                                                    يلزم تغيير السر
                                                </span>
                                            ) : (
                                                <span 
                                                    className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50/30 px-2.5 py-0.5 rounded-full border border-emerald-100" 
                                                    title="الرقم السري مؤمن وتم ضبطه من قبل المستخدم"
                                                >
                                                    <Lock className="h-3 w-3" />
                                                    مؤمن ونشط
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="تعديل الحساب والصلاحيات"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    disabled={isResetting && selectedUser?.id === user.id}
                                                    title="إعادة تعيين كلمة المرور مؤقتاً"
                                                >
                                                    {isResetting && selectedUser?.id === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                                    ) : (
                                                        <KeyRound className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={user.id === currentUserId}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="حذف حساب المستخدم نهائياً"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                                        <div className="flex flex-col items-center gap-2 py-4">
                                            <Users className="h-8 w-8 text-slate-300 animate-bounce" />
                                            <p className="font-bold text-slate-800 text-xs">لم يتم العثور على أي مستخدمين يطابقون بحثك</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
