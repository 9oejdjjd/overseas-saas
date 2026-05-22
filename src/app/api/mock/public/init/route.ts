import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExamSessionStatus } from "@prisma/client";
import { normalizePhone } from "@/lib/phone-utils";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitorName, professionSlug, deviceFingerprint } = body;
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

        if (profession._count.questions < profession.questionCount) {
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
        // Block if any session matching this IP, Phone, or Fingerprint is banned.
        const isBanned = await prisma.examSession.findFirst({
            where: {
                isBanned: true,
                OR: [
                    { visitorPhone: visitorPhone },
                    { visitorPhone: phoneWithoutPlus },
                    { ipAddress: ipAddress },
                    ...(baseFingerprint ? [{ deviceFingerprint: { startsWith: baseFingerprint } }] : [])
                ]
            }
        });

        if (isBanned) {
            return NextResponse.json({ 
                error: "عفواً، لقد تم حظر هذا الجهاز أو الرقم من الوصول للنظام. يرجى مراجعة الإدارة." 
            }, { status: 403 });
        }

        // --- 2. Check for existing UNFINISHED session (for THIS profession only) ---
        const existingSession = await prisma.examSession.findFirst({
            where: {
                professionId: profession.id,
                status: { in: ["NEW", "STARTED", "RESUMED"] },
                OR: [
                    { visitorPhone: visitorPhone },
                    { visitorPhone: phoneWithoutPlus },
                    ...(baseFingerprint ? [{ deviceFingerprint: { startsWith: baseFingerprint } }] : [])
                ]
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
            // Find active purchase
            let activePurchase = await prisma.mockExamPurchase.findFirst({
                where: {
                    OR: [{ phone: visitorPhone }, { phone: phoneWithoutPlus }],
                    status: "ACTIVE",
                    isPaid: true,
                },
                orderBy: { createdAt: "desc" }
            });

            // Filter out purchases that are fully consumed or expired (doing it in JS for flexibility)
            if (activePurchase) {
                if (activePurchase.totalCredits !== -1 && activePurchase.usedCredits >= activePurchase.totalCredits) activePurchase = null;
                if (activePurchase?.expiresAt && activePurchase.expiresAt < new Date()) activePurchase = null;
            }

            if (!activePurchase) {
                // Try to find a FREE package and auto-assign
                const freePackage = await prisma.mockExamPackage.findFirst({
                    where: { isFree: true, isActive: true },
                    orderBy: { sortOrder: "asc" }
                });

                if (freePackage) {
                    activePurchase = await prisma.mockExamPurchase.create({
                        data: {
                            phone: visitorPhone,
                            buyerName: visitorName,
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
                    return NextResponse.json({ error: "لا توجد باقة أو محاولات متاحة لك حالياً. يرجى الاشتراك في إحدى الباقات." }, { status: 403 });
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
            attemptNum = activePurchase.usedCredits + 1;

        } else {
            // Legacy 3 Global Attempts Logic
            const MAX_GLOBAL_ATTEMPTS = 3;
            const attemptsByPhone = await prisma.examSession.count({
                where: { type: "PUBLIC", OR: [{ visitorPhone: visitorPhone }, { visitorPhone: phoneWithoutPlus }], status: { in: consumedStatuses } }
            });
            let attemptsByFingerprint = 0;
            if (baseFingerprint) {
                attemptsByFingerprint = await prisma.examSession.count({
                    where: { type: "PUBLIC", deviceFingerprint: { startsWith: baseFingerprint }, status: { in: consumedStatuses } }
                });
            }
            const previousAttempts = Math.max(attemptsByPhone, attemptsByFingerprint);
            if (previousAttempts >= MAX_GLOBAL_ATTEMPTS) {
                return NextResponse.json({ error: `لقد استنفذت جميع محاولاتك المجانية (${MAX_GLOBAL_ATTEMPTS} محاولات).` }, { status: 403 });
            }
            attemptNum = previousAttempts + 1;
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
