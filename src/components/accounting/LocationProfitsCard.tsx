"use client";

import { Badge } from "@/components/ui/badge";

interface LocationProfit {
    locationId: string;
    locationName: string;
    profitMargin: number | string;
    revenue: number;
    cost: number;
    profit: number;
}

interface LocationProfitsCardProps {
    profitByLocation: LocationProfit[];
}

export function LocationProfitsCard({ profitByLocation }: LocationProfitsCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/40">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">أداء أرباح الفروع والمناطق</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">تحليلات الأرباح الصافية وهوامش أداء مبيعات المناطق.</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {profitByLocation.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">لا تتوفر إحصائيات للمناطق حالياً</div>
                ) : (
                    profitByLocation.map((loc) => {
                        const marginVal = typeof loc.profitMargin === 'string' 
                            ? parseFloat(loc.profitMargin) 
                            : loc.profitMargin;
                        
                        const isHigh = marginVal > 30;
                        const isMedium = marginVal > 15;

                        // Progress bar width (max 100)
                        const barWidth = Math.min(Math.max(marginVal, 0), 100);

                        return (
                            <div key={loc.locationId} className="p-5 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-emerald-600 transition-colors">
                                        {loc.locationName}
                                    </h4>
                                    <Badge 
                                        variant="outline" 
                                        className={`text-[10px] font-bold shrink-0 py-0.5 px-2 rounded-full ${
                                            isHigh 
                                                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" 
                                                : isMedium 
                                                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" 
                                                : "text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                                        }`}
                                    >
                                        هامش {marginVal}%
                                    </Badge>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 mt-3 overflow-hidden shadow-inner border border-slate-100/50 dark:border-slate-900">
                                    <div 
                                        style={{ width: `${barWidth}%` }}
                                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                                            isHigh 
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                                : isMedium 
                                                ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                                                : "bg-gradient-to-r from-rose-500 to-red-500"
                                        }`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 dark:text-slate-500 font-medium">الإيرادات</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{Number(loc.revenue).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 dark:text-slate-500 font-medium">التكاليف</span>
                                        <span className="font-semibold text-rose-500 dark:text-rose-400">{Number(loc.cost).toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-2 pt-2.5 border-t border-dashed border-slate-100 dark:border-slate-800 mt-2 flex justify-between items-baseline text-sm font-bold">
                                        <span className="text-slate-600 dark:text-slate-400 text-xs">الربح الصافي</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                                            {Number(loc.profit).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ر.ي</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
