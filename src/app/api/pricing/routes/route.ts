import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromId = searchParams.get("fromId");

        const whereClause: any = {};
        if (fromId) whereClause.fromDestinationId = fromId;

        const routes = await prisma.transportRouteDefault.findMany({
            where: whereClause,
            include: {
                fromDestination: true,
                toDestination: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        const mappedRoutes = routes.map(r => ({
            id: r.id,
            fromId: r.fromDestinationId,
            toId: r.toDestinationId,
            oneWayPrice: Number(r.price),
            roundTripPrice: Number(r.priceRoundTrip || r.price),
            isActive: true,
            fromDestination: r.fromDestination,
            toDestination: r.toDestination
        }));

        return NextResponse.json(mappedRoutes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate
        if (!body.fromId || !body.toId || !body.oneWayPrice) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if route exists
        const existing = await prisma.transportRouteDefault.findFirst({
            where: {
                fromDestinationId: body.fromId,
                toDestinationId: body.toId,
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Route already exists" }, { status: 400 });
        }

        const route = await prisma.transportRouteDefault.create({
            data: {
                fromDestinationId: body.fromId,
                toDestinationId: body.toId,
                price: body.oneWayPrice,
                priceRoundTrip: body.roundTripPrice || 0, // Default to 0 if not provided
            },
            include: {
                fromDestination: true,
                toDestination: true
            }
        });

        return NextResponse.json(route);
    } catch (error) {
        console.error("Create Route Error", error);
        return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
    }
}
