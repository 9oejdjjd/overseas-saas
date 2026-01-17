export type Applicant = {
    id: string;
    fullName: string;
    profession?: string | null;
    phone: string;
    whatsappNumber: string;
    platformEmail?: string | null;
    platformPassword?: string | null;
    examDate?: string | null;
    examTime?: string | null;
    examLocation: string;
    status: string;

    // New Fields
    firstName?: string | null;
    lastName?: string | null;
    passportNumber?: string | null;
    passportExpiry?: string | null;
    nationalId?: string | null;
    dob?: string | null;
    applicantType?: string | null;
    gender?: string | null;

    notes?: string | null;
    hasTransportation: boolean;
    travelDate?: string | null;
    totalAmount: number;
    discount: number;
    amountPaid: number;
    remainingBalance: number;
    createdAt: string;
    transportFromId?: string | null;
    locationId?: string | null;
    applicantCode?: string | null; // PNR Field
};

export type Transaction = {
    id: string;
    amount: number;
    type: string; // PAYMENT, EXPENSE, WITHDRAWAL
    date: string;
    notes?: string | null;
};

export type Ticket = {
    id: string;
    ticketNumber: string;
    busNumber?: string | null;
    seatNumber?: string | null;
    departureDate: string;
    departureTime?: string | null;
    arrivalTime?: string | null;
    departureLocation: string;
    arrivalLocation: string;
    transportCompany: string;
    status: string;
    createdAt: string;
    applicantCode?: string | null;
};

export type ActivityLog = {
    id: string;
    action: string;
    details: string | null;
    timestamp: string;
    user?: { name: string } | null;
};

// Define extended type to include relations
export interface ExtendedApplicant extends Applicant {
    locationId?: string | null;
    location?: {
        id: string;
        name: string;
        code?: string;
        address?: string | null;
        locationUrl?: string | null;
    } | null;
    transportFrom?: { id: string; name: string } | null;
    transportType?: string | null;

    // Policy Info attached by API
    reschedulePolicy?: {
        maxFreeChanges: number;
        rescheduleCount: number;
        changeFee: number;
    } | null;
}
