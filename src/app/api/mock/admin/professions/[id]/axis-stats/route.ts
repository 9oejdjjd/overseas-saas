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

        // Aggregate questions count by axis and type (In-memory grouping to support IMAGE questions as a distinct type)
        const questions = await prisma.question.findMany({
            where: { professionId },
            select: { axis: true, type: true, imageUrl: true }
        });

        // Format into a friendly dictionary: { "HEALTH_SAFETY": { "MCQ": 10, "TRUE_FALSE": 5, ... }, ... }
        const stats: Record<string, Record<string, number>> = {};
        questions.forEach(q => {
            const axis = q.axis;
            if (!stats[axis]) {
                stats[axis] = { MCQ: 0, TRUE_FALSE: 0, FILL_BLANK: 0, IMAGE: 0 };
            }
            
            const isImage = q.imageUrl && q.imageUrl.trim() !== "" && q.imageUrl !== "null";
            const effectiveType = isImage ? "IMAGE" : q.type;
            
            if (stats[axis][effectiveType] !== undefined) {
                stats[axis][effectiveType]++;
            } else {
                stats[axis][effectiveType] = 1;
            }
        });

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        console.error("GET Axis Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch axis stats" }, { status: 500 });
    }
}
