import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, nameEn, accountNumber, accountName, isActive, icon, instructions, accounts } = body;

        const updatedWallet = await prisma.walletAccount.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                nameEn: nameEn !== undefined ? nameEn : undefined,
                accountNumber: accountNumber !== undefined ? accountNumber : null,
                accountName: accountName !== undefined ? accountName : null,
                isActive: isActive !== undefined ? Boolean(isActive) : undefined,
                icon: icon !== undefined ? icon : undefined,
                instructions: instructions !== undefined ? instructions : undefined,
                accounts: accounts !== undefined ? accounts : undefined,
            }
        });

        return NextResponse.json(updatedWallet);
    } catch (error) {
        console.error("PUT Wallet Error:", error);
        return NextResponse.json({ error: "Failed to update wallet account" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.walletAccount.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Wallet account deleted successfully" });
    } catch (error) {
        console.error("DELETE Wallet Error:", error);
        return NextResponse.json({ error: "Failed to delete wallet account" }, { status: 500 });
    }
}
