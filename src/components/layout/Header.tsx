"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
    };

    const getRoleName = (role?: string) => {
        switch (role) {
            case "ADMIN": return "مدير النظام";
            case "REGISTRATION_STAFF": return "مسجل بيانات";
            case "ACCOUNTANT": return "محاسب";
            case "FOLLOW_UP_STAFF": return "متابعة";
            default: return role || "مستخدم";
        }
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        // ... (existing search logic remains same, just ensuring this block is valid)
        if (e.key === "Enter" && searchQuery.trim()) {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/applicants?search=${encodeURIComponent(searchQuery)}`);
                if (!res.ok) {
                    alert(`خطأ في البحث: ${res.status}`);
                    return;
                }
                const results = await res.json();
                if (results && results.error) {
                    alert(`خطأ: ${results.error}`);
                    return;
                }
                if (Array.isArray(results) && results.length > 0) {
                    const exactMatch = results.find(
                        (r) => r.applicantCode?.toLowerCase() === searchQuery.toLowerCase()
                    );
                    const target = exactMatch || results[0];
                    router.push(`/applicants/${target.id}`);
                } else {
                    alert(`لم يتم العثور على متقدم بـ "${searchQuery}"`);
                }
            } catch (error) {
                console.error("Search failed", error);
                alert("خطأ في الاتصال بالخادم");
            } finally {
                setIsSearching(false);
            }
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
            {/* Left: Search */}
            <div className="flex items-center gap-4 w-1/3">
                <div className="relative w-full max-w-md hidden md:block">
                    <Search
                        className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isSearching ? "text-blue-500 animate-pulse" : "text-gray-400"
                            }`}
                    />
                    <input
                        type="text"
                        placeholder="بحث سريع برقم الملف (PNR) أو الاسم..."
                        className="w-full h-9 pr-10 pl-4 rounded-md border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:bg-white transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        disabled={isSearching}
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-semibold text-gray-700">
                                    {session?.user?.name || "جاري التحميل..."}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {getRoleName(session?.user?.role as string)}
                                </p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">الملف الشخصي</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">الإعدادات</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 cursor-pointer"
                            onClick={handleLogout}
                        >
                            تسجيل الخروج
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
