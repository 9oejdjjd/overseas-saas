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
        const agentId = session.user.agentId;

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
        const type = searchParams.get("type");
        const search = searchParams.get("search")?.trim();
        const skip = (page - 1) * limit;

        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId },
            select: { 
                walletBalance: true, 
                totalDeposited: true, 
                totalSpent: true, 
                allowDebt: true, 
                debtLimit: true,
                currency: true,
                companyName: true,
                commissionRate: true,
                customSingleExamPrice: true,
            },
        });

        if (!agent) {
            return NextResponse.json({ error: "الوكالة غير موجودة" }, { status: 404 });
        }

        const where: any = { agentId };

        if (type && type !== "ALL") {
            where.type = type;
        }

        if (search) {
            where.description = { contains: search, mode: "insensitive" };
        }

        const [transactions, total] = await Promise.all([
            prisma.agentWalletTransaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.agentWalletTransaction.count({ where }),
        ]);

        return NextResponse.json({
            data: {
                walletBalance: Number(agent.walletBalance || 0),
                totalDeposited: Number(agent.totalDeposited || 0),
                totalSpent: Number(agent.totalSpent || 0),
                allowDebt: agent.allowDebt,
                debtLimit: Number(agent.debtLimit || 0),
                currency: agent.currency || "YER",
                commissionRate: Number(agent.commissionRate || 0),
                customSingleExamPrice: agent.customSingleExamPrice ? Number(agent.customSingleExamPrice) : null,
                companyName: agent.companyName,
                transactions,
            },
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
