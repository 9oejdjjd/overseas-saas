import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
            select: { name: true, email: true },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "PASSWORD_RESET",
                details: `Reset password for user: ${user.name}`,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Password Reset Error:", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
