import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromId = searchParams.get("fromId");

        const whereClause: any = { isActive: true };
        if (fromId) whereClause.fromId = fromId;

        const routes = await prisma.transportRoute.findMany({
            where: whereClause,
            include: {
                from: true,
                to: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(routes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate
        if (!body.fromId || !body.toId || !body.oneWayPrice) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if route exists
        const existing = await prisma.transportRoute.findFirst({
            where: {
                fromId: body.fromId,
                toId: body.toId,
                isActive: true
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Route already exists" }, { status: 400 });
        }

        const route = await prisma.transportRoute.create({
            data: {
                fromId: body.fromId,
                toId: body.toId,
                oneWayPrice: body.oneWayPrice,
                roundTripPrice: body.roundTripPrice || 0, // Default to 0 if not provided
                departureTime: body.departureTime,
                arrivalTime: body.arrivalTime,
            },
            include: {
                from: true,
                to: true
            }
        });

        return NextResponse.json(route);
    } catch (error) {
        console.error("Create Route Error", error);
        return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
    }
}
