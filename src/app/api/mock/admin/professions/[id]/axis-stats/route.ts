import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id: professionId } = await params;

        // Verify profession exists
        const profession = await prisma.profession.findUnique({
            where: { id: professionId }
        });

        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        // Aggregate questions count by axis
        const axisGroup = await prisma.question.groupBy({
            by: ['axis'],
            where: { professionId },
            _count: {
                axis: true
            }
        });

        // Format into a friendly dictionary: { "HEALTH_SAFETY": 12, ... }
        const stats: Record<string, number> = {};
        axisGroup.forEach(group => {
            stats[group.axis] = group._count.axis;
        });

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        console.error("GET Axis Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch axis stats" }, { status: 500 });
    }
}
