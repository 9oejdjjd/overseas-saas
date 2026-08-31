import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExamSessionStatus } from "@prisma/client";
import { normalizePhone } from "@/lib/phone-utils";


// Helper: Robust Phone Variants Generator
const getPhoneVariants = (phone: string | null | undefined) => {
    if (!phone) return [];
    const clean = phone.replace(/\D/g, "");
    const variants = [phone, clean];
    if (phone.startsWith("+")) {
        variants.push(phone.slice(1));
    } else {
        variants.push(`+${phone}`);
    }
    const local = clean.replace(/^967/, "");
    if (local !== clean) {
        variants.push(local);
        variants.push(`0${local}`);
    } else {
        variants.push(`967${clean}`);
        variants.push(`+967${clean}`);
    }
    return [...new Set(variants)];
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitorName, professionSlug, deviceFingerprint, visitorEmail } = body;
        const visitorPhone = normalizePhone(body.visitorPhone || "");
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

        if (!visitorName || !visitorPhone || !professionSlug) {
            return NextResponse.json({ error: "Name, WhatsApp number, and profession are required" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({
            where: { slug: professionSlug },
            include: { _count: { select: { questions: { where: { isActive: true } } } } }
        });

        if (!profession || !profession.isActive) {
            return NextResponse.json({ error: "Profession not found or inactive" }, { status: 404 });
        }

        // Get correct question count from either the user's active purchase or the active free package
        let requiredQuestions = profession.questionCount;
        try {
            const config = await prisma.serviceConfig.findUnique({ where: { id: "global" } });
            const packagesEnabled = config?.mockExamPackagesEnabled ?? true;

            if (packagesEnabled) {
                const uniquePhones = getPhoneVariants(visitorPhone);
                const activePurchaseConditions: any[] = uniquePhones.map(ph => ({ phone: ph }));
                if (visitorEmail) activePurchaseConditions.push({ email: visitorEmail });

                const purchases = await prisma.mockExamPurchase.findMany({
                    where: {
                        OR: activePurchaseConditions,
                        status: { in: ["ACTIVE", "PAID"] },
                        isPaid: true,
                    },
                    include: { package: true },
                    orderBy: { createdAt: "desc" }
                });

                const activePurchase = purchases.find(p => {
                    const isExpired = p.expiresAt && p.expiresAt < new Date();
                    const hasCreditsLeft = p.totalCredits === -1 || p.usedCredits < p.totalCredits;
                    return !isExpired && hasCreditsLeft;
                });

                if (activePurchase?.package?.examQuestionsCount && activePurchase.package.examQuestionsCount > 0) {
                    requiredQuestions = activePurchase.package.examQuestionsCount;
                } else {
                    const freePackage = await prisma.mockExamPackage.findFirst({
                        where: { isFree: true, isActive: true },
                        select: { examQuestionsCount: true }
                    });
                    if (freePackage?.examQuestionsCount && freePackage.examQuestionsCount > 0) {
                        requiredQuestions = freePackage.examQuestionsCount;
                    }
                }
            } else {
                const freePackage = await prisma.mockExamPackage.findFirst({
                    where: { isFree: true, isActive: true },
                    select: { examQuestionsCount: true }
                });
                if (freePackage?.examQuestionsCount && freePackage.examQuestionsCount > 0) {
                    requiredQuestions = freePackage.examQuestionsCount;
                }
            }
        } catch (e) {
            console.error("Failed to dynamically resolve required questions count:", e);
        }

        if (profession._count.questions < requiredQuestions) {
            return NextResponse.json({ error: "Not enough questions in bank for this profession to start exam." }, { status: 400 });
        }

        const phoneWithoutPlus = visitorPhone.replace(/^\+/, "");
        
        // --- 1. Smart Fingerprint Extraction ---
        // Fingerprint is "browserId-localId". Extract browserId (more stable across localStorage clears)
        let baseFingerprint = deviceFingerprint || null;
        if (baseFingerprint && baseFingerprint.includes("-")) {
            baseFingerprint = baseFingerprint.split("-")[0];
        }

        // --- 1.5. Security: Check for Banned Status ---
        // Block if any session matching this IP, Phone, Email, or Fingerprint is banned.
        const bannedConditions: any[] = [
            { visitorPhone: visitorPhone },
            { visitorPhone: phoneWithoutPlus },
            { ipAddress: ipAddress }
        ];
        if (visitorEmail) bannedConditions.push({ visitorEmail: visitorEmail });
        if (baseFingerprint) bannedConditions.push({ deviceFingerprint: { startsWith: baseFingerprint } });

        const isBanned = await prisma.examSession.findFirst({
            where: {
                isBanned: true,
                OR: bannedConditions
            }
        });

        if (isBanned) {
            return NextResponse.json({ 
                error: "عفواً، لقد تم حظر هذا الجهاز أو الرقم أو الإيميل من الوصول للنظام. يرجى مراجعة الإدارة." 
            }, { status: 403 });
        }

        // --- 2. Check for existing UNFINISHED session (for THIS profession only) ---
        const existingSessionConditions: any[] = [
            { visitorPhone: visitorPhone },
            { visitorPhone: phoneWithoutPlus }
        ];
        if (visitorEmail) existingSessionConditions.push({ visitorEmail: visitorEmail });
        if (baseFingerprint) existingSessionConditions.push({ deviceFingerprint: { startsWith: baseFingerprint } });

        const existingSession = await prisma.examSession.findFirst({
            where: {
                professionId: profession.id,
                status: { in: ["NEW", "STARTED", "RESUMED"] },
                OR: existingSessionConditions
            },
            orderBy: { createdAt: "desc" }
        });

        if (existingSession) {
            if (existingSession.status === "STARTED" || existingSession.status === "RESUMED") {
                if (existingSession.startedAt) {
                    const elapsed = new Date().getTime() - existingSession.startedAt.getTime();
                    const durationMs = (profession.examDuration || 60) * 60 * 1000;
                    if (elapsed < durationMs) {
                        return NextResponse.json({ token: existingSession.token, professionName: profession.name });
                    } else {
                        await prisma.examSession.update({
                            where: { id: existingSession.id },
                            data: { status: "TIMEOUT" }
                        });
                    }
                }
            } else if (existingSession.status === "NEW") {
                await prisma.examSession.update({
                    where: { id: existingSession.id },
                    data: {
                        visitorPhone: visitorPhone,
                        ipAddress: ipAddress,
                        ...(visitorEmail ? { visitorEmail } : {}),
                        ...(deviceFingerprint ? { deviceFingerprint } : {})
                    }
                });
                return NextResponse.json({ token: existingSession.token, professionName: profession.name });
            }
        }

        // --- 3. Attempt Limits (Packages vs Global Fallback) ---
        const config = await prisma.serviceConfig.findUnique({ where: { id: "global" } });
        const packagesEnabled = config?.mockExamPackagesEnabled ?? true;
        const consumedStatuses: ExamSessionStatus[] = ["SUBMITTED", "EXPIRED", "TIMEOUT"];
        
        let purchaseIdToLink: string | null = null;
        let attemptNum = 1;

        if (packagesEnabled) {
            const uniquePhones = getPhoneVariants(visitorPhone);
            const activePurchaseConditions: any[] = uniquePhones.map(ph => ({ phone: ph }));
            if (visitorEmail) activePurchaseConditions.push({ email: visitorEmail });

            // Find all active purchases
            const purchases = await prisma.mockExamPurchase.findMany({
                where: {
                    OR: activePurchaseConditions,
                    status: { in: ["ACTIVE", "PAID"] },
                    isPaid: true,
                },
                orderBy: { createdAt: "desc" }
            });

            // Find the first valid one in memory
            let activePurchase = purchases.find(p => {
                const isExpired = p.expiresAt && p.expiresAt < new Date();
                const hasCreditsLeft = p.totalCredits === -1 || p.usedCredits < p.totalCredits;
                return !isExpired && hasCreditsLeft;
            }) || null;

            if (!activePurchase) {
                // If they have past purchases but none are valid/active, they are exhausted
                const hasPastPurchases = purchases.length > 0;
                if (hasPastPurchases) {
                    return NextResponse.json({ error: "لقد استنفذت جميع محاولات باقاتك السابقة. يرجى الاشتراك في إحدى الباقات المتاحة للاستمرار." }, { status: 403 });
                }

                // Try to find a FREE package and auto-assign since they are a new user
                const freePackage = await prisma.mockExamPackage.findFirst({
                    where: { isFree: true, isActive: true },
                    orderBy: { sortOrder: "asc" }
                });

                if (freePackage) {
                    // --- SECURITY: Device Fingerprint Attempt Limit Check ---
                    // Prevent creating a new free package purchase if the same device fingerprint has already used the free credits limit
                    if (baseFingerprint && baseFingerprint !== "unknown" && baseFingerprint !== "fallback") {
                        const freeCreditsLimit = freePackage.examCredits;
                        
                        const freeSessionsOnDevice = await prisma.examSession.count({
                            where: {
                                deviceFingerprint: { startsWith: baseFingerprint },
                                OR: [
                                    { purchase: { package: { isFree: true } } },
                                    { purchaseId: null }
                                ]
                            }
                        });
                        
                        if (freeSessionsOnDevice >= freeCreditsLimit) {
                            console.warn(`[OTP Security] Fingerprint block triggered for ${baseFingerprint}. Free sessions: ${freeSessionsOnDevice}/${freeCreditsLimit}`);
                            return NextResponse.json({ 
                                error: "لقد استنفذت الحد الأقصى للمحاولات المجانية المتاحة لهذا الجهاز. يرجى الاشتراك في إحدى باقات الاختبارات للمتابعة." 
                            }, { status: 403 });
                        }
                    }

                    activePurchase = await prisma.mockExamPurchase.create({
                        data: {
                            phone: visitorPhone,
                            buyerName: visitorName,
                            email: visitorEmail || null,
                            packageId: freePackage.id,
                            totalCredits: freePackage.examCredits,
                            amount: 0,
                            isPaid: true,
                            status: "ACTIVE",
                            activatedAt: new Date(),
                            expiresAt: freePackage.validityDays ? new Date(Date.now() + freePackage.validityDays * 24 * 60 * 60 * 1000) : null
                        }
                    });
                } else {
                    return NextResponse.json({ error: "عذراً، لا توجد لديك أي محاولات متاحة في الوقت الحالي. يرجى الاشتراك في إحدى باقات الاختبارات." }, { status: 403 });
                }
            }

            // Deduct credit
            if (activePurchase.totalCredits !== -1) {
                await prisma.mockExamPurchase.update({
                    where: { id: activePurchase.id },
                    data: { usedCredits: { increment: 1 } }
                });
            }
            purchaseIdToLink = activePurchase.id;
            
            const prevSessionsCount = await prisma.examSession.count({
                where: {
                    professionId: profession.id,
                    OR: [
                        { visitorPhone: visitorPhone },
                        { visitorPhone: phoneWithoutPlus }
                    ]
                }
            });
            attemptNum = prevSessionsCount + 1;

        } else {
            // Dynamic Global Attempts Fallback Logic
            const freePackage = await prisma.mockExamPackage.findFirst({
                where: { isFree: true, isActive: true },
                select: { examCredits: true }
            });
            const MAX_GLOBAL_ATTEMPTS = freePackage?.examCredits ?? 2;
            const attemptsByPhone = await prisma.examSession.count({
                where: { type: "PUBLIC", OR: [{ visitorPhone: visitorPhone }, { visitorPhone: phoneWithoutPlus }], status: { in: consumedStatuses } }
            });
            let attemptsByFingerprint = 0;
            if (baseFingerprint) {
                attemptsByFingerprint = await prisma.examSession.count({
                    where: { type: "PUBLIC", deviceFingerprint: { startsWith: baseFingerprint }, status: { in: consumedStatuses } }
                });
            }
            let attemptsByEmail = 0;
            if (visitorEmail) {
                attemptsByEmail = await prisma.examSession.count({
                    where: { type: "PUBLIC", visitorEmail: visitorEmail, status: { in: consumedStatuses } }
                });
            }
            const previousAttempts = Math.max(attemptsByPhone, attemptsByFingerprint, attemptsByEmail);
            if (previousAttempts >= MAX_GLOBAL_ATTEMPTS) {
                return NextResponse.json({ error: "لقد استنفذت جميع محاولاتك المجانية المتاحة." }, { status: 403 });
            }
            
            const totalPreviousSessions = await prisma.examSession.count({
                where: {
                    professionId: profession.id,
                    OR: [
                        { visitorPhone: visitorPhone },
                        { visitorPhone: phoneWithoutPlus }
                    ]
                }
            });
            attemptNum = totalPreviousSessions + 1;
        }

        // --- 3.5. IP Abuse Detection ---
        // If same IP has 6+ sessions with different phone numbers → suspicious, block
        if (ipAddress && ipAddress !== "unknown") {
            const distinctPhonesFromIp = await prisma.examSession.findMany({
                where: {
                    type: "PUBLIC",
                    ipAddress: ipAddress,
                    visitorPhone: { not: null },
                    status: { in: consumedStatuses }
                },
                select: { visitorPhone: true },
                distinct: ["visitorPhone"]
            });
            if (distinctPhonesFromIp.length >= 5) {
                return NextResponse.json({
                    error: "تم اكتشاف نشاط مشبوه من هذا الاتصال. يرجى التواصل مع الإدارة."
                }, { status: 403 });
            }
        }

        // --- 4. Strict Verification Check ---
        const applicant = await prisma.applicant.findFirst({
            where: {
                OR: [
                    { phone: visitorPhone },
                    { phone: phoneWithoutPlus },
                    { whatsappNumber: visitorPhone },
                    { whatsappNumber: phoneWithoutPlus }
                ]
            }
        });

        const otpRecord = await prisma.mockVisitorOtp.findFirst({
            where: {
                OR: [
                    { phone: visitorPhone },
                    { phone: phoneWithoutPlus },
                    { phone: `+${phoneWithoutPlus}` }
                ]
            }
        });
        
        if (!applicant && !otpRecord?.verified) {
            return NextResponse.json({ error: "الرجاء تأكيد رقم الهاتف أولاً" }, { status: 403 });
        }

        // --- 5. Create New Session ---
        const session = await prisma.examSession.create({
            data: {
                type: "PUBLIC",
                professionId: profession.id,
                visitorName: visitorName,
                visitorPhone: visitorPhone,
                visitorEmail: visitorEmail || null,
                deviceFingerprint: deviceFingerprint || null,
                ipAddress: ipAddress,
                passingScore: profession.passingScore,
                attemptNumber: attemptNum,
                ...(purchaseIdToLink ? { purchaseId: purchaseIdToLink } : {})
            }
        });

        return NextResponse.json({ token: session.token, professionName: profession.name });
    } catch (error) {
        console.error("Public Session Init Error:", error);
        return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
    }
}
