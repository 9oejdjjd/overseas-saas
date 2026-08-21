import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const totalAgents = await prisma.travelAgent.count();
        const activeAgents = await prisma.travelAgent.count({ where: { status: "ACTIVE" } });
        
        const aggregations = await prisma.travelAgent.aggregate({
            _sum: {
                walletBalance: true,
                totalDeposited: true,
                totalSpent: true,
            },
        });

        const totalExamsSent = await prisma.agentExamOrder.count();

        return NextResponse.json({
            data: {
                totalAgents,
                activeAgents,
                totalWalletBalance: aggregations._sum.walletBalance || 0,
                totalDeposited: aggregations._sum.totalDeposited || 0,
                totalSpent: aggregations._sum.totalSpent || 0,
                totalExamsSent,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
