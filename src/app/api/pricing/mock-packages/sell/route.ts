import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { buyerName, profession, phone, whatsapp, packageId, saleType, examCount, isPaid, paymentMethod, paymentNote, discount, amountPaid } = body;

        if (!phone || !buyerName) {
            return NextResponse.json({ error: "الاسم ورقم الهاتف مطلوبة" }, { status: 400 });
        }

        let totalCredits = 1;
        let amount = 0;
        let expiresAt: Date | null = null;
        let resolvedPackageId: string | null = packageId || null;

        if (saleType === "individual") {
            // Individual exam sale - use single exam price from config
            const config = await prisma.serviceConfig.findUnique({ where: { id: "global" } });
            const singlePrice = Number(config?.mockExamSinglePrice ?? 0);
            totalCredits = Number(examCount) || 1;
            amount = singlePrice * totalCredits - Number(discount || 0);
            if (amount < 0) amount = 0;
            resolvedPackageId = null;
        } else {
            // Package sale
            if (!packageId) return NextResponse.json({ error: "يجب اختيار باقة" }, { status: 400 });
            const pkg = await prisma.mockExamPackage.findUnique({ where: { id: packageId } });
            if (!pkg || !pkg.isActive) return NextResponse.json({ error: "الباقة غير متاحة" }, { status: 404 });
            totalCredits = pkg.examCredits;
            amount = Number(pkg.examPrice) - Number(discount || 0);
            if (amount < 0) amount = 0;
            if (pkg.validityDays) { expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + pkg.validityDays); }
        }

        // Create purchase record
        const purchaseData: any = {
            phone,
            buyerName,
            profession,
            totalCredits,
            amount,
            isPaid: Boolean(isPaid),
            paymentMethod: paymentMethod || null,
            paymentNote: paymentNote || null,
            status: isPaid ? "ACTIVE" : "PENDING",
            activatedAt: isPaid ? new Date() : null,
            expiresAt,
        };
        if (resolvedPackageId) purchaseData.packageId = resolvedPackageId;

        const purchase = await prisma.mockExamPurchase.create({ data: purchaseData });

        // Ensure visitor has a verified OTP record
        const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        await prisma.mockVisitorOtp.upsert({
            where: { phone: normalizedPhone },
            update: { verified: true },
            create: { phone: normalizedPhone, code: "000000", expiresAt: new Date(), verified: true }
        });

        return NextResponse.json(purchase);
    } catch (error) {
        console.error("Error selling package:", error);
        return NextResponse.json({ error: "فشل في إتمام عملية البيع" }, { status: 500 });
    }
}
