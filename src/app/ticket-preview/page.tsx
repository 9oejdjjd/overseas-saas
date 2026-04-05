"use client";

import React from 'react';
import TransportTicketDesign from '@/components/TransportTicketDesign';

export default function TicketPreviewPage() {
  const mockApplicant = { applicantCode: 'B7X9Q2', passportNumber: 'A12345678', fullName: 'أحمد محمود صالح' };
  const mockTicket = { 
      ticketNumber: '702-88192033', agentName: 'مكتب سفريات اليمن',
      departureDate: '2026-04-15', departureLocation: 'صنعاء', arrivalLocation: 'عدن', 
      boardingPoint: 'محطة النقل البري - الستين', busNumber: 'YE-101',
      trip: { departureTime: '08:00', arrivalTime: '16:00', tripNumber: 'YE-101', date: '2026-04-15', stops: [] },
      returnTrip: { departureTime: '09:00', arrivalTime: '17:00', tripNumber: 'YE-102', date: '2026-04-20', stops: [] }
  };
  
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 border-none p-8 flex justify-center items-start">
      <TransportTicketDesign 
          ticket={mockTicket} 
          applicant={mockApplicant} 
          passengerName={mockApplicant.fullName} 
          passportNumber={mockApplicant.passportNumber} 
          ticketNumber={mockTicket.ticketNumber} 
          isRoundTrip={true} 
      />
    </div>
  );
}
