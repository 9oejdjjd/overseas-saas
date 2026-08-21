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

        const agent = await prisma.travelAgent.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        active: true,
                        isAgentOwner: true,
                    }
                },
                _count: {
                    select: { clients: true, examOrders: true, walletTransactions: true },
                },
            },
        });

        if (!agent) {
            return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ data: agent });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.manage")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { 
            companyName, 
            ownerName, 
            phone, 
            whatsappNumber, 
            address, 
            city, 
            licenseNumber, 
            commissionRate, 
            customSingleExamPrice,
            status,
            allowDebt,
            debtLimit
        } = data;

        const agent = await prisma.travelAgent.update({
            where: { id },
            data: { 
                companyName, 
                ownerName, 
                phone, 
                whatsappNumber, 
                address, 
                city, 
                licenseNumber, 
                commissionRate: commissionRate ? Number(commissionRate) : undefined, 
                customSingleExamPrice: customSingleExamPrice !== undefined ? (customSingleExamPrice === null ? null : Number(customSingleExamPrice)) : undefined,
                status,
                allowDebt: allowDebt !== undefined ? Boolean(allowDebt) : undefined,
                debtLimit: debtLimit !== undefined ? Number(debtLimit) : undefined
            },
        });

        return NextResponse.json({ data: agent, message: "تم تحديث بيانات الوكيل" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.manage")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        // Deactivate agent by setting status to SUSPENDED and isActive to false
        const agent = await prisma.travelAgent.update({
            where: { id },
            data: { status: "SUSPENDED", isActive: false },
        });

        // Also suspend users under this agent
        await prisma.user.updateMany({
            where: { agentId: id },
            data: { active: false }
        });

        return NextResponse.json({ data: agent, message: "تم تعطيل الوكيل وحسابات موظفيه" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
