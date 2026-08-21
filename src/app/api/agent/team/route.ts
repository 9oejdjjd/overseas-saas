import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const team = await prisma.user.findMany({
            where: { agentId: session.user.agentId, role: "TRAVEL_AGENT" },
            select: { id: true, name: true, email: true, isAgentOwner: true, createdAt: true },
        });

        return NextResponse.json({ data: team });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT" || !session.user.isAgentOwner) {
            return NextResponse.json({ error: "غير مصرح أو لا تملك صلاحية إضافة أعضاء" }, { status: 401 });
        }

        const data = await req.json();
        const { name, email, password } = data;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "البيانات المطلوبة مفقودة" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "TRAVEL_AGENT",
                agentId: session.user.agentId,
                isAgentOwner: false,
            }
        });

        return NextResponse.json({ data: { id: newUser.id, name: newUser.name, email: newUser.email }, message: "تمت إضافة عضو الفريق بنجاح" }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
