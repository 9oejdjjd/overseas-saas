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

        const clientCount = await prisma.agentClient.count({ where: { agentId } });
        
        const examsByStatus = await prisma.agentExamOrder.groupBy({
            by: ['status'],
            where: { agentId },
            _count: { id: true },
        });

        const examStats = examsByStatus.reduce((acc: any, curr) => {
            acc[curr.status] = curr._count.id;
            return acc;
        }, {});

        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId },
            select: { walletBalance: true, allowDebt: true, debtLimit: true, commissionRate: true, customSingleExamPrice: true },
        });

        const config = await prisma.serviceConfig.findFirst();
        
        let examPrice = 50;
        if (agent?.customSingleExamPrice) {
            examPrice = Number(agent.customSingleExamPrice);
        } else if (config && Number(config.agentMockExamSinglePrice) > 0) {
            examPrice = Number(config.agentMockExamSinglePrice);
        } else if (config && Number(config.mockExamSinglePrice) > 0) {
            examPrice = Number(config.mockExamSinglePrice);
        }

        const recentExams = await prisma.agentExamOrder.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                client: { select: { fullName: true } },
                profession: { select: { name: true } },
            },
        });

        // Calculate pass rate
        const completedExams = await prisma.agentExamOrder.count({
            where: { agentId, status: 'COMPLETED' }
        });
        const passedExams = await prisma.agentExamOrder.count({
            where: { agentId, status: 'COMPLETED', isPassed: true }
        });

        const passRate = completedExams > 0 ? (passedExams / completedExams) * 100 : 0;

        return NextResponse.json({
            data: {
                clientCount,
                examStats,
                walletBalance: agent?.walletBalance || 0,
                allowDebt: agent?.allowDebt || false,
                debtLimit: Number(agent?.debtLimit || 0),
                commissionRate: Number(agent?.commissionRate || 0),
                examPrice,
                recentExams,
                passRate: Math.round(passRate),
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
