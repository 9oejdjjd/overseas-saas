import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: "كلمة المرور يجب أن تكون مكونة من 6 أحرف على الأقل" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                requirePasswordChange: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "USER_PASSWORD_CHANGED",
                details: `User ${updatedUser.name} (${updatedUser.email}) changed their password successfully.`,
                userId: userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "تم تغيير كلمة المرور بنجاح"
        });

    } catch (error) {
        console.error("Change Password API Error:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
