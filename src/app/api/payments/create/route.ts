import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone-utils";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { packageId, buyerName, phone, profession, paymentNote } = body;
        
        if (!packageId || !buyerName || !phone) {
            return NextResponse.json({ error: "اسم المشترك ورقم الهاتف والباقة مطلوبة" }, { status: 400 });
        }

        // Find the package from the database
        const pkg = await prisma.mockExamPackage.findUnique({
            where: { id: packageId }
        });

        if (!pkg || !pkg.isActive) {
            return NextResponse.json({ error: "الباقة المطلوبة غير متاحة حالياً" }, { status: 404 });
        }

        const normalizedPhone = normalizePhone(phone);

        // Fetch price securely from database
        const { currentCityId, examCityId } = body;
        
        const sarCurrency = await prisma.systemCurrency.findFirst({
            where: { code: "SAR" }
        }) || { buyRate: 530.00, sellRate: 533.00 };
        const sarBuyRate = Number(sarCurrency.buyRate) || 530.00;
        const sarSellRate = Number(sarCurrency.sellRate) || 533.00;

        let amount = 0;

        const isDynamic = pkg.includesRegistration || pkg.includesTransport;

        if (isDynamic) {
            // 1. Base Mock Exam Price in SAR
            const examPriceSAR = Number(pkg.priceSAR) > 0 ? Number(pkg.priceSAR) : (Number(pkg.examPrice || 0) / sarBuyRate);

            // 2. Registration Price in SAR
            let registrationCostSAR = 0;
            if (pkg.includesRegistration) {
                const config = await prisma.serviceConfig.findUnique({
                    where: { id: "global" }
                });
                const baseRegPriceYER = config ? Number(config.registrationPrice) : 16000;
                const registrationCostYER = Math.max(0, baseRegPriceYER - Number(pkg.registrationDiscount || 0));
                registrationCostSAR = registrationCostYER / sarBuyRate;
            }

            // 3. Transport Price in SAR
            let transportCostSAR = 0;
            if (pkg.includesTransport) {
                if (!currentCityId || !examCityId) {
                    return NextResponse.json({ error: "مدينة الإقامة ومركز الاختبار مطلوبة لحساب تكلفة النقل" }, { status: 400 });
                }

                const currentCity = await prisma.location.findUnique({ where: { id: currentCityId } });
                const examCity = await prisma.location.findUnique({ where: { id: examCityId } });

                if (!currentCity || !examCity) {
                    return NextResponse.json({ error: "المدينة أو المركز المختار غير موجود بالنظام" }, { status: 400 });
                }

                const route = await prisma.transportRouteDefault.findFirst({
                    where: {
                        fromDestination: { name: currentCity.name },
                        toDestination: { name: examCity.name }
                    }
                });

                if (!route) {
                    return NextResponse.json({ error: "لا يتوفر مسار نقل معتمد يربط بين مدينة الانطلاق ومركز الاختبار المختار" }, { status: 400 });
                }

                const baseRoutePrice = pkg.transportType === "ROUND_TRIP"
                    ? Number(route.priceRoundTrip || route.price)
                    : Number(route.price);
                
                let transportPriceSAR = 0;
                if (route.currency === "SAR") {
                    transportPriceSAR = baseRoutePrice;
                } else {
                    transportPriceSAR = baseRoutePrice / sarBuyRate;
                }

                const transportDiscountSAR = Number(pkg.transportDiscount || 0) / sarBuyRate;
                transportCostSAR = Math.max(0, transportPriceSAR - transportDiscountSAR);
            }

            // Secure Recalculated total package price in SAR
            const totalSAR = examPriceSAR + registrationCostSAR + transportCostSAR;
            amount = Math.round(totalSAR * sarSellRate);
        } else {
            // Exams only packages
            const examPriceSAR = Number(pkg.priceSAR) > 0 ? Number(pkg.priceSAR) : (Number(pkg.price || pkg.examPrice || 0) / sarBuyRate);
            amount = Math.round(examPriceSAR * sarSellRate);
        }

        let expiresAt: Date | null = null;
        if (pkg.validityDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);
        }

        // Generate a unique 6-digit random number for transactionRef
        let transactionRef = "";
        let isUnique = false;
        let attempt = 0;
        while (!isUnique && attempt < 10) {
            transactionRef = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await prisma.mockExamPurchase.findUnique({
                where: { transactionRef }
            });
            if (!existing) {
                isUnique = true;
            }
            attempt++;
        }
        if (!isUnique) {
            transactionRef = `${Date.now()}`.slice(-6);
        }

        // Create a pending purchase record
        const purchase = await prisma.mockExamPurchase.create({
            data: {
                phone: normalizedPhone,
                buyerName,
                packageId: pkg.id,
                totalCredits: pkg.examCredits,
                amount: amount,
                currency: "YER", // Default currency for Yemeni E-wallets
                isPaid: false,
                status: "AWAITING_VERIFICATION",
                transactionRef,
                expiresAt,
                profession: profession || null,
                paymentNote: paymentNote || null,
            },
            include: {
                package: {
                    select: {
                        name: true,
                        nameEn: true,
                        examCredits: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            amount: Number(purchase.amount),
            currency: purchase.currency,
            buyerName: purchase.buyerName,
            phone: purchase.phone,
            packageName: purchase.package?.name || "باقة اختبارات",
            packageNameEn: purchase.package?.nameEn || null,
            totalCredits: purchase.totalCredits,
            transactionRef: purchase.transactionRef
        });

    } catch (error) {
        console.error("POST Create Purchase Error:", error);
        return NextResponse.json({ error: "فشل في إنشاء طلب الدفع" }, { status: 500 });
    }
}
