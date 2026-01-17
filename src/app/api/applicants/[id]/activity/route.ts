import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Next.js 15 requires await

        const logs = await prisma.activityLog.findMany({
            where: { applicantId: id },
            orderBy: { timestamp: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Activity Log Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity logs" },
            { status: 500 }
        );
    }
}
