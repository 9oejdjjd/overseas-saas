import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            const route = await prisma.transportRoute.findUnique({
                where: { id },
                include: {
                    stops: {
                        orderBy: { orderIndex: 'asc' },
                        include: { destination: true }
                    },
                    returnRoute: true,
                    inverseOfReturn: true
                }
            });
            if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });
            return NextResponse.json(route);
        }

        const routes = await prisma.transportRoute.findMany({
            include: {
                stops: {
                    orderBy: { orderIndex: 'asc' },
                    include: { destination: true }
                },
                returnRoute: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(routes);
    } catch (error) {
        console.error("Fetch Routes Error:", error);
        return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, code, isActive, returnRouteId, stops } = body;

        const route = await prisma.transportRoute.create({
            data: {
                name,
                code,
                isActive: isActive ?? true,
                returnRouteId: returnRouteId || null,
                stops: {
                    create: stops?.map((stop: any, idx: number) => ({
                        destinationId: stop.destinationId,
                        orderIndex: idx,
                        minutesFromStart: stop.minutesFromStart || 0,
                        stopDurationMinutes: stop.stopDurationMinutes || 0,
                        priceFromStart: stop.priceFromStart || 0,
                        boardingPoint: stop.boardingPoint || null,
                        allowBoarding: stop.allowBoarding !== undefined ? stop.allowBoarding : true,
                        allowDropoff: stop.allowDropoff !== undefined ? stop.allowDropoff : true,
                    }))
                }
            },
            include: { stops: true }
        });

        // Setup inverse relation if returnRouteId is provided
        if (returnRouteId) {
            await prisma.transportRoute.update({
                where: { id: returnRouteId },
                data: { returnRouteId: route.id }
            });
        }

        return NextResponse.json(route);
    } catch (error) {
        console.error("Create Route Error:", error);
        return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, code, isActive, returnRouteId, stops } = body;

        const updateData: any = {
            name,
            code,
            isActive,
            returnRouteId: returnRouteId || null,
        };

        if (stops) {
            updateData.stops = {
                deleteMany: {},
                create: stops.map((stop: any, idx: number) => ({
                    destinationId: stop.destinationId,
                    orderIndex: idx,
                    minutesFromStart: stop.minutesFromStart || 0,
                    stopDurationMinutes: stop.stopDurationMinutes || 0,
                    priceFromStart: stop.priceFromStart || 0,
                    boardingPoint: stop.boardingPoint || null,
                    allowBoarding: stop.allowBoarding !== undefined ? stop.allowBoarding : true,
                    allowDropoff: stop.allowDropoff !== undefined ? stop.allowDropoff : true,
                }))
            };
        }

        const route = await prisma.transportRoute.update({
            where: { id },
            data: updateData,
            include: { stops: true }
        });

        return NextResponse.json(route);
    } catch (error) {
        console.error("Update Route Error:", error);
        return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Prisma cascade delete will remove stops automatically
        await prisma.transportRoute.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Route Error:", error);
        return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
    }
}
