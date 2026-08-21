import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const clients = await prisma.agentClient.findMany({
            where: { agentId: id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { examOrders: true }
                }
            }
        });

        return NextResponse.json({ data: clients });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
