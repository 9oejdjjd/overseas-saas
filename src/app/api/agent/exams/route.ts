import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");

        const where: any = { agentId: session.user.agentId };
        if (status) where.status = status;

        const skip = (page - 1) * limit;

        const [exams, total] = await Promise.all([
            prisma.agentExamOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    client: { select: { fullName: true, passportNumber: true } },
                    profession: { select: { name: true } },
                    session: { select: { token: true, status: true, score: true } },
                },
            }),
            prisma.agentExamOrder.count({ where }),
        ]);

        return NextResponse.json({
            data: exams,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
