import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: locationId } = await params;
        const body = await request.json();
        const { name, address, locationUrl } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const center = await prisma.examCenter.create({
            data: {
                name,
                address,
                locationUrl,
                locationId,
            },
        });

        return NextResponse.json(center);
    } catch (error) {
        console.error("Error creating exam center:", error);
        return NextResponse.json(
            { error: "Failed to create exam center" },
            { status: 500 }
        );
    }
}
