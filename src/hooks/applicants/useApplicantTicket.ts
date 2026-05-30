"use client";

import { useRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/simple-toast";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ExtendedApplicant, Ticket } from "@/types/applicant";

interface UseApplicantTicketProps {
    applicant: ExtendedApplicant;
    ticket: Ticket | null;
    onUpdate: () => void;
}

export function useApplicantTicket({ applicant, ticket, onUpdate }: UseApplicantTicketProps) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [destinations, setDestinations] = useState<any[]>([]);

    // Booking State
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [tripType, setTripType] = useState("ONE_WAY");
    const [returnDate, setReturnDate] = useState("");

    // Custom Ticket Fields
    const [agentName, setAgentName] = useState("");
    const [boardingPoint, setBoardingPoint] = useState("");
    const [companions, setCompanions] = useState<{ name: string }[]>([]);

    // Search Results
    const [availableTrips, setAvailableTrips] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Booking Steps: 1=Search, 2=Select Departure, 3=Select Return, 4=Review
    const [step, setStep] = useState(1);

    // Selection
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
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

    // Fetch destinations on mount
    useEffect(() => {
        fetch("/api/transport/destinations")
            .then(res => res.json())
            .then(data => setDestinations(data))
            .catch(err => console.error(err));
    }, []);

    // Auto-fill parameters from Applicant data
    useEffect(() => {
        if (!ticket && destinations.length > 0) {
            const fromName = applicant.transportFrom?.name;
            if (fromName) {
                const match = destinations.find(d => d.name === fromName);
                if (match) setFromId(match.id);
            } else if (applicant.transportFromId) {
                const match = destinations.find(d => d.id === applicant.transportFromId);
                if (match) setFromId(match.id);
            }

            const toName = applicant.location?.name;
            if (toName) {
                const match = destinations.find(d => d.name === toName);
                if (match) setToId(match.id);
            } else if (applicant.locationId) {
                const match = destinations.find(d => d.id === applicant.locationId);
                if (match) setToId(match.id);
            }

            if (applicant.examDate) {
                const examDate = new Date(applicant.examDate);
                const travelD = new Date(examDate);
                travelD.setDate(travelD.getDate() - 1);
                setTravelDate(travelD.toISOString().split('T')[0]);

                const returnD = new Date(examDate);
                setReturnDate(returnD.toISOString().split('T')[0]);
            }

            if (applicant.transportType) {
                setTripType(applicant.transportType);
            }
        }
    }, [applicant, ticket, destinations]);

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

    const handleSearchTrips = async (overrideStep1Date?: string) => {
        if (!fromId || !toId || (!travelDate && !overrideStep1Date)) {
            toast("يرجى اختيار معايير البحث بالكامل", "error");
            return;
        }

        setLoading(true);
        setStep(1);
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
                setStep(2);
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

    const calculatePrice = async (depTrip: any, depStop: any, retTrip: any, retStop: any) => {
        setLoading(true);
        setIsEditingPrice(false);
        setManualPrice(null);

        try {
            const depPrice = depStop ? Number(depStop.price) : Number(depTrip.price);
            let retPrice = 0;
            if (retTrip) {
                retPrice = retStop ? Number(retStop.price) : Number(retTrip.price);
            }

            const basePrice = depPrice + retPrice;

            let passengerType = "ADULT";
            if (applicant.dob) {
                const age = new Date().getFullYear() - new Date(applicant.dob).getFullYear();
                if (age < 2) passengerType = "INFANT";
                else if (age < 12) passengerType = "CHILD";
            }

            const res = await fetch("/api/transport/pricing-engine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    basePrice,
                    routeFromId: depTrip.fromDestinationId,
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
            setStep(4);
        } catch (e) {
            toast("خطأ في حساب السعر", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrip = async (trip: any, stop: any = null) => {
        if (step === 2) {
            setSelectedTrip(trip);
            setSelectedStop(stop);
            
            if (trip.segmentDetails?.fromBoardingPoint) {
                setBoardingPoint(trip.segmentDetails.fromBoardingPoint);
            } else {
                setBoardingPoint("");
            }

            if (tripType === "ROUND_TRIP") {
                handleSearchReturnTrips();
            } else {
                calculatePrice(trip, stop, null, null);
            }
        } else if (step === 3) {
            setSelectedReturnTrip(trip);
            setSelectedReturnStop(stop);
            calculatePrice(selectedTrip, selectedStop, trip, stop);
        }
    };

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
            }

            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast("تم إصدار التذكرة بنجاح", "success");
                setShowBookingSheet(false);
                setStep(1);
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
                
                const margin = 10;
                pdf.addImage(imgData, "PNG", 0, margin, pdfWidth, printHeight);
            }
            
            pdf.save(`Ticket-${applicant.fullName}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            toast("فشل إنشاء ملف PDF", "error");
        }
    };

    return {
        ticketRef,
        loading,
        destinations,
        fromId,
        setFromId,
        toId,
        setToId,
        travelDate,
        setTravelDate,
        tripType,
        setTripType,
        returnDate,
        setReturnDate,
        agentName,
        setAgentName,
        boardingPoint,
        setBoardingPoint,
        companions,
        setCompanions,
        availableTrips,
        hasSearched,
        step,
        setStep,
        selectedTrip,
        selectedStop,
        selectedReturnTrip,
        selectedReturnStop,
        showBookingSheet,
        setShowBookingSheet,
        showCancelDialog,
        setShowCancelDialog,
        pricingBreakdown,
        manualPrice,
        setManualPrice,
        isEditingPrice,
        setIsEditingPrice,
        handleRequestTransport,
        handleSearchTrips,
        handleSearchReturnTrips,
        handleSelectTrip,
        confirmBooking,
        handleDownloadPDF
    };
}
