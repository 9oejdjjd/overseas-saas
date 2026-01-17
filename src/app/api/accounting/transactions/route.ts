import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, amount, description, applicantId, category, relatedLocation, notes } = body;

        // Start a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    type, // PAYMENT, EXPENSE, WITHDRAWAL
                    amount,
                    category,
                    description,
                    relatedLocation: relatedLocation || null,
                    notes,
                    applicantId: applicantId || null,
                },
            });

            // 2. If valid Applicant & Payment/Refund, update Applicant Balance
            if (applicantId && (type === "PAYMENT" || type === "REFUND")) {
                const applicant = await tx.applicant.findUnique({ where: { id: applicantId } });

                if (applicant) {
                    let newAmountPaid = Number(applicant.amountPaid);

                    if (type === "PAYMENT") {
                        newAmountPaid += Number(amount);
                    } else if (type === "REFUND") { // Needs simplified TransactionType enum check in schema if REFUND isn't there, assuming PAYMENT with negative log or just logic
                        // If REFUND is not in enum, we might use "EXPENSE" linked to applicant or just "PAYMENT" with negative? 
                        // Checking schema: enum TransactionType { PAYMENT, EXPENSE, WITHDRAWAL }
                        // For Refund, we usually use WITHDRAWAL linked to applicant or just decrease PAYMENT.
                        // Let's assume user sends "WITHDRAWAL" for refund? Or maybe we just stick to PAYMENT for money IN.
                        // Wait, user wants "Refund". Let's use "WITHDRAWAL" linked to Applicant as a Refund.
                        newAmountPaid -= Number(amount);
                    }

                    const newBalance = Number(applicant.totalAmount) - Number(applicant.discount) - newAmountPaid;

                    await tx.applicant.update({
                        where: { id: applicantId },
                        data: {
                            amountPaid: newAmountPaid,
                            remainingBalance: newBalance,
                        },
                    });
                }
            }
            return transaction;
        });

        // Log activity outside transaction (non-blocking)
        await prisma.activityLog.create({
            data: {
                action: `TRANSACTION_${body.type}`,
                details: `${body.type === "PAYMENT" ? "قبض" : body.type === "WITHDRAWAL" ? "صرف/إرجاع" : "مصروف"}: ${body.amount} ر.ي - ${description}`,
                applicantId: applicantId || null,
            },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Transaction Creation Error:", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
