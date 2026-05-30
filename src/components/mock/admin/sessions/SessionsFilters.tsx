/**
 * @file SessionsFilters.tsx
 * @description مكون فلاتر تصفية والبحث في الجلسات (SessionsFilters).
 * يعزل فلاتر المشتبه بهم وحقل البحث الذكي عن الكود الكلي لتسهيل الاستخدام والتخصيص البصري.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuspicionFilterType } from "@/hooks/mock-exams/useMockExamsSessions";

interface FiltersProps {
    suspicionFilter: SuspicionFilterType;
    setSuspicionFilter: (filter: SuspicionFilterType) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    suspiciousCount: number;
    criticalCount: number;
}

export function SessionsFilters({
    suspicionFilter,
    setSuspicionFilter,
    searchTerm,
    setSearchTerm,
    suspiciousCount,
    criticalCount
}: FiltersProps) {
    const filterOptions = [
        { key: "ALL" as const, label: "عرض الكل", color: "" },
        { key: "ANY" as const, label: "⚠️ مشبوه", color: "text-orange-600 hover:bg-orange-50/50" },
        { key: "CRITICAL" as const, label: "🔴 خطير", color: "text-red-600 hover:bg-red-50/50" },
    ];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full" dir="rtl">
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                {/* أزرار تصفية مستويات الاشتباه */}
                <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-xl p-1 shadow-sm">
                    {filterOptions.map(f => (
                        <Button 
                            key={f.key}
                            variant={suspicionFilter === f.key ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSuspicionFilter(f.key)}
                            className={`text-xs h-8 px-3 rounded-lg font-bold transition-all duration-200 ${
                                suspicionFilter === f.key 
                                    ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800" 
                                    : f.color
                            }`}
                        >
                            {f.label}
                            {f.key === "ANY" && suspiciousCount > 0 && (
                                <span className="mr-1.5 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                                    {suspiciousCount}
                                </span>
                            )}
                            {f.key === "CRITICAL" && criticalCount > 0 && (
                                <span className="mr-1.5 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                                    {criticalCount}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* حقل البحث بالاسم والـ IP والرقم */}
            <div className="relative w-full md:w-72 shadow-sm rounded-xl overflow-hidden">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="بحث بالاسم، الرقم، أو IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9 border-gray-200 focus:border-slate-400 bg-white placeholder-gray-400 text-xs h-9 transition-colors focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
        </div>
    );
}
