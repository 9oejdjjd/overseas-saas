import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const [agent, user] = await Promise.all([
            prisma.travelAgent.findUnique({
                where: { id: session.user.agentId },
            }),
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, name: true, email: true, createdAt: true, isAgentOwner: true },
            }),
        ]);

        if (!agent) {
            return NextResponse.json({ error: "الوكالة غير موجودة" }, { status: 404 });
        }

        return NextResponse.json({ 
            data: {
                ...agent,
                commissionRate: Number(agent.commissionRate || 0),
                walletBalance: Number(agent.walletBalance || 0),
                debtLimit: Number(agent.debtLimit || 0),
                customSingleExamPrice: agent.customSingleExamPrice ? Number(agent.customSingleExamPrice) : null,
                userAccount: user,
            } 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const body = await req.json();
        const { 
            whatsappNumber, 
            address, 
            city, 
            companyNameEn, 
            licenseNumber,
            currentPassword,
            newPassword
        } = body;

        // 1. If password update requested
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "يرجى إدخال كلمة المرور الحالية" }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: session.user.id },
            });

            if (!currentUser || !currentUser.password) {
                return NextResponse.json({ error: "تعذر التحقق من بيانات المستخدم" }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPassword, currentUser.password);
            if (!isValid) {
                return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword },
            });
        }

        // 2. Update agent profile fields
        const updateData: any = {};
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (companyNameEn !== undefined) updateData.companyNameEn = companyNameEn;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

        const updatedAgent = await prisma.travelAgent.update({
            where: { id: session.user.agentId },
            data: updateData,
        });

        return NextResponse.json({ 
            data: updatedAgent, 
            message: "تم تحديث الإعدادات والملف الشخصي بنجاح" 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
