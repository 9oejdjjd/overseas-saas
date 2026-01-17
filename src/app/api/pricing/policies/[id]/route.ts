
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const policy = await prisma.cancellationPolicy.update({
            where: { id },
            data: {
                ...body
            }
        });

        return NextResponse.json(policy);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.cancellationPolicy.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
    }
}
