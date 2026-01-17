import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month";
        const locationId = searchParams.get("locationId"); // Changed to use locationId

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "today":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "week":
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek;
                startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        // Build where clause for transactions
        const transactionWhere: any = {
            date: { gte: startDate },
        };

        if (locationId) {
            transactionWhere.OR = [
                { locationId: locationId },
                { applicant: { locationId: locationId } },
            ];
        }

        // Get all transactions with dynamic location
        const transactions = await prisma.transaction.findMany({
            where: transactionWhere,
            include: {
                applicant: {
                    select: {
                        fullName: true,
                        locationId: true,
                        location: { select: { name: true } },
                    },
                },
                location: {
                    select: { name: true }
                }
            },
            orderBy: { date: "desc" },
        });

        // Calculate totals
        const revenue = transactions
            .filter((t) => t.type === "PAYMENT")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const withdrawals = transactions
            .filter((t) => t.type === "WITHDRAWAL")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netProfit = revenue - expenses - withdrawals;

        // Get applicants with dynamic locations for profit analysis
        const applicantWhere: any = {
            createdAt: { gte: startDate },
        };
        if (locationId) {
            applicantWhere.locationId = locationId;
        }

        const applicants = await prisma.applicant.findMany({
            where: applicantWhere,
            include: {
                transactions: true,
                location: { select: { id: true, name: true } },
            },
        });

        // Calculate per-applicant profit
        const applicantProfits = applicants.map((app) => {
            const paid = app.transactions
                .filter((t) => t.type === "PAYMENT")
                .reduce((sum, t) => sum + Number(t.amount), 0);

            // Simplified cost estimation (30% margin)
            const estimatedCost = Number(app.totalAmount) * 0.7;
            const profit = paid - estimatedCost;

            return {
                id: app.id,
                fullName: app.fullName,
                locationId: app.locationId,
                locationName: app.location?.name || "غير محدد",
                totalAmount: Number(app.totalAmount),
                discount: Number(app.discount),
                paid,
                estimatedCost,
                profit,
            };
        });

        // Fetch all active locations for dynamic profit breakdown
        const allLocations = await prisma.location.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        // Profit by location (dynamic)
        const profitByLocation = allLocations.map((loc) => {
            const locApplicants = applicantProfits.filter((a) => a.locationId === loc.id);
            const locRevenue = locApplicants.reduce((sum, a) => sum + a.paid, 0);
            const locCost = locApplicants.reduce((sum, a) => sum + a.estimatedCost, 0);
            const locProfit = locRevenue - locCost;

            return {
                locationId: loc.id,
                locationName: loc.name,
                applicantCount: locApplicants.length,
                revenue: locRevenue,
                cost: locCost,
                profit: locProfit,
                profitMargin: locRevenue > 0 ? ((locProfit / locRevenue) * 100).toFixed(1) : 0,
            };
        });

        return NextResponse.json({
            summary: {
                revenue,
                expenses,
                withdrawals,
                netProfit,
            },
            transactions,
            applicantProfits,
            profitByLocation,
            locations: allLocations, // Include locations for filter dropdown
        });
    } catch (error) {
        console.error("Accounting Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch accounting data" },
            { status: 500 }
        );
    }
}
