import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { amount, reason } = body;

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json({ error: "يجب تحديد مبلغ الإعفاء" }, { status: 400 });
        }

        const applicant = await prisma.applicant.findUnique({
            where: { id },
            select: {
                fullName: true, applicantCode: true,
                totalAmount: true, remainingBalance: true, discount: true, locationId: true
            }
        });

        if (!applicant) {
            return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
        }

        const waiveAmount = Math.min(Number(amount), Number(applicant.remainingBalance));
        if (waiveAmount <= 0) {
            return NextResponse.json({ error: "لا يوجد رصيد مستحق للإعفاء" }, { status: 400 });
        }

        const applicantLabel = `${applicant.fullName}${applicant.applicantCode ? ` (${applicant.applicantCode})` : ''}`;

        // Transaction: update applicant + create log + create transaction record
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Update applicant balances
            const newTotal = Number(applicant.totalAmount) - waiveAmount;
            const newDiscount = Number(applicant.discount) + waiveAmount;
            const newBalance = Number(applicant.remainingBalance) - waiveAmount;

            const updated = await tx.applicant.update({
                where: { id },
                data: {
                    totalAmount: newTotal,
                    discount: newDiscount,
                    remainingBalance: newBalance,
                }
            });

            // 2. Create a WITHDRAWAL transaction for accounting records
            await tx.transaction.create({
                data: {
                    applicantId: id,
                    amount: waiveAmount,
                    type: "WITHDRAWAL",
                    category: "DEBT_WAIVER",
                    description: `إعفاء مالي لـ ${applicantLabel} - المبلغ: ${waiveAmount.toLocaleString()} ر.ي${reason ? ` - السبب: ${reason}` : ''}`,
                    notes: reason || "إعفاء من مبلغ مستحق",
                    locationId: applicant.locationId || null,
                }
            });

            // 3. Log activity
            await tx.activityLog.create({
                data: {
                    action: "DEBT_WAIVED",
                    details: `تم إعفاء ${waiveAmount.toLocaleString()} ر.ي - ${reason || 'بدون سبب محدد'}`,
                    applicantId: id,
                }
            });

            return updated;
        });

        return NextResponse.json({
            success: true,
            waivedAmount: waiveAmount,
            newBalance: result.remainingBalance,
        });
    } catch (error) {
        console.error("Waive Error:", error);
        return NextResponse.json({ error: "فشل في إجراء الإعفاء" }, { status: 500 });
    }
}
