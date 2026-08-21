import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const users = await prisma.user.findMany({
            where: { agentId: id },
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                isAgentOwner: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ data: users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.manage")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { name, email, password, isAgentOwner } = data;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "البيانات الأساسية المطلوبة مفقودة" }, { status: 400 });
        }

        // Check if agent exists
        const agent = await prisma.travelAgent.findUnique({ where: { id } });
        if (!agent) {
            return NextResponse.json({ error: "الوكالة غير موجودة" }, { status: 404 });
        }

        // Check if email already registered
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً لمستخدم آخر" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "TRAVEL_AGENT",
                agentId: id,
                isAgentOwner: isAgentOwner || false,
                requirePasswordChange: false,
                active: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                isAgentOwner: true,
                createdAt: true
            }
        });

        return NextResponse.json({ data: newUser, message: "تمت إضافة المستخدم بنجاح" }, { status: 201 });
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

        const { id } = await params; // agentId
        const data = await req.json();
        const { userId, name, email, password, active, isAgentOwner } = data;

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب للتعديل" }, { status: 400 });
        }

        // Confirm user belongs to this agent
        const targetUser = await prisma.user.findFirst({
            where: { id: userId, agentId: id }
        });
        if (!targetUser) {
            return NextResponse.json({ error: "المستخدم غير موجود أو لا ينتمي لهذا الوكيل" }, { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            // Check if email already registered elsewhere
            const existingEmail = await prisma.user.findFirst({
                where: { email, NOT: { id: userId } }
            });
            if (existingEmail) {
                return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً لمستخدم آخر" }, { status: 400 });
            }
            updateData.email = email;
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        if (active !== undefined) updateData.active = Boolean(active);
        if (isAgentOwner !== undefined) updateData.isAgentOwner = Boolean(isAgentOwner);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                isAgentOwner: true,
                createdAt: true
            }
        });

        return NextResponse.json({ data: updatedUser, message: "تم تحديث المستخدم بنجاح" });
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
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب للحذف" }, { status: 400 });
        }

        const targetUser = await prisma.user.findFirst({
            where: { id: userId, agentId: id }
        });
        if (!targetUser) {
            return NextResponse.json({ error: "المستخدم غير موجود أو لا ينتمي لهذا الوكيل" }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
