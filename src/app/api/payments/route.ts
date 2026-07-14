import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Restrict to Admin, Registration Staff, and Accountant
        if (!session || !["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const purchases = await prisma.mockExamPurchase.findMany({
            where,
            include: {
                package: {
                    select: {
                        name: true,
                        nameEn: true,
                        examCredits: true
                    }
                },
                reviewedBy: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(purchases);

    } catch (error) {
        console.error("GET Admin Purchases Error:", error);
        return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }
}
