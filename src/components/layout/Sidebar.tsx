"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    MessageSquare,
    DollarSign,
    LogOut,
    ChevronLeft,
    ChevronRight,
    PieChart,
    Ticket,
    Bus,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "لوحة التحكم", href: "/", icon: LayoutDashboard, permission: null },
    { name: "المتقدمين", href: "/applicants", icon: Users, permission: "VIEW_APPLICANTS" as const },
    {
        name: "إدارة الرحلات",
        href: "/tickets",
        icon: Ticket,
        permission: "VIEW_APPLICANTS" as const,
    },
    {
        name: "كشف الرحلات",
        href: "/transport/manifest",
        icon: Bus,
        permission: "VIEW_APPLICANTS" as const, // Same permission as tickets for now
    },

    {
        name: "المحاسبة",
        href: "/accounting",
        icon: DollarSign,
        permission: "VIEW_ACCOUNTING" as const,
    },
    { name: "الأسعار", href: "/pricing", icon: PieChart, permission: "MANAGE_PRICING" as const },
    { name: "مركز الرسائل", href: "/messaging", icon: MessageSquare, permission: null },
    { name: "قوالب الرسائل", href: "/settings/templates", icon: FileText, permission: null },
    {
        name: "نظام القسائم",
        href: "/vouchers",
        icon: Ticket,
        permission: "VIEW_ACCOUNTING" as const
    },
    {
        name: "الإعدادات",
        href: "/settings",
        icon: Settings,
        permission: "ACCESS_SETTINGS" as const,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);

    const canAccess = (permission: string | null) => {
        if (!permission) return true; // No permission required
        if (!session?.user?.role) return false;
        return hasPermission(session.user.role, permission as any);
    };

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-[#001529] text-gray-300 transition-all duration-300 ease-in-out relative z-20",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-gray-700/50 bg-[#002140]">
                {collapsed ? (
                    <span className="text-xl font-bold text-white">EMS</span>
                ) : (
                    <h1 className="text-lg font-bold text-white tracking-wider">Idurar ERP</h1>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    if (!canAccess(item.permission)) return null;

                    const isActive =
                        pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-sm px-4 py-3 text-sm transition-colors mb-1",
                                isActive
                                    ? "bg-[#1890ff] text-white shadow-md shadow-blue-900/20"
                                    : "hover:text-white hover:bg-[#ffffff1a]",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "ml-3")} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Trigger */}
            <div
                className="absolute -left-3 top-20 bg-white text-[#001529] p-1 rounded-full shadow-md cursor-pointer border border-gray-200 hover:bg-gray-100"
                onClick={() => setCollapsed(!collapsed)}
            >
                {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-700/50">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center w-full text-red-400 hover:text-red-300 hover:bg-[#ffffff1a] rounded-sm py-2 transition-colors",
                        collapsed ? "justify-center" : "px-4"
                    )}
                >
                    <LogOut className={cn("h-5 w-5", collapsed ? "mr-0" : "ml-3")} />
                    {!collapsed && <span>تسجيل خروج</span>}
                </button>
            </div>
        </div>
    );
}
