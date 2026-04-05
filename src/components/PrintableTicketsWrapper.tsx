import React, { forwardRef } from 'react';
import TransportTicketDesign from './TransportTicketDesign';

interface PrintableTicketsWrapperProps {
  ticket: any;
  applicant: any;
  tripType: string;
}

export const PrintableTicketsWrapper = forwardRef<HTMLDivElement, PrintableTicketsWrapperProps>(({ ticket, applicant, tripType }, ref) => {
  const isRoundTrip = tripType === 'round-trip' || tripType === 'ROUND_TRIP';
  
  // Companions data comes from ticket.companions (JSON array)
  const companions = ticket?.companions && Array.isArray(ticket.companions) ? ticket.companions : [];

  return (
    <div ref={ref} className="printable-tickets-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .printable-tickets-wrapper > .ticket-page {
            page-break-after: always;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .printable-tickets-wrapper > .ticket-page:last-child {
            page-break-after: auto;
          }
        }
      `}} />
      
      {/* 1. Main Applicant Ticket */}
      <TransportTicketDesign
        ticket={ticket}
        applicant={applicant}
        passengerName={applicant.fullName}
        passportNumber={applicant.passportNumber}
        ticketNumber={ticket.ticketNumber}
        isRoundTrip={isRoundTrip}
      />

      {/* 2. Companions Tickets */}
      {companions.map((comp: any, idx: number) => (
        <TransportTicketDesign
          key={idx}
          ticket={ticket}
          applicant={applicant}
          passengerName={comp.name}
          passportNumber="غير محدد (مرافق)"
          ticketNumber={comp.ticketNumber}
          isRoundTrip={isRoundTrip}
        />
      ))}
    </div>
  );
});

PrintableTicketsWrapper.displayName = 'PrintableTicketsWrapper';
