import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, subDays, format } from "date-fns";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const examDateParam = searchParams.get("examDate");
        const transportDateParam = searchParams.get("transportDate");

        // Dates Setup
        const today = new Date();
        const tomorrow = addDays(today, 1);
        const sevenDaysAgo = subDays(today, 6);

        // Dynamic Exam Date
        let selectedExamDate = examDateParam ? new Date(examDateParam) : tomorrow;
        // Validate date
        if (isNaN(selectedExamDate.getTime())) selectedExamDate = tomorrow;

        // Dynamic Transport Date
        let selectedTransportDate = transportDateParam ? new Date(transportDateParam) : today;
        if (isNaN(selectedTransportDate.getTime())) selectedTransportDate = today;

        // 1. Overview Stats
        const totalApplicants = await prisma.applicant.count();

        // Revenue
        const revenueAgg = await prisma.applicant.aggregate({
            _sum: { amountPaid: true }
        });
        const totalRevenue = revenueAgg._sum.amountPaid || 0;

        // Pass / Fail Stats
        const passedCount = await prisma.applicant.count({ where: { status: 'PASSED' } });
        const failedCount = await prisma.applicant.count({ where: { status: 'FAILED' } });
        const othersCount = totalApplicants - (passedCount + failedCount);

        // 2. Exam Schedule (Based on selected date)
        const examsCount = await prisma.applicant.count({
            where: {
                examDate: {
                    gte: startOfDay(selectedExamDate),
                    lte: endOfDay(selectedExamDate)
                }
            }
        });

        const examsList = await prisma.applicant.findMany({
            where: {
                examDate: {
                    gte: startOfDay(selectedExamDate),
                    lte: endOfDay(selectedExamDate)
                }
            },
            select: {
                id: true,
                fullName: true,
                examLocation: true,
                examTime: true,
                status: true
            },
            orderBy: { examTime: 'asc' },
            take: 20 // Limit list size
        });

        // 3. Transport Summary (Based on selectedTransportDate)
        const transportDate = selectedTransportDate;
        const transportTrips = await prisma.ticket.findMany({
            where: {
                departureDate: {
                    gte: startOfDay(transportDate),
                    lte: endOfDay(transportDate)
                },
                status: { not: 'CANCELLED' }
            },
            select: {
                busNumber: true,
                departureLocation: true,
                arrivalLocation: true
            }
        });

        // Grouping Transport Data
        const transportStats = {
            totalPassengers: transportTrips.length,
            activeBuses: new Set(transportTrips.map(t => t.busNumber).filter(Boolean)).size,
            routes: {} as Record<string, number>
        };

        // Simple route summary
        transportTrips.forEach(t => {
            const route = `${t.departureLocation} -> ${t.arrivalLocation}`;
            transportStats.routes[route] = (transportStats.routes[route] || 0) + 1;
        });


        // 4. Trends (Last 7 Days)
        const last7DaysApplicants = await prisma.applicant.findMany({
            where: { createdAt: { gte: startOfDay(sevenDaysAgo) } },
            select: { createdAt: true }
        });

        const trendData = [];
        for (let i = 0; i < 7; i++) {
            const d = subDays(today, i);
            const dayStr = format(d, 'yyyy-MM-dd');
            const count = last7DaysApplicants.filter(a => format(new Date(a.createdAt), 'yyyy-MM-dd') === dayStr).length;
            trendData.unshift({ name: format(d, 'MM/dd'), applicants: count });
        }

        // 5. Locations Distribution
        const locations = await prisma.location.findMany({
            include: {
                _count: { select: { applicants: true } }
            }
        });

        const locationData = locations.map(l => ({
            name: l.name,
            value: l._count.applicants
        })).filter(l => l.value > 0);

        // 6. Recent Activity
        const recentActivity = await prisma.activityLog.findMany({
            take: 5,
            orderBy: { timestamp: 'desc' },
            include: { applicant: { select: { fullName: true } }, user: { select: { name: true } } }
        });

        return NextResponse.json({
            overview: {
                totalApplicants,
                totalRevenue,
                passedCount,
                failedCount,
                othersCount,
            },
            examSchedule: {
                date: selectedExamDate,
                count: examsCount,
                list: examsList
            },
            transportStats,
            trendData,
            locationData,
            recentActivity
        });

    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
