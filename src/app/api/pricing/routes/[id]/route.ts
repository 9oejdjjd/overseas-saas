import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const route = await prisma.transportRouteDefault.update({
            where: { id },
            data: {
                price: body.oneWayPrice,
                priceRoundTrip: body.roundTripPrice,
            }
        });

        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const route = await prisma.transportRouteDefault.delete({
            where: { id },
        });

        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
    }
}
