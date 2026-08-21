import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const order = await prisma.agentExamOrder.findFirst({
            where: { id, agentId: session.user.agentId },
            include: {
                client: true,
                profession: true,
                session: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
