
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const defaults = await prisma.transportRouteDefault.findMany({
            include: {
                fromDestination: true,
                toDestination: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return NextResponse.json(defaults);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch route defaults" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fromId, toId, price, priceRoundTrip, cost, costRoundTrip } = body;

        const record = await prisma.transportRouteDefault.upsert({
            where: {
                fromDestinationId_toDestinationId: {
                    fromDestinationId: fromId,
                    toDestinationId: toId
                }
            },
            update: {
                price: parseFloat(price),
                priceRoundTrip: priceRoundTrip ? parseFloat(priceRoundTrip) : null,
                cost: cost ? parseFloat(cost) : 0,
                costRoundTrip: costRoundTrip ? parseFloat(costRoundTrip) : 0,
            },
            create: {
                fromDestinationId: fromId,
                toDestinationId: toId,
                price: parseFloat(price),
                priceRoundTrip: priceRoundTrip ? parseFloat(priceRoundTrip) : null,
                cost: cost ? parseFloat(cost) : 0,
                costRoundTrip: costRoundTrip ? parseFloat(costRoundTrip) : 0,
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error("Error saving route default:", error);
        return NextResponse.json({ error: "Failed to save route default" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.transportRouteDefault.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
