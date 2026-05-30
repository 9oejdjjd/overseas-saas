"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, UserCheck, XCircle, ChevronDown, ChevronUp, User } from "lucide-react";
import { ManifestTicket } from "@/hooks/manifest/usePassengerManifest";

interface DailyTripSheetProps {
    tickets: ManifestTicket[];
    loading: boolean;
    handleUpdateStatus: (ticketId: string, status: "USED" | "NO_SHOW", name: string) => void;
}

export function DailyTripSheet({ tickets, loading, handleUpdateStatus }: DailyTripSheetProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm print:shadow-none print:border-none p-4 md:p-6 print:p-0 overflow-hidden text-right" dir="rtl">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/70 border-b border-slate-100 print:bg-slate-100">
                        <TableRow>
                            <TableHead className="w-[50px] text-right font-bold text-slate-700">#</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">رقم التذكرة</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">اسم المسافر</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">خط السير</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">الباص / المقعد</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">الجوال والتواصل</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">الحالة</TableHead>
                            <TableHead className="text-center no-print font-bold text-slate-700">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-slate-400 font-bold">جاري تحميل بيانات الركاب...</TableCell>
                            </TableRow>
                        ) : tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-slate-400 text-sm">لا توجد رحلات أو مسافرين مجدولين لهذا اليوم</TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket, index) => {
                                const isExpanded = !!expandedRows[ticket.id];
                                
                                // Premium conditional color classes
                                let rowClass = "";
                                if (ticket.status === 'USED') rowClass = "bg-emerald-50/30 hover:bg-emerald-50/50";
                                else if (ticket.status === 'NO_SHOW') rowClass = "bg-rose-50/30 hover:bg-rose-50/50";
                                
                                return (
                                    <>
                                        {/* Main Traveler Row */}
                                        <TableRow 
                                            key={ticket.id} 
                                            className={`${rowClass} cursor-pointer transition-colors border-b border-slate-100`}
                                            onClick={() => toggleRow(ticket.id)}
                                        >
                                            <TableCell className="font-mono text-slate-400 text-xs font-bold">{index + 1}</TableCell>
                                            <TableCell className="font-mono font-black text-slate-700">{ticket.ticketNumber}</TableCell>
                                            <TableCell>
                                                <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                                    <span>{ticket.applicant.fullName}</span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-3.5 w-3.5 text-slate-400 no-print" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 no-print" />
                                                    )}
                                                </div>
                                                {ticket.applicant.passportNumber && (
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">جواز: {ticket.applicant.passportNumber}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-650">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-blue-700">{ticket.departureLocation}</span>
                                                    <span className="text-slate-350">←</span>
                                                    <span className="text-emerald-700">{ticket.arrivalLocation}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-600 font-mono text-[10px] font-bold">باص: {ticket.busNumber || '?'}</Badge>
                                                    <Badge variant="secondary" className="font-mono text-[10px] font-bold">مقعد: {ticket.seatNumber || '?'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <span dir="ltr" className="text-xs font-mono text-slate-600 font-bold">{ticket.applicant.phone}</span>
                                                    {ticket.applicant.whatsappNumber && (
                                                        <a 
                                                            href={`https://web.whatsapp.com/send?phone=${ticket.applicant.whatsappNumber.replace('+', '')}`} 
                                                            target="whatsapp_chat" 
                                                            rel="noreferrer" 
                                                            className="no-print text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded-lg transition-all duration-300 shadow-sm border border-emerald-100 hover:scale-110"
                                                            title="تواصل مباشر عبر الواتساب"
                                                        >
                                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.89 9.89 0 0 0-6.974-2.879C6.2 3.96 1.777 8.331 1.773 13.76c-.001 1.738.482 3.403 1.397 4.887l-1.013 3.7 3.841-.994zM16.57 14.86c-.27-.135-1.597-.788-1.845-.877-.247-.09-.427-.135-.607.135-.18.27-.697.877-.855 1.057-.157.18-.315.202-.585.067-1.127-.564-1.92-1.02-2.673-2.31-.197-.338.197-.314.563-1.042.06-.12.03-.225-.015-.315-.045-.09-.427-1.02-.585-1.4-.153-.371-.32-.32-.427-.32h-.36c-.18 0-.473.067-.72.338-.247.27-.945.923-.945 2.25 0 1.327.968 2.61 1.103 2.79.135.18 1.905 2.91 4.613 4.077.644.278 1.147.444 1.54.569.647.206 1.236.177 1.701.107.519-.078 1.597-.653 1.822-1.283.225-.63.225-1.17.157-1.283-.067-.113-.247-.18-.517-.315z"/>
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {ticket.status === 'USED' ? (
                                                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold border-none px-3.5 py-1">تم صعود الركوب</Badge>
                                                ) : ticket.status === 'NO_SHOW' ? (
                                                    <Badge variant="destructive" className="rounded-lg font-bold px-3.5 py-1">تخلف عن الحضور</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 rounded-lg px-3.5 py-1 font-bold">حجز مؤكد وساري</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="no-print" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {ticket.status === 'ISSUED' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-lg font-bold text-xs hover:scale-[1.03] active:scale-[0.98] transition-all"
                                                                onClick={() => handleUpdateStatus(ticket.id, "USED", ticket.applicant.fullName)}
                                                            >
                                                                <UserCheck className="h-3.5 w-3.5 ml-0.5" />
                                                                حضور
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8 px-3 gap-1 rounded-lg font-bold text-xs hover:scale-[1.03] transition-all"
                                                                onClick={() => handleUpdateStatus(ticket.id, "NO_SHOW", ticket.applicant.fullName)}
                                                            >
                                                                <XCircle className="h-3.5 w-3.5 ml-0.5" />
                                                                غياب
                                                            </Button>
                                                        </>
                                                    )}
                                                    {ticket.status !== 'ISSUED' && (
                                                        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-md">محدّث ومقفل</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expandable Details Row with Height Transition */}
                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/40 hover:bg-slate-50/40 no-print transition-all">
                                                <TableCell colSpan={8} className="p-5 border-b border-slate-100">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-right pr-6 animate-in slide-in-from-top-2 duration-300">
                                                        {/* Ticket Info Card */}
                                                        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                                                            <h4 className="font-extrabold text-xs text-indigo-700 border-b pb-1.5 mb-2.5 flex items-center gap-1.5">
                                                                <User className="h-4 w-4" /> تفاصيل تذكرة السفر
                                                            </h4>
                                                            <p className="text-slate-600 text-xs"><strong>كود الحجز (PNR):</strong> <span className="font-mono font-bold text-slate-800">{ticket.ticketNumber}</span></p>
                                                            <p className="text-slate-600 text-xs"><strong>مسار الحجز:</strong> <span className="font-bold text-slate-700">{ticket.departureLocation} ➝ {ticket.arrivalLocation}</span></p>
                                                            <p className="text-slate-600 text-xs"><strong>درجة السفر:</strong> <span className="font-bold text-slate-700">حافلة نقل بري</span></p>
                                                        </div>

                                                        {/* Applicant Notes Card */}
                                                        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                                                            <h4 className="font-extrabold text-xs text-indigo-700 border-b pb-1.5 mb-2.5 flex items-center gap-1.5">
                                                                <svg className="h-4 w-4 text-indigo-500 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                                                ملاحظات المسافر الخاصة
                                                            </h4>
                                                            <p className="text-slate-600 text-xs font-bold"><strong>الملاحظات المدرجة:</strong></p>
                                                            <p className="text-slate-500 text-xs leading-relaxed">{ticket.applicant.notes || "لا توجد ملاحظات أو تنبيهات إضافية لهذا المسافر حالياً."}</p>
                                                        </div>

                                                        {/* Contacts and Passport Info */}
                                                        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                                                            <h4 className="font-extrabold text-xs text-indigo-700 border-b pb-1.5 mb-2.5 flex items-center gap-1.5">
                                                                <Phone className="h-4 w-4 text-indigo-500" /> معلومات السفر والمستندات
                                                            </h4>
                                                            <p className="text-slate-600 text-xs"><strong>رقم جواز السفر:</strong> <span className="font-mono font-bold text-slate-800">{ticket.applicant.passportNumber || "غير متوفر"}</span></p>
                                                            <p className="text-slate-600 text-xs"><strong>جوال الواتس اب:</strong> <span className="font-mono font-bold text-slate-700" dir="ltr">{ticket.applicant.whatsappNumber || "-"}</span></p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
