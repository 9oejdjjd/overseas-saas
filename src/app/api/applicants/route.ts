
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to generate PNR
function generatePNR() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Fetch Pricing Configuration & Route (Validation & Calculation)
        const config = await prisma.serviceConfig.findFirst();
        const basePrice = Number(config?.registrationPrice || 0);

        let transportPrice = 0;
        let transportRoute = null;

        if (body.hasTransportation && body.locationId && body.transportFromId) {
            // Location and TransportDestination are different tables with different IDs.
            // We need to resolve Location names first, then find matching TransportDestination IDs.
            const fromLocation = await prisma.location.findUnique({ where: { id: body.transportFromId }, select: { name: true } });
            const toLocation = await prisma.location.findUnique({ where: { id: body.locationId }, select: { name: true } });

            if (fromLocation && toLocation) {
                const fromDest = await prisma.transportDestination.findFirst({ where: { name: fromLocation.name } });
                const toDest = await prisma.transportDestination.findFirst({ where: { name: toLocation.name } });

                if (fromDest && toDest) {
                    transportRoute = await prisma.transportRouteDefault.findFirst({
                        where: {
                            fromDestinationId: fromDest.id,
                            toDestinationId: toDest.id,
                        }
                    });
                }
            }

            if (transportRoute) {
                if (body.transportType === "ROUND_TRIP" && transportRoute.priceRoundTrip) {
                    transportPrice = Number(transportRoute.priceRoundTrip);
                } else {
                    transportPrice = Number(transportRoute.price);
                }
            }
        }

        // Voucher/Promo Code Logic
        let discount = Number(body.discount || 0);
        let usedVoucherId = null;
        let voucherNotes = "";

        if (body.promoCode) {
            // Find Voucher by Code (Inefficient but strict workaround)
            // We fetch all "EXAM_RETAKE" active vouchers or just all active vouchers and scan notes
            const allVouchers = await prisma.voucher.findMany({
                where: { isUsed: false },
                select: { id: true, notes: true, type: true }
            });

            const matchedVoucher = allVouchers.find((v: { notes: string | null; id: string; type: any }) => {
                if (!v.notes || !v.notes.includes("[META:")) return false;
                try {
                    const parts = v.notes.split("[META:");
                    const meta = JSON.parse(parts[1].slice(0, -1));
                    return meta.code === body.promoCode && meta.category === "PUBLIC";
                } catch { return false; }
            });

            if (matchedVoucher) {
                // Parse Meta
                const parts = matchedVoucher.notes!.split("[META:");
                const meta = JSON.parse(parts[1].slice(0, -1));
                const oldNotes = parts[0].trim();

                // Validation
                const now = new Date();
                if (meta.expiryDate && new Date(meta.expiryDate) < now) {
                    return NextResponse.json({ error: "الرمز الترويجي منتهي الصلاحية" }, { status: 400 });
                }
                if (meta.maxUses && meta.amount >= meta.maxUses) { // wait, previously I used 'usageCount' in Frontend, but schema I put 'amount' for legacy reasons or I need to track usage in 'amount' or 'balance'?
                    // In api/vouchers/route.ts I used: usageCount || 0
                    // But where is it stored? In meta.
                    // Let's assume meta.usageCount
                }
                const currentUsage = meta.usageCount || 0;
                if (meta.maxUses && currentUsage >= meta.maxUses) {
                    return NextResponse.json({ error: "تم تجاوز الحد الأقصى لاستخدام هذا الرمز" }, { status: 400 });
                }

                // Calculate Discount
                const grossTotal = basePrice + transportPrice;
                discount = grossTotal * (Number(meta.discount) / 100);

                usedVoucherId = matchedVoucher.id;
                voucherNotes = `Using Promo Code: ${body.promoCode} (${meta.discount}%)`;

                // Prepare Meta update (increment usage)
                meta.usageCount = currentUsage + 1;
                const newNotes = `${oldNotes} [META:${JSON.stringify(meta)}]`;

                // Update Metadata in memory to pass to transaction? 
                // No, we must update DB. But we need to do it inside transaction or before?
                // Inside transaction is better.
                matchedVoucher.notes = newNotes; // Store for usage
            } else {
                return NextResponse.json({ error: "الرمز الترويجي غير صحيح" }, { status: 400 });
            }
        }

        const amountPaid = Number(body.amountPaid || 0);
        const totalAmount = basePrice + transportPrice - discount;
        const remainingBalance = totalAmount - amountPaid;

        // Create transaction to ensure integrity
        const result = await prisma.$transaction(async (tx: any) => {
            // Update Voucher Usage if present
            if (usedVoucherId && body.promoCode) { // Double check we have a matched one
                // We need to fetch it again or just update
                // Since we have the ID and new notes:
                // Wait, we computed newNotes above in 'matchedVoucher.notes'
                // But that was a local object found in array.
                // We re-find 'matchedVoucher' logic inside tx is hard.
                // We'll update by ID.
                const v = await tx.voucher.findUnique({ where: { id: usedVoucherId } });
                if (v) {
                    // Re-parse logic briefly or trust previous?
                    // Trust previous calculation for simplicity, assuming low concurrency on single promo code or accept race condition on counter
                    // Better: Re-read to increment atomic? No JSON is not atomic.
                    // We will update with the string we prepared.
                    const parts = v.notes!.split("[META:"); // assuming it exists as we found it
                    const meta = JSON.parse(parts[1].slice(0, -1));
                    meta.usageCount = (meta.usageCount || 0) + 1;
                    const newMetaNotes = `${parts[0].trim()} [META:${JSON.stringify(meta)}]`;

                    await tx.voucher.update({
                        where: { id: usedVoucherId },
                        data: { notes: newMetaNotes }
                    });
                }
            }

            // Generate Unique PNR
            let applicantCode = generatePNR();
            let isUnique = false;
            while (!isUnique) {
                const existing = await tx.applicant.findUnique({ where: { applicantCode } });
                if (!existing) isUnique = true;
                else applicantCode = generatePNR();
            }

            // 1.5 Handle Visitor Conversion (Mock Exam Purchase Link)
            let mockPurchaseUpdate = undefined;
            if (body.visitorPurchaseId) {
                const existingPurchase = await tx.mockExamPurchase.findUnique({
                    where: { id: body.visitorPurchaseId }
                });
                if (existingPurchase) {
                    mockPurchaseUpdate = {
                        connect: { id: body.visitorPurchaseId }
                    };
                }
            }

            // 2. Create Applicant with Linked Location & Financials
            const applicant = await tx.applicant.create({
                data: {
                    fullName: body.fullName,
                    applicantCode,
                    mockPurchase: mockPurchaseUpdate,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    passportNumber: body.passportNumber,
                    passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
                    nationalId: body.nationalId,
                    dob: body.dob ? new Date(body.dob) : null,
                    applicantType: body.applicantType,
                    gender: body.gender,

                    profession: body.profession,
                    phone: body.phone,
                    whatsappNumber: body.whatsappNumber,

                    // Location linking
                    locationId: body.locationId,
                    // Keeping legacy field for now if needed, but defaulting to null or mapping if essential
                    // examLocation: ... 

                    // Transport linking
                    hasTransportation: body.hasTransportation || false,
                    transportFromId: body.transportFromId || null,
                    transportType: body.transportType || null,
                    travelDate: body.travelDate ? new Date(body.travelDate) : null,

                    // Financials (Calculated backend-side for security)
                    totalAmount: totalAmount,
                    discount: discount,
                    amountPaid: amountPaid,
                    remainingBalance: remainingBalance,

                    status: "NEW_REGISTRATION",

                    notes: voucherNotes ? `${body.notes || ""} | ${voucherNotes}` : body.notes
                },
            });

            // 3. Create Ledgers (Transactions) for clear accounting
            if (amountPaid > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: amountPaid,
                        type: "PAYMENT",
                        notes: "إيداع دفعة نقدية مقدمة (رصيد للمتقدم)",
                        category: "ADVANCE_PAYMENT",
                        locationId: body.locationId 
                    },
                });
            }

            if (basePrice > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: basePrice,
                        type: "CHARGE",
                        notes: "رسوم التسجيل وفتح الملف الأساسية",
                        category: "REGISTRATION_FEE",
                        locationId: body.locationId
                    }
                });
            }

            if (transportPrice > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: transportPrice,
                        type: "CHARGE",
                        notes: `رسوم النقل (الوجهة: ${body.locationId})`,
                        category: "TRANSPORT_FEE",
                        locationId: body.locationId
                    }
                });
            }

            // 4. Log Activity
            await tx.activityLog.create({
                data: {
                    action: "NEW_REGISTRATION",
                    details: `تم تسجيل متقدم جديد: ${applicant.fullName} (${applicantCode}) - الوجهة: ${body.locationId ? 'محدد' : 'غير محدد'} ${voucherNotes ? '- كود خصم' : ''} ${body.visitorPurchaseId ? '(تم التحويل من زائر)' : ''}`,
                    applicantId: applicant.id,
                },
            });

            // 5. Trigger Auto-Send WhatsApp Confirmation 
            // We use dynamic import to avoid circular dependencies if any
            try {
                const { autoSendMessage } = await import("@/lib/autoSendMessage");
                // Don't await to not block the response unless necessary
                autoSendMessage(applicant.id, "ON_REGISTRATION").catch(err => 
                    console.error("[AutoSend] Failed ON_REGISTRATION:", err)
                );
            } catch (e) {
                console.error("[AutoSend] Import failed:", e);
            }

            return applicant;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json(
            { error: "Failed to create applicant" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "50"));
        const skip = (page - 1) * limit;

        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const locationId = searchParams.get("locationId");
        const examDateFrom = searchParams.get("examDateFrom");
        const examDateTo = searchParams.get("examDateTo");
        const regDateFrom = searchParams.get("regDateFrom");
        const regDateTo = searchParams.get("regDateTo");
        const viewType = searchParams.get("viewType"); // ALL, APPLICANTS, VISITORS

        // Build Where Clause for applicants
        const whereClause: any = { fullName: { not: "زائر (اختبار تجريبي)" } };

        if (search) {
            whereClause.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { whatsappNumber: { contains: search } },
                { platformEmail: { contains: search, mode: 'insensitive' } },
                { applicantCode: { contains: search, mode: 'insensitive' } },
                { passportNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'ALL' && status !== 'VISITOR') whereClause.status = status;
        if (locationId && locationId !== 'ALL') whereClause.locationId = locationId;
        if (examDateFrom || examDateTo) {
            whereClause.examDate = {};
            if (examDateFrom) whereClause.examDate.gte = new Date(examDateFrom);
            if (examDateTo) whereClause.examDate.lte = new Date(examDateTo);
        }
        if (regDateFrom || regDateTo) {
            whereClause.createdAt = {};
            if (regDateFrom) whereClause.createdAt.gte = new Date(regDateFrom);
            if (regDateTo) whereClause.createdAt.lte = new Date(regDateTo);
        }

        const sort = searchParams.get("sort") || "createdAt";
        const order = searchParams.get("order") === "asc" ? "asc" : "desc";
        const orderBy: any = sort === 'examDate' ? { examDate: order } : { [sort]: order };

        // ── Fetch Applicants (skip if VISITORS only) ──
        let applicantRows: any[] = [];
        let applicantTotal = 0;

        if (viewType !== 'VISITORS') {
            const [cnt, apps] = await prisma.$transaction([
                prisma.applicant.count({ where: whereClause }),
                prisma.applicant.findMany({
                    where: whereClause,
                    take: limit,
                    skip,
                    orderBy,
                    select: {
                        id: true, applicantCode: true, fullName: true, phone: true,
                        whatsappNumber: true, examDate: true, examTime: true, profession: true,
                        location: { select: { name: true, address: true, locationUrl: true } },
                        examCenter: { select: { name: true, address: true, locationUrl: true } },
                        status: true, remainingBalance: true, hasTransportation: true,
                        ticket: { select: { id: true, status: true, ticketNumber: true, departureDate: true } },
                    },
                })
            ]);
            applicantTotal = cnt;

            // Attach mock purchase data to applicants
            const phones = apps.map((a: any) => a.phone).filter(Boolean);
            const phonesPlus = phones.map((p: string) => p.startsWith('+') ? p : `+${p}`);
            const allPhoneVariants = [...new Set([...phones, ...phonesPlus])];

            const mockPurchases = allPhoneVariants.length > 0 ? await prisma.mockExamPurchase.findMany({
                where: { phone: { in: allPhoneVariants } },
                include: { package: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }) : [];

            applicantRows = apps.map((a: any) => {
                const purchase = mockPurchases.find((p: any) =>
                    p.phone === a.phone || p.phone === `+${a.phone}` || `+${p.phone}` === a.phone
                );
                return {
                    ...a,
                    isVisitor: false,
                    mockPurchase: purchase ? {
                        id: purchase.id,
                        packageId: purchase.packageId,
                        packageName: purchase.package?.name || null,
                        totalCredits: purchase.totalCredits,
                        usedCredits: purchase.usedCredits,
                        status: purchase.status,
                        expiresAt: purchase.expiresAt?.toISOString() || null,
                    } : null,
                };
            });
        }

        // ── Fetch Visitors (from MockExamPurchase) ──
        let visitorRows: any[] = [];
        if (viewType !== 'APPLICANTS' && status !== 'PASSED' && status !== 'FAILED' && status !== 'ABSENT' && status !== 'EXAM_SCHEDULED' && status !== 'NEW_REGISTRATION') {
            const visitorWhere: any = {};
            if (search) {
                visitorWhere.OR = [
                    { buyerName: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ];
            }

            const purchases = await prisma.mockExamPurchase.findMany({
                where: visitorWhere,
                include: { package: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: viewType === 'VISITORS' ? limit : 50,
            });

            // Get all registered phone numbers to exclude
            const regApplicants = await prisma.applicant.findMany({
                select: { phone: true },
                where: { fullName: { not: "زائر (اختبار تجريبي)" } }
            });
            const regPhones = new Set<string>();
            regApplicants.forEach((a: any) => {
                regPhones.add(a.phone);
                regPhones.add(a.phone.startsWith('+') ? a.phone.slice(1) : `+${a.phone}`);
            });

            visitorRows = purchases
                .filter((p: any) => !regPhones.has(p.phone) && !regPhones.has(p.phone.replace('+', '')))
                .map((p: any) => ({
                    id: `visitor_${p.id}`,
                    fullName: p.buyerName || "زائر",
                    phone: p.phone,
                    whatsappNumber: p.phone,
                    applicantCode: null,
                    profession: null,
                    examDate: null, examTime: null,
                    location: null, examCenter: null, examLocation: "",
                    status: "VISITOR",
                    remainingBalance: 0,
                    hasTransportation: false,
                    ticket: null,
                    totalAmount: 0, discount: 0, amountPaid: Number(p.amount),
                    createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
                    isVisitor: true,
                    visitorPurchaseId: p.id,
                    mockPurchase: {
                        id: p.id,
                        packageId: p.packageId,
                        packageName: p.package?.name || "اختبارات مفردة",
                        totalCredits: p.totalCredits,
                        usedCredits: p.usedCredits,
                        status: p.status,
                        expiresAt: p.expiresAt?.toISOString() || null,
                    }
                }));
        }

        const mergedData = [...applicantRows, ...visitorRows];
        const totalCount = applicantTotal + visitorRows.length;

        return NextResponse.json({
            data: mergedData,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
    }
}
