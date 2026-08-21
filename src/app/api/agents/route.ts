import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");

        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: "insensitive" } },
                { ownerName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
            ];
        }
        if (status) {
            where.status = status;
        }

        const [agents, total] = await Promise.all([
            prisma.travelAgent.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { clients: true, examOrders: true },
                    },
                },
            }),
            prisma.travelAgent.count({ where }),
        ]);

        return NextResponse.json({
            data: agents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.manage")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const data = await req.json();
        const { 
            companyName, 
            ownerName, 
            email, 
            phone, 
            whatsappNumber, 
            address, 
            city, 
            licenseNumber, 
            password,
            initialBalance
        } = data;

        if (!companyName || !ownerName || !email || !phone) {
            return NextResponse.json({ error: "البيانات الأساسية المطلوبة مفقودة" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
        }

        const generatedPassword = password || (Math.random().toString(36).slice(-8) + "A1!");
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        const parsedInitialBalance = initialBalance ? Number(initialBalance) : 0;

        const result = await prisma.$transaction(async (tx) => {
            const agent = await tx.travelAgent.create({
                data: {
                    companyName,
                    ownerName,
                    email,
                    phone,
                    whatsappNumber,
                    address,
                    city,
                    licenseNumber,
                    commissionRate: 0,
                    status: "ACTIVE",
                    walletBalance: parsedInitialBalance,
                    totalDeposited: parsedInitialBalance,
                    totalSpent: 0,
                },
            });

            await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: ownerName || companyName,
                    role: "TRAVEL_AGENT",
                    agentId: agent.id,
                    isAgentOwner: true,
                    requirePasswordChange: true,
                },
            });

            if (parsedInitialBalance > 0) {
                await tx.agentWalletTransaction.create({
                    data: {
                        agentId: agent.id,
                        amount: parsedInitialBalance,
                        type: 'DEPOSIT',
                        balanceBefore: 0,
                        balanceAfter: parsedInitialBalance,
                        description: "شحن رصيد افتتاحي عند إنشاء الحساب",
                        approvedById: session.user.id,
                    }
                });
            }

            return agent;
        });

        return NextResponse.json({ 
            data: { 
                ...result, 
                password: generatedPassword 
            }, 
            message: "تم إنشاء الوكيل بنجاح" 
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
