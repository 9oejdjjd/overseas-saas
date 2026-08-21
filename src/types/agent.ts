export interface AgentClient {
    id: string;
    fullName: string;
    phone: string;
    whatsappNumber: string;
    email: string | null;
    profession: string | null;
    nationalId: string | null;
    passportNumber: string | null;
    notes: string | null;
    createdAt: string;
    _count?: {
        examOrders: number;
    };
    examOrders?: AgentExamOrder[];
}

export interface AgentProfession {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    examDuration: number;
    questionCount: number;
    passingScore: number;
    isActive: boolean;
}

export interface AgentExamOrder {
    id: string;
    createdAt: string;
    status: string; // PENDING, SENT, STARTED, COMPLETED, EXPIRED, CANCELLED
    examPrice: number;
    score: number | null;
    isPassed: boolean | null;
    examLink?: string;
    client: {
        id?: string;
        fullName: string;
        phone?: string;
        whatsappNumber?: string;
    };
    profession: {
        id?: string;
        name: string;
    };
}

export interface AgentWalletTransaction {
    id: string;
    type: string; // DEPOSIT, EXAM_PURCHASE, REFUND, BONUS, ADJUSTMENT
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string | null;
    orderId?: string | null;
    createdAt: string;
}

export interface TravelAgent {
    id: string;
    companyName: string;
    ownerName: string;
    phone: string;
    email: string;
    whatsappNumber: string | null;
    address: string | null;
    city: string | null;
    licenseNumber: string | null;
    commissionRate: number;
    walletBalance: number;
    totalDeposited: number;
    totalSpent: number;
    status: "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
    allowDebt: boolean;
    debtLimit: number;
    createdAt: string;
}

export interface AgentUser {
    id: string;
    name: string;
    email: string;
    active: boolean;
    isAgentOwner: boolean;
    createdAt: string;
}
