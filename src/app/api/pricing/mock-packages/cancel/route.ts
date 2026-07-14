import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { purchaseId } = body;

        if (!purchaseId) {
            return NextResponse.json({ error: "معرف عملية الشراء مطلوب" }, { status: 400 });
        }

        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId },
            include: { package: true }
        });

        if (!purchase) {
            return NextResponse.json({ error: "عملية الشراء غير موجودة" }, { status: 404 });
        }

        if (purchase.status === "CANCELLED") {
            return NextResponse.json({ error: "هذه الباقة معطلة بالفعل" }, { status: 400 });
        }

        const totalCredits = purchase.totalCredits;
        const usedCredits = purchase.usedCredits;
        const remainingCredits = Math.max(0, totalCredits - usedCredits);
        const remainingRatio = totalCredits > 0 ? remainingCredits / totalCredits : 0;

        // Base mock refund
        const mockRefund = Number(purchase.amount) * remainingRatio;

        let registrationRefund = 0;
        let transportRefund = 0;
        let applicant = null;

        if (purchase.applicantId) {
            applicant = await prisma.applicant.findUnique({
                where: { id: purchase.applicantId },
                include: { ticket: true }
            });
        }

        if (applicant) {
            // Check if package includes registration
            if (purchase.package?.includesRegistration) {
                const isExamConfirmed = applicant.examDate !== null || 
                    ["EXAM_SCHEDULED", "AWAITING_EXAM", "ATTENDED_EXAM", "PASSED", "FAILED"].includes(applicant.status);
                
                if (!isExamConfirmed) {
                    // Refund registration fee - look up registration charge transaction
                    const regTx = await prisma.transaction.findFirst({
                        where: { applicantId: applicant.id, type: "CHARGE", category: "REGISTRATION_FEE" }
                    });
                    if (regTx) {
                        registrationRefund = Number(regTx.amount);
                    } else {
                        // Fallback to package registration discount or default
                        registrationRefund = Number(purchase.package.registrationDiscount || 0);
                    }
                }
            }

            // Check if package includes transport
            if (purchase.package?.includesTransport) {
                const isTransportConfirmed = applicant.ticket !== null;

                if (!isTransportConfirmed) {
                    // Refund transport fee - look up transport charge transaction
                    const transTx = await prisma.transaction.findFirst({
                        where: { applicantId: applicant.id, type: "CHARGE", category: "TRANSPORT_FEE" }
                    });
                    if (transTx) {
                        transportRefund = Number(transTx.amount);
                    } else {
                        transportRefund = Number(purchase.package.transportDiscount || 0);
                    }
                }
            }
        }

        const totalRefund = mockRefund + registrationRefund + transportRefund;

        // Perform cancellation in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update purchase status
            const updatedPurchase = await tx.mockExamPurchase.update({
                where: { id: purchaseId },
                data: { status: "CANCELLED" }
            });

            let cashRefund = 0;
            let debtWaiver = 0;

            if (applicant) {
                const amountPaid = Number(applicant.amountPaid);
                const totalAmount = Number(applicant.totalAmount);

                const newTotalAmount = Math.max(0, totalAmount - totalRefund);
                cashRefund = Math.max(0, amountPaid - newTotalAmount);
                debtWaiver = totalRefund - cashRefund;

                const newAmountPaid = Math.max(0, amountPaid - cashRefund);
                const newRemainingBalance = Math.max(0, newTotalAmount - newAmountPaid);

                // 2. Update applicant balance
                await tx.applicant.update({
                    where: { id: applicant.id },
                    data: {
                        totalAmount: newTotalAmount,
                        amountPaid: newAmountPaid,
                        remainingBalance: newRemainingBalance
                    }
                });

                // 3. Log a refund transaction
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: cashRefund,
                        type: "WITHDRAWAL",
                        notes: `تعطيل باقة (${purchase.package?.name || 'مخصصة'}) | مسترجع نقدي: ${cashRefund.toLocaleString()} ر.ي | خصم مستحقات: ${debtWaiver.toLocaleString()} ر.ي | متبقي محاولات: ${remainingCredits}/${totalCredits}`,
                        category: "CLIENT_REFUND",
                        locationId: applicant.locationId
                    }
                });

                // 4. Log Activity
                await tx.activityLog.create({
                    data: {
                        action: "PACKAGE_CANCEL",
                        details: `تعطيل الباقة للمتقدم ${applicant.fullName} - مسترجع كلي: ${totalRefund.toLocaleString()} ر.ي (نقدي: ${cashRefund.toLocaleString()}, إعفاء دين: ${debtWaiver.toLocaleString()})`,
                        applicantId: applicant.id
                    }
                });
            } else {
                // Visitor refund
                cashRefund = totalRefund;
                
                // Create a refund transaction with no applicant
                await tx.transaction.create({
                    data: {
                        amount: cashRefund,
                        type: "WITHDRAWAL",
                        notes: `تعطيل باقة لزائر (${purchase.phone}) - مسترجع نقدي: ${cashRefund.toLocaleString()} ر.ي | متبقي محاولات: ${remainingCredits}/${totalCredits}`,
                        category: "CLIENT_REFUND",
                    }
                });

                await tx.activityLog.create({
                    data: {
                        action: "PACKAGE_CANCEL",
                        details: `تعطيل الباقة لزائر (${purchase.phone}) - مسترجع نقدي: ${cashRefund.toLocaleString()} ر.ي`
                    }
                });
            }

            return {
                purchase: updatedPurchase,
                totalRefund,
                cashRefund,
                debtWaiver
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error cancelling package:", error);
        return NextResponse.json({ error: "فشل في تعطيل الباقة" }, { status: 500 });
    }
}
