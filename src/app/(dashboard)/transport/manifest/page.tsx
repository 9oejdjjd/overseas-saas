"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Calendar as CalendarIcon, Phone, UserCheck, XCircle, Bus, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ManifestTicket {
    id: string;
    ticketNumber: string;
    busNumber: string;
    seatNumber: string;
    departureLocation: string;
    arrivalLocation: string;
    departureDate: string;
    status: string;
    applicant: {
        id: string;
        fullName: string;
        phone: string;
        whatsappNumber: string;
        passportNumber?: string;
        notes?: string;
    };
}

export default function TransportManifestPage() {
    const [date, setDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [tickets, setTickets] = useState<ManifestTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Native print handler
    const handlePrint = () => {
        window.print();
    };

    const fetchManifest = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transport/manifest?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManifest();
    }, [date]);

    const handleUpdateStatus = async (ticketId: string, newStatus: "USED" | "NO_SHOW", applicantName: string) => {
        const actionText = newStatus === "USED" ? "تأكيد الحضور" : "تسجيل غياب (مع خصم الغرامة)";
        if (!confirm(`هل أنت متأكد من ${actionText} للمسافر: ${applicantName}؟`)) return;

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, updateUsage: true })
            });

            if (res.ok) {
                // Optimistic update
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                alert("تم تحديث الحالة بنجاح");
            }
        } catch (error) {
            alert("خطأ في التحديث");
        }
    };

    // Derived stats
    const totalPassengers = tickets.length;
    const confirmedUsed = tickets.filter(t => t.status === 'USED').length;
    const noShows = tickets.filter(t => t.status === 'NO_SHOW').length;

    // Filter logic
    const filteredTickets = tickets.filter(t =>
        t.applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.includes(searchTerm) ||
        (t.busNumber && t.busNumber.includes(searchTerm))
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bus className="h-6 w-6 text-blue-600" />
                        كشف حركة الركاب اليومي
                    </h1>
                    <p className="text-gray-500 text-sm">إدارة الحضور والغياب وكشوفات السائقين</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border p-1 px-3 rounded-md shadow-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <Input
                            type="date"
                            className="border-none shadow-none h-8 w-32 outline-none focus:ring-0 px-0"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <Button variant="outline" onClick={() => fetchManifest()}>تحديث</Button>

                    <Button onClick={handlePrint} className="gap-2 bg-slate-800 hover:bg-slate-700">
                        <Printer className="h-4 w-4" />
                        طباعة الكشف
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                <Card className="bg-white">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-gray-500">إجمالي الحجوزات</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">{totalPassengers}</CardContent>
                </Card>
                <Card className="bg-white border-green-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-green-600">تم الحضور (Used)</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-green-700">{confirmedUsed}</CardContent>
                </Card>
                <Card className="bg-white border-red-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-red-600">تخلف عن السفر (No Show)</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-red-700">{noShows}</CardContent>
                </Card>
                <Card className="bg-white border-blue-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-blue-600">المقاعد الشاغرة (تقديري)</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-700">--</CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="md:w-1/3 no-print">
                <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="بحث باسم مسافر، رقم تذكرة، لوحة الباص..."
                        className="pr-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TICKET TABLE (PRINTABLE AREA) */}
            <div className="bg-white rounded-lg border shadow-sm print:shadow-none print:border-none p-4 md:p-6 print:p-0 overflow-hidden">
                {/* Print Header */}
                <div className="hidden print:flex flex-col items-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold mb-2">كشف رحلات الركاب</h1>
                    <div className="flex gap-8 text-lg">
                        <span>التاريخ: {date}</span>
                        <span>إجمالي الركاب: {totalPassengers}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 print:bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px] text-right">#</TableHead>
                                <TableHead className="text-right">رقم التذكرة</TableHead>
                                <TableHead className="text-right">اسم المسافر</TableHead>
                                <TableHead className="text-right">خط السير</TableHead>
                                <TableHead className="text-right">الباص / المقعد</TableHead>
                                <TableHead className="text-right">الجوال / التواصل</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-center no-print">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center h-24">جاري تحميل البيانات...</TableCell></TableRow>
                            ) : filteredTickets.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center h-24 text-gray-500">لا توجد رحلات لهذا اليوم</TableCell></TableRow>
                            ) : (
                                filteredTickets.map((ticket, index) => (
                                    <TableRow key={ticket.id} className={
                                        ticket.status === 'NO_SHOW' ? 'bg-red-50' :
                                            ticket.status === 'USED' ? 'bg-green-50' : ''
                                    }>
                                        <TableCell className="font-mono text-gray-500">{index + 1}</TableCell>
                                        <TableCell className="font-mono font-bold">{ticket.ticketNumber}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{ticket.applicant.fullName}</div>
                                            {ticket.applicant.passportNumber && <div className="text-xs text-gray-500">{ticket.applicant.passportNumber}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-gray-400" />
                                                {ticket.departureLocation} ➝ {ticket.arrivalLocation}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="ml-1">{ticket.busNumber || '?'}</Badge>
                                            <Badge variant="secondary">{ticket.seatNumber || '?'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span dir="ltr" className="text-sm font-mono">{ticket.applicant.phone}</span>
                                                <a href={`https://web.whatsapp.com/send?phone=${ticket.applicant.whatsappNumber?.replace('+', '')}`} target="whatsapp_chat" rel="noreferrer" className="no-print text-green-600 hover:bg-green-50 p-1 rounded">
                                                    <Phone className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.status === 'USED' ? <Badge className="bg-green-600">تم السفر</Badge> :
                                                ticket.status === 'NO_SHOW' ? <Badge variant="destructive">لم يحضر</Badge> :
                                                    <Badge variant="outline" className="text-gray-500">حجز مؤكد</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="no-print">
                                            <div className="flex items-center justify-center gap-1">
                                                {ticket.status === 'ISSUED' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-2 bg-green-600 hover:bg-green-700 gap-1"
                                                            onClick={() => handleUpdateStatus(ticket.id, "USED", ticket.applicant.fullName)}
                                                        >
                                                            <UserCheck className="h-3 w-3" />
                                                            حضور
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-7 px-2 gap-1"
                                                            onClick={() => handleUpdateStatus(ticket.id, "NO_SHOW", ticket.applicant.fullName)}
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            غياب
                                                        </Button>
                                                    </>
                                                )}
                                                {ticket.status !== 'ISSUED' && (
                                                    <span className="text-xs text-gray-400">تم التحديث</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Print Footer */}
                <div className="mt-8 pt-4 border-t hidden print:flex justify-between text-sm text-gray-500">
                    <div>توقيع السائق: _________________</div>
                    <div>توقيع المسؤول: _________________</div>
                    <div>تمت الطباعة بتاريخ: {new Date().toLocaleString('ar-SA')}</div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    .no-print { display: none !important; }
                    body { background: white; }
                    /* Ensure badges print correctly */
                    .bg-green-600 { background-color: #16a34a !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-red-50 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
                    .bg-green-50 { background-color: #f0fdf4 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
