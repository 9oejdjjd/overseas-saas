import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const transactions = await prisma.transaction.findMany({
            where: {
                applicantId: id,
            },
            orderBy: { date: "desc" },
            select: {
                id: true,
                amount: true,
                type: true,
                category: true,
                description: true,
                date: true,
                notes: true,
            },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Transactions Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
