import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
        const skip = (page - 1) * limit;

        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "ALL";
        const trigger = searchParams.get("trigger") || "ALL";

        // Build where clause
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { recipient: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
                { error: { contains: search, mode: "insensitive" } }
            ];
        }

        if (status && status !== "ALL") {
            whereClause.status = status;
        }

        if (trigger && trigger !== "ALL") {
            whereClause.trigger = trigger;
        }

        // Fetch logs
        const logs = await prisma.emailLog.findMany({
            where: whereClause,
            orderBy: { sentAt: "desc" },
            skip,
            take: limit
        });

        const totalCount = await prisma.emailLog.count({ where: whereClause });

        // Calculate Stats
        const total = await prisma.emailLog.count();
        const sentCount = await prisma.emailLog.count({ where: { status: "SENT" } });
        const failedCount = await prisma.emailLog.count({ where: { status: "FAILED" } });
        const successRate = total > 0 ? Math.round((sentCount / total) * 100) : 100;

        // Get failed count in the last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const failedToday = await prisma.emailLog.count({
            where: {
                status: "FAILED",
                sentAt: { gte: yesterday }
            }
        });

        // Get all unique triggers in DB for filtering
        const triggersRaw = await prisma.emailLog.findMany({
            distinct: ["trigger"],
            select: { trigger: true }
        });
        const triggers = triggersRaw.map(t => t.trigger).filter(Boolean);

        return NextResponse.json({
            logs,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            },
            stats: {
                total,
                sentCount,
                failedCount,
                failedToday,
                successRate
            },
            triggers
        });

    } catch (error) {
        console.error("GET Email Logs Error:", error);
        return NextResponse.json({ error: "Failed to fetch email logs" }, { status: 500 });
    }
}
