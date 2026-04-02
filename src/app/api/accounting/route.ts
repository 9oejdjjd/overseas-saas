import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month";
        const locationId = searchParams.get("locationId"); // Changed to use locationId

        // Calculate date range
        const now = new Date();
        let startDate: Date | null = null;

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
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "all":
            default:
                startDate = null; // No date filter for all time
                break;
        }

        // Build where clause for regular (approved) transactions
        const transactionWhere: any = {
            isPending: false,
        };
        if (startDate) {
            transactionWhere.date = { gte: startDate };
        }

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

        // Fetch Pending Expenses separately
        const pendingExpenses = await prisma.transaction.findMany({
            where: {
                isPending: true,
                ...(startDate ? { date: { gte: startDate } } : {}),
                ...(locationId ? { OR: [{ locationId }, { applicant: { locationId } }] } : {}),
            },
            include: {
                applicant: { select: { fullName: true } }
            },
            orderBy: { date: "desc" },
        });

        // Get applicants with dynamic locations for profit analysis
        const applicantWhere: any = {};
        if (startDate) {
            applicantWhere.createdAt = { gte: startDate };
        }
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

        // Calculate per-applicant profit using REAL expenses
        const applicantProfits = applicants.map((app) => {
            const paid = app.transactions
                .filter((t) => t.type === "PAYMENT")
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            // Real cost from actual EXPENSE transactions (excluding pending)
            const realCost = app.transactions
                .filter((t) => t.type === "EXPENSE" && !t.isPending)
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            const profit = paid - realCost;

            return {
                id: app.id,
                fullName: app.fullName,
                locationId: app.locationId,
                locationName: app.location?.name || "غير محدد",
                totalAmount: Number(app.totalAmount),
                discount: Number(app.discount),
                paid,
                realCost,
                profit,
            };
        });

        // Fetch all active locations for dynamic profit breakdown
        const allLocations = await prisma.location.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        // Profit by location (dynamic) - using REAL costs
        const profitByLocation = allLocations.map((loc) => {
            const locApplicants = applicantProfits.filter((a) => a.locationId === loc.id);
            const locRevenue = locApplicants.reduce((sum, a) => sum + a.paid, 0);
            const locCost = locApplicants.reduce((sum, a) => sum + a.realCost, 0);
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

        // Overdue applicants (those with remaining balance > 0)
        const overdueApplicants = await prisma.applicant.findMany({
            where: {
                remainingBalance: { gt: 0 },
                ...(locationId ? { locationId } : {}),
            },
            select: {
                id: true,
                fullName: true,
                applicantCode: true,
                phone: true,
                whatsappNumber: true,
                profession: true,
                totalAmount: true,
                amountPaid: true,
                discount: true,
                remainingBalance: true,
                createdAt: true,
                status: true,
                location: { select: { name: true } },
            },
            orderBy: { remainingBalance: 'desc' },
        });

        const totalOverdue = overdueApplicants.reduce(
            (sum, a) => sum + Number(a.remainingBalance), 0
        );

        return NextResponse.json({
            summary: {
                revenue,
                expenses,
                withdrawals,
                netProfit,
                totalOverdue,
                overdueCount: overdueApplicants.length,
            },
            transactions,
            pendingExpenses,
            applicantProfits,
            profitByLocation,
            overdueApplicants,
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
