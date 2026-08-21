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

        // Only load active professions and count their questions
        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: { name: 'asc' },
        });

        // Filter to only return professions with at least 30 questions in the question bank
        const filteredProfessions = professions
            .filter(p => p._count.questions >= 30)
            .map(({ _count, ...rest }) => rest);

        return NextResponse.json({ data: filteredProfessions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
