import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function generateTempPassword(length = 10) {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%&*?";
    const all = uppercase + lowercase + numbers + special;
    
    // Ensure we have at least one of each for security
    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    for (let i = 4; i < length; i++) {
        password += all.charAt(Math.floor(Math.random() * all.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Only ADMIN can reset passwords
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Verify if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate secure temporary password
        const tempPassword = generateTempPassword(10);

        // Hash temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update database
        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                requirePasswordChange: true
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "USER_PASSWORD_RESET",
                details: `Reset password for user: ${user.name} (${user.email}). Temporary password generated.`,
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            tempPassword,
            message: "تم توليد كلمة المرور المؤقتة بنجاح"
        });

    } catch (error) {
        console.error("User Password Reset API Error:", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
