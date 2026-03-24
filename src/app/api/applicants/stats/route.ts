import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(now.getDate() - 3);

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const [pendingPayment, missingTicket, expiringPassport] = await prisma.$transaction([
            // 1. Pending Payment: Registered > 3 days ago AND Remaining > 0
            prisma.applicant.count({
                where: {
                    createdAt: { lt: threeDaysAgo },
                    remainingBalance: { gt: 0 }
                }
            }),
            // 2. Missing Ticket: Has transportation AND Exam in < 3 days AND No ticket assigned
            prisma.applicant.count({
                where: {
                    hasTransportation: true,
                    examDate: {
                        gte: now.toISOString(),
                        lte: threeDaysFromNow.toISOString()
                    },
                    ticket: { is: null }
                }
            }),
            // 3. Passport Expiring Soon
            prisma.applicant.count({
                where: {
                    passportExpiry: {
                        gte: now,
                        lte: thirtyDaysFromNow
                    }
                }
            })
        ]);

        return NextResponse.json({
            pendingPayment,
            missingTicket,
            expiringPassport
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
