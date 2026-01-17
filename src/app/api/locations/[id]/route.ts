import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const location = await prisma.location.update({
            where: { id },
            data: {
                name: body.name,
                code: body.code,
                address: body.address,
                locationUrl: body.locationUrl,
                isActive: body.isActive
            }
        });

        return NextResponse.json(location);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Soft delete
        const location = await prisma.location.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json(location);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
    }
}
