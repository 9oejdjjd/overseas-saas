"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Calendar as CalendarIcon, Search } from "lucide-react";

interface PassengerSearchProps {
    date: string;
    setDate: (date: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handlePrint: () => void;
    fetchManifest: () => void;
}

export function PassengerSearch({
    date,
    setDate,
    searchTerm,
    setSearchTerm,
    handlePrint,
    fetchManifest
}: PassengerSearchProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right" dir="rtl">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-extrabold text-slate-700">تاريخ الرحلة والجدول:</span>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-2 px-3 rounded-xl hover:bg-slate-100/50 transition-colors">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <Input
                        type="date"
                        className="border-none shadow-none h-6 w-32 outline-none focus:ring-0 px-0 bg-transparent text-xs text-slate-700 font-bold"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchManifest}
                    className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                    تحديث الكشف
                </Button>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="بحث بالاسم، الباص، أو كود PNR..."
                        className="pr-10 h-9 rounded-xl border-slate-200 text-xs text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                    onClick={handlePrint} 
                    size="sm" 
                    className="gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl text-xs font-bold transition-all"
                >
                    <Printer className="h-4 w-4 ml-1" />
                    طباعة الكشف اليومي
                </Button>
            </div>
        </div>
    );
}
