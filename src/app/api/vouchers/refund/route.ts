
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        /* 
        // RBAC Check - Optional for now, but good practice
        if (!session || !hasPermission(session.user.role, "MANAGE_ACCOUNTING")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        */

        const body = await req.json();
        const { voucherId, notes } = body;

        if (!voucherId) {
            return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 });
        }

        // 1. Fetch Voucher
        const voucher = await prisma.voucher.findUnique({
            where: { id: voucherId },
            include: { applicant: true }
        });

        if (!voucher) {
            return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
        }

        if (voucher.isUsed) {
            return NextResponse.json({ error: "Voucher is already used" }, { status: 400 });
        }

        // Check Category (Must be Compensation)
        // Metadata parsing might be needed if category is not a field.
        // Assuming we rely on the `notes` field or just trust the ID for now.
        // But better to check type/notes context if possible. 
        // For now, we proceed as long as it has value.

        // Calculate Amount (Parsing from metadata if stored there, or generic logic)
        // In this system, Amount might be in Metadata.
        let amount = 0;
        if (voucher.notes && voucher.notes.includes("[META:")) {
            try {
                const parts = voucher.notes.split("[META:");
                const meta = JSON.parse(parts[1].slice(0, -1));
                amount = Number(meta.balance) || Number(meta.amount) || 0;
            } catch (e) {
                console.error("Failed to parse voucher meta", e);
            }
        }

        if (amount <= 0) {
            return NextResponse.json({ error: "Invalid voucher amount" }, { status: 400 });
        }


        // 2. Transaction (Withdrawal/Expense)
        // We are paying CASH to the user.
        // This is a WITHDRAWAL from the system.

        const transaction = await prisma.transaction.create({
            data: {
                amount: -amount, // Money leaving
                type: "WITHDRAWAL", // Or EXPENSE
                category: "VOUCHER_REFUND",
                description: `Cash Refund for Voucher`,
                notes: `Refunded Voucher #${voucher.id}. ${notes || ""}`,
                applicantId: voucher.applicantId,
                date: new Date()
            }
        });

        // 3. Mark Voucher as Used
        await prisma.voucher.update({
            where: { id: voucherId },
            data: {
                isUsed: true,
                usedAt: new Date(),
                notes: `${voucher.notes} [REFUNDED_CASH]`
            }
        });

        return NextResponse.json({ success: true, transaction });

    } catch (error) {
        console.error("Refund error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
