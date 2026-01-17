
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        const template = await prisma.messagingTemplate.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        await prisma.messagingTemplate.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }
}
