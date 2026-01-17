import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { action, details } = await request.json();
        const applicantId = params.id;

        const log = await prisma.activityLog.create({
            data: {
                action,
                details,
                applicantId
            }
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("Log Error:", error);
        return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
    }
}
