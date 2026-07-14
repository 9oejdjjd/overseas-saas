import prisma from "@/lib/prisma";
import { parseSms } from "./smsParser";

/**
 * Matching and Auto-Activation Engine
 * Matches SMS transactions with pending purchases and activates subscriptions in real-time.
 */
export async function matchSmsAndActivate(smsTransactionId: string): Promise<boolean> {
    try {
        // 1. Retrieve the SMS transaction
        const sms = await prisma.smsTransaction.findUnique({
            where: { id: smsTransactionId }
        });

        if (!sms || sms.isMatched || !sms.transactionNumber || !sms.amount) {
            return false;
        }

        // 2. Search for a pending purchase matching this transactionRef and amount
        const purchase = await prisma.mockExamPurchase.findFirst({
            where: {
                transactionRef: sms.transactionNumber,
                amount: sms.amount,
                status: "AWAITING_VERIFICATION",
                isPaid: false
            },
            include: { package: true }
        });

        if (!purchase) {
            console.log(`Auto-matching: No matching pending purchase found for transaction [${sms.transactionNumber}] with amount [${sms.amount}] YER yet.`);
            return false;
        }

        // 3. Match Found! Execute atomic activation inside a Prisma transaction
        await prisma.$transaction([
            // A. Mark SMS as matched
            prisma.smsTransaction.update({
                where: { id: sms.id },
                data: {
                    isMatched: true,
                    matchedPurchaseId: purchase.id
                }
            }),
            // B. Mark MockExamPurchase as PAID
            prisma.mockExamPurchase.update({
                where: { id: purchase.id },
                data: {
                    isPaid: true,
                    status: "PAID",
                    activatedAt: new Date(),
                    paymentNote: `تفعيل تلقائي آلي - مطابقة رسالة ويبهوك SMS رقم ${sms.textbeeMessageId || "محلي"} من محفظة ${sms.walletName || "اليمن"} رقم عملية ${sms.transactionNumber}`
                }
            }),
            // C. Auto-verify Visitor OTP for immediate exam access
            prisma.mockVisitorOtp.upsert({
                where: { phone: purchase.phone },
                update: { verified: true },
                create: { 
                    phone: purchase.phone, 
                    code: "000000", 
                    expiresAt: new Date(), 
                    verified: true 
                }
            }),
            // D. Log to ActivityLog for audit trail
            prisma.activityLog.create({
                data: {
                    action: "AUTO_APPROVE_PAYMENT",
                    details: `تفعيل تلقائي آلي للباقة [${purchase.package?.name || "اختبارات مفردة"}] للمشترك [${purchase.buyerName || purchase.phone}] بقيمة ${Number(purchase.amount).toLocaleString()} ${purchase.currency === 'SAR' ? 'ر.س' : 'ر.ي'} عبر مطابقة ويبهوك الرسائل`,
                    userId: null,
                    applicantId: purchase.applicantId || null
                }
            })
        ]);

        console.log(`Auto-matching SUCCESS: Automatically activated purchase [${purchase.id}] using SMS [${sms.id}]!`);

        // Trigger activation message asynchronously (fire-and-forget)
        import("@/lib/autoSendMessage").then((m) => {
            m.sendMockPackageActivationMessage(purchase.id).catch((err) => {
                console.error("Failed to send mock package activation message in matchingEngine:", err);
            });
        });

        return true;

    } catch (error) {
        console.error("Error inside matchSmsAndActivate engine:", error);
        return false;
    }
}
