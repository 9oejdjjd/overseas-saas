"use client";

import { useToast } from "@/components/ui/simple-toast";

import { format } from "date-fns";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Ticket as TicketIcon, Printer, Download, XCircle, Search, Save, Lock, AlertTriangle, Edit, Settings, Bus, RefreshCw, ArrowLeftRight, ArrowRight } from "lucide-react";
import { ExtendedApplicant, Ticket } from "@/types/applicant";
import { TicketTemplate } from "@/components/TicketTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";
import { cn } from "@/lib/utils";
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
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);

    // Smart Wizard State
    const [showTransportForm, setShowTransportForm] = useState(applicant.hasTransportation || !!ticket);
    const [activateMode, setActivateMode] = useState(false);


    // Toast
    const { toast } = useToast();

    // Initial State for Sheet Form
    const [editForm, setEditForm] = useState({
        departureDate: "",
        departureLocation: "",
        arrivalLocation: "",
        busNumber: "",
        seatNumber: "",
        tripType: "ONE_WAY" as "ONE_WAY" | "ROUND_TRIP",
    });

    // Calculated Fine & Price Logic
    const [calculatedFine, setCalculatedFine] = useState(0);
    const [priceDiff, setPriceDiff] = useState(0);
    const [matchedPolicy, setMatchedPolicy] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [newRoutePrice, setNewRoutePrice] = useState(0); // Track new price separately for UI if needed

    // Store original route price ref
    const [originalRoutePrice, setOriginalRoutePrice] = useState(0);

    // Voucher Selection State
    const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
    const [voucherDiscount, setVoucherDiscount] = useState(0);

    // Public Voucher Code State
    const [publicVoucherCode, setPublicVoucherCode] = useState("");
    const [publicVoucher, setPublicVoucher] = useState<any>(null);
    const [publicVoucherError, setPublicVoucherError] = useState("");
    const [isCheckingCode, setIsCheckingCode] = useState(false);

    // Cancellation Dialog State
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelDialogData, setCancelDialogData] = useState<{
        ticketPrice: number;
        fineAmount: number;
        voucherValue: number;
        policyName: string;
        ticketType: string;
    } | null>(null);

    // Booking Confirmation Sheet State
    const [showBookingSheet, setShowBookingSheet] = useState(false);
    const [bookingData, setBookingData] = useState<{
        ticketPrice: number;
        tripType: string;
        departureLocation: string;
        arrivalLocation: string;
        departureDate: string;
    } | null>(null);

    // In setup mode, if ticket exists -> Read Only
    const isReadOnly = viewMode === "setup" && !!ticket;

    // Helper: Find Location Name by ID or Name
    const getLocationName = (idOrName: string | null | undefined) => {
        if (!idOrName) return "";
        const found = locations.find(l => l.id === idOrName || l.name === idOrName);
        return found ? found.name : idOrName;
    };

    // Auto-Fill Logic
    useEffect(() => {
        if (viewMode === "setup" && !ticket && locations.length > 0) {
            // Auto-fill logic for new ticket in wizard
            const defaultDate = (() => {
                if (applicant.examDate) {
                    const d = new Date(applicant.examDate);
                    d.setDate(d.getDate() - 1);
                    return d.toISOString().split('T')[0];
                }
                return "";
            })();

            const fromLoc = getLocationName(applicant.transportFromId);
            const toLoc = getLocationName(applicant.examLocation); // examLocation is usually name, but ensuring

            setFormData(prev => ({
                ...prev,
                departureDate: defaultDate,
                departureLocation: fromLoc,
                arrivalLocation: toLoc,
                // If user requested Round Trip in registration (Need to add this field to Applicant if not exists, currently defaulting One Way or checking notes/metadata? 
                // schema says transportType exists on Applicant)
                // We'll set it in the UI context if we had a field for it in formData, but formData here is just ticket fields.
                // We can use it to fetch price.
            }));
        }
    }, [viewMode, ticket, applicant, locations]);


    // New Ticket Form State
    // Calculate default date for NEW ticket
    const getDefaultDate = () => {
        if (ticket?.departureDate) return new Date(ticket.departureDate).toISOString().split('T')[0];
        if (applicant.examDate) {
            const date = new Date(applicant.examDate);
            date.setDate(date.getDate() - 1); // Subtract 1 day
            return date.toISOString().split('T')[0];
        }
        if (applicant.travelDate) return new Date(applicant.travelDate).toISOString().split('T')[0];
        return "";
    }

    const [formData, setFormData] = useState({
        // Note: New Ticket Creation usually assumes ONE_WAY unless we add field. 
        // For now, let's keep creation simple or add tripType if user insists.
        // Current prompt focused on Modification.
        busNumber: ticket?.busNumber || "A1 100",
        seatNumber: ticket?.seatNumber || "",
        departureDate: getDefaultDate(),
        departureLocation: ticket?.departureLocation || "صنعاء",
        arrivalLocation: ticket?.arrivalLocation || applicant.location?.name || applicant.examLocation || "",
        transportCompany: ticket?.transportCompany || "أوفرسيز للسفريات",
        tripType: applicant.transportType || "ONE_WAY"
    });

    // Calculate Price for New Ticket (Wizard Mode)
    useEffect(() => {
        if (!ticket && showTransportForm && formData.departureLocation && formData.arrivalLocation) {
            fetchRouteData(formData.departureLocation, formData.arrivalLocation).then(prices => {
                const price = formData.tripType === 'ROUND_TRIP' ? prices.roundTrip : prices.oneWay;
                setNewRoutePrice(price);
            });
        }
    }, [ticket, showTransportForm, formData.departureLocation, formData.arrivalLocation, formData.tripType]);

    // Fetch Locations on Mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch("/api/locations");
                if (res.ok) {
                    const data = await res.json();
                    setLocations(data);
                }
            } catch (e) {
                console.error("Failed to fetch locations");
            }
        };
        fetchLocations();
    }, []);

    // Fetch Available Vouchers for Applicant (All types: Personal + Compensation)
    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const res = await fetch(`/api/vouchers?applicantId=${applicant.id}&activeOnly=true`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter active vouchers with balance > 0
                    const activeVouchers = data.filter((v: any) =>
                        !v.isUsed && v.balance > 0
                    );
                    setAvailableVouchers(activeVouchers);
                }
            } catch (e) {
                console.error("Failed to fetch vouchers", e);
            }
        };
        fetchVouchers();
    }, [applicant.id]);

    // Check Public Voucher Code
    const checkPublicVoucherCode = async () => {
        if (!publicVoucherCode.trim()) return;

        setIsCheckingCode(true);
        setPublicVoucherError("");
        setPublicVoucher(null);

        try {
            const res = await fetch(`/api/vouchers?code=${encodeURIComponent(publicVoucherCode.trim())}`);
            if (res.ok) {
                const vouchers = await res.json();
                if (vouchers.length > 0) {
                    const voucher = vouchers[0];
                    if (voucher.isUsed) {
                        setPublicVoucherError("هذه القسيمة مستخدمة بالفعل");
                    } else if (voucher.balance <= 0) {
                        setPublicVoucherError("لا يوجد رصيد متاح في هذه القسيمة");
                    } else {
                        setPublicVoucher(voucher);
                    }
                } else {
                    setPublicVoucherError("لم يتم العثور على قسيمة بهذا الكود");
                }
            }
        } catch (e) {
            setPublicVoucherError("خطأ في التحقق من الكود");
        } finally {
            setIsCheckingCode(false);
        }
    };

    // Fetch Route Data Helper
    const fetchRouteData = async (from: string, to: string) => {
        try {
            const res = await fetch(`/api/transport-routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
            if (res.ok) {
                const data = await res.json();
                return {
                    oneWay: Number(data.oneWayPrice || 0),
                    roundTrip: Number(data.roundTripPrice || 0)
                };
            }
        } catch (e) {
            console.error("Failed to fetch price", e);
        }
        return { oneWay: 0, roundTrip: 0 };
    };

    // When ticket changes (or component mounts), sync edit form and fetch original price
    useEffect(() => {
        if (ticket) {
            // Determine current trip type from applicant
            const currentTripType = (applicant.transportType === 'ROUND_TRIP') ? 'ROUND_TRIP' : 'ONE_WAY';

            setEditForm({
                departureDate: new Date(ticket.departureDate).toISOString().split('T')[0],
                departureLocation: ticket.departureLocation,
                arrivalLocation: ticket.arrivalLocation,
                busNumber: ticket.busNumber || "",
                seatNumber: ticket.seatNumber || "",
                tripType: currentTripType,
            });

            // Calculate Original Price
            fetchRouteData(ticket.departureLocation, ticket.arrivalLocation).then(prices => {
                setOriginalRoutePrice(currentTripType === 'ROUND_TRIP' ? prices.roundTrip : prices.oneWay);
            });
        }
    }, [ticket, applicant.transportType]);

    // Recalculate Fine & Price whenever Edit Form Changes
    useEffect(() => {
        if (!ticket || !isSheetOpen) return;

        const calculate = async () => {
            setIsCalculating(true);
            try {
                // 1. Calculate Fine (Modification Policy)
                const travelDate = new Date(ticket.departureDate);
                const now = new Date();
                const diffMs = travelDate.getTime() - now.getTime();
                const hoursRemaining = diffMs / (1000 * 60 * 60);

                // Filter for MODIFICATION policies
                const modPolicies = cancellationPolicies
                    .filter(p => p.category === 'MODIFICATION')
                    .sort((a, b) => (a.hoursTrigger || 9999) - (b.hoursTrigger || 9999));

                // Fallback if no specific category found, check name (Legacy)
                if (modPolicies.length === 0) {
                    cancellationPolicies.forEach(p => {
                        if (p.name.includes('تعديل') && !p.category) modPolicies.push(p);
                    });
                    modPolicies.sort((a, b) => (a.hoursTrigger || 9999) - (b.hoursTrigger || 9999));
                }

                let policyToApply = null;
                for (const policy of modPolicies) {
                    if (policy.hoursTrigger && hoursRemaining < policy.hoursTrigger) {
                        policyToApply = policy;
                        break;
                    }
                }
                if (!policyToApply && modPolicies.length > 0) {
                    policyToApply = modPolicies.find(p => !p.hoursTrigger) || modPolicies[modPolicies.length - 1]; // Default or last (strictest?)
                }

                if (policyToApply) {
                    setMatchedPolicy(policyToApply);
                    setCalculatedFine(Number(policyToApply.feeAmount || 0));
                } else {
                    setMatchedPolicy(null);
                    setCalculatedFine(0);
                }

                // 2. Calculate New Price
                const prices = await fetchRouteData(editForm.departureLocation, editForm.arrivalLocation);
                const currentNewPrice = editForm.tripType === 'ROUND_TRIP' ? prices.roundTrip : prices.oneWay;
                setNewRoutePrice(currentNewPrice);

                // 3. Diff
                setPriceDiff(currentNewPrice - originalRoutePrice);

            } catch (err) {
                console.error(err);
            } finally {
                setIsCalculating(false);
            }
        };

        const timeout = setTimeout(calculate, 500); // Debounce
        return () => clearTimeout(timeout);

    }, [editForm, ticket, isSheetOpen, cancellationPolicies, originalRoutePrice]);


    const handleIssueTicket = async () => {
        if (!formData.departureDate) {
            toast("يرجى تحديد تاريخ السفر أولاً", "error");
            return;
        }

        if (!formData.departureLocation || !formData.arrivalLocation) {
            toast("يرجى تحديد مسار الرحلة", "error");
            return;
        }

        setLoading(true);
        try {
            // Fetch route price before confirmation
            const prices = await fetchRouteData(formData.departureLocation, formData.arrivalLocation);
            const price = formData.tripType === 'ROUND_TRIP'
                ? Number(prices.roundTrip || 0)
                : Number(prices.oneWay || 0);

            setBookingData({
                ticketPrice: price,
                tripType: formData.tripType === 'ROUND_TRIP' ? "ذهاب وعودة" : "ذهاب فقط",
                departureLocation: formData.departureLocation,
                arrivalLocation: formData.arrivalLocation,
                departureDate: formData.departureDate,
            });
            setShowBookingSheet(true);
        } catch (error) {
            alert("خطأ في حساب سعر التذكرة");
        } finally {
            setLoading(false);
        }
    };

    const confirmBooking = async () => {
        if (!bookingData) return;

        setLoading(true);
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId: applicant.id,
                    ...formData,
                    voucherId: selectedVoucher?.id || null, // Personal Voucher
                    publicVoucherId: publicVoucher?.id || null, // Public Voucher
                    voucherDiscount: voucherDiscount,
                }),
            });

            if (res.ok) {
                // Mark Personal voucher as used if applied
                if (selectedVoucher) {
                    await fetch(`/api/vouchers/${selectedVoucher.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isUsed: true }),
                    });
                }

                // Mark Public voucher as used if applied (optional - depends on business logic, maybe public vouchers are reusable?)
                // Assuming public vouchers are one-time use per person or globally unique codes
                if (publicVoucher && publicVoucher.id) {
                    await fetch(`/api/vouchers/${publicVoucher.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isUsed: true }),
                    });
                }

                toast("تم إصدار التذكرة بنجاح 🎫", "success");
                setShowBookingSheet(false);
                onUpdate();
            }
        } catch (error) {
            toast("خطأ في إصدار التذكرة", "error");
        } finally {
            setLoading(false);
        }
    };


    // New State for Update Confirmation
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

    // Step 1: Trigger Dialog
    const handleUpdateTicket = async () => {
        if (!ticket) return;
        // Verify minimal requirements
        if (!editForm.departureDate) {
            toast("يرجى تحديد تاريخ السفر", "error");
            return;
        }
        setShowUpdateDialog(true);
    };

    // Step 2: Confirm Update
    const confirmUpdateTicket = async () => {
        if (!ticket) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editForm,
                    fineAmount: calculatedFine,
                    priceDiff: priceDiff
                }),
            });

            if (res.ok) {
                toast("تم تعديل التذكرة بنجاح", "success");
                setIsSheetOpen(false);
                setShowUpdateDialog(false);
                onUpdate();
            } else {
                toast("فشل التعديل", "error");
            }
        } catch (error) {
            toast("حدث خطأ أثناء التعديل", "error");
        } finally {
            setLoading(false);
        }
    }

    const handleCancelTicket = async () => {
        if (!ticket) return;

        // Find Cancellation Fee Logic (Bonus)
        const travelDate = new Date(ticket.departureDate);
        const now = new Date();
        const diffMs = travelDate.getTime() - now.getTime();
        const hoursRemaining = diffMs / (1000 * 60 * 60);

        const cancelPolicies = cancellationPolicies
            .filter(p => p.category === 'CANCELLATION')
            .sort((a, b) => {
                // Sort by hours trigger descending to check larger windows first? 
                // Or ascending?
                // Logic: 
                // If I have > 24h and < 24h.
                // If I am at 30h. > 24h matches.
                // If I am at 10h. < 24h matches.
                // Providing a consistent sort is key. Let's rely on specific checks.
                return (a.hoursTrigger || 0) - (b.hoursTrigger || 0);
            });

        let fee = 0;
        let policyName = "";

        // Iterate and find first matching policy
        // We need to prioritize strict matches.
        // Usually: 
        // - Less than X hours (Urgent cancellation)
        // - Greater than X hours (Normal cancellation)

        for (const policy of cancelPolicies) {
            const hours = policy.hoursTrigger || 0;
            const condition = policy.condition || 'LESS_THAN'; // Default to less than if not specified

            let isMatch = false;

            if (condition === 'GREATER_THAN') {
                if (hoursRemaining >= hours) {
                    isMatch = true;
                }
            } else if (condition === 'LESS_THAN') {
                if (hoursRemaining < hours) {
                    isMatch = true;
                }
            } else {
                // Fallback for EQUAL or undefined
                if (hoursRemaining < hours) isMatch = true;
            }

            if (isMatch) {
                // If we already found a match, should we overwrite it?
                // Case: > 24h (Fee 100), < 72h (Fee 50) - 30h matches both if defined poorly.
                // Let's assume policies shouldn't overlap in a conflicting way, or take the highest fee?
                // For now, let's take the first one that matches logic-wise or maybe specificity.
                // If I match "Greater than 24h" (30h), and I have "Greater than 48h" (30h is NOT > 48).

                // Let's just pick the first valid match and break, assuming sorted by severity? 
                // Or maybe we want to verify.

                // Simple logic: overwrite fee if this matches. 
                // If we sort ascending hours:
                // 1. < 6h
                // 2. > 24h

                // At 30h: 
                // 1. < 6h? No.
                // 2. > 24h? Yes. -> Fee set.

                // At 4h:
                // 1. < 6h? Yes. -> Fee set.
                // 2. > 24h? No.

                // At 12h:
                // 1. < 6h? No.
                // 2. > 24h? No.
                // Result: No fee? Usually standard fee applies. 

                // Let's rely on what we have.
                fee = Number(policy.feeAmount);
                policyName = policy.name;

                // If it's a "Less than" triggers, precise matches usually come first (smallest hours).
                // If matched, we break.
                if (condition === 'LESS_THAN') break;

                // If "Greater than", maybe we keep looking? 
                // Example: > 24h (100), > 48h (50). 
                // At 60h: > 24h is true (100). > 48h is true (50).
                // Usually earlier cancellation = cheaper. So we want the > 48h one. 
                // Since we sorted ASC (24 then 48), we will see 24 first, set 100. Then see 48, set 50.
                // So not breaking is better for GREATER_THAN if sorted ASC.
            }
        }

        if (fee === 0 && cancelPolicies.length > 0) {
            // Check for a default policy (no hours trigger or explicit default)
            const defaultPolicy = cancelPolicies.find(p => !p.hoursTrigger);
            if (defaultPolicy) {
                fee = Number(defaultPolicy.feeAmount);
                policyName = defaultPolicy.name;
            }
        }

        // Calculate ticket price based on applicant's transport type
        const ticketTypeVal = applicant.transportType || "ONE_WAY";

        // We need to fetch route price - do it async
        try {
            const routeRes = await fetch(`/api/transport-routes?from=${encodeURIComponent(ticket.departureLocation)}&to=${encodeURIComponent(ticket.arrivalLocation)}`);
            let ticketPrice = 0;
            if (routeRes.ok) {
                const routeData = await routeRes.json();
                ticketPrice = ticketTypeVal === "ROUND_TRIP"
                    ? Number(routeData.roundTripPrice || 0)
                    : Number(routeData.oneWayPrice || 0);
            }

            const voucherValue = ticketPrice - fee;

            // Show dialog with all details
            setCancelDialogData({
                ticketPrice,
                fineAmount: fee,
                voucherValue: Math.max(0, voucherValue),
                policyName: policyName || "افتراضي",
                ticketType: ticketTypeVal === "ROUND_TRIP" ? "ذهاب وعودة" : "ذهاب فقط"
            });
            setShowCancelDialog(true);
        } catch (error) {
            console.error("Error calculating cancel details", error);
            toast("خطأ في حساب تفاصيل الإلغاء", "error");
        }
    };

    // Confirm cancellation after user reviews the dialog
    const confirmCancelTicket = async () => {
        if (!ticket || !cancelDialogData) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "CANCELLED",
                    fineAmount: cancelDialogData.fineAmount
                })
            });

            if (res.ok) {
                setShowCancelDialog(false);
                setCancelDialogData(null);
                toast("تم إلغاء التذكرة وإنشاء قسيمة التعويض بنجاح ✅", "success");
                onUpdate();
            }
        } catch (error) {
            toast("خطأ في إلغاء التذكرة", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!ticketRef.current || !ticket) return;
        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            } as any);

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4"); // A4 paper
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, pdfHeight);
            pdf.save(`Ticket-${applicant.fullName}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            toast("فشل إنشاء ملف PDF", "error");
        }
    };

    return (
        <>
            {/* Cancellation Details Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            تأكيد إلغاء التذكرة
                        </DialogTitle>
                        <DialogDescription className="text-right">
                            يرجى مراجعة تفاصيل الإلغاء قبل التأكيد
                        </DialogDescription>
                    </DialogHeader>

                    {cancelDialogData && (
                        <div className="space-y-4 py-4">
                            {/* Ticket Info */}
                            <div className="bg-slate-50 rounded-lg p-4 border">
                                <div className="text-sm text-gray-500 mb-2">معلومات التذكرة</div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">رقم التذكرة</span>
                                    <span className="font-bold text-primary">{ticket?.ticketNumber}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="font-medium">نوع الرحلة</span>
                                    <Badge variant="outline">{cancelDialogData.ticketType}</Badge>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="font-medium">المسار</span>
                                    <span className="text-sm">{ticket?.departureLocation} ↔ {ticket?.arrivalLocation}</span>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                                <div className="text-sm text-red-600 mb-3 font-medium">💰 التفاصيل المالية</div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">سعر التذكرة</span>
                                        <span className="font-medium">{cancelDialogData.ticketPrice.toLocaleString()} ر.ي</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-600">
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            غرامة الإلغاء ({cancelDialogData.policyName})
                                        </span>
                                        <span className="font-medium">-{cancelDialogData.fineAmount.toLocaleString()} ر.ي</span>
                                    </div>
                                    <div className="border-t border-dashed pt-2 mt-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-green-700">قيمة القسيمة التعويضية</span>
                                        <span className="font-bold text-lg text-green-600">
                                            {cancelDialogData.voucherValue.toLocaleString()} ر.ي
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Alert */}
                            {cancelDialogData.voucherValue > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">🎫</span>
                                        <div>
                                            <p className="font-medium">سيتم إنشاء قسيمة تعويض تلقائياً</p>
                                            <p className="text-green-600 text-xs mt-1">
                                                يمكن للمتقدم استخدامها عند حجز تذكرة جديدة
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={loading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancelTicket}
                            disabled={loading}
                            className="gap-2"
                        >
                            {loading ? (
                                <>جاري الإلغاء...</>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    تأكيد الإلغاء
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Confirmation Dialog */}
            <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2 text-blue-600">
                            <Edit className="h-5 w-5" />
                            تأكيد تعديل التذكرة
                        </DialogTitle>
                        <DialogDescription className="text-right">
                            سيتم تطبيق الرسوم التالية على حساب المتقدم
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-slate-50 border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">حالة السياسة:</span>
                                <Badge variant={matchedPolicy ? "destructive" : "outline"}>
                                    {matchedPolicy ? matchedPolicy.name : "تعديل عادي"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">غرامة التعديل</span>
                                <span className="text-red-600 font-bold">{calculatedFine.toLocaleString()} ر.ي</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-medium">فارق السعر ({editForm.tripType === 'ROUND_TRIP' ? "ذهاب وعودة" : "ذهاب فقط"})</span>
                                <span className={cn("font-bold", priceDiff > 0 ? "text-red-600" : "text-green-600")}>
                                    {priceDiff > 0 ? "+" : ""}{priceDiff.toLocaleString()} ر.ي
                                </span>
                            </div>
                            <div className="border-t border-dashed my-3"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold">الإجمالي المستحق</span>
                                <span className="font-bold text-primary">{(calculatedFine + priceDiff).toLocaleString()} ر.ي</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>إلغاء</Button>
                        <Button onClick={confirmUpdateTicket} disabled={loading}>
                            {loading ? "جاري التعديل..." : "تأكيد التعديل"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Booking Confirmation Sheet */}
            <Sheet open={showBookingSheet} onOpenChange={setShowBookingSheet}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-right flex items-center gap-2 text-blue-700">
                            <TicketIcon className="h-5 w-5" />
                            تأكيد حجز التذكرة
                        </SheetTitle>
                        <SheetDescription className="text-right">
                            راجع تفاصيل الرحلة والقسائم قبل التأكيد النهائي
                        </SheetDescription>
                    </SheetHeader>

                    {bookingData && (
                        <div className="space-y-6 py-6">
                            {/* Trip Summary */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-800 text-right">🛫 تفاصيل الرحلة</h3>
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-right space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-800">{bookingData.departureLocation}</span>
                                        <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                                        <span className="font-bold text-slate-800">{bookingData.arrivalLocation}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">نوع الرحلة:</span>
                                        <Badge variant="outline">{bookingData.tripType}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">تاريخ السفر:</span>
                                        <span className="font-medium" dir="ltr">{bookingData.departureDate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Vouchers Section */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-800 text-right">🎟️ القسائم والخصومات</h3>

                                {/* Personal Vouchers */}
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <Label className="text-sm font-medium text-blue-700 mb-2 block text-right">قسائم المتقدم الشخصية</Label>
                                    {availableVouchers.length > 0 ? (
                                        <Select
                                            value={selectedVoucher?.id || "none"}
                                            onValueChange={(val) => {
                                                if (val === "none") {
                                                    setSelectedVoucher(null);
                                                    setVoucherDiscount(publicVoucher ? Number(publicVoucher.balance) : 0);
                                                } else {
                                                    const voucher = availableVouchers.find(v => v.id === val);
                                                    setSelectedVoucher(voucher || null);
                                                    const personalDiscount = voucher ? Number(voucher.balance) : 0;
                                                    const publicDiscount = publicVoucher ? Number(publicVoucher.balance) : 0;
                                                    setVoucherDiscount(personalDiscount + publicDiscount);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="bg-white text-right" dir="rtl">
                                                <SelectValue placeholder="اختر قسيمة شخصية" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                <SelectItem value="none">بدون قسيمة شخصية</SelectItem>
                                                {availableVouchers.map((voucher) => (
                                                    <SelectItem key={voucher.id} value={voucher.id}>
                                                        <div className="flex items-center gap-2 w-full justify-between">
                                                            <span>{Number(voucher.balance).toLocaleString()} ر.ي</span>
                                                            <Badge variant="outline" className={
                                                                voucher.notes?.includes('COMP_') || voucher.notes?.includes('تعويض')
                                                                    ? "bg-orange-50 text-orange-700 border-orange-200 ml-2"
                                                                    : "bg-blue-50 text-blue-700 border-blue-200 ml-2"
                                                            }>
                                                                {voucher.notes?.includes('COMP_') || voucher.notes?.includes('تعويض') ? 'تعويض' : 'شخصية'}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded border border-dashed">
                                            لا توجد قسائم متاحة
                                        </div>
                                    )}
                                </div>



                                {/* Public Voucher Code */}
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                    <Label className="text-sm font-medium text-purple-700 mb-2 block text-right">كود قسيمة عامة</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={checkPublicVoucherCode}
                                            disabled={isCheckingCode || !publicVoucherCode.trim()}
                                            className="whitespace-nowrap"
                                        >
                                            {isCheckingCode ? <RefreshCw className="h-4 w-4 animate-spin" /> : "تحقق"}
                                        </Button>
                                        <Input
                                            placeholder="أدخل الكود..."
                                            value={publicVoucherCode}
                                            onChange={(e) => setPublicVoucherCode(e.target.value)}
                                            className="text-right"
                                        />
                                    </div>
                                    {publicVoucherError && (
                                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1 justify-end">
                                            {publicVoucherError} <XCircle className="h-3 w-3" />
                                        </div>
                                    )}
                                    {publicVoucher && (
                                        <div className="mt-2 flex items-center justify-between bg-purple-50 rounded p-2 text-sm border border-purple-200">
                                            <span className="font-bold text-purple-600">{Number(publicVoucher.balance).toLocaleString()} ر.ي</span>
                                            <span className="text-purple-700">✅ قيمة القسيمة</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Total Calculation */}
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{bookingData.ticketPrice.toLocaleString()} ر.ي</span>
                                    <span className="text-gray-600">سعر التذكرة:</span>
                                </div>

                                {selectedVoucher && (
                                    <div className="flex justify-between items-center text-sm text-green-600">
                                        <span className="font-medium">-{Number(selectedVoucher.balance).toLocaleString()} ر.ي</span>
                                        <span>خصم قسيمة شخصية:</span>
                                    </div>
                                )}

                                {publicVoucher && (
                                    <div className="flex justify-between items-center text-sm text-purple-600">
                                        <span className="font-medium">-{Number(publicVoucher.balance).toLocaleString()} ر.ي</span>
                                        <span>خصم قسيمة عامة:</span>
                                    </div>
                                )}

                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg shadow-md mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold">
                                            {Math.max(0, bookingData.ticketPrice - voucherDiscount).toLocaleString()} <span className="text-sm font-normal">ر.ي</span>
                                        </span>
                                        <span className="font-bold">الإجمالي النهائي</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <SheetFooter className="flex-col gap-2 mt-4 sm:flex-col sm:space-x-0">
                        <Button
                            onClick={confirmBooking}
                            disabled={loading}
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg"
                        >
                            {loading ? "جاري الإصدار..." : (
                                <span className="flex items-center gap-2">
                                    تأكيد وحجز التذكرة <TicketIcon className="h-5 w-5" />
                                </span>
                            )}
                        </Button>
                        <SheetClose asChild>
                            <Button variant="outline" className="w-full">إلغاء</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <div className="space-y-6">
                {/* Hidden Ticket Template for Printing */}
                <div className="absolute top-[-9999px] left-[-9999px]">
                    {ticket && (
                        <TicketTemplate
                            ref={ticketRef}
                            ticket={{ ...ticket, createdAt: ticket.createdAt.toString(), departureTime: ticket.departureTime || null, arrivalTime: ticket.arrivalTime || null }}
                            applicant={applicant}
                            tripType={applicant.transportType === 'ROUND_TRIP' ? "round-trip" : "one-way"}
                        />
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <CardTitle className="flex items-center gap-2">
                                <TicketIcon className="h-5 w-5 text-blue-600" />
                                إدارة التذاكر
                                {isReadOnly && <Badge variant="secondary" className="mr-auto"><Lock className="w-3 h-3 mr-1" /> للقراءة فقط</Badge>}
                            </CardTitle>

                            {/* Ticket Status Badge + WhatsApp Button */}
                            {ticket && ticket.status !== 'CANCELLED' && (
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={
                                            ticket.status === 'ISSUED' || ticket.status === 'ACTIVE'
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : ticket.status === 'USED'
                                                    ? "bg-gray-100 text-gray-700 border-gray-200"
                                                    : ticket.status === 'NO_SHOW'
                                                        ? "bg-red-100 text-red-700 border-red-200"
                                                        : "bg-blue-100 text-blue-700 border-blue-200"
                                        }
                                    >
                                        {ticket.status === 'ISSUED' || ticket.status === 'ACTIVE' ? 'فعّالة'
                                            : ticket.status === 'USED' ? 'مستخدمة'
                                                : ticket.status === 'NO_SHOW' ? 'تخلف'
                                                    : ticket.status}
                                    </Badge>

                                    {/* Contextual WhatsApp Button */}
                                    <ContextualMessageButton
                                        applicant={applicant}
                                        ticket={ticket}
                                        trigger={
                                            ticket.status === 'ISSUED' || ticket.status === 'ACTIVE'
                                                ? 'ticket_issued'
                                                : ticket.status === 'NO_SHOW'
                                                    ? 'no_show'
                                                    : 'ticket_issued'
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!ticket || ticket.status === 'CANCELLED' ? (
                            /* ----- Form to Issue Ticket ----- */
                            <div className="space-y-4">
                                {/* IF NO TRANSPORT REQUESTED: Show Activate Button */}
                                {!showTransportForm && !activateMode && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4 border-2 border-dashed border-gray-200 rounded-lg">
                                        <Bus className="h-12 w-12 text-gray-300" />
                                        <div className="text-center">
                                            <h3 className="text-lg font-medium text-gray-900">لم يتم طلب خدمة مواصلات</h3>
                                            <p className="text-sm text-gray-500">يمكنك تفعيل الخدمة وإصدار التذكرة الآن</p>
                                        </div>
                                        <Button onClick={() => { setActivateMode(true); setShowTransportForm(true); }} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                            تفعيل خدمة المواصلات
                                        </Button>
                                    </div>
                                )}

                                {/* Ticket Form (Visible if showTransportForm is true) */}
                                {(showTransportForm || activateMode) && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        {ticket?.status === 'CANCELLED' && (
                                            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border border-red-200">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 flex-shrink-0" />
                                                    <span>هذه التذكرة ملغية (رقم {ticket.ticketNumber}). يمكنك إصدار تذكرة جديدة.</span>
                                                </div>
                                                <ContextualMessageButton
                                                    applicant={applicant}
                                                    ticket={ticket}
                                                    trigger="ticket_cancelled"
                                                />
                                            </div>
                                        )}

                                        {/* Auto-Calculated Price Display */}
                                        {newRoutePrice > 0 && (
                                            <div className={cn(
                                                "border rounded-lg p-4 mb-4",
                                                voucherDiscount > 0 ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200" : "bg-green-50 border-green-200"
                                            )}>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-green-100 p-2 rounded-full">
                                                                <Badge variant="outline" className="bg-white border-green-300 text-green-700">
                                                                    {newRoutePrice.toLocaleString()} ر.ي
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-green-800">رسوم المواصلات</p>
                                                                <p className="text-xs text-green-600">
                                                                    المسار: {formData.departureLocation} ↔ {formData.arrivalLocation}
                                                                    ({applicant.transportType === 'ROUND_TRIP' ? "ذهاب وعودة" : "ذهاب فقط"})
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {voucherDiscount > 0 && (
                                                        <>
                                                            <div className="border-t border-dashed border-gray-300 pt-2"></div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">السعر الأصلي:</span>
                                                                <span className="font-medium">{newRoutePrice.toLocaleString()} ر.ي</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-green-600">خصم القسيمة:</span>
                                                                <span className="font-medium text-green-600">-{voucherDiscount.toLocaleString()} ر.ي</span>
                                                            </div>
                                                            <div className="border-t border-gray-300 pt-2"></div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-base font-bold text-gray-900">المبلغ النهائي:</span>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {Math.max(0, newRoutePrice - voucherDiscount).toLocaleString()} ر.ي
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}



                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>نوع الرحلة</Label>
                                                <Select
                                                    value={formData.tripType}
                                                    onValueChange={(val) => setFormData({ ...formData, tripType: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ONE_WAY">ذهاب فقط</SelectItem>
                                                        <SelectItem value="ROUND_TRIP">ذهاب وعودة</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>تاريخ السفر</Label>
                                                <CustomDatePicker
                                                    value={formData.departureDate ? new Date(formData.departureDate) : undefined}
                                                    onChange={(date) => {
                                                        const dateStr = date ? date.toISOString().split('T')[0] : "";
                                                        setFormData({ ...formData, departureDate: dateStr });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>شركة النقل</Label>
                                                <Input
                                                    value={formData.transportCompany}
                                                    onChange={(e) => setFormData({ ...formData, transportCompany: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>من مدينة</Label>
                                                <Select
                                                    value={formData.departureLocation}
                                                    onValueChange={(val) => setFormData({ ...formData, departureLocation: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="اختر مدينة الانطلاق" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {locations.map((loc) => (
                                                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>إلى مدينة</Label>
                                                <Input
                                                    value={formData.arrivalLocation}
                                                    onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
                                                    readOnly={viewMode === "setup"} // Lock destination in setup mode as per requirements?
                                                    className={viewMode === "setup" ? "bg-gray-50 text-gray-500" : ""}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رقم الباص (اختياري)</Label>
                                                <Input
                                                    value={formData.busNumber}
                                                    onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رقم المقعد (اختياري)</Label>
                                                <Input
                                                    value={formData.seatNumber}
                                                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                                                />
                                            </div>

                                            <Button onClick={handleIssueTicket} disabled={loading} className="col-span-2 w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                                                {loading ? "جاري الإصدار..." : "إصدار التذكرة وحفظ الرسوم"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ----- Ticket Details View ----- */
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-green-800 text-lg">تذكرة سفر رقم : {ticket.ticketNumber}</p>
                                        <p className="text-sm text-green-600 mb-1">
                                            {ticket.departureLocation} ➔ {ticket.arrivalLocation} | {new Date(ticket.departureDate).toLocaleDateString("ar-EG")}
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                            {applicant.transportType === 'ROUND_TRIP' ? "ذهاب وعودة" : "ذهاب فقط"}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                                            <Download className="h-4 w-4 ml-2" />
                                            تحميل PDF
                                        </Button>

                                        {/* Only show Cancel/Modify if Admin Mode */}
                                        {viewMode === "admin" && (
                                            <>
                                                {/* --- Modify Ticket Sheet Trigger --- */}
                                                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                                    <SheetTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                            <Edit className="h-4 w-4 ml-2" />
                                                            تعديل
                                                        </Button>
                                                    </SheetTrigger>
                                                    <SheetContent className="sm:max-w-md overflow-y-auto w-full">
                                                        <SheetHeader>
                                                            <SheetTitle className="flex items-center gap-2">
                                                                <Settings className="w-5 h-5 text-blue-600" />
                                                                تعديل التذكرة
                                                            </SheetTitle>
                                                            <SheetDescription>
                                                                قم بتعديل بيانات التذكرة أدناه. يرجى الانتباه للغرامات وفوارق الأسعار.
                                                            </SheetDescription>
                                                        </SheetHeader>

                                                        <div className="py-6 space-y-6">

                                                            {/* --- FINANCIAL SUMMARY SECTION --- */}
                                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                                                                <h4 className="font-semibold text-sm text-slate-700 mb-2">ملخص التكاليف</h4>

                                                                {/* Fine Row */}
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                                        <span className="text-slate-600">غرامة التعديل:</span>
                                                                    </div>
                                                                    <span className="font-medium">{calculatedFine.toLocaleString()} ر.ي</span>
                                                                </div>

                                                                {/* Price Diff Row */}
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <RefreshCw className="w-4 h-4 text-blue-500" />
                                                                        <span className="text-slate-600">فارق السعر:</span>
                                                                    </div>
                                                                    <span className={`font-medium ${priceDiff > 0 ? "text-blue-600" : priceDiff < 0 ? "text-green-600" : ""}`}>
                                                                        {priceDiff > 0 ? "+" : ""}{priceDiff.toLocaleString()} ر.ي
                                                                    </span>
                                                                </div>

                                                                <div className="border-t border-slate-200 my-2"></div>

                                                                {/* Total Row */}
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold text-slate-800">الإجمالي المستحق:</span>
                                                                    <span className={`font-bold text-lg ${(calculatedFine + priceDiff) > 0 ? "text-red-600" : (calculatedFine + priceDiff) < 0 ? "text-green-600" : "text-slate-700"}`}>
                                                                        {(calculatedFine + priceDiff).toLocaleString()} ر.ي
                                                                    </span>
                                                                </div>

                                                                {/* Policy Hint */}
                                                                {matchedPolicy && (
                                                                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 italic">
                                                                        * السياسة المطبقة: {matchedPolicy.condition || matchedPolicy.name}
                                                                    </div>
                                                                )}

                                                                {/* Debug/Info: Show old vs new price */}
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    السعر القديم: {originalRoutePrice} | السعر الجديد: {newRoutePrice}
                                                                </div>
                                                            </div>

                                                            {/* Edit Form */}
                                                            <div className="space-y-4 border-t pt-4">
                                                                {/* Trip Type Selector */}
                                                                <div className="space-y-2">
                                                                    <Label>نوع الرحلة</Label>
                                                                    <Select
                                                                        value={editForm.tripType}
                                                                        onValueChange={(val: "ONE_WAY" | "ROUND_TRIP") => setEditForm({ ...editForm, tripType: val })}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ONE_WAY">
                                                                                <div className="flex items-center gap-2">
                                                                                    <ArrowRight className="w-4 h-4" />
                                                                                    ذهاب فقط
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="ROUND_TRIP">
                                                                                <div className="flex items-center gap-2">
                                                                                    <ArrowLeftRight className="w-4 h-4" />
                                                                                    ذهاب وعودة (شاملة)
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <Label>نقطة الانطلاق</Label>
                                                                        <Select
                                                                            value={editForm.departureLocation}
                                                                            onValueChange={(val) => setEditForm({ ...editForm, departureLocation: val })}
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="اختر المدينة" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {locations.map((loc) => (
                                                                                    <SelectItem key={loc.id} value={loc.name}>
                                                                                        {loc.name}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>الوجهة</Label>
                                                                        <Select
                                                                            value={editForm.arrivalLocation}
                                                                            onValueChange={(val) => setEditForm({ ...editForm, arrivalLocation: val })}
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="اختر الوجهة" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {locations.map((loc) => (
                                                                                    <SelectItem key={loc.id} value={loc.name}>
                                                                                        {loc.name}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>تاريخ السفر الجديد</Label>
                                                                    <DatePicker
                                                                        date={editForm.departureDate ? new Date(editForm.departureDate) : undefined}
                                                                        setDate={(date) => {
                                                                            const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                                                            setEditForm({ ...editForm, departureDate: dateStr });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <Label>رقم الباص</Label>
                                                                        <Input
                                                                            value={editForm.busNumber}
                                                                            onChange={e => setEditForm({ ...editForm, busNumber: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>رقم المقعد</Label>
                                                                        <Input
                                                                            value={editForm.seatNumber}
                                                                            onChange={e => setEditForm({ ...editForm, seatNumber: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <SheetFooter className="flex-col sm:flex-row gap-2">
                                                            <Button onClick={handleUpdateTicket} disabled={loading || isCalculating} className="w-full bg-blue-600 hover:bg-blue-700">
                                                                <Save className="h-4 w-4 ml-2" />
                                                                {isCalculating ? "جاري الحساب..." : "تأكيد واستقطاع"}
                                                            </Button>
                                                            <SheetClose asChild>
                                                                <Button variant="ghost" className="w-full">إلغاء</Button>
                                                            </SheetClose>
                                                        </SheetFooter>
                                                    </SheetContent>
                                                </Sheet>

                                                <Button onClick={handleCancelTicket} variant="destructive" size="sm">
                                                    <XCircle className="h-4 w-4 ml-2" />
                                                    إلغاء التذكرة
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isReadOnly && (
                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>تم إصدار التذكرة. للتعديل أو الإلغاء يرجى الانتقال إلى صفحة الإدارة.</span>
                                    </div>
                                )}

                                {/* WhatsApp Button for Ticket Issued */}
                                {ticket && ticket.status !== 'CANCELLED' && (
                                    <div className="flex justify-center pt-4 border-t border-gray-100">
                                        <ContextualMessageButton
                                            applicant={applicant}
                                            ticket={ticket}
                                            trigger="ON_TICKET_ISSUED"
                                            variant="success"
                                            label="إرسال تفاصيل التذكرة"
                                            allowCustomAttachment={true}
                                            attachmentName="تذكرة السفر PDF"
                                            onSuccess={onUpdate}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
