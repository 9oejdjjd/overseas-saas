
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const pricing = await prisma.pricingPackage.findMany({
            where: { active: true },
        });
        return NextResponse.json(pricing);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch pricing" },
            { status: 500 }
        );
    }
}
