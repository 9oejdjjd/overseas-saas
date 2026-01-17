import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Next.js 15 requires await
        const body = await request.json();

        const updated = await prisma.pricingPackage.update({
            where: { id },
            data: {
                ...(body.price !== undefined && { price: body.price }),
                ...(body.actualCost !== undefined && { actualCost: body.actualCost }),
                ...(body.active !== undefined && { active: body.active }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Pricing Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update pricing package" },
            { status: 500 }
        );
    }
}
