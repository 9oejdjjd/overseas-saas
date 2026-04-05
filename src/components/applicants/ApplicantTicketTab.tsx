
"use client";

import { useRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/simple-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Ticket as TicketIcon, Printer, Download, XCircle, Search, Save, Lock, AlertTriangle, Edit, Settings, Bus, RefreshCw, ArrowRight, MapPin, Clock, Loader2 } from "lucide-react";
import { ExtendedApplicant, Ticket } from "@/types/applicant";
import { PrintableTicketsWrapper } from "@/components/PrintableTicketsWrapper";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface ApplicantTicketTabProps {
    applicant: ExtendedApplicant;
    ticket: Ticket | null;
    onUpdate: () => void;
    viewMode?: "setup" | "admin";
    cancellationPolicies?: any[];
}

export function ApplicantTicketTab({ applicant, ticket, onUpdate, viewMode = "admin", cancellationPolicies = [] }: ApplicantTicketTabProps) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [destinations, setDestinations] = useState<any[]>([]);

    // Booking State
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [tripType, setTripType] = useState("ONE_WAY"); // ONE_WAY or ROUND_TRIP
    const [returnDate, setReturnDate] = useState("");

    // Custom Ticket Fields
    const [agentName, setAgentName] = useState("");
    const [boardingPoint, setBoardingPoint] = useState("");
    const [companions, setCompanions] = useState<{name: string}[]>([]);

    // Search Results
    const [availableTrips, setAvailableTrips] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Booking Steps: 1=Search, 2=Select Departure, 3=Select Return, 4=Review
    const [step, setStep] = useState(1);

    // Selection
    const [selectedTrip, setSelectedTrip] = useState<any>(null); // Departure Trip
    const [selectedStop, setSelectedStop] = useState<any>(null);

    // Return Selection
    const [selectedReturnTrip, setSelectedReturnTrip] = useState<any>(null);
    const [selectedReturnStop, setSelectedReturnStop] = useState<any>(null);

    // Sheet & Dialogs
    const [showBookingSheet, setShowBookingSheet] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // Pricing State
    const [pricingBreakdown, setPricingBreakdown] = useState<any[]>([]);
    const [manualPrice, setManualPrice] = useState<number | null>(null);
    const [isEditingPrice, setIsEditingPrice] = useState(false);

    const { toast } = useToast();

    // Handle requesting transport for applicants who didn't select it during registration
    const handleRequestTransport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hasTransportation: true })
            });
            if (res.ok) {
                toast("تم طلب خدمة المواصلات بنجاح", "success");
                onUpdate();
            } else {
                toast("فشل طلب المواصلات", "error");
            }
        } catch (e) {
            toast("حدث خطأ", "error");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Destinations
    useEffect(() => {
        fetch("/api/transport/destinations")
            .then(res => res.json())
            .then(data => setDestinations(data))
            .catch(err => console.error(err));
    }, []);

    // Auto-fill from Applicant Data
    useEffect(() => {
        if (!ticket && destinations.length > 0) {
            // 1. From (Transport From) - Match by Name because IDs might differ (Location vs TransportDestination)
            // Use optional chaining for safety
            const fromName = applicant.transportFrom?.name;
            if (fromName) {
                const match = destinations.find(d => d.name === fromName);
                if (match) setFromId(match.id);
            } else if (applicant.transportFromId) {
                // Fallback to ID if name missing (orphan ID?)
                const match = destinations.find(d => d.id === applicant.transportFromId);
                if (match) setFromId(match.id);
            }

            // 2. To (Exam Location) - Match by Name
            const toName = applicant.location?.name;
            if (toName) {
                const match = destinations.find(d => d.name === toName);
                if (match) setToId(match.id);
            } else if (applicant.locationId) {
                const match = destinations.find(d => d.id === applicant.locationId);
                if (match) setToId(match.id);
            }

            // 3. Travel Date (Exam Date - 1 Day)
            if (applicant.examDate) {
                const examDate = new Date(applicant.examDate);

                const travelD = new Date(examDate);
                travelD.setDate(travelD.getDate() - 1); // Day before exam
                setTravelDate(travelD.toISOString().split('T')[0]);

                // 4. Return Date (Same as Exam Date)
                const returnD = new Date(examDate);
                setReturnDate(returnD.toISOString().split('T')[0]);
            }

            // 5. Trip Type
            if (applicant.transportType) {
                setTripType(applicant.transportType);
            }
        }
    }, [applicant, ticket, destinations]);

    const handleSearchTrips = async (overrideStep1Date?: string) => {
        if (!fromId || !toId || (!travelDate && !overrideStep1Date)) {
            toast("يرجى اختيار معايير البحث بالكامل", "error");
            return;
        }

        setLoading(true);
        setStep(1); // Reset
        setSelectedTrip(null);
        setSelectedReturnTrip(null);

        try {
            const params = new URLSearchParams();
            params.append("from", fromId);
            params.append("to", toId);
            params.append("date", overrideStep1Date || travelDate);

            const res = await fetch(`/api/transport/booking/search?${params.toString()}`);
            if (res.ok) {
                const trips = await res.json();
                setAvailableTrips(trips);
                setHasSearched(true);
                setStep(2); // Go to Select Departure
            } else {
                toast("تعذر جلب الرحلات", "error");
            }
        } catch (e) {
            console.error(e);
            toast("خطأ في البحث عن الرحلات", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchReturnTrips = async (overrideDate?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("from", toId);
            params.append("to", fromId);
            params.append("date", overrideDate || returnDate);
            
            const res = await fetch(`/api/transport/booking/search?${params.toString()}`);
            if (res.ok) {
                const returnTrips = await res.json();
                setAvailableTrips(returnTrips);
                setStep(3);
            } else {
                toast("خطأ في البحث عن رحلات العودة", "error");
            }
        } catch (e) {
            toast("خطأ في البحث عن رحلات العودة", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrip = async (trip: any, stop: any = null) => {
        if (step === 2) {
            // Selected Departure
            setSelectedTrip(trip);
            setSelectedStop(stop);
            
            if (trip.segmentDetails?.fromBoardingPoint) {
                setBoardingPoint(trip.segmentDetails.fromBoardingPoint);
            } else {
                setBoardingPoint("");
            }

            if (tripType === "ROUND_TRIP") {
                // Prepare for Return Selection
                handleSearchReturnTrips();
            } else {
                // One Way - Go to Pricing
                calculatePrice(trip, stop, null, null);
            }
        } else if (step === 3) {
            // Selected Return
            setSelectedReturnTrip(trip);
            setSelectedReturnStop(stop);
            // Go to Pricing (Use previously selected departure + this return)
            calculatePrice(selectedTrip, selectedStop, trip, stop);
        }
    };

    const calculatePrice = async (depTrip: any, depStop: any, retTrip: any, retStop: any) => {
        setLoading(true);
        setIsEditingPrice(false);
        setManualPrice(null);

        try {
            // Determine Base Price
            const depPrice = depStop ? Number(depStop.price) : Number(depTrip.price);
            let retPrice = 0;
            if (retTrip) {
                retPrice = retStop ? Number(retStop.price) : Number(retTrip.price);
            }

            const basePrice = depPrice + retPrice;

            // Calculate Passenger Type
            let passengerType = "ADULT";
            if (applicant.dob) {
                const age = new Date().getFullYear() - new Date(applicant.dob).getFullYear();
                if (age < 2) passengerType = "INFANT";
                else if (age < 12) passengerType = "CHILD";
            }

            // Call Pricing Engine
            // Note: Pricing Engine currently handles single leg. 
            // For Round Trip, we might want to call it twice OR ideally update it to handle total.
            // For now, let's assume valid total price is sufficient, or call twice and sum?
            // Better: Pass total base price and tripType=ROUND_TRIP to engine so it applies RT discount rules.

            const res = await fetch("/api/transport/pricing-engine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    basePrice,
                    routeFromId: depTrip.fromDestinationId, // Main route
                    routeToId: depTrip.toDestinationId,
                    passengerType,
                    tripType: tripType,
                    busClass: "STANDARD",
                    bookingDate: new Date(),
                    travelDate: depTrip.date
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPricingBreakdown(data.breakdown || []);
                setManualPrice(data.finalPrice);
            } else {
                setManualPrice(basePrice);
                setPricingBreakdown([{ label: "سعر أساسي", amount: basePrice }]);
            }

            setShowBookingSheet(true);
            setStep(4); // Review
        } catch (e) {
            toast("خطأ في حساب السعر", "error");
        } finally {
            setLoading(false);
        }
    }

    const confirmBooking = async () => {
        if (!selectedTrip) return;

        setLoading(true);
        try {
            const payload: any = {
                applicantId: applicant.id,
                tripId: selectedTrip.id,
                stopId: selectedStop?.id,
                price: manualPrice,
                tripType: tripType,
                agentName: agentName,
                boardingPoint: boardingPoint,
                companions: companions.filter(c => c.name.trim() !== "")
            };

            if (selectedReturnTrip) {
                payload.returnTripId = selectedReturnTrip.id;
                // payload.returnStopId = selectedReturnStop?.id; // If API supports it
            }

            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast("تم إصدار التذكرة بنجاح", "success");
                setShowBookingSheet(false);
                setStep(1); // Reset
                onUpdate();
            } else {
                const err = await res.json();
                toast(err.error || "فشل حجز التذكرة", "error");
            }
        } catch (e) {
            toast("حدث خطأ", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!ticketRef.current || !ticket) return;
        try {
            const pages = Array.from(ticketRef.current.querySelectorAll('.ticket-page'));
            if (pages.length === 0) return;

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                const pageElement = pages[i] as HTMLElement;
                const canvas = await html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                } as any);

                const imgData = canvas.toDataURL("image/png");
                const imgProps = pdf.getImageProperties(imgData);
                const printHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (i > 0) pdf.addPage();
                
                // Center vertically if it doesn't take the full height
                // or just place at top with small margin
                const margin = 10;
                pdf.addImage(imgData, "PNG", 0, margin, pdfWidth, printHeight);
            }
            
            pdf.save(`Ticket-${applicant.fullName}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            toast("فشل إنشاء ملف PDF", "error");
        }
    };

    // If ticket is already booked and active, show ticket details instead of booking form
    if (ticket && (ticket.status === 'ISSUED' || ticket.status === 'ACTIVE')) {
        return (
            <div className="space-y-6">
                {/* Hidden Ticket Template for Printing */}
                <div className="absolute top-[-9999px] left-[-9999px] print:static print:block w-full">
                    <PrintableTicketsWrapper
                        ref={ticketRef}
                        ticket={{
                            ...ticket,
                            createdAt: ticket.createdAt.toString(),
                            departureTime: ticket.departureTime || null,
                            arrivalTime: ticket.arrivalTime || null,
                            trip: ticket.trip as any,
                            returnTrip: ticket.returnTrip as any
                        }}
                        applicant={applicant}
                        tripType={applicant.transportType === 'ROUND_TRIP' ? "round-trip" : "one-way"}
                    />
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <CardTitle className="flex items-center gap-2">
                                <TicketIcon className="h-5 w-5 text-blue-600" />
                                إدارة التذاكر
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                    {ticket.status === 'ISSUED' || ticket.status === 'ACTIVE' ? 'فعّالة' : ticket.status}
                                </Badge>
                                <ContextualMessageButton
                                    applicant={applicant}
                                    ticket={ticket}
                                    trigger="ON_TICKET_ISSUE"
                                    variant="success"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="font-bold text-green-800 text-lg">تذكرة سفر رقم : {ticket.ticketNumber}</p>
                                <p className="text-sm text-green-600 mb-1">
                                    {ticket.departureLocation} ➔ {ticket.arrivalLocation} | {new Date(ticket.departureDate).toLocaleDateString("ar-EG")}
                                </p>
                                <Badge variant="default" className="text-xs">
                                    {applicant.transportType === 'ROUND_TRIP' ? "ذهاب وعودة" : "ذهاب فقط"}
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                                    <Download className="h-4 w-4 ml-2" />
                                    تحميل PDF/طباعة
                                </Button>
                            </div>
                        </div>

                        {/* WhatsApp Button snippet */}
                        <div className="flex justify-center pt-6 mt-4 border-t border-gray-100">
                            <ContextualMessageButton
                                applicant={applicant}
                                ticket={ticket}
                                trigger="ON_TICKET_ISSUE"
                                variant="default"
                                label="إرسال تفاصيل التذكرة"
                                allowCustomAttachment={true}
                                attachmentName="تذكرة السفر PDF"
                                onSuccess={onUpdate}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If no transportation requested and no ticket, show request button
    if (!applicant.hasTransportation && !ticket) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 rounded-full bg-gray-100">
                    <Bus className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">لم يتم طلب خدمة المواصلات</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                    هذا المتقدم لم يطلب خدمة المواصلات عند التسجيل. يمكنك طلب الخدمة الآن لإصدار تذكرة.
                </p>
                <Button
                    onClick={handleRequestTransport}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 mt-2"
                >
                    <Bus className="h-4 w-4 ml-2" />
                    {loading ? "جاري الطلب..." : "طلب المواصلات"}
                </Button>
            </div>
        );
    }
    return (
        <div className="space-y-6 relative">
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">جاري المعالجة...</span>
                    </div>
                </div>
            )}
            {/* Step Indicator */}
            {hasSearched && (
                <div className="flex justify-between mb-4 px-4">
                    <div className={`text-sm font-bold ${step >= 2 ? "text-green-600" : "text-gray-400"}`}>1. اختيار الذهاب</div>
                    <div className={`text-sm font-bold ${step >= 3 ? "text-green-600" : "text-gray-400"}`}>2. اختيار العودة</div>
                    <div className={`text-sm font-bold ${step >= 4 ? "text-green-600" : "text-gray-400"}`}>3. المراجعة والدفع</div>
                </div>
            )}

            {/* Search Form (Only show if step 1 or re-searching) */}
            {step === 1 && (
                <Card>
                    {/* ... Existing Search Form Logic ... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-blue-600" />
                            البحث عن رحلات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Trip Type Toggle */}
                        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setTripType("ONE_WAY")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tripType === "ONE_WAY" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                ذهاب فقط
                            </button>
                            <button
                                type="button"
                                onClick={() => setTripType("ROUND_TRIP")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tripType === "ROUND_TRIP" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                ذهاب وعودة
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">من (الانطلاق)</label>
                                <Select value={fromId} onValueChange={setFromId}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">إلى (الوصول)</label>
                                <Select value={toId} onValueChange={setToId}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>
                                        {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">تاريخ الذهاب</label>
                                <Input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} />
                            </div>
                            {tripType === "ROUND_TRIP" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-gray-500">تاريخ العودة</label>
                                    <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                                </div>
                            )}
                        </div>
                        <Button onClick={() => handleSearchTrips()} className="w-full bg-blue-600 hover:bg-blue-700">بحث</Button>
                    </CardContent>
                </Card>
            )}

            {/* Results (Step 2 or 3) */}
            {(step === 2 || step === 3) && hasSearched && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-lg gap-3">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                            {step === 2 ? "نتائج البحث (الذهاب)" : "نتائج البحث (العودة)"}
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{availableTrips.length} رحلة</Badge>
                        </h3>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 bg-white border-blue-200 hover:bg-blue-100 px-3"
                                disabled={loading}
                                onClick={() => {
                                    const curr = step === 2 ? travelDate : returnDate;
                                    const d = new Date(curr);
                                    d.setDate(d.getDate() - 1);
                                    const nextDate = d.toISOString().split('T')[0];
                                    if (step === 2) {
                                        setTravelDate(nextDate);
                                        handleSearchTrips(nextDate);
                                    } else {
                                        setReturnDate(nextDate);
                                        handleSearchReturnTrips(nextDate);
                                    }
                                }}
                            >
                                ◀ اليوم السابق
                            </Button>
                            
                            <span className="text-sm font-bold mx-2 hidden sm:block text-blue-900 border-x border-blue-200 px-3">
                                {new Date(step === 2 ? travelDate : returnDate).toLocaleDateString("ar-EG", { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 bg-white border-blue-200 hover:bg-blue-100 px-3"
                                disabled={loading}
                                onClick={() => {
                                    const curr = step === 2 ? travelDate : returnDate;
                                    const d = new Date(curr);
                                    d.setDate(d.getDate() + 1);
                                    const nextDate = d.toISOString().split('T')[0];
                                    if (step === 2) {
                                        setTravelDate(nextDate);
                                        handleSearchTrips(nextDate);
                                    } else {
                                        setReturnDate(nextDate);
                                        handleSearchReturnTrips(nextDate);
                                    }
                                }}
                            >
                                اليوم التالي ▶
                            </Button>
                            
                            <div className="h-8 w-px bg-blue-200 mx-1 hidden sm:block"></div>
                            
                            {step === 2 && <Button variant="ghost" onClick={() => setStep(1)} size="sm" className="h-8 text-blue-700 hover:bg-blue-100">تغيير بحث</Button>}
                            {step === 3 && <Button variant="ghost" onClick={() => { setStep(2); handleSearchTrips(travelDate); }} size="sm" className="h-8 text-blue-700 hover:bg-blue-100">رجوع للذهاب</Button>}
                        </div>
                    </div>

                    {availableTrips.length === 0 && (
                        <div className="text-center py-12 px-4 shadow-sm text-gray-500 bg-white rounded-lg border flex flex-col items-center justify-center gap-3">
                            <Bus className="h-10 w-10 text-gray-300" />
                            <p className="font-semibold text-gray-700">لا توجد رحلات متاحة في هذا اليوم</p>
                            <p className="text-sm">يمكنك التنقل إلى اليوم التالي لمعرفة الرحلات المتاحة</p>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {availableTrips.map(tripSegment => {
                            const availableSeats = tripSegment.availableSeats || 0;
                            const isFull = availableSeats <= 0;
                            const departureTime = tripSegment.segmentDetails.departureTime;
                            const arrivalTime = tripSegment.segmentDetails.arrivalTime;
                            
                            // Handle cases where arrival is next day
                            const isNextDay = tripSegment.segmentDetails?.nextDayArrival || false;

                            return (
                                <Card key={tripSegment.tripId} className={`transition-all border shadow-sm border-r-4 ${isFull ? 'bg-gray-50 border-r-gray-300 opacity-80' : 'hover:border-blue-400 hover:shadow-md cursor-pointer border-r-blue-500'}`} onClick={() => {
                                    if (isFull) return;
                                    handleSelectTrip({
                                        ...tripSegment,
                                        id: tripSegment.tripId, 
                                        date: tripSegment.segmentDetails.departureDate,
                                        departureTime: tripSegment.segmentDetails.departureTime,
                                        fromDestinationId: fromId,
                                        toDestinationId: toId,
                                        fromDestination: { name: tripSegment.segmentDetails.fromDestination },
                                        toDestination: { name: tripSegment.segmentDetails.toDestination }
                                    }, {
                                        id: tripSegment.segmentDetails.toStopId,
                                        price: tripSegment.segmentDetails.price
                                    });
                                }}>
                                    <CardContent className="p-0">
                                        <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                                            {/* Flight-style info row */}
                                            <div className="flex-1 w-full flex items-center justify-between">
                                                <div className="text-center md:text-right min-w-[80px]">
                                                    <p className="text-2xl font-bold font-mono text-gray-800">{departureTime}</p>
                                                    <p className="text-sm font-semibold text-gray-600 mt-1">{tripSegment.segmentDetails.fromDestination}</p>
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col items-center px-4 relative">
                                                    <div className="w-full h-[2px] bg-gray-200 absolute top-1/2 -translate-y-1/2"></div>
                                                    <Bus className={`h-6 w-6 bg-white px-1 relative z-10 ${isFull ? 'text-gray-400' : 'text-blue-500'}`} />
                                                    <p className="text-[11px] font-bold text-gray-500 bg-white px-2 mt-1 relative z-10">
                                                        {tripSegment.vehicle?.model || tripSegment.busClass || "حافلة اعتيادية"}
                                                    </p>
                                                </div>

                                                <div className="text-center md:text-left min-w-[80px] relative">
                                                    <p className="text-2xl font-bold font-mono text-gray-800 flex items-start justify-center md:justify-end">
                                                        {arrivalTime}
                                                        {isNextDay && <span className="text-[10px] text-red-500 font-bold ml-1 absolute leading-tight -left-8 top-1 bg-red-50 px-1 rounded border border-red-100">+1 يوم</span>}
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-600 mt-1">{tripSegment.segmentDetails.toDestination}</p>
                                                </div>
                                            </div>

                                            {/* Separator */}
                                            <div className="hidden md:block w-px h-16 bg-gray-200 mx-2"></div>

                                            {/* Action & Status */}
                                            <div className="w-full md:w-auto flex flex-col items-center justify-center gap-2">
                                                <div className="flex flex-row md:flex-col justify-between md:justify-center items-center w-full gap-2">
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-gray-500">المقاعد المتاحة</p>
                                                        <p className={`text-lg leading-none font-bold ${isFull ? 'text-red-500' : (availableSeats < 5 ? 'text-orange-500' : 'text-green-600')}`}>
                                                            {isFull ? "ممتلئة" : availableSeats}
                                                        </p>
                                                    </div>
                                                    <Button size="sm" disabled={isFull} className={`w-32 rounded-full ${isFull ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
                                                        {isFull ? "الرحلة ممكتلئة" : (step === 2 ? "اختيار للذهاب" : "اختيار للعودة")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Route Banner */}
                                        <div className="bg-gray-50/80 px-4 py-2 border-t text-[11px] text-gray-500 flex items-center gap-2 rounded-b-lg">
                                            <MapPin className="h-3 w-3 text-blue-400" />
                                            <span className="font-semibold text-gray-600">مسار الرحلة الكامل:</span> 
                                            {tripSegment.mainRouteTitle}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Confirmation Sheet (Review - Step 4) */}
            <Sheet open={showBookingSheet} onOpenChange={(open) => { setShowBookingSheet(open); if (!open) setStep(1); }}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>ملخص والحجز</SheetTitle>
                        <SheetDescription>تأكد من بيانات الرحلة قبل الإصدار</SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        {/* Outbound Summary */}
                        {selectedTrip && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-sm text-blue-800 pb-1 border-b border-blue-100">رحلة الذهاب</h4>
                                <div className="text-sm">
                                    <div className="font-semibold">{selectedTrip.fromDestination.name} ← {selectedTrip.toDestination.name}</div>
                                    <div className="text-gray-500 flex justify-between mt-1">
                                        <span>{format(new Date(selectedTrip.date), 'yyyy-MM-dd')}</span>
                                        <span>{selectedTrip.departureTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Return Summary */}
                        {selectedReturnTrip && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-sm text-green-800 pb-1 border-b border-green-100">رحلة العودة</h4>
                                <div className="text-sm">
                                    <div className="font-semibold">{selectedReturnTrip.fromDestination.name} ← {selectedReturnTrip.toDestination.name}</div>
                                    <div className="text-gray-500 flex justify-between mt-1">
                                        <span>{format(new Date(selectedReturnTrip.date), 'yyyy-MM-dd')}</span>
                                        <span>{selectedReturnTrip.departureTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="border rounded p-3 border-green-200 bg-green-50">
                            <div className="text-sm font-bold text-green-800 mb-2">تفاصيل السعر ({tripType === "ROUND_TRIP" ? "ذهاب وعودة" : "ذهاب فقط"})</div>

                            <div className="space-y-1 mb-3 text-sm">
                                {pricingBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-gray-600">
                                        <span>{item.label}</span>
                                        <span dir="ltr">{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center border-t border-green-200 pt-2 pb-4">
                                <div className="text-sm font-bold text-green-800">سعر التذكرة (للفرد)</div>
                                <div className="flex items-center gap-2">
                                    {isEditingPrice ? (
                                        <Input
                                            type="number"
                                            className="h-8 w-24 bg-white"
                                            value={manualPrice || 0}
                                            onChange={e => setManualPrice(Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="text-lg font-bold text-green-700">
                                            {manualPrice} ريال
                                        </div>
                                    )}
                                    <Button
                                        size="icon" variant="ghost" className="h-6 w-6"
                                        onClick={() => setIsEditingPrice(!isEditingPrice)}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            
                            {companions.length > 0 && (
                                <div className="flex justify-between items-center border-t border-green-200 pt-3 pb-2">
                                    <div className="text-sm font-bold text-green-800">إجمالي السعر (الأصيل + {companions.length} مرافقين)</div>
                                    <div className="text-xl font-bold bg-green-100 px-3 py-1 rounded text-green-800 border border-green-300">
                                        {(manualPrice || 0) * (1 + companions.length)} ريال
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Companions Section */}
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                    إضافة مرافقين <Badge variant="secondary" className="text-xs">{(manualPrice||0)} ر.ي لكل مرافق</Badge>
                                </h4>
                                <Button size="sm" variant="outline" onClick={() => setCompanions([...companions, {name: ""}])} className="h-8 shadow-sm">
                                    + إضافة مرافق
                                </Button>
                            </div>
                            
                            {companions.length > 0 ? (
                                <div className="space-y-3">
                                    {companions.map((comp, idx) => (
                                        <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <Input 
                                                placeholder="اسم المرافق الرباعي" 
                                                value={comp.name} 
                                                onChange={e => {
                                                    const newComps = [...companions];
                                                    newComps[idx].name = e.target.value;
                                                    setCompanions(newComps);
                                                }}
                                                className="border-blue-100 focus-visible:ring-blue-400"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                                                onClick={() => {
                                                    const newComps = [...companions];
                                                    newComps.splice(idx, 1);
                                                    setCompanions(newComps);
                                                }}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 p-2 bg-gray-50 rounded border border-dashed border-gray-200 text-center">لا يوجد مرافقين مضافين. سيتم إصدار التذكرة للمتقدم الأصيل فقط.</p>
                            )}
                        </div>

                        {/* Custom Ticket Info */}
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <h4 className="font-bold text-sm text-gray-800">تخصيص بيانات التذكرة (اختياري)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">اسم الوكيل</label>
                                    <Input
                                        placeholder="مثال: وكالة السفر الدولية"
                                        value={agentName}
                                        onChange={e => setAgentName(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">موقع الانطلاق (نقطة التجمع)</label>
                                    <Input
                                        placeholder="مثال: صنعاء - شارع حده المجمع السينمائي"
                                        value={boardingPoint}
                                        onChange={e => setBoardingPoint(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button onClick={confirmBooking} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                            {loading ? "جاري الإصدار..." : "تأكيد وإصدار التذكرة"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

// Helper types
// ... (Assumed global types or from imports)
