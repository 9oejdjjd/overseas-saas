import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Restrict to Admin, Registration Staff, and Accountant
        if (!session || !["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { purchaseId, action, reason } = body;

        if (!purchaseId || !action) {
            return NextResponse.json({ error: "معرف الطلب والإجراء مطلوبان" }, { status: 400 });
        }

        if (action !== "APPROVE" && action !== "REJECT") {
            return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
        }

        // Fetch purchase record
        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId },
            include: { package: true }
        });

        if (!purchase) {
            return NextResponse.json({ error: "طلب الدفع غير موجود" }, { status: 404 });
        }

        if (purchase.isPaid && action === "APPROVE") {
            return NextResponse.json({ error: "هذا الطلب مدفوع ومفعل بالفعل" }, { status: 400 });
        }

        const reviewerId = (session.user as any).id || null;

        if (action === "APPROVE") {
            // ── APPROVE ACTION ──
            await prisma.$transaction(async (tx) => {
                // 1. Update purchase status
                await tx.mockExamPurchase.update({
                    where: { id: purchaseId },
                    data: {
                        isPaid: true,
                        status: "PAID",
                        activatedAt: new Date(),
                        reviewedById: reviewerId,
                        paymentNote: "تم التنشيط والقبول يدوياً من موظف خدمة العملاء"
                    }
                });

                // 2. Ensure visitor has a verified OTP record instantly
                await tx.mockVisitorOtp.upsert({
                    where: { phone: purchase.phone },
                    update: { verified: true },
                    create: { 
                        phone: purchase.phone, 
                        code: "000000", 
                        expiresAt: new Date(), 
                        verified: true 
                    }
                });

                // 3. Log to ActivityLog for audit trail
                await tx.activityLog.create({
                    data: {
                        action: "APPROVE_PAYMENT",
                        details: `تم تفعيل الباقة [${purchase.package?.name || "اختبارات مفردة"}] يدوياً للمشترك [${purchase.buyerName || purchase.phone}] - بقيمة ${Number(purchase.amount).toLocaleString()} ${purchase.currency === 'SAR' ? 'ر.س' : 'ر.ي'}`,
                        userId: reviewerId,
                        applicantId: purchase.applicantId || null
                    }
                });

                // 4. Resolve Location ID if applicant is linked
                let locationId = null;
                if (purchase.applicantId) {
                    const applicant = await tx.applicant.findUnique({
                        where: { id: purchase.applicantId },
                        select: { locationId: true }
                    });
                    if (applicant) {
                        locationId = applicant.locationId;
                    }
                }

                // 5. Record CHARGE transaction for ledger
                await tx.transaction.create({
                    data: {
                        applicantId: purchase.applicantId || null,
                        amount: purchase.amount,
                        type: "CHARGE",
                        category: "MOCK_EXAM_FEE",
                        description: `رسوم شراء باقة اختبارات تجريبية (${purchase.package?.name || 'فردية'}) للمشترك (${purchase.buyerName || purchase.phone})`,
                        notes: "شراء باقة اختبارات",
                        locationId: locationId
                    }
                });

                // 6. Record PAYMENT transaction for ledger
                await tx.transaction.create({
                    data: {
                        applicantId: purchase.applicantId || null,
                        amount: purchase.amount,
                        type: "PAYMENT",
                        category: "MOCK_EXAM_PURCHASE",
                        description: `رسوم اشتراك في باقة (${purchase.package?.name || "اختبارات مفردة"}) للمستفيد (${purchase.buyerName || purchase.phone}) عبر محفظة (${purchase.paymentMethod || "غير محدد"}) بقيمة (${Number(purchase.amount)} ${purchase.currency === 'SAR' ? 'ر.س' : 'ر.ي'}) رقم العملية (${purchase.transactionRef || "غير محدد"})`,
                        notes: "سداد باقة اختبارات",
                        locationId: locationId
                    }
                });

                // 7. Record EXPENSE transaction for ledger (if package has actual cost > 0)
                if (purchase.package && Number(purchase.package.actualCost) > 0) {
                    await tx.transaction.create({
                        data: {
                            applicantId: purchase.applicantId || null,
                            amount: purchase.package.actualCost,
                            type: "EXPENSE",
                            category: "MOCK_EXAM_COST",
                            description: `التكلفة التشغيلية الفعلية لباقة الاختبار التجريبي (${purchase.package.name}) للمشترك (${purchase.buyerName || purchase.phone})`,
                            notes: "تكلفة باقة اختبار",
                            locationId: locationId
                        }
                    });
                }
            });

            // Trigger activation message asynchronously (fire-and-forget)
            import("@/lib/autoSendMessage").then((m) => {
                m.sendMockPackageActivationMessage(purchaseId).catch((err) => {
                    console.error("Failed to send mock package activation message in review/route:", err);
                });
            });

            return NextResponse.json({
                success: true,
                message: "تم تفعيل الاشتراك للمشترك بنجاح وتوثيق العملية."
            });

        } else {
            // ── REJECT ACTION ──
            if (!reason || !reason.trim()) {
                return NextResponse.json({ error: "سبب الرفض مطلوب للإجراء" }, { status: 400 });
            }

            await prisma.$transaction([
                // 1. Update purchase status to REJECTED & release transactionRef constraint
                prisma.mockExamPurchase.update({
                    where: { id: purchaseId },
                    data: {
                        status: "REJECTED",
                        rejectedReason: reason.trim(),
                        reviewedById: reviewerId,
                        transactionRef: purchase.transactionRef ? `${purchase.transactionRef}-REJECTED-${Date.now()}` : null
                    }
                }),
                // 2. Log to ActivityLog for audit trail
                prisma.activityLog.create({
                    data: {
                        action: "REJECT_PAYMENT",
                        details: `تم رفض تفعيل الباقة للمشترك [${purchase.buyerName || purchase.phone}] - السبب: ${reason.trim()}`,
                        userId: reviewerId,
                        applicantId: purchase.applicantId || null
                    }
                })
            ]);

            return NextResponse.json({
                success: true,
                message: "تم رفض الطلب بنجاح وتوثيق سبب الرفض."
            });
        }

    } catch (error) {
        console.error("POST Review Payment Error:", error);
        return NextResponse.json({ error: "فشل في معالجة مراجعة الدفع" }, { status: 500 });
    }
}
