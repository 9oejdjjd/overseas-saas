"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar as CalendarIcon, Phone, CheckCircle2, XCircle, User } from "lucide-react";

interface SmartAuditorProps {
    opSearchQuery: string;
    setOpSearchQuery: (query: string) => void;
    opSearchResult: any;
    opSearchLoading: boolean;
    opUpdateLoading: boolean;
    opError: string;
    handleOpSearch: () => void;
    updateOpTicketStatus: (status: string) => void;
}

export function SmartAuditor({
    opSearchQuery,
    setOpSearchQuery,
    opSearchResult,
    opSearchLoading,
    opUpdateLoading,
    opError,
    handleOpSearch,
    updateOpTicketStatus
}: SmartAuditorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right" dir="rtl">
            {/* Search Panel */}
            <Card className="md:col-span-1 h-fit shadow-sm border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 p-5 border-b border-slate-100">
                    <CardTitle className="text-base font-extrabold text-slate-800">بوابة المدقق الذكي</CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">ابحث عن كود الحجز أو تذكرة المسافر لمطابقة المستندات وتأكيد حالتها</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                        <Input
                            placeholder="أدخل كود الحجز (PNR) أو رقم التذكرة..."
                            className="pr-10 h-10 rounded-xl border-slate-200 text-xs text-slate-700 font-bold"
                            value={opSearchQuery}
                            onChange={(e) => setOpSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleOpSearch()}
                        />
                    </div>
                    <Button 
                        onClick={handleOpSearch} 
                        disabled={opSearchLoading} 
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-5 text-xs font-bold transition-all shadow"
                    >
                        {opSearchLoading ? "جاري البحث والمطابقة..." : "بحث وتدقيق التذكرة"}
                    </Button>
                    {opError && (
                        <p className="text-xs text-rose-600 font-bold mt-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 animate-in fade-in duration-300">
                            {opError}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Preview Results Panel */}
            <div className="md:col-span-2">
                {opSearchResult ? (
                    <Card className="border-t-4 border-t-blue-600 shadow-md rounded-2xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100/60">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-800 mb-1">{opSearchResult.applicant?.fullName}</CardTitle>
                                    <CardDescription className="font-mono text-xs text-slate-500 font-bold">تذكرة سفر: {opSearchResult.ticketNumber}</CardDescription>
                                </div>
                                <Badge 
                                    className="text-xs px-3 py-1 font-bold border-none rounded-lg" 
                                    variant={
                                        opSearchResult.status === "USED" ? "secondary" : 
                                        opSearchResult.status === "CANCELLED" ? "destructive" : "default"
                                    }
                                >
                                    {opSearchResult.status === "USED" ? "تم الحضور والصعود (مستخدمة)" :
                                        opSearchResult.status === "NO_SHOW" ? "تخلف عن الحضور (No Show)" :
                                        opSearchResult.status === "CANCELLED" ? "تذكرة ملغاة" : "حجز نشط مؤكد"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-400 font-bold text-[10px]">مدينة الانطلاق</span>
                                    <div className="font-extrabold text-slate-700 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-blue-500" /> {opSearchResult.departureLocation}</div>
                                </div>
                                <div className="flex flex-col gap-1 border-r pr-3 sm:border-r-0 sm:pr-0">
                                    <span className="text-slate-400 font-bold text-[10px]">وجهة الوصول</span>
                                    <div className="font-extrabold text-slate-700 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> {opSearchResult.arrivalLocation}</div>
                                </div>
                                <div className="flex flex-col gap-1 border-r pr-3">
                                    <span className="text-slate-400 font-bold text-[10px]">تاريخ الرحلة</span>
                                    <div className="font-extrabold text-slate-700 flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> {new Date(opSearchResult.departureDate).toLocaleDateString("ar-EG")}</div>
                                </div>
                                <div className="flex flex-col gap-1 border-r pr-3">
                                    <span className="text-slate-400 font-bold text-[10px]">جوال التواصل</span>
                                    <div className="font-extrabold text-slate-700 flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5 text-indigo-500" /> {opSearchResult.applicant?.phone}</div>
                                </div>
                            </div>

                            {/* Actions on Searched Ticket */}
                            <div className="pt-5 border-t border-slate-100">
                                <h4 className="text-xs font-bold mb-3.5 text-slate-500">الإجراءات المباشرة للمدقق:</h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250 h-11 rounded-xl text-xs font-bold hover:scale-[1.01] transition-all"
                                        onClick={() => updateOpTicketStatus("USED")}
                                        disabled={opUpdateLoading || opSearchResult.status === "USED" || opSearchResult.status === "CANCELLED"}
                                    >
                                        <CheckCircle2 className="h-4.5 w-4.5 ml-2" />
                                        تأكيد صعود المسافر (سافر)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-250 h-11 rounded-xl text-xs font-bold hover:scale-[1.01] transition-all"
                                        onClick={() => updateOpTicketStatus("NO_SHOW")}
                                        disabled={opUpdateLoading || opSearchResult.status === "NO_SHOW" || opSearchResult.status === "CANCELLED"}
                                    >
                                        <XCircle className="h-4.5 w-4.5 ml-2" />
                                        تسجيل تخلف عن الحضور (No Show)
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-[280px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/30">
                        <User className="h-14 w-14 mb-3 text-slate-300 opacity-80" />
                        <p className="text-xs font-bold">يرجى البحث برقم التذكرة أو كود (PNR) لعرض بطاقة التدقيق والبيانات</p>
                    </div>
                )}
            </div>
        </div>
    );
}
