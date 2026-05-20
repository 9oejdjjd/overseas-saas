import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const [totalPackages, totalPurchases, purchases] = await Promise.all([
            prisma.mockExamPackage.count({ where: { isActive: true } }),
            prisma.mockExamPurchase.count(),
            prisma.mockExamPurchase.findMany({ select: { amount: true, totalCredits: true } })
        ]);

        const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalCreditsSold = purchases.reduce((sum, p) => sum + p.totalCredits, 0);

        return NextResponse.json({
            totalPackages,
            totalPurchases,
            totalRevenue,
            totalCreditsSold
        });
    } catch (error) {
        console.error("Error fetching mock stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
