"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { format, isSameDay, addDays } from "date-fns";

type TransportMovementProps = {
    transportStats: {
        totalPassengers: number;
        activeBuses: number;
        routes: Record<string, number>;
    };
    transportDate: Date;
    changeTransportDate: (days: number) => void;
};

export function TransportMovement({
    transportStats,
    transportDate,
    changeTransportDate
}: TransportMovementProps) {
    
    const formattedDateTitle = isSameDay(transportDate, new Date()) 
        ? "اليوم" 
        : isSameDay(transportDate, addDays(new Date(), 1)) 
        ? "غداً" 
        : format(transportDate, 'yyyy-MM-dd');

    const routesList = Object.entries(transportStats.routes);

    return (
        <Card className="shadow-sm border border-slate-100 bg-white">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/20">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1 bg-amber-50 text-amber-600 rounded-lg">
                            <Bus className="h-4 w-4" />
                        </span>
                        حركة خطوط النقل البري
                    </CardTitle>
                </div>
                
                {/* Date Navigation Bar */}
                <div className="flex items-center justify-between bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-800" 
                        onClick={() => changeTransportDate(-1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold w-32 text-center text-slate-700 select-none">
                        {formattedDateTitle}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-800" 
                        onClick={() => changeTransportDate(1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {transportStats.totalPassengers === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                        لا توجد رحلات أو ركاب مجدولين في {formattedDateTitle}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Two quick status badges */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
                                <p className="text-xl font-black text-amber-700 tracking-tight">{transportStats.totalPassengers}</p>
                                <p className="text-[10px] font-bold text-amber-600 mt-0.5">راكب مجدول للسفر</p>
                            </div>
                            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                                <p className="text-xl font-black text-indigo-700 tracking-tight">{transportStats.activeBuses}</p>
                                <p className="text-[10px] font-bold text-indigo-650 mt-0.5">حافلات نقل نشطة</p>
                            </div>
                        </div>

                        {/* Top Routes List */}
                        <div className="space-y-2.5">
                            <p className="text-[10px] font-black text-slate-400 block tracking-wide text-right">أبرز خطوط السير اليومية</p>
                            {routesList.slice(0, 3).map(([route, count]) => (
                                <div 
                                    key={route} 
                                    className="flex justify-between items-center text-xs p-2.5 border border-slate-200/80 rounded-xl hover:bg-slate-50/50 transition-colors"
                                >
                                    <span className="flex items-center gap-2 text-slate-600 font-bold">
                                        <MapPin className="h-3.5 w-3.5 text-slate-450" /> 
                                        {route}
                                    </span>
                                    <Badge 
                                        variant="secondary" 
                                        className="font-mono bg-slate-100 text-slate-700 border-slate-200 font-bold"
                                    >
                                        {count} ركاب
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {/* Deep link button */}
                        <Link href={`/dashboard/transport?date=${format(transportDate, 'yyyy-MM-dd')}`}>
                            <Button 
                                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-10 text-xs shadow-sm flex items-center gap-1.5 justify-center"
                            >
                                <Bus className="h-4 w-4" />
                                عرض الكشوف وتأكيد صعود الرحلات
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
