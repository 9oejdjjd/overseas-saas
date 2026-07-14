import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const allParam = url.searchParams.get("all") === "true";

        let where: any = { isActive: true };

        // If requested all accounts, check if user is admin
        if (allParam) {
            const session = await getServerSession(authOptions);
            if (session && hasPermission(session.user.role, "MANAGE_SYSTEM")) {
                where = {}; // return all accounts (active & inactive)
            }
        }

        const wallets = await prisma.walletAccount.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(wallets);
    } catch (error) {
        console.error("Error fetching wallet accounts:", error);
        return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, nameEn, accountNumber, accountName, isActive, icon, instructions, accounts } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const newWallet = await prisma.walletAccount.create({
            data: {
                name,
                nameEn: nameEn || null,
                accountNumber: accountNumber || null,
                accountName: accountName || null,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                icon: icon || null,
                instructions: instructions || null,
                accounts: accounts || []
            }
        });

        return NextResponse.json(newWallet);
    } catch (error) {
        console.error("POST Wallet Error:", error);
        return NextResponse.json({ error: "Failed to create wallet account" }, { status: 500 });
    }
}
