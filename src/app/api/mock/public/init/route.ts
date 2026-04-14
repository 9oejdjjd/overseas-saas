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
        const { visitorName, professionSlug, deviceFingerprint } = body;
        const visitorPhone = normalizePhone(body.visitorPhone || "");

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

        // 1. Look for an existing UNFINISHED session (NEW, STARTED, RESUMED) for this phone/fingerprint
        //    Also try matching phone without leading + for compatibility
        const phoneWithoutPlus = visitorPhone.replace(/^\+/, "");
        const existingSession = await prisma.examSession.findFirst({
            where: {
                professionId: profession.id,
                status: { in: ["NEW", "STARTED", "RESUMED"] },
                OR: [
                    { visitorPhone: visitorPhone },
                    { visitorPhone: phoneWithoutPlus },
                    ...(deviceFingerprint ? [{ deviceFingerprint }] : [])
                ]
            },
            orderBy: { createdAt: "desc" }
        });

        // 2. Auto-resume logic
        if (existingSession) {
            if (existingSession.status === "STARTED" || existingSession.status === "RESUMED") {
                // Check if time has expired
                if (existingSession.startedAt) {
                    const elapsed = new Date().getTime() - existingSession.startedAt.getTime();
                    const durationMs = (profession.examDuration || 60) * 60 * 1000;
                    if (elapsed < durationMs) {
                        // Still active, return it directly!
                        return NextResponse.json({ token: existingSession.token, professionName: profession.name });
                    } else {
                        // Time is up, mark as TIMEOUT and fall back to create new if limits allow
                        await prisma.examSession.update({
                            where: { id: existingSession.id },
                            data: { status: "TIMEOUT" }
                        });
                    }
                }
            } else if (existingSession.status === "NEW") {
                // Just a fresh session the user (or admin) created but never started. Resume it!
                // Update the phone/fingerprint on the session in case admin created it without fingerprint
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

        // 3. Check attempt limits - count ONLY fully consumed sessions (SUBMITTED, EXPIRED, TIMEOUT)
        //    Search by both phone formats for consistency
        const previousAttemptsByPhone = await prisma.examSession.count({
            where: {
                professionId: profession.id,
                OR: [
                    { visitorPhone: visitorPhone },
                    { visitorPhone: phoneWithoutPlus }
                ],
                status: { in: ["SUBMITTED", "EXPIRED", "TIMEOUT"] }
            }
        });

        let previousAttemptsByFingerprint = 0;
        if (deviceFingerprint) {
            previousAttemptsByFingerprint = await prisma.examSession.count({
                where: {
                    professionId: profession.id,
                    deviceFingerprint: deviceFingerprint,
                    status: { in: ["SUBMITTED", "EXPIRED", "TIMEOUT"] }
                }
            });
        }

        const previousAttempts = Math.max(previousAttemptsByPhone, previousAttemptsByFingerprint);

        if (previousAttempts >= profession.maxAttempts) {
            return NextResponse.json({
                error: `لقد استنفذت جميع محاولاتك (${profession.maxAttempts} محاولات). يرجى التواصل مع الإدارة للحصول على محاولات إضافية.`
            }, { status: 403 });
        }

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
