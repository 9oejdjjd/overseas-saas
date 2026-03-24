"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Calendar as CalendarIcon, Phone, UserCheck, XCircle, Bus, MapPin, Search, CheckCircle2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/simple-toast";

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
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("manifest");

    // --- MANIFEST STATE ---
    const [date, setDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [tickets, setTickets] = useState<ManifestTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- OPERATIONS STATE ---
    const [opSearchQuery, setOpSearchQuery] = useState("");
    const [opSearchResult, setOpSearchResult] = useState<any>(null);
    const [opSearchLoading, setOpSearchLoading] = useState(false);
    const [opUpdateLoading, setOpUpdateLoading] = useState(false);
    const [opError, setOpError] = useState("");


    // ================== MANIFEST FUNCTIONS ==================

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
            toast("فشل تحميل الكشف", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManifest();
    }, [date]);

    // Update from Manifest List
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
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                toast("تم تحديث الحالة بنجاح", "success");
            }
        } catch (error) {
            toast("خطأ في التحديث", "error");
        }
    };

    // Derived stats for Manifest
    const totalPassengers = tickets.length;
    const confirmedUsed = tickets.filter(t => t.status === 'USED').length;
    const noShows = tickets.filter(t => t.status === 'NO_SHOW').length;

    const filteredTickets = tickets.filter(t =>
        t.applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.includes(searchTerm) ||
        (t.busNumber && t.busNumber.includes(searchTerm))
    );


    // ================== OPERATIONS FUNCTIONS ==================

    const handleOpSearch = async () => {
        if (!opSearchQuery) return;
        setOpSearchLoading(true);
        setOpError("");
        setOpSearchResult(null);
        try {
            const res = await fetch(`/api/tickets/search?q=${opSearchQuery}`);
            if (res.ok) {
                setOpSearchResult(await res.json());
            } else {
                setOpError("لم يتم العثور على تذكرة بهذا الرقم");
            }
        } catch (e) { setOpError("حدث خطأ في النظام"); }
        setOpSearchLoading(false);
    };

    const updateOpTicketStatus = async (status: string) => {
        if (!opSearchResult) return;
        setOpUpdateLoading(true);
        try {
            const res = await fetch(`/api/tickets/${opSearchResult.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setOpSearchResult({ ...opSearchResult, status });
                toast("تم تحديث حالة التذكرة", "success");
                // Optional: Refresh manifest if date matches?
                if (activeTab === 'manifest') fetchManifest();
            }
        } catch (e) {
            console.error(e);
            toast("فشل تحديث التذكرة", "error");
        }
        setOpUpdateLoading(false);
    };


    return (
        <div className="p-6 space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bus className="h-6 w-6 text-blue-600" />
                        إدارة النقل والرحلات
                    </h1>
                    <p className="text-gray-500 text-sm">إدارة كشوفات الركاب، تأكيد الحضور، ومعالجة التذاكر</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="no-print">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="manifest">كشف الرحلات اليومي</TabsTrigger>
                        <TabsTrigger value="operations">البحث والمدقق الذكي</TabsTrigger>
                    </TabsList>
                </div>

                {/* =====================================================================================
                                                    MANIFEST TAB
                   ===================================================================================== */}
                <TabsContent value="manifest" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">تاريخ الرحلة:</span>
                            <div className="flex items-center gap-2 bg-gray-50 border p-1 px-3 rounded-md">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    className="border-none shadow-none h-8 w-32 outline-none focus:ring-0 px-0 bg-transparent"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => fetchManifest()}>تحديث</Button>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="بحث في الكشف..."
                                    className="pr-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={handlePrint} size="sm" className="gap-2 bg-slate-800 hover:bg-slate-700">
                                <Printer className="h-4 w-4" />
                                طباعة
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                        <Card className="bg-white shadow-sm">
                            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-gray-500">إجمالي الحجوزات</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-bold">{totalPassengers}</CardContent>
                        </Card>
                        <Card className="bg-white border-green-100 shadow-sm">
                            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-green-600">تم الحضور (Used)</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-bold text-green-700">{confirmedUsed}</CardContent>
                        </Card>
                        <Card className="bg-white border-red-100 shadow-sm">
                            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-red-600">تخلف عن السفر (No Show)</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-2xl font-bold text-red-700">{noShows}</CardContent>
                        </Card>
                    </div>

                    {/* TICKET TABLE (PRINTABLE AREA) */}
                    <div className="bg-white rounded-lg border shadow-sm print:shadow-none print:border-none p-4 md:p-6 print:p-0 overflow-hidden">
                        {/* Print Header */}
                        <div className="hidden print:flex flex-col items-center mb-8 border-b pb-4">
                            <div className="text-2xl font-bold mb-2">كشف رحلات الركاب</div>
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
                                        <TableRow><TableCell colSpan={8} className="text-center h-24 text-gray-500">لا توجد رحلات لهذا اليوم (أو لا تطابق البحث)</TableCell></TableRow>
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
                </TabsContent>


                {/* =====================================================================================
                                                    OPERATIONS TAB
                   ===================================================================================== */}
                <TabsContent value="operations">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Search Section */}
                        <Card className="md:col-span-1 h-fit shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">المدقق الذكي</CardTitle>
                                <CardDescription>ابحث عن التذكرة لتغيير حالتها</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="رقم التذكرة أو كود (PNR)"
                                        className="pr-9"
                                        value={opSearchQuery}
                                        onChange={(e) => setOpSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleOpSearch()}
                                    />
                                </div>
                                <Button onClick={handleOpSearch} disabled={opSearchLoading} className="w-full">
                                    {opSearchLoading ? "جاري البحث..." : "بحث"}
                                </Button>
                                {opError && <p className="text-sm text-red-500 mt-2 bg-red-50 p-2 rounded">{opError}</p>}
                            </CardContent>
                        </Card>

                        {/* Result Section */}
                        <div className="md:col-span-2">
                            {opSearchResult ? (
                                <Card className="border-t-4 border-t-blue-500 shadow-md">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl mb-1">{opSearchResult.applicant?.fullName}</CardTitle>
                                                <CardDescription className="font-mono">{opSearchResult.ticketNumber}</CardDescription>
                                            </div>
                                            <Badge className="text-base px-3 py-1" variant={opSearchResult.status === "USED" ? "secondary" : opSearchResult.status === "CANCELLED" ? "destructive" : "default"}>
                                                {opSearchResult.status === "USED" ? "تم الاستخدام (سافر)" :
                                                    opSearchResult.status === "NO_SHOW" ? "تخلف عن السفر" :
                                                        opSearchResult.status === "CANCELLED" ? "ملغاة" : "نشطة (محجوزة)"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 text-xs">من</span>
                                                <div className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {opSearchResult.departureLocation}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 text-xs">إلى</span>
                                                <div className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {opSearchResult.arrivalLocation}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 text-xs">التاريخ</span>
                                                <div className="font-medium flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {new Date(opSearchResult.departureDate).toLocaleDateString("ar-EG")}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 text-xs">الهاتف</span>
                                                <div className="font-medium flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" /> {opSearchResult.applicant?.phone}</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-medium mb-3 text-gray-500">الإجراءات المتاحة</h4>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 h-10"
                                                    onClick={() => updateOpTicketStatus("USED")}
                                                    disabled={opUpdateLoading || opSearchResult.status === "USED" || opSearchResult.status === "CANCELLED"}
                                                >
                                                    <CheckCircle2 className="h-5 w-5 ml-2" />
                                                    تأكيد الصعود (سافر)
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 h-10"
                                                    onClick={() => updateOpTicketStatus("NO_SHOW")}
                                                    disabled={opUpdateLoading || opSearchResult.status === "NO_SHOW" || opSearchResult.status === "CANCELLED"}
                                                >
                                                    <XCircle className="h-5 w-5 ml-2" />
                                                    تسجيل تخلف (No Show)
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-gray-300 bg-gray-50/50">
                                    <User className="h-16 w-16 mb-4 opacity-20" />
                                    <p>استخدم البحث للوصول لتذكرة معينة</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0; }
                    .no-print { display: none !important; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    nav, aside { display: none !important; }
                    /* Ensure badges print correctly */
                    .bg-green-600 { background-color: #16a34a !important; color: white !important; }
                    .bg-red-50 { background-color: #fef2f2 !important; }
                    .bg-green-50 { background-color: #f0fdf4 !important; }
                }
            `}</style>
        </div>
    );
}
