import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const templates = await prisma.messagingTemplate.findMany({
            orderBy: { createdAt: 'asc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, body: textBody, trigger } = body;

        // If no ID, treated as CREATE (or we can use a separate PUT)
        if (!id) {
            const newTemplate = await prisma.messagingTemplate.create({
                data: {
                    name,
                    body: textBody,
                    type: "WHATSAPP", // Default
                    trigger: trigger || null
                }
            });
            return NextResponse.json(newTemplate);
        }

        const updated = await prisma.messagingTemplate.update({
            where: { id },
            data: {
                name,
                body: textBody,
                trigger: trigger || null
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.messagingTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
