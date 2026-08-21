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

        const client = await prisma.agentClient.findFirst({
            where: { id, agentId: session.user.agentId },
            include: {
                examOrders: {
                    include: {
                        profession: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
            },
        });

        if (!client) {
            return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ data: client });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();

        const client = await prisma.agentClient.updateMany({
            where: { id, agentId: session.user.agentId },
            data,
        });

        if (client.count === 0) {
            return NextResponse.json({ error: "العميل غير موجود أو لا تملك صلاحية تعديله" }, { status: 404 });
        }

        return NextResponse.json({ message: "تم تحديث بيانات العميل" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const client = await prisma.agentClient.deleteMany({
            where: { id, agentId: session.user.agentId },
        });

        if (client.count === 0) {
            return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ message: "تم حذف العميل" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
