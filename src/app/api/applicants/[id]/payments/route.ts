import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { applicantId, amount, notes } = body;

        // Create payment transaction
        const transaction = await prisma.transaction.create({
            data: {
                applicantId,
                amount,
                type: "PAYMENT",
                category: "دفعة",
                description: notes || "دفعة من العميل",
                notes,
            },
        });

        // Get updated applicant with all transactions
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            include: {
                transactions: {
                    where: { type: "PAYMENT" },
                    orderBy: { date: "desc" },
                },
            },
        });

        // Calculate totals
        const totalPaid = applicant?.transactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        ) || 0;

        // Update applicant's amountPaid and remainingBalance
        const updated = await prisma.applicant.update({
            where: { id: applicantId },
            data: {
                amountPaid: totalPaid,
                remainingBalance: Number(applicant!.totalAmount) - totalPaid,
            },
        });

        // Log activity
        // Log activity (safely)
        try {
            await prisma.activityLog.create({
                data: {
                    action: "PAYMENT_ADDED",
                    details: `تم إضافة دفعة بمبلغ ${amount} ر.ي`,
                    applicantId,
                    ...(session?.user?.id && { userId: session.user.id }),
                },
            });
        } catch (logError) {
            console.error("Failed to log payment activity (likely invalid User ID in session):", logError);
            // Continue execution - do not fail the request just because logging failed
        }

        return NextResponse.json({
            transaction,
            totalPaid,
            remainingBalance: updated.remainingBalance,
        });
    } catch (error) {
        console.error("Payment Creation Error:", error);
        return NextResponse.json(
            { error: "Failed to add payment" },
            { status: 500 }
        );
    }
}
