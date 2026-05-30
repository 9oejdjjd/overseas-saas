"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, Download } from "lucide-react";
import { ExtendedApplicant, Ticket } from "@/types/applicant";
import { PrintableTicketsWrapper } from "@/components/PrintableTicketsWrapper";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

interface ActiveTicketViewProps {
    applicant: ExtendedApplicant;
    ticket: Ticket;
    ticketRef: React.RefObject<HTMLDivElement | null>;
    handleDownloadPDF: () => Promise<void>;
    onUpdate: () => void;
}

export function ActiveTicketView({
    applicant,
    ticket,
    ticketRef,
    handleDownloadPDF,
    onUpdate
}: ActiveTicketViewProps) {
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

                    {/* WhatsApp Button */}
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
