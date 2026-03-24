import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, amount, description, applicantId, category, relatedLocation, notes, discountAmount } = body;

        // Fetch applicant name for rich description if linked
        let applicantLabel = '';
        let applicantLocationId: string | null = null;
        if (applicantId) {
            const appInfo = await prisma.applicant.findUnique({
                where: { id: applicantId },
                select: { fullName: true, applicantCode: true, locationId: true, profession: true }
            });
            if (appInfo) {
                applicantLabel = `${appInfo.fullName}${appInfo.applicantCode ? ` (${appInfo.applicantCode})` : ''}`;
                applicantLocationId = appInfo.locationId;
            }
        }

        // Build rich description based on type
        let richDescription = description || '';
        if (!richDescription || richDescription === description) {
            const typeLabel = type === "PAYMENT" ? "سند قبض" : type === "WITHDRAWAL" ? "إرجاع/مسحوبات" : "مصروف";
            if (applicantLabel) {
                const discountNote = discountAmount && Number(discountAmount) > 0 ? ` | خصم: ${Number(discountAmount).toLocaleString()} ر.ي` : '';
                richDescription = `${typeLabel} من ${applicantLabel} - المبلغ: ${Number(amount).toLocaleString()} ر.ي${discountNote}${description ? ` - ${description}` : ''}`;
            } else if (description) {
                richDescription = `${typeLabel} - ${description} - المبلغ: ${Number(amount).toLocaleString()} ر.ي`;
            }
        }

        // Determine category
        const resolvedCategory = category || (type === "PAYMENT" ? "CLIENT_PAYMENT" : type === "WITHDRAWAL" ? "CLIENT_REFUND" : "GENERAL_EXPENSE");

        // Start a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create the Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    type, // PAYMENT, EXPENSE, WITHDRAWAL
                    amount,
                    category: resolvedCategory,
                    description: richDescription,
                    relatedLocation: relatedLocation || null,
                    notes,
                    applicantId: applicantId || null,
                    locationId: applicantLocationId,
                },
            });

            // 2. If valid Applicant & Payment/Refund, update Applicant Balance
            if (applicantId && (type === "PAYMENT" || type === "REFUND")) {
                const applicant = await tx.applicant.findUnique({ where: { id: applicantId } });

                if (applicant) {
                    let newAmountPaid = Number(applicant.amountPaid);
                    let currentDiscount = Number(applicant.discount);
                    let currentTotal = Number(applicant.totalAmount);

                    if (type === "PAYMENT") {
                        newAmountPaid += Number(amount);
                    } else if (type === "REFUND") {
                        newAmountPaid -= Number(amount);
                    }

                    // Apply discount if provided
                    const disc = Number(discountAmount || 0);
                    if (disc > 0) {
                        currentDiscount += disc;
                        currentTotal -= disc;
                    }

                    const newBalance = currentTotal - newAmountPaid;

                    await tx.applicant.update({
                        where: { id: applicantId },
                        data: {
                            amountPaid: newAmountPaid,
                            totalAmount: currentTotal,
                            discount: currentDiscount,
                            remainingBalance: newBalance,
                        },
                    });
                }
            }
            return transaction;
        });

        // Log activity outside transaction (non-blocking)
        const typeLabels: Record<string, string> = {
            "PAYMENT": "سند قبض",
            "WITHDRAWAL": "سند صرف / إرجاع",
            "EXPENSE": "مصروف تشغيلي"
        };
        await prisma.activityLog.create({
            data: {
                action: `TRANSACTION_${body.type}`,
                details: `${typeLabels[body.type] || body.type}: ${Number(body.amount).toLocaleString()} ر.ي${applicantLabel ? ` - ${applicantLabel}` : ''} - ${description || 'بدون وصف'}`,
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
