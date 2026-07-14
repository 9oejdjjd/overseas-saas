import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { buyerName, profession, phone, whatsapp, packageId, saleType, examCount, isPaid, paymentMethod, paymentNote, discount, amountPaid, applicantId, email } = body;

        if (!phone || !buyerName) {
            return NextResponse.json({ error: "الاسم ورقم الهاتف مطلوبة" }, { status: 400 });
        }

        // Try to find the applicant automatically by phone if applicantId is not provided
        let resolvedApplicantId = applicantId || null;
        if (!resolvedApplicantId && phone) {
            // Normalize phone for lookup
            const cleanedPhone = phone.replace(/\D/g, "");
            const applicants = await prisma.applicant.findMany({
                select: { id: true, phone: true }
            });
            const matchedApplicant = applicants.find(app => {
                const appCleaned = app.phone.replace(/\D/g, "");
                return appCleaned.includes(cleanedPhone) || cleanedPhone.includes(appCleaned);
            });
            if (matchedApplicant) {
                resolvedApplicantId = matchedApplicant.id;
            }
        }

        let totalCredits = 1;
        let amount = 0;
        let expiresAt: Date | null = null;
        let resolvedPackageId: string | null = packageId || null;
        let pkg: any = null;

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
            pkg = await prisma.mockExamPackage.findUnique({ where: { id: packageId } });
            if (!pkg || !pkg.isActive) return NextResponse.json({ error: "الباقة غير متاحة" }, { status: 404 });
            totalCredits = pkg.examCredits;
            amount = Number(pkg.examPrice) - Number(discount || 0);
            if (amount < 0) amount = 0;
            if (pkg.validityDays) { expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + pkg.validityDays); }
        }

        // Create purchase record and record transactions inside a database transaction
        const purchase = await prisma.$transaction(async (tx) => {
            const purchaseData: any = {
                phone,
                buyerName,
                email: email || null,
                profession,
                totalCredits,
                amount,
                isPaid: Boolean(isPaid),
                paymentMethod: paymentMethod || null,
                paymentNote: paymentNote || null,
                status: isPaid ? "ACTIVE" : "PENDING",
                activatedAt: isPaid ? new Date() : null,
                expiresAt,
                applicantId: resolvedApplicantId
            };
            if (resolvedPackageId) purchaseData.packageId = resolvedPackageId;

            const newPurchase = await tx.mockExamPurchase.create({ data: purchaseData });

            if (Boolean(isPaid)) {
                // Resolve Location ID if applicant is linked
                let locationId = null;
                let applicantName = buyerName;
                let applicantCode = "";
                if (resolvedApplicantId) {
                    const applicant = await tx.applicant.findUnique({
                        where: { id: resolvedApplicantId },
                        select: { locationId: true, fullName: true, applicantCode: true }
                    });
                    if (applicant) {
                        locationId = applicant.locationId;
                        applicantName = applicant.fullName;
                        applicantCode = applicant.applicantCode || "";
                    }
                }

                const displayCode = applicantCode ? ` (${applicantCode})` : "";

                // 1. Record CHARGE transaction for ledger
                await tx.transaction.create({
                    data: {
                        applicantId: resolvedApplicantId,
                        amount: amount,
                        type: "CHARGE",
                        category: "MOCK_EXAM_FEE",
                        description: `رسوم شراء باقة اختبارات تجريبية (${pkg?.name || 'فردية'}) للمشترك (${applicantName}${displayCode})`,
                        notes: "شراء باقة اختبارات",
                        locationId: locationId
                    }
                });

                // 2. Record PAYMENT transaction for ledger
                await tx.transaction.create({
                    data: {
                        applicantId: resolvedApplicantId,
                        amount: amountPaid || amount,
                        type: "PAYMENT",
                        category: "MOCK_EXAM_PURCHASE",
                        description: `رسوم اشتراك في باقة (${pkg?.name || "اختبارات مفردة"}) للمستفيد (${applicantName}${displayCode}) عبر محفظة (${paymentMethod || "CASH"}) بقيمة (${Number(amountPaid || amount)} ${newPurchase.currency === 'SAR' ? 'ر.س' : 'ر.ي'})`,
                        notes: "سداد باقة اختبارات",
                        locationId: locationId
                    }
                });

                // 3. Record EXPENSE transaction for ledger (if package has actual cost > 0)
                if (pkg && Number(pkg.actualCost) > 0) {
                    await tx.transaction.create({
                        data: {
                            applicantId: resolvedApplicantId,
                            amount: pkg.actualCost,
                            type: "EXPENSE",
                            category: "MOCK_EXAM_COST",
                            description: `التكلفة التشغيلية الفعلية لباقة الاختبار التجريبي (${pkg.name}) للمشترك (${applicantName}${displayCode})`,
                            notes: "تكلفة باقة اختبار",
                            locationId: locationId
                        }
                    });
                }
            }

            return newPurchase;
        });

        // Ensure visitor has a verified OTP record
        const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        await prisma.mockVisitorOtp.upsert({
            where: { phone: normalizedPhone },
            update: { verified: true },
            create: { phone: normalizedPhone, code: "000000", expiresAt: new Date(), verified: true }
        });

        if (purchase.isPaid) {
            // Trigger activation message asynchronously (fire-and-forget)
            import("@/lib/autoSendMessage").then((m) => {
                m.sendMockPackageActivationMessage(purchase.id).catch((err) => {
                    console.error("Failed to send mock package activation message in sell/route:", err);
                });
            });
        }

        return NextResponse.json(purchase);
    } catch (error) {
        console.error("Error selling package:", error);
        return NextResponse.json({ error: "فشل في إتمام عملية البيع" }, { status: 500 });
    }
}
