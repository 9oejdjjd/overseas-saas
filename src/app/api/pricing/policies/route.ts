
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const policies = await prisma.cancellationPolicy.findMany({
            orderBy: { feeAmount: 'asc' }
        });
        return NextResponse.json(policies);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category, hoursTrigger, condition, feeAmount, isActive } = body;

        const policy = await prisma.cancellationPolicy.create({
            data: {
                name,
                category,
                hoursTrigger: hoursTrigger ? Number(hoursTrigger) : null,
                condition,
                feeAmount,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(policy);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
    }
}
