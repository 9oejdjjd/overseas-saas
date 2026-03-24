import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, details } = body;

        const log = await prisma.activityLog.create({
            data: {
                action,
                details,
                applicantId: id
            }
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("Log Error:", error);
        return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
    }
}
