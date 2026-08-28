"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSettingsManagement } from "@/hooks/settings/useSettingsManagement";
import { SettingsStats } from "@/components/settings/SettingsStats";
import { UsersList } from "@/components/settings/UsersList";
import { UserFormDrawer } from "@/components/settings/UserFormDrawer";
import { PasswordResetDialog } from "@/components/settings/PasswordResetDialog";
import { Button } from "@/components/ui/button";
import { Shield, Plus, ShieldAlert, Loader2 } from "lucide-react";

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-slate-100 rounded-3xl shadow-sm w-full animate-in fade-in-50" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <ShieldAlert className="w-8 h-8 text-red-650" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed">
                ليس لديك الصلاحيات الكافية للوصول إلى لوحة إدارة المستخدمين والصلاحيات. يرجى مراجعة مدير النظام للحصول على الصلاحيات المطلوبة.
            </p>
        </div>
    );
}

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const {
        users,
        loading,
        searchTerm,
        setSearchTerm,
        showAddEdit,
        setShowAddEdit,
        showResetModal,
        setShowResetModal,
        selectedUser,
        generatedPassword,
        copied,
        formData,
        permissions,
        isSaving,
        isResetting,
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
        stats,
        filteredUsers
    } = useSettingsManagement();

    // Redirect non-admins to dashboard
    useEffect(() => {
        if (status === "authenticated" && session?.user.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-400 font-bold animate-pulse">جاري التحقق من الهوية وصلاحيات الولوج...</p>
            </div>
        );
    }

    if (!session || session.user.role !== "ADMIN") {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-400 font-bold animate-pulse">جاري تحميل مصفوفة الأمان والمستخدمين...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto text-right animate-in fade-in-50 duration-500 pb-12" dir="rtl">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="h-7 w-7 text-indigo-600" />
                        إدارة المستخدمين والمشرفين والصلاحيات
                    </h1>
                    <p className="text-slate-500 text-xs">
                        تعديل وإضافة مستخدمي النظام وتخصيص صلاحيات وصولهم الدقيقة ومصفوفة أمان التطبيق.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleAdd}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 shadow-md shadow-indigo-100 gap-2 text-xs"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة حساب موظف جديد
                    </Button>
                </div>
            </div>

            {/* Statistics KPIs */}
            <SettingsStats stats={stats} />

            {/* Users Data List */}
            <UsersList 
                filteredUsers={filteredUsers}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleEdit={handleEdit}
                handleResetPassword={handleResetPassword}
                handleDelete={handleDelete}
                isResetting={isResetting}
                selectedUser={selectedUser}
                currentUserId={session.user.id}
            />

            {/* Form Sheet Drawer (Add / Edit User) */}
            <UserFormDrawer 
                open={showAddEdit}
                onOpenChange={setShowAddEdit}
                selectedUser={selectedUser}
                formData={formData}
                permissions={permissions}
                isSaving={isSaving}
                updateFormField={updateFormField}
                handleRoleChange={handleRoleChange}
                togglePermission={togglePermission}
                toggleAllPermissions={toggleAllPermissions}
                handleSave={handleSave}
            />

            {/* Password Reset Modal Dialog */}
            <PasswordResetDialog 
                open={showResetModal}
                onOpenChange={setShowResetModal}
                selectedUser={selectedUser}
                generatedPassword={generatedPassword}
                copied={copied}
                handleCopy={handleCopy}
            />

        </div>
    );
}
