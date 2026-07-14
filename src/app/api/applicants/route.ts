
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
        let fromDest = null;
        const toLocation = body.locationId 
            ? await prisma.location.findUnique({ where: { id: body.locationId }, select: { name: true, nameEn: true, nameAr: true } })
            : null;

        if (body.hasTransportation && body.locationId && body.transportFromId) {
            // transportFromId is now a TransportDestination ID!
            fromDest = await prisma.transportDestination.findUnique({ where: { id: body.transportFromId } });

            if (fromDest && toLocation) {
                const toDestOr: any[] = [{ name: toLocation.name }];
                if (toLocation.nameEn) toDestOr.push({ nameEn: toLocation.nameEn });
                if (toLocation.nameAr) toDestOr.push({ nameAr: toLocation.nameAr });

                const toDest = await prisma.transportDestination.findFirst({ 
                    where: { OR: toDestOr }
                });

                if (toDest) {
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

        // Mock Exam Package calculations
        let mockExamPrice = 0;
        let finalBasePrice = basePrice;
        let finalTransportPrice = transportPrice;
        let pkgObj: any = null;

        if (body.wantsMockExam) {
            if (body.mockExamType === "package" && body.selectedPackageId) {
                pkgObj = await prisma.mockExamPackage.findFirst({
                    where: { id: body.selectedPackageId, isActive: true }
                });
                if (pkgObj) {
                    mockExamPrice = Number(pkgObj.price || 0);
                    if (pkgObj.includesRegistration) {
                        finalBasePrice = basePrice - Number(pkgObj.registrationDiscount || 0);
                        if (finalBasePrice < 0) finalBasePrice = 0;
                    }
                    if (pkgObj.includesTransport && transportPrice > 0) {
                        finalTransportPrice = transportPrice - Number(pkgObj.transportDiscount || 0);
                        if (finalTransportPrice < 0) finalTransportPrice = 0;
                    }
                }
            } else if (body.mockExamType === "individual") {
                const singlePrice = Number(config?.mockExamSinglePrice || 0);
                const count = Math.max(1, Number(body.mockExamCount) || 1);
                mockExamPrice = singlePrice * count;
            }
        }
        // Compute actual transport cost
        let actualTransportCost = 0;
        if (body.hasTransportation && transportRoute) {
            if (body.transportType === "ROUND_TRIP") {
                actualTransportCost = Number(transportRoute.costRoundTrip || transportRoute.cost || 0);
            } else {
                actualTransportCost = Number(transportRoute.cost || 0);
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
                const currentUsage = meta.usageCount || 0;
                if (meta.maxUses && currentUsage >= meta.maxUses) {
                    return NextResponse.json({ error: "تم تجاوز الحد الأقصى لاستخدام هذا الرمز" }, { status: 400 });
                }

                // Calculate Discount
                const grossTotal = finalBasePrice + finalTransportPrice + mockExamPrice;
                discount = grossTotal * (Number(meta.discount) / 100);

                usedVoucherId = matchedVoucher.id;
                voucherNotes = `Using Promo Code: ${body.promoCode} (${meta.discount}%)`;

                // Prepare Meta update (increment usage)
                meta.usageCount = currentUsage + 1;
                const newNotes = `${oldNotes} [META:${JSON.stringify(meta)}]`;
                matchedVoucher.notes = newNotes; // Store for usage
            } else {
                return NextResponse.json({ error: "الرمز الترويجي غير صحيح" }, { status: 400 });
            }
        }

        const amountPaid = Number(body.amountPaid || 0);
        const totalAmount = finalBasePrice + finalTransportPrice + mockExamPrice - discount;
        const remainingBalance = totalAmount - amountPaid;

        // Create transaction to ensure integrity
        const result = await prisma.$transaction(async (tx: any) => {
            // Update Voucher Usage if present
            if (usedVoucherId && body.promoCode) {
                const v = await tx.voucher.findUnique({ where: { id: usedVoucherId } });
                if (v) {
                    const parts = v.notes!.split("[META:");
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

            // 2. Create Applicant with Linked Location & Financials
            const applicant = await tx.applicant.create({
                data: {
                    fullName: body.fullName,
                    applicantCode,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    passportNumber: body.passportNumber,
                    passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
                    nationalId: body.nationalId,
                    dob: body.dob ? new Date(body.dob) : null,
                    applicantType: body.applicantType,
                    gender: body.gender,
                    isArchived: false,

                    profession: body.profession,
                    phone: body.phone,
                    whatsappNumber: body.whatsappNumber,
                    platformEmail: body.platformEmail || null,

                    // Location linking
                    locationId: body.locationId,

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

            // 2.5 Link Visitor Conversion if applicable
            if (body.visitorPurchaseId) {
                await tx.mockExamPurchase.update({
                    where: { id: body.visitorPurchaseId },
                    data: { applicantId: applicant.id }
                });
            }

            // 2.6 Create Mock Exam Purchase if selected
            if (body.wantsMockExam) {
                if (body.mockExamType === "package" && body.selectedPackageId && pkgObj) {
                    let expiresAt = null;
                    if (pkgObj.validityDays) {
                        expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + pkgObj.validityDays);
                    }
                    await tx.mockExamPurchase.create({
                        data: {
                            phone: body.phone,
                            buyerName: body.fullName,
                            applicantId: applicant.id,
                            packageId: pkgObj.id,
                            totalCredits: pkgObj.examCredits,
                            amount: mockExamPrice,
                            isPaid: amountPaid >= totalAmount,
                            status: "ACTIVE",
                            activatedAt: new Date(),
                            expiresAt,
                        }
                    });
                } else if (body.mockExamType === "individual") {
                    const count = Math.max(1, Number(body.mockExamCount) || 1);
                    await tx.mockExamPurchase.create({
                        data: {
                            phone: body.phone,
                            buyerName: body.fullName,
                            applicantId: applicant.id,
                            packageId: null, // No package
                            totalCredits: count,
                            amount: mockExamPrice,
                            isPaid: amountPaid >= totalAmount,
                            status: "ACTIVE",
                            activatedAt: new Date(),
                            expiresAt: null, // Individual exams usually don't expire quickly, or set default
                        }
                    });
                }
            }

            // 3. Create Ledgers (Transactions) for clear accounting
            if (amountPaid > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: amountPaid,
                        type: "PAYMENT",
                        description: `إيداع دفعة نقدية مقدمة عند التسجيل للمتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode}) عبر طريقة الدفع (${body.paymentMethod || 'نقداً'})`,
                        notes: "دفعة مقدمة عند التسجيل",
                        category: "ADVANCE_PAYMENT",
                        locationId: body.locationId 
                    },
                });
            }

            if (finalBasePrice > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: finalBasePrice,
                        type: "CHARGE",
                        description: `رسوم التسجيل وفتح الملف للمتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode})`,
                        notes: "رسوم تسجيل وفتح ملف",
                        category: "REGISTRATION_FEE",
                        locationId: body.locationId
                    }
                });

                // Operating Cost for Registration
                const regCost = Number(config?.registrationCost || 0);
                if (regCost > 0) {
                    await tx.transaction.create({
                        data: {
                            applicantId: applicant.id,
                            amount: regCost,
                            type: "EXPENSE",
                            description: `التكلفة التشغيلية الفعلية لرسوم تسجيل المتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode})`,
                            notes: "تكلفة تسجيل ملف",
                            category: "REGISTRATION_COST",
                            locationId: body.locationId
                        }
                    });
                }
            }

            if (finalTransportPrice > 0) {
                const routeLabel = `${fromDest?.name || 'غير محدد'} ← ${toLocation?.name || 'غير محدد'}`;
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: finalTransportPrice,
                        type: "CHARGE",
                        description: `رسوم نقل المتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode}) للخط (${routeLabel}) ونوع الرحلة (${body.transportType === 'ROUND_TRIP' ? 'ذهاب وعودة' : 'ذهاب'})`,
                        notes: "رسوم مواصلات المتقدم",
                        category: "TRANSPORT_FEE",
                        locationId: body.locationId
                    }
                });

                // Operating Cost for Transport
                if (actualTransportCost > 0) {
                    await tx.transaction.create({
                        data: {
                            applicantId: applicant.id,
                            amount: actualTransportCost,
                            type: "EXPENSE",
                            description: `التكلفة التشغيلية الفعلية لرحلة مواصلات المتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode}) للخط (${routeLabel})`,
                            notes: "تكلفة نقل المتقدم",
                            category: "TRANSPORT_COST",
                            locationId: body.locationId
                        }
                    });
                }
            }

            if (mockExamPrice > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId: applicant.id,
                        amount: mockExamPrice,
                        type: "CHARGE",
                        description: `رسوم باقة اختبارات تجريبية (${pkgObj?.name || 'مخصصة'}) للمتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode})`,
                        notes: "رسوم باقة اختبارات",
                        category: "MOCK_EXAM_FEE",
                        locationId: body.locationId
                    }
                });

                // Operating Cost for Mock Exam Package
                const pkgCost = Number(pkgObj?.actualCost || 0);
                if (pkgCost > 0) {
                    await tx.transaction.create({
                        data: {
                            applicantId: applicant.id,
                            amount: pkgCost,
                            type: "EXPENSE",
                            description: `التكلفة التشغيلية الفعلية لباقة الاختبار التجريبي (${pkgObj.name}) للمتقدم (${applicant.fullName}) برقم ملف (${applicant.applicantCode})`,
                            notes: "تكلفة باقة اختبار",
                            category: "MOCK_EXAM_COST",
                            locationId: body.locationId
                        }
                    });
                }
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
            try {
                const { autoSendMessage } = await import("@/lib/autoSendMessage");
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
        const whereClause: any = { 
            fullName: { not: "زائر (اختبار تجريبي)" },
            isArchived: false
        };

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

        // ── Fetch Applicants (skip if VISITORS only) ──
        let applicantRows: any[] = [];

        if (viewType !== 'VISITORS') {
            const apps = await prisma.applicant.findMany({
                where: whereClause,
                select: {
                    id: true, applicantCode: true, fullName: true, phone: true,
                    whatsappNumber: true, examDate: true, examTime: true, profession: true,
                    location: { select: { name: true, nameEn: true, nameAr: true, address: true, locationUrl: true } },
                    examCenter: { select: { name: true, address: true, locationUrl: true } },
                    status: true, remainingBalance: true, hasTransportation: true,
                    ticket: { select: { id: true, status: true, ticketNumber: true, departureDate: true } },
                    createdAt: true
                },
            });

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
            });

            // Get all registered phone numbers to exclude
            const regApplicants = await prisma.applicant.findMany({
                select: { phone: true },
                where: { fullName: { not: "زائر (اختبار تجريبي)" }, isArchived: false }
            });
            const regPhones = new Set<string>();
            regApplicants.forEach((a: any) => {
                regPhones.add(a.phone);
                regPhones.add(a.phone.startsWith('+') ? a.phone.slice(1) : `+${a.phone}`);
            });

            const phoneGroups = new Map<string, any[]>();
            purchases
                .filter((p: any) => !regPhones.has(p.phone) && !regPhones.has(p.phone.replace('+', '')))
                .forEach((p: any) => {
                    const normalizedPhone = p.phone.replace(/^\+/, '');
                    const existing = phoneGroups.get(normalizedPhone) || [];
                    existing.push(p);
                    phoneGroups.set(normalizedPhone, existing);
                });

            visitorRows = Array.from(phoneGroups.entries()).map(([normalizedPhone, groupPurchases]) => {
                // Sort by createdAt desc to get the latest first
                groupPurchases.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                // Pick the best name (first non-generic name found)
                const bestName = groupPurchases.find((p: any) => 
                    p.buyerName && p.buyerName !== "تجديد" && p.buyerName !== "مشترك" && p.buyerName !== "زائر"
                )?.buyerName || groupPurchases[0].buyerName || "زائر";
                
                // Pick the most recent active purchase, or fallback to the latest one
                const activePurchase = groupPurchases.find((p: any) => 
                    (p.status === "ACTIVE" || p.status === "PAID") && p.isPaid
                ) || groupPurchases[0];

                // Sum total credits and used credits across ALL purchases for this phone
                const totalCreditsAll = groupPurchases.reduce((sum: number, p: any) => sum + (p.totalCredits === -1 ? 0 : p.totalCredits), 0);
                const usedCreditsAll = groupPurchases.reduce((sum: number, p: any) => sum + p.usedCredits, 0);
                const hasUnlimited = groupPurchases.some((p: any) => p.totalCredits === -1);

                const latestEmail = groupPurchases.find((p: any) => p.email)?.email || null;

                return {
                    id: `visitor_${activePurchase.id}`,
                    fullName: bestName,
                    phone: activePurchase.phone,
                    whatsappNumber: activePurchase.phone,
                    applicantCode: null,
                    profession: activePurchase.profession || null,
                    examDate: null, examTime: null,
                    location: null, examCenter: null, examLocation: "",
                    status: "VISITOR",
                    remainingBalance: 0,
                    hasTransportation: false,
                    ticket: null,
                    totalAmount: 0, discount: 0, amountPaid: groupPurchases.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
                    createdAt: groupPurchases[groupPurchases.length - 1].createdAt, // oldest creation date
                    isVisitor: true,
                    visitorPurchaseId: activePurchase.id,
                    email: latestEmail,
                    totalPurchases: groupPurchases.length,
                    mockPurchase: {
                        id: activePurchase.id,
                        packageId: activePurchase.packageId,
                        packageName: activePurchase.package?.name || "اختبارات مفردة",
                        totalCredits: hasUnlimited ? -1 : totalCreditsAll,
                        usedCredits: usedCreditsAll,
                        status: activePurchase.status,
                        expiresAt: activePurchase.expiresAt?.toISOString() || null,
                        email: latestEmail,
                    }
                };
            });
        }

        const mergedData = [...applicantRows, ...visitorRows];

        // Global Sort
        const sort = searchParams.get("sort") || "createdAt";
        const order = searchParams.get("order") === "asc" ? "asc" : "desc";

        mergedData.sort((a: any, b: any) => {
            let valA = a[sort];
            let valB = b[sort];

            // Handle date conversion
            if (sort === "createdAt" || sort === "examDate" || sort === "travelDate") {
                const dateA = valA ? new Date(valA).getTime() : 0;
                const dateB = valB ? new Date(valB).getTime() : 0;
                return order === "asc" ? dateA - dateB : dateB - dateA;
            }

            // Handle numeric values
            if (sort === "remainingBalance" || sort === "totalAmount" || sort === "amountPaid") {
                const numA = Number(valA || 0);
                const numB = Number(valB || 0);
                return order === "asc" ? numA - numB : numB - numA;
            }

            // Handle string values (case-insensitive)
            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return order === "asc" ? -1 : 1;
            if (strA > strB) return order === "asc" ? 1 : -1;
            return 0;
        });

        // Apply slice for pagination
        const totalCount = mergedData.length;
        const paginatedData = mergedData.slice(skip, skip + limit);

        // Convert Dates to ISOString for response safety
        const formattedData = paginatedData.map((item: any) => ({
            ...item,
            createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        }));

        return NextResponse.json({
            data: formattedData,
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
