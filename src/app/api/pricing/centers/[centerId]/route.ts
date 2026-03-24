import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ centerId: string }> }
) {
    try {
        const { centerId } = await params;
        const body = await request.json();

        const center = await prisma.examCenter.update({
            where: { id: centerId },
            data: body,
        });

        return NextResponse.json(center);
    } catch (error) {
        console.error("Error updating exam center:", error);
        return NextResponse.json(
            { error: "Failed to update exam center" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ centerId: string }> }
) {
    try {
        const { centerId } = await params;

        // Check if center has applicants before deleting
        const center = await prisma.examCenter.findUnique({
            where: { id: centerId },
            include: { _count: { select: { applicants: true } } }
        });

        if (center && center._count.applicants > 0) {
            return NextResponse.json(
                { error: "Cannot delete center with assigned applicants" },
                { status: 400 }
            );
        }

        await prisma.examCenter.delete({
            where: { id: centerId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting exam center:", error);
        return NextResponse.json(
            { error: "Failed to delete exam center" },
            { status: 500 }
        );
    }
}
