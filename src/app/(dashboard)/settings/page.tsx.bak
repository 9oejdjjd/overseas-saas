"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getRoleLabel, getAllRoles, type UserRole } from "@/lib/rbac";
import { Users, Plus, Pencil, Trash2, KeyRound, Save, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function SettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddEdit, setShowAddEdit] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "REGISTRATION_STAFF" as UserRole,
        active: true,
    });
    const [newPassword, setNewPassword] = useState("");

    //  Check if user is admin
    useEffect(() => {
        if (session && session.user.role !== "ADMIN") {
            router.push("/");
        }
    }, [session, router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user.role === "ADMIN") {
            fetchUsers();
        }
    }, [session]);

    const handleAdd = () => {
        setSelectedUser(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "REGISTRATION_STAFF",
            active: true,
        });
        setShowAddEdit(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            active: user.active,
        });
        setShowAddEdit(true);
    };

    const handleSave = async () => {
        try {
            const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
            const method = selectedUser ? "PATCH" : "POST";

            const body = selectedUser
                ? { name: formData.name, email: formData.email, role: formData.role, active: formData.active }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                alert(selectedUser ? "تم تحديث المستخدم بنجاح" : "تم إضافة المستخدم بنجاح");
                setShowAddEdit(false);
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || "حدث خطأ");
            }
        } catch (error) {
            alert("حدث خطأ");
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`هل أنت متأكد من حذف المستخدم: ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("تم حذف المستخدم بنجاح");
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || "حدث خطأ");
            }
        } catch (error) {
            alert("حدث خطأ");
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) return;

        try {
            const res = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            if (res.ok) {
                alert("تم إعادة تعيين كلمة المرور بنجاح");
                setShowResetPassword(false);
                setNewPassword("");
            } else {
                const error = await res.json();
                alert(error.error || "حدث خطأ");
            }
        } catch (error) {
            alert("حدث خطأ");
        }
    };

    if (session?.user.role !== "ADMIN") {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                    <p className="text-gray-500 text-sm mt-1">إضافة وتعديل وحذف مستخدمي النظام</p>
                </div>
                <button onClick={handleAdd} className="ant-btn ant-btn-primary gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مستخدم
                </button>
            </div>

            {/* Users Table */}
            <div className="ant-card">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">المستخدمون ({users.length})</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#fafafa] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">الاسم</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">البريد الإلكتروني</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">الدور</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">الحالة</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">تاريخ الإنشاء</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#f0f9ff] transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.active ? (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-xs">نشط</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <XCircle className="h-4 w-4" />
                                                <span className="text-xs">غير نشط</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                                                title="تعديل"
                                            >
                                                <Pencil className="h-4 w-4 text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowResetPassword(true);
                                                }}
                                                className="p-2 hover:bg-orange-50 rounded-md transition-colors"
                                                title="إعادة تعيين كلمة المرور"
                                            >
                                                <KeyRound className="h-4 w-4 text-orange-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                disabled={user.id === session?.user.id}
                                                className="p-2 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                                                title="حذف"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit User Sheet */}
            <Sheet open={showAddEdit} onOpenChange={setShowAddEdit}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader className="pb-6 border-b">
                        <SheetTitle className="text-xl">
                            {selectedUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">الاسم الكامل *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="ant-input mt-2"
                                    placeholder="أحمد محمد"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني *</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="ant-input mt-2"
                                    placeholder="ahmed@example.com"
                                />
                            </div>

                            {!selectedUser && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">كلمة المرور *</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="ant-input mt-2"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700">الدور *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="ant-input w-full mt-2"
                                >
                                    {getAllRoles().map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    حساب نشط
                                </label>
                            </div>
                        </div>

                        <div className="pt-6 border-t space-y-3">
                            <Button onClick={handleSave} className="ant-btn ant-btn-primary w-full">
                                <Save className="h-4 w-4 ml-2" />
                                {selectedUser ? "تحديث المستخدم" : "إضافة المستخدم"}
                            </Button>
                            <Button onClick={() => setShowAddEdit(false)} variant="outline" className="w-full">
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Reset Password Sheet */}
            <Sheet open={showResetPassword} onOpenChange={setShowResetPassword}>
                <SheetContent>
                    <SheetHeader className="pb-6 border-b">
                        <SheetTitle className="text-xl">إعادة تعيين كلمة المرور</SheetTitle>
                        <p className="text-sm text-gray-500 text-right">
                            {selectedUser?.name} - {selectedUser?.email}
                        </p>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700">كلمة المرور الجديدة *</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="ant-input mt-2"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <p className="text-xs text-gray-500 mt-1">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                        </div>

                        <div className="pt-6 border-t space-y-3">
                            <Button
                                onClick={handleResetPassword}
                                disabled={!newPassword || newPassword.length < 6}
                                className="ant-btn ant-btn-primary w-full"
                            >
                                <KeyRound className="h-4 w-4 ml-2" />
                                إعادة تعيين كلمة المرور
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setNewPassword("");
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
