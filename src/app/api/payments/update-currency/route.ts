import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { purchaseId, currency } = body;

        if (!purchaseId || !currency) {
            return NextResponse.json({ error: "معرف الطلب والعملة مطلوبة" }, { status: 400 });
        }

        if (currency !== "YER" && currency !== "SAR") {
            return NextResponse.json({ error: "العملة غير مدعومة" }, { status: 400 });
        }

        // Fetch purchase record
        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId },
            include: { package: true }
        });

        if (!purchase) {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }

        if (purchase.isPaid) {
            return NextResponse.json({ error: "تم دفع هذا الطلب بالفعل" }, { status: 400 });
        }

        const pkg = purchase.package;
        if (!pkg) {
            return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
        }

        // Fetch exchange rates
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
                // Read paymentNote which contains the currentCity and examCity from creation
                let currentCityName = "";
                let examCityName = "";
                if (purchase.paymentNote) {
                    try {
                        const noteData = JSON.parse(purchase.paymentNote);
                        currentCityName = noteData.currentCity;
                        examCityName = noteData.examCity;
                    } catch (e) {
                        // ignore
                    }
                }

                if (currentCityName && examCityName) {
                    const route = await prisma.transportRouteDefault.findFirst({
                        where: {
                            fromDestination: { name: currentCityName },
                            toDestination: { name: examCityName }
                        }
                    });

                    if (route) {
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
                }
            }

            const totalSAR = examPriceSAR + registrationCostSAR + transportCostSAR;
            if (currency === "YER") {
                amount = Math.round(totalSAR * sarSellRate);
            } else {
                amount = Math.round(totalSAR);
            }
        } else {
            // Exams only packages
            const examPriceSAR = Number(pkg.priceSAR) > 0 ? Number(pkg.priceSAR) : (Number(pkg.price || pkg.examPrice || 0) / sarBuyRate);
            if (currency === "YER") {
                amount = Math.round(examPriceSAR * sarSellRate);
            } else {
                amount = Math.round(examPriceSAR);
            }
        }

        // Update purchase record
        const updatedPurchase = await prisma.mockExamPurchase.update({
            where: { id: purchaseId },
            data: {
                amount,
                currency
            }
        });

        return NextResponse.json({
            success: true,
            amount: Number(updatedPurchase.amount),
            currency: updatedPurchase.currency
        });

    } catch (error) {
        console.error("POST Update Purchase Currency Error:", error);
        return NextResponse.json({ error: "فشل في تحديث عملة الدفع" }, { status: 500 });
    }
}
