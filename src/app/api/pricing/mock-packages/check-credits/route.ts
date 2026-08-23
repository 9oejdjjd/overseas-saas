import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get("phone");
        const applicantId = searchParams.get("applicantId");

        if (!phone && !applicantId) {
            return NextResponse.json({ error: "phone or applicantId required" }, { status: 400 });
        }

        // Build phone variants for matching
        const phoneVariants: string[] = [];
        if (phone) {
            phoneVariants.push(...getPhoneVariants(phone));
        }

        // If applicantId provided, get phone from applicant
        if (applicantId) {
            const applicant = await prisma.applicant.findUnique({
                where: { id: applicantId },
                select: { phone: true }
            });
            if (applicant?.phone) {
                phoneVariants.push(...getPhoneVariants(applicant.phone));
            } else {
                // Check if it is an AgentClient
                const agentClient = await prisma.agentClient.findUnique({
                    where: { id: applicantId },
                    include: {
                        examOrders: {
                            where: { status: { in: ["PENDING", "SENT", "STARTED"] } }
                        }
                    }
                });

                if (agentClient) {
                    const hasActiveOrder = agentClient.examOrders.length > 0;
                    return NextResponse.json({
                        hasCredits: hasActiveOrder,
                        remaining: agentClient.examOrders.length,
                        total: agentClient.examOrders.length,
                        used: 0,
                        packageName: "حساب وكيل معتمد",
                        purchases: []
                    });
                }
            }
        }

        const uniquePhones = [...new Set(phoneVariants)];

        // Find all active purchases for this phone or applicantId
        const purchases = await prisma.mockExamPurchase.findMany({
            where: {
                OR: [
                    ...(applicantId ? [{ applicantId: applicantId }] : []),
                    ...(uniquePhones.length > 0 ? [{ phone: { in: uniquePhones } }] : [])
                ],
                status: { in: ["ACTIVE", "PENDING", "PAID", "AWAITING_VERIFICATION", "UNDER_REVIEW"] },
            },
            include: { package: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        if (purchases.length === 0) {
            return NextResponse.json({
                hasCredits: false,
                remaining: 0,
                total: 0,
                used: 0,
                packageName: null,
                purchases: []
            });
        }

        // Aggregate credits across all purchases
        let totalCredits = 0;
        let usedCredits = 0;
        let hasUnlimited = false;

        const purchaseSummary = purchases.map((p: any) => {
            if (p.totalCredits === -1) hasUnlimited = true;
            totalCredits += p.totalCredits === -1 ? 0 : p.totalCredits;
            usedCredits += p.usedCredits;
            return {
                id: p.id,
                packageName: p.package?.name || "اختبارات مفردة",
                totalCredits: p.totalCredits,
                usedCredits: p.usedCredits,
                remaining: p.totalCredits === -1 ? -1 : p.totalCredits - p.usedCredits,
                status: p.status,
                expiresAt: p.expiresAt?.toISOString() || null,
            };
        });

        const remaining = hasUnlimited ? -1 : totalCredits - usedCredits;

        return NextResponse.json({
            hasCredits: hasUnlimited || remaining > 0,
            remaining,
            total: hasUnlimited ? -1 : totalCredits,
            used: usedCredits,
            packageName: purchases[0]?.package?.name || "اختبارات مفردة",
            purchases: purchaseSummary,
        });

    } catch (error) {
        console.error("Error checking credits:", error);
        return NextResponse.json({ error: "Failed to check credits" }, { status: 500 });
    }
}
