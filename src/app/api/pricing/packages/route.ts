import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const packages = await prisma.pricingPackage.findMany({

            orderBy: { name: 'asc' }
        });
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, price, actualCost } = body;

        const newPackage = await prisma.pricingPackage.create({
            data: {
                name,
                price: Number(price),
                actualCost: Number(actualCost || 0),
            },

        });

        return NextResponse.json(newPackage);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
    }
}
