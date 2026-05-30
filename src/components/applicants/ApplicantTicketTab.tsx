"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Bus } from "lucide-react";
import { ExtendedApplicant, Ticket } from "@/types/applicant";
import { useApplicantTicket } from "@/hooks/applicants/useApplicantTicket";
import { ActiveTicketView } from "./ticket/ActiveTicketView";
import { TripSearchForm } from "./ticket/TripSearchForm";
import { TripResultsList } from "./ticket/TripResultsList";
import { BookingReviewSheet } from "./ticket/BookingReviewSheet";

interface ApplicantTicketTabProps {
    applicant: ExtendedApplicant;
    ticket: Ticket | null;
    onUpdate: () => void;
    viewMode?: "setup" | "admin";
    cancellationPolicies?: any[];
}

export function ApplicantTicketTab({
    applicant,
    ticket,
    onUpdate,
    viewMode = "admin"
}: ApplicantTicketTabProps) {
    const hook = useApplicantTicket({ applicant, ticket, onUpdate });
    const {
        ticketRef,
        loading,
        hasSearched,
        step,
        handleRequestTransport,
        handleDownloadPDF
    } = hook;

    // If ticket is already booked and active, show ticket details instead of booking form
    if (ticket && (ticket.status === 'ISSUED' || ticket.status === 'ACTIVE')) {
        return (
            <ActiveTicketView
                applicant={applicant}
                ticket={ticket}
                ticketRef={ticketRef}
                handleDownloadPDF={handleDownloadPDF}
                onUpdate={onUpdate}
            />
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

            {/* Search Form (Only show if step 1) */}
            {step === 1 && <TripSearchForm hook={hook} />}

            {/* Results (Step 2 or 3) */}
            {(step === 2 || step === 3) && hasSearched && <TripResultsList hook={hook} />}

            {/* Confirmation Sheet (Review - Step 4) */}
            <BookingReviewSheet hook={hook} />
        </div>
    );
}
