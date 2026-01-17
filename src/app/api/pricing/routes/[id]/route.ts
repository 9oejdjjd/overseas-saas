import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const route = await prisma.transportRoute.update({
            where: { id },
            data: {
                oneWayPrice: body.oneWayPrice,
                roundTripPrice: body.roundTripPrice,
                departureTime: body.departureTime,
                arrivalTime: body.arrivalTime,
                isActive: body.isActive
            }
        });

        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const route = await prisma.transportRoute.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
    }
}
