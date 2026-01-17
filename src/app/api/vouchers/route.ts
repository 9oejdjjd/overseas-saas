
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { applicantId, type, notes, discountPercent, locationId, category, code, amount, balance, maxUses, expiryDate } = body;

        // Validation based on category
        let effectiveCategory = category || "PERSONAL";

        // Legacy support: if no category but applicantId exists, it's PERSONAL
        if (!category && applicantId) effectiveCategory = "PERSONAL";

        // Validate Public Vouchers
        if (effectiveCategory === "PUBLIC" && !code) {
            return NextResponse.json({ error: "Public vouchers require a promo code" }, { status: 400 });
        }

        // Validate Personalized Vouchers
        if (effectiveCategory !== "PUBLIC" && !applicantId) {
            return NextResponse.json({ error: "Personal vouchers require an applicant ID" }, { status: 400 });
        }

        // Handle Public Vouchers Applicant Binding
        let finalApplicantId = applicantId;
        if (effectiveCategory === "PUBLIC" && !finalApplicantId) {
            // Find or create System Applicant holder
            const systemNationalId = "SYSTEM_VOUCHER_HOLDER";
            let systemApplicant = await prisma.applicant.findFirst({ where: { nationalId: systemNationalId } });

            if (!systemApplicant) {
                try {
                    systemApplicant = await prisma.applicant.create({
                        data: {
                            fullName: "System Vouchers",
                            nationalId: systemNationalId,
                            platformEmail: "system-vouchers@internal.app",
                            profession: "System",
                            phone: "0000000000",
                            whatsappNumber: "0000000000",
                            totalAmount: 0,
                            remainingBalance: 0,
                            platformPassword: "system-placeholder",
                        }
                    });
                } catch (e) {
                    console.error("Failed to create System Applicant:", e);
                    return NextResponse.json({ error: "System initialization failed for public vouchers" }, { status: 500 });
                }
            }
            finalApplicantId = systemApplicant.id;
        }

        // Workaround: Store metadata in notes if schema update failed
        // We use EXAM_RETAKE as the underlying DB type if the selected type is EXAM or FULL_PROGRAM
        const dbType = (type === "EXAM" || type === "FULL_PROGRAM") ? "EXAM_RETAKE" : (type || "EXAM_RETAKE");

        // For PUBLIC vouchers, we need an applicantId since DB requires it (NOT NULL).
        // We will fallback to a System Placeholder or just fail if not provided in request (assuming frontend handles it).
        // Best approach: If PUBLIC and no applicantId, try to find a system admin or just use null if DB allows (it doesn't).
        // Hack: If PUBLIC, we might need to skip DB creation?? No.
        // We will assume frontend sends a "System Applicant ID" for PUBLIC vouchers?
        // Or I just let Prisma fail if applicantId is missing.
        // I'll keep applicantId required in destructuring above if provided.

        const metadata = {
            realType: type || "GENERIC",
            category: effectiveCategory,
            discount: discountPercent || 100,
            location: locationId,
            code: code,
            amount: amount,
            balance: balance || amount,
            maxUses: maxUses,
            expiryDate: expiryDate
        };
        const notesWithMeta = `${notes || ""} [META:${JSON.stringify(metadata)}]`;

        const voucher = await prisma.voucher.create({
            data: {
                applicantId: finalApplicantId,
                type: dbType,
                notes: notesWithMeta,
            }
        });

        // Parse back for response
        const responseVoucher = { ...voucher, ...metadata, type: type, discountPercent: metadata.discount };
        return NextResponse.json(responseVoucher);
    } catch (error) {
        console.error("Error creating voucher:", error);
        return NextResponse.json({ error: "Failed to create voucher" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const applicantId = searchParams.get("applicantId");
        const activeOnly = searchParams.get("activeOnly") === "true";
        const type = searchParams.get("type"); // e.g. EXAM
        const category = searchParams.get("category"); // PERSONAL, PUBLIC, COMPENSATION

        const whereClause: any = {};
        if (applicantId) whereClause.applicantId = applicantId;
        if (activeOnly) whereClause.isUsed = false;

        // Broad fetch logic
        if (type === "EXAM" || type === "EXAM_RETAKE") {
            whereClause.type = "EXAM_RETAKE";
        } else if (type) {
            whereClause.type = type;
        }

        const vouchers = await prisma.voucher.findMany({
            where: whereClause,
            include: { applicant: { select: { fullName: true, applicantCode: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const parsedVouchers = vouchers.map((v: any) => {
            // Parse Meta
            let meta: any = {
                realType: v.type,
                category: "PERSONAL", // Default
                discount: 100,
                location: null,
                code: null,
                amount: 0,
                balance: 0,
                maxUses: 1,
                expiryDate: null
            };

            let cleanNotes = v.notes;
            if (v.notes && v.notes.includes("[META:")) {
                try {
                    const parts = v.notes.split("[META:");
                    cleanNotes = parts[0].trim();
                    meta = JSON.parse(parts[1].slice(0, -1)); // Remove closing ]
                } catch (e) { }
            }
            return {
                ...v,
                type: meta.realType || v.type, // Restore real type
                category: meta.category || "PERSONAL",
                discountPercent: meta.discount || 100,
                locationId: meta.location || null,
                code: meta.code,
                amount: meta.amount,
                balance: meta.balance,
                maxUses: meta.maxUses,
                expiryDate: meta.expiryDate,
                notes: cleanNotes
            };
        });

        // Filter by requested category and type
        const filtered = parsedVouchers.filter((v: any) => {
            let match = true;
            if (category && v.category !== category) match = false;

            if (type) {
                if (type === "EXAM") {
                    if (v.type !== "EXAM" && v.type !== "EXAM_RETAKE" && v.type !== "FULL_PROGRAM") match = false;
                } else {
                    if (v.type !== type) match = false;
                }
            }
            return match;
        });

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("Error fetching vouchers:", error);
        return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 });
    }
}
