
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const templates = await prisma.messagingTemplate.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const template = await prisma.messagingTemplate.create({
            data: {
                name: body.name,
                type: body.type,
                subject: body.subject,
                body: body.body,
                active: body.active ?? true,
            },
        });
        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
}
