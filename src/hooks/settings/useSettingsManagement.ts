"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/simple-toast";
import { 
    getDefaultPermissions, 
    getRoleLabel, 
    type UserRole, 
    type CustomPermissions 
} from "@/lib/rbac";

export type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    permissions: any;
    requirePasswordChange: boolean;
    createdAt: string;
    updatedAt: string;
};

export function useSettingsManagement() {
    const { data: session } = useSession();
    const { toast } = useToast();
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddEdit, setShowAddEdit] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [copied, setCopied] = useState(false);
    
    // Drawer form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "REGISTRATION_STAFF" as UserRole,
        active: true,
    });
    
    const [permissions, setPermissions] = useState<CustomPermissions>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast("فشل في تحميل قائمة المستخدمين", "error");
            }
        } catch (error) {
            console.error(error);
            toast("حدث خطأ أثناء تحميل البيانات", "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (session?.user.role === "ADMIN") {
            fetchUsers();
        }
    }, [session, fetchUsers]);

    // Handle adding a user trigger
    const handleAdd = useCallback(() => {
        setSelectedUser(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "REGISTRATION_STAFF",
            active: true,
        });
        setPermissions(getDefaultPermissions("REGISTRATION_STAFF"));
        setShowAddEdit(true);
    }, []);

    // Handle editing a user trigger
    const handleEdit = useCallback((user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            active: user.active,
        });
        
        let userPerms = user.permissions;
        if (userPerms && typeof userPerms === "string") {
            try {
                userPerms = JSON.parse(userPerms);
            } catch (e) {
                userPerms = getDefaultPermissions(user.role);
            }
        } else if (!userPerms) {
            userPerms = getDefaultPermissions(user.role);
        }
        setPermissions(userPerms);
        setShowAddEdit(true);
    }, []);

    // Handle role change and automatically apply default permissions
    const handleRoleChange = useCallback((role: UserRole) => {
        setFormData(prev => ({ ...prev, role }));
        const defaults = getDefaultPermissions(role);
        setPermissions(defaults);
        toast(`تم تطبيق الصلاحيات الافتراضية لدور: ${getRoleLabel(role)}`, "info");
    }, [toast]);

    // Handler to toggle boolean permissions
    const togglePermission = useCallback((path: string) => {
        setPermissions(prev => {
            const updated = { ...prev } as any;
            const parts = path.split(".");
            
            if (parts.length === 1) {
                updated[parts[0]] = !updated[parts[0]];
            } else if (parts.length === 2) {
                if (!updated[parts[0]]) updated[parts[0]] = {};
                updated[parts[0]] = {
                    ...updated[parts[0]],
                    [parts[1]]: !updated[parts[0]][parts[1]]
                };
            }
            return updated;
        });
    }, []);

    // Set all permissions to true or false for selected user
    const toggleAllPermissions = useCallback((grant: boolean) => {
        const fullPerms = getDefaultPermissions("ADMIN"); // Admin has everything set to true
        const clearedPerms = Object.keys(fullPerms).reduce((acc: any, key: string) => {
            const val = (fullPerms as any)[key];
            if (typeof val === "boolean") {
                acc[key] = grant;
            } else if (typeof val === "object") {
                acc[key] = Object.keys(val).reduce((subAcc: any, subKey: string) => {
                    subAcc[subKey] = grant;
                    return subAcc;
                }, {});
            }
            return acc;
        }, {} as CustomPermissions);
        
        setPermissions(clearedPerms);
        toast(grant ? "تم تفعيل كافة الصلاحيات" : "تم إلغاء تفعيل كافة الصلاحيات", grant ? "success" : "info");
    }, [toast]);

    const handleSave = useCallback(async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast("يرجى ملء جميع الحقول المطلوبة (*)", "error");
            return;
        }

        setIsSaving(true);
        try {
            const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
            const method = selectedUser ? "PATCH" : "POST";

            let finalFormData = { ...formData };
            if (!selectedUser && !formData.password) {
                // Generate simple initial password
                finalFormData.password = Math.random().toString(36).slice(-8) + "A1!";
            }

            const body = selectedUser
                ? { 
                    name: finalFormData.name, 
                    email: finalFormData.email, 
                    role: finalFormData.role, 
                    active: finalFormData.active,
                    permissions: permissions 
                  }
                : { 
                    ...finalFormData,
                    permissions: permissions 
                  };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast(selectedUser ? "تم تحديث بيانات المستخدم بنجاح" : "تم إضافة المستخدم الجديد بنجاح", "success");
                setShowAddEdit(false);
                fetchUsers();
            } else {
                const error = await res.json();
                toast(error.error || "حدث خطأ أثناء حفظ البيانات", "error");
            }
        } catch (error) {
            console.error(error);
            toast("فشل الاتصال بالخادم", "error");
        } finally {
            setIsSaving(false);
        }
    }, [formData, selectedUser, permissions, fetchUsers, toast]);

    const handleDelete = useCallback(async (user: User) => {
        if (user.id === session?.user.id) {
            toast("لا يمكنك حذف حسابك الشخصي!", "error");
            return;
        }

        const confirmText = `هل أنت متأكد تماماً من حذف حساب المستخدم: "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء وسيتم إلغاء كافة صلاحيات الوصول الخاصة به فوراً.`;
        if (!confirm(confirmText)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast("تم حذف حساب المستخدم بنجاح", "success");
                fetchUsers();
            } else {
                const error = await res.json();
                toast(error.error || "فشل حذف المستخدم", "error");
            }
        } catch (error) {
            console.error(error);
            toast("حدث خطأ غير متوقع", "error");
        }
    }, [session, fetchUsers, toast]);

    const handleResetPassword = useCallback(async (user: User) => {
        const confirmText = `هل ترغب في إعادة تعيين كلمة مرور المستخدم: "${user.name}"؟ سيقوم النظام بتوليد كلمة مرور مؤقتة عشوائية قوية وسيتم إلزام المستخدم بتغييرها فور تسجيل دخوله التالي.`;
        if (!confirm(confirmText)) return;

        setIsResetting(true);
        setSelectedUser(user);
        try {
            const res = await fetch(`/api/users/${user.id}/reset-password`, {
                method: "POST",
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedPassword(data.tempPassword);
                setCopied(false);
                setShowResetModal(true);
            } else {
                const error = await res.json();
                toast(error.error || "فشل إعادة تعيين كلمة المرور", "error");
            }
        } catch (error) {
            console.error(error);
            toast("حدث خطأ في الاتصال بالخادم", "error");
        } finally {
            setIsResetting(false);
        }
    }, [toast]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedPassword);
        setCopied(true);
        toast("تم نسخ كلمة المرور إلى الحافظة!", "success");
        setTimeout(() => setCopied(false), 2000);
    }, [generatedPassword, toast]);

    const updateFormField = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Statistics count
    const totalUsersCount = users.length;
    const activeUsersCount = users.filter(u => u.active).length;
    const adminCount = users.filter(u => u.role === "ADMIN").length;
    const staffCount = totalUsersCount - adminCount;

    // Filtered users
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRoleLabel(u.role).includes(searchTerm)
    );

    return {
        users,
        loading,
        searchTerm,
        setSearchTerm,
        showAddEdit,
        setShowAddEdit,
        showResetModal,
        setShowResetModal,
        selectedUser,
        setSelectedUser,
        generatedPassword,
        copied,
        formData,
        permissions,
        isSaving,
        isResetting,
        fetchUsers,
        handleAdd,
        handleEdit,
        handleRoleChange,
        togglePermission,
        toggleAllPermissions,
        handleSave,
        handleDelete,
        handleResetPassword,
        handleCopy,
        updateFormField,
        stats: {
            total: totalUsersCount,
            active: activeUsersCount,
            admins: adminCount,
            staff: staffCount
        },
        filteredUsers
    };
}
