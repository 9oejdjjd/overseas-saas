import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }
        const agentId = session.user.agentId;
        const { id } = await params;

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.agentExamOrder.findFirst({
                where: { id, agentId },
                include: { session: true }
            });

            if (!order) throw new Error("الطلب غير موجود");
            if (order.status !== 'PENDING' && order.status !== 'SENT') {
                throw new Error("لا يمكن إلغاء هذا الطلب");
            }

            const updatedOrder = await tx.agentExamOrder.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            if (order.sessionId) {
                await tx.examSession.update({
                    where: { id: order.sessionId },
                    data: { status: 'EXPIRED' }
                });
            }

            const agent = await tx.travelAgent.findUnique({ where: { id: agentId } });
            if (!agent) throw new Error("الوكالة غير موجودة");

            const price = Number(order.examPrice);
            const balanceBefore = Number(agent.walletBalance);
            const balanceAfter = balanceBefore + price;
            const newTotalSpent = Number(agent.totalSpent) - price;

            const updatedAgent = await tx.travelAgent.update({
                where: { id: agentId },
                data: {
                    walletBalance: balanceAfter,
                    totalSpent: newTotalSpent,
                }
            });

            await tx.agentWalletTransaction.create({
                data: {
                    agentId,
                    amount: price,
                    type: 'REFUND',
                    balanceBefore,
                    balanceAfter,
                    description: `استرجاع رصيد لإلغاء طلب اختبار ${order.id}`,
                    orderId: order.id,
                    approvedById: session.user.id,
                }
            });

            return updatedOrder;
        });

        return NextResponse.json({ data: result, message: "تم إلغاء الطلب واسترجاع الرصيد بنجاح" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
