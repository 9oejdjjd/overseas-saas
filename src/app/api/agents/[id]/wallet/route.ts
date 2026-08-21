import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.credits")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { amount, description, type } = data; // type: DEPOSIT, ADJUSTMENT, BONUS

        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount === 0) {
            return NextResponse.json({ error: "مبلغ غير صحيح" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const agent = await tx.travelAgent.findUnique({ where: { id } });
            if (!agent) throw new Error("الوكيل غير موجود");

            const balanceBefore = Number(agent.walletBalance);
            const balanceAfter = balanceBefore + parsedAmount;

            if (balanceAfter < 0) {
                throw new Error("لا يمكن للرصيد أن يصبح بالسالب");
            }

            const totalDepositedDiff = type === 'DEPOSIT' && parsedAmount > 0 ? parsedAmount : 0;
            const newTotalDeposited = Number(agent.totalDeposited) + totalDepositedDiff;

            const updatedAgent = await tx.travelAgent.update({
                where: { id },
                data: {
                    walletBalance: balanceAfter,
                    totalDeposited: newTotalDeposited,
                },
            });

            const transaction = await tx.agentWalletTransaction.create({
                data: {
                    agentId: id,
                    amount: parsedAmount,
                    type: type || 'DEPOSIT',
                    balanceBefore,
                    balanceAfter,
                    description,
                    approvedById: session.user.id,
                },
            });

            return { agent: updatedAgent, transaction };
        });

        return NextResponse.json({ data: result, message: "تم تحديث رصيد المحفظة بنجاح" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const transactions = await prisma.agentWalletTransaction.findMany({
            where: { agentId: id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({ data: transactions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
