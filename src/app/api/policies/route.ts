import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const policies = await prisma.cancellationPolicy.findMany({
            where: { isActive: true },
            orderBy: { feeAmount: 'asc' }
        });
        return NextResponse.json(policies);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
    }
}
