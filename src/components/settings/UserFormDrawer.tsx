"use client";

import { User } from "@/hooks/settings/useSettingsManagement";
import { CustomPermissions, getAllRoles, UserRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
    Save, Plus, Shield, Users, ShieldCheck, Lock, AlertTriangle, KeyRound, Loader2, Landmark, Ticket, Mail, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserFormDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedUser: User | null;
    formData: {
        name: string;
        email: string;
        password?: string;
        role: UserRole;
        active: boolean;
    };
    permissions: CustomPermissions;
    isSaving: boolean;
    updateFormField: (field: string, value: any) => void;
    handleRoleChange: (role: UserRole) => void;
    togglePermission: (path: string) => void;
    toggleAllPermissions: (grant: boolean) => void;
    handleSave: () => void;
};

export function UserFormDrawer({
    open,
    onOpenChange,
    selectedUser,
    formData,
    permissions,
    isSaving,
    updateFormField,
    handleRoleChange,
    togglePermission,
    toggleAllPermissions,
    handleSave
}: UserFormDrawerProps) {
    
    const generateRandomPass = () => {
        const randomPass = Math.random().toString(36).slice(-8) + "A1!";
        updateFormField("password", randomPass);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-50 p-0 text-right" dir="rtl">
                
                {/* Header Gradient */}
                <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-700 text-white p-6 relative border-b border-slate-700">
                    <SheetHeader className="space-y-1">
                        <SheetTitle className="text-xl font-black text-white">
                            {selectedUser ? "تعديل حساب وصلاحيات الموظف" : "إضافة حساب موظف جديد للنظام"}
                        </SheetTitle>
                        <SheetDescription className="text-slate-300 text-xs">
                            {selectedUser 
                                ? `تعديل المظهر العام ومستويات الوصول للمستخدم: ${selectedUser.name}` 
                                : "أدخل بيانات الموظف الجديد وحدد له مصفوفة الصلاحيات المخصصة بدقة"
                            }
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-slate-200 bg-white p-0">
                        <TabsTrigger 
                            value="account" 
                            className="py-3 font-bold text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-650"
                        >
                            معلومات الحساب الأساسية
                        </TabsTrigger>
                        <TabsTrigger 
                            value="permissions" 
                            className="py-3 font-bold text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-650"
                        >
                            مصفوفة الصلاحيات التفصيلية
                        </TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="account" className="p-6 space-y-6 mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">البيانات الشخصية والمسؤولية</h3>
                            
                            <div className="space-y-4 text-xs font-semibold text-slate-700">
                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label className="font-bold text-slate-800">الاسم الكامل للموظف *</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => updateFormField("name", e.target.value)}
                                        className="text-right border-slate-200 focus-visible:ring-indigo-500 rounded-xl h-10 text-xs"
                                        placeholder="مثال: صالح أحمد اليافعي"
                                    />
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="font-bold text-slate-800">البريد الإلكتروني المهني *</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormField("email", e.target.value)}
                                        className="text-left border-slate-200 focus-visible:ring-indigo-500 rounded-xl font-mono text-xs h-10"
                                        placeholder="employee@domain.com"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Role Selector */}
                                <div className="space-y-1.5 text-right">
                                    <label className="font-bold text-slate-800">الدور والمسؤولية الوظيفية *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                                        className="w-full text-xs font-bold text-slate-700 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white h-10 cursor-pointer"
                                    >
                                        {getAllRoles().map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-bold block mt-1 leading-normal">
                                        💡 تنبيه: تغيير الدور سيقوم بإعادة تعيين الصلاحيات المخصصة تلقائياً لقيم هذا الدور الافتراضية لمنع الأخطاء.
                                    </p>
                                </div>

                                {/* Password Field (Only for New Users) */}
                                {!selectedUser && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={generateRandomPass}
                                                className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                توليد كلمة مرور مؤقتة
                                            </button>
                                            <label className="font-bold text-slate-800">كلمة المرور الابتدائية</label>
                                        </div>
                                        <Input
                                            type="text"
                                            value={formData.password || ""}
                                            onChange={(e) => updateFormField("password", e.target.value)}
                                            className="text-left border-slate-200 focus-visible:ring-indigo-500 rounded-xl font-mono text-xs h-10"
                                            placeholder="أدخل كلمة مرور أو اضغط توليد مؤقت"
                                            dir="ltr"
                                        />
                                        <p className="text-[10px] text-slate-400 block mt-1 font-bold leading-normal">
                                            سيلزم النظام الموظف الجديد بإنشاء كلمة سر شخصية خاصة به فور تسجيل دخوله الأول كإجراء حمائي.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activation State switch */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">أمان وحالة الحساب</h3>
                            
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100/80">
                                <div className="text-right space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">تنشيط وصلاحية الحساب للولوج</p>
                                    <p className="text-[10px] text-slate-400 font-bold leading-normal">عند إلغاء التنشيط، سيتم حظر الموظف من تسجيل الدخول نهائياً.</p>
                                </div>
                                <Switch
                                    checked={formData.active}
                                    onCheckedChange={(checked) => updateFormField("active", checked)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Interactive Permissions Tab */}
                    <TabsContent value="permissions" className="p-6 space-y-6 mt-0 focus-visible:outline-none focus-visible:ring-0">
                        {/* Custom Control Banner */}
                        <div className="bg-indigo-50/50 border-r-4 border-indigo-650 rounded-l-xl p-4 flex justify-between items-center text-slate-800">
                            <div className="text-right space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-800">تعديل مصفوفة الصلاحيات المخصصة</h4>
                                <p className="text-[10px] text-slate-500 leading-normal">يمكنك الآن تخصيص صلاحيات هذا الموظف بدقة واستثنائه من القواعد الافتراضية لدوره.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm"
                                    onClick={() => toggleAllPermissions(true)} 
                                    className="text-[10px] h-8 bg-white border border-indigo-100 hover:bg-indigo-50/80 rounded-xl text-indigo-700 font-bold transition-all shadow-sm"
                                >
                                    منح الكل
                                </Button>
                                <Button 
                                    size="sm"
                                    onClick={() => toggleAllPermissions(false)} 
                                    className="text-[10px] h-8 bg-white border border-indigo-100 hover:bg-indigo-50/80 rounded-xl text-indigo-700 font-bold transition-all shadow-sm"
                                >
                                    حظر الكل
                                </Button>
                            </div>
                        </div>

                        {/* List of Permissions Grouped by Component */}
                        <div className="space-y-5">
                            
                            {/* APPLICANTS */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <Users className="h-4.5 w-4.5 text-indigo-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">إدارة ملفات المتقدمين (Applicants)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { path: "applicants.view", label: "عرض قوائم وبيانات المتقدمين" },
                                        { path: "applicants.create", label: "إنشاء طلب متقدم جديد" },
                                        { path: "applicants.actions", label: "ولوج مركز الإجراءات (الرسوم والنقل)" },
                                        { path: "applicants.adminView", label: "الاطلاع على الملف المالي والإداري" },
                                        { path: "applicants.delete", label: "حذف ملف متقدم نهائياً" },
                                    ].map((perm) => (
                                        <div key={perm.path} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="text-xs text-slate-700 ml-3">{perm.label}</span>
                                            <Switch
                                                checked={!!(permissions.applicants as any)?.[perm.path.split(".")[1]]}
                                                onCheckedChange={() => togglePermission(perm.path)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MOCK EXAMS */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">نظام الاختبارات التجريبية (Mock Exams)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { path: "mockExams.access", label: "ولوج صفحة الاختبارات العامة" },
                                        { path: "mockExams.sessions", label: "إدارة جلسات الاختبار والنتائج" },
                                        { path: "mockExams.professions", label: "إدارة المهن والتخصصات المطابقة" },
                                        { path: "mockExams.questions", label: "التحكم ببنك الأسئلة والمحاور" },
                                        { path: "mockExams.manageActions", label: "منح محاولات إضافية أو الحظر" },
                                    ].map((perm) => (
                                        <div key={perm.path} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="text-xs text-slate-700 ml-3">{perm.label}</span>
                                            <Switch
                                                checked={!!(permissions.mockExams as any)?.[perm.path.split(".")[1]]}
                                                onCheckedChange={() => togglePermission(perm.path)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TRANSPORT */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <Lock className="h-4.5 w-4.5 text-amber-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">إدارة وجدولة النقل البري (Transport)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { path: "transport.access", label: "الولوج لصفحة النقل العام" },
                                        { path: "transport.schedule", label: "جدولة وتسيير الرحلات اليومية" },
                                        { path: "transport.destinations", label: "إضافة وتعديل المدن والوجهات" },
                                        { path: "transport.routes", label: "التحكم بالمسارات ومحطات التوقف" },
                                        { path: "transport.pricing", label: "تسعير التذاكر ذهاباً وإياباً" },
                                        { path: "transport.rules", label: "قواعد الخصم والتسعير الديناميكي" },
                                        { path: "transport.templates", label: "إعداد قوالب الرحلات المكررة" },
                                    ].map((perm) => (
                                        <div key={perm.path} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="text-xs text-slate-700 ml-3">{perm.label}</span>
                                            <Switch
                                                checked={!!(permissions.transport as any)?.[perm.path.split(".")[1]]}
                                                onCheckedChange={() => togglePermission(perm.path)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PRICING & POLICIES */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <Landmark className="h-4.5 w-4.5 text-indigo-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">إعدادات الرسوم والأسعار والسياسات (Pricing)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { path: "pricing.access", label: "الولوج لصفحة تسعير الرسوم والخدمات" },
                                        { path: "pricing.locations", label: "تهيئة المواقع الجغرافية ومراكز القياس" },
                                        { path: "pricing.services", label: "إدارة الباقات والرسوم التأسيسية" },
                                        { path: "pricing.policies", label: "إدارة السياسات وقواعد الغرامات" },
                                        { path: "pricing.mockPackages", label: "إدارة باقات الاختبارات التجريبية" },
                                    ].map((perm) => (
                                        <div key={perm.path} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="text-xs text-slate-700 ml-3">{perm.label}</span>
                                            <Switch
                                                checked={!!(permissions.pricing as any)?.[perm.path.split(".")[1]]}
                                                onCheckedChange={() => togglePermission(perm.path)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FINANCIAL & SYSTEM NODES */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <Shield className="h-4.5 w-4.5 text-indigo-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">الأنظمة الإضافية والأمان</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { path: "accounting", label: "ولوج شاشة المالية والحسابات والمحافظ" },
                                        { path: "vouchers", label: "الولوج لصفحة القسائم وأكواد الخصم والتعويض" },
                                        { path: "messaging", label: "نظام التراسل والإشعارات والرسائل النصية" },
                                        { path: "settings", label: "إدارة إعدادات النظام وإضافة المستخدمين" },
                                    ].map((perm) => (
                                        <div key={perm.path} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="text-xs text-slate-700 ml-3">{perm.label}</span>
                                            <Switch
                                                checked={!!(permissions as any)?.[perm.path]}
                                                onCheckedChange={() => togglePermission(perm.path)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </TabsContent>
                </Tabs>

                {/* Sticky Drawer Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-150 p-4 flex gap-2 justify-end shadow-lg z-50">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl text-xs h-10 gap-2 shadow-md shadow-indigo-100"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري حفظ البيانات...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {selectedUser ? "تحديث حساب الموظف" : "حفظ الحساب وتنشيطه"}
                            </>
                        )}
                    </Button>
                    <Button 
                        onClick={() => onOpenChange(false)} 
                        variant="outline" 
                        className="px-6 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs h-10 text-slate-500"
                    >
                        إلغاء
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
