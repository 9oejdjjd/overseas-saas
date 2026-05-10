import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Normalize phone numbers by stripping all non-digit chars except leading +
function normalizePhone(phone: string): string {
    if (!phone) return "";
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // Ensure starts with +
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitorName, professionSlug, deviceFingerprint, otp } = body;
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
        // Fingerprint is "browserId-localId". We only want "browserId" to prevent bypassing via cleared localStorage.
        let baseFingerprint = deviceFingerprint || null;
        if (baseFingerprint && baseFingerprint.includes("-")) {
            baseFingerprint = baseFingerprint.split("-")[0];
        }

        // --- 2. Check for existing UNFINISHED session ---
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
                        ...(deviceFingerprint ? { deviceFingerprint } : {})
                    }
                });
                return NextResponse.json({ token: existingSession.token, professionName: profession.name });
            }
        }

        // --- 3. Check Attempt Limits (GLOBAL) ---
        const MAX_GLOBAL_ATTEMPTS = 3;

        const previousAttemptsByPhone = await prisma.examSession.count({
            where: {
                type: "PUBLIC",
                OR: [{ visitorPhone: visitorPhone }, { visitorPhone: phoneWithoutPlus }],
                status: { in: ["SUBMITTED", "EXPIRED", "TIMEOUT"] }
            }
        });

        let previousAttemptsByFingerprint = 0;
        if (baseFingerprint) {
            previousAttemptsByFingerprint = await prisma.examSession.count({
                where: {
                    type: "PUBLIC",
                    deviceFingerprint: { startsWith: baseFingerprint },
                    status: { in: ["SUBMITTED", "EXPIRED", "TIMEOUT"] }
                }
            });
        }

        const previousAttempts = Math.max(previousAttemptsByPhone, previousAttemptsByFingerprint);

        if (previousAttempts >= MAX_GLOBAL_ATTEMPTS) {
            return NextResponse.json({
                error: `لقد استنفذت جميع محاولاتك (${MAX_GLOBAL_ATTEMPTS} محاولات مجانية). يرجى التواصل مع الإدارة.`
            }, { status: 403 });
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

        const otpRecord = await prisma.mockVisitorOtp.findUnique({ where: { phone: visitorPhone } });
        
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
                passingScore: profession.passingScore,
                attemptNumber: previousAttempts + 1
            }
        });

        return NextResponse.json({ token: session.token, professionName: profession.name });
    } catch (error) {
        console.error("Public Session Init Error:", error);
        return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
    }
}
