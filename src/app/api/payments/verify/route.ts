import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { purchaseId, transactionRef, paymentMethod } = body;

        if (!purchaseId || !transactionRef) {
            return NextResponse.json({ error: "معرف الطلب ورقم العملية مطلوبة" }, { status: 400 });
        }

        const cleanRef = transactionRef.trim();

        // 1. Find the purchase request
        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId },
            include: { package: true }
        });

        if (!purchase) {
            return NextResponse.json({ error: "طلب الدفع غير موجود" }, { status: 404 });
        }

        // If already paid, return success immediately
        if (purchase.isPaid || purchase.status === "PAID") {
            return NextResponse.json({
                success: true,
                isMatched: true,
                message: "تم تفعيل هذا الاشتراك مسبقاً وهو نشط حالياً."
            });
        }

        // 2. Prevent Double Spending (Check if transactionRef is already used)
        const duplicateRef = await prisma.mockExamPurchase.findFirst({
            where: {
                transactionRef: cleanRef,
                NOT: { id: purchaseId }
            }
        });

        if (duplicateRef) {
            return NextResponse.json({ error: "رقم هذه العملية مستخدم بالفعل لتفعيل طلب آخر. يرجى مراجعة الدعم الفني." }, { status: 400 });
        }

        // Update the purchase with the reference number and transition to awaiting verification
        await prisma.mockExamPurchase.update({
            where: { id: purchaseId },
            data: {
                transactionRef: cleanRef,
                status: "AWAITING_VERIFICATION",
                paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined
            }
        });

        // 3. Proactive SMS Matching (Check if SMS webhook already arrived before customer submitted reference!)
        const matchingSms = await prisma.smsTransaction.findFirst({
            where: {
                transactionNumber: cleanRef,
                amount: purchase.amount,
                isMatched: false
            }
        });

        if (matchingSms) {
            // Perfect Match found! Auto-activate immediately
            await prisma.$transaction([
                // Update SMS Transaction
                prisma.smsTransaction.update({
                    where: { id: matchingSms.id },
                    data: {
                        isMatched: true,
                        matchedPurchaseId: purchaseId
                    }
                }),
                // Update MockExamPurchase to PAID
                prisma.mockExamPurchase.update({
                    where: { id: purchaseId },
                    data: {
                        isPaid: true,
                        status: "PAID",
                        activatedAt: new Date(),
                        paymentNote: `تفعيل تلقائي مبكر - مطابقة فورية لرسالة ${matchingSms.walletName || "المحفظة"} رقم العملية ${cleanRef}`
                    }
                })
            ]);

            // Trigger activation message asynchronously (fire-and-forget)
            import("@/lib/autoSendMessage").then((m) => {
                m.sendMockPackageActivationMessage(purchaseId).catch((err) => {
                    console.error("Failed to send mock package activation message in verify/route:", err);
                });
            });

            return NextResponse.json({
                success: true,
                isMatched: true,
                message: "تهانينا! تم مطابقة الحوالة وتفعيل باقتك تلقائياً بنجاح فوري!"
            });
        }

        // Standard case: Reference saved, awaiting SMS webhook delivery
        return NextResponse.json({
            success: true,
            isMatched: false,
            message: "تم تسجيل رقم العملية بنجاح. بانتظار وصول تأكيد رسالة الـ SMS للمطابقة وتفعيل حسابك تلقائياً."
        });

    } catch (error) {
        console.error("POST Verify Payment Error:", error);
        return NextResponse.json({ error: "فشل في تسجيل رقم العملية للتحقق" }, { status: 500 });
    }
}
