import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validations";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = userUpdateSchema.safeParse(body);
        
        if (!parsed.success) {
            return NextResponse.json(
                { error: "بيانات غير صالحة", details: parsed.error.format() },
                { status: 400 }
            );
        }

        const validData = parsed.data;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(validData.name && { name: validData.name }),
                ...(validData.email && { email: validData.email }),
                ...(validData.role && { role: validData.role }),
                ...(validData.active !== undefined && { active: validData.active }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "USER_UPDATED",
                details: `Updated user: ${updatedUser.name}`,
                userId: session.user.id,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("User Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Prevent deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        const user = await prisma.user.delete({
            where: { id },
            select: { name: true, email: true },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "USER_DELETED",
                details: `Deleted user: ${user.name} (${user.email})`,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User Deletion Error:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
