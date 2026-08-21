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
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const where: any = { agentId };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { passportNumber: { contains: search, mode: "insensitive" } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.agentClient.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { examOrders: true } },
                    examOrders: {
                        select: {
                            id: true,
                            status: true,
                            examLink: true,
                        }
                    }
                },
            }),
            prisma.agentClient.count({ where }),
        ]);

        return NextResponse.json({
            data: clients,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const data = await req.json();
        const client = await prisma.agentClient.create({
            data: {
                ...data,
                agentId: session.user.agentId,
            },
        });

        return NextResponse.json({ data: client, message: "تمت إضافة العميل بنجاح" }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
