import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            const template = await prisma.tripTemplate.findUnique({
                where: { id },
                include: {
                    route: { include: { stops: { include: { destination: true } } } },
                    defaultDriver: true,
                    defaultVehicle: true,
                }
            });
            if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
            return NextResponse.json(template);
        }

        const templates = await prisma.tripTemplate.findMany({
            include: {
                route: { include: { stops: { include: { destination: true }, orderBy: { orderIndex: 'asc' } } } },
                defaultDriver: true,
                defaultVehicle: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("Fetch TripTemplates Error:", error);
        return NextResponse.json({ error: "Failed to fetch trip templates" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            name, routeId, recurrenceRule, departureTime, 
            startDate, endDate, defaultCapacity, busClass, 
            defaultDriverId, defaultVehicleId 
        } = body;

        const template = await prisma.tripTemplate.create({
            data: {
                name,
                routeId,
                recurrenceRule,
                departureTime,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                capacity: parseInt(defaultCapacity) || 50,
                busClass: busClass || 'STANDARD',
                defaultDriverId: defaultDriverId || null,
                defaultVehicleId: defaultVehicleId || null
            },
            include: { route: true }
        });

        // The background cron or the manual trigger should run the "Generate Scheduled Trips" logic here.
        // For now, we just save the template. 

        return NextResponse.json(template);
    } catch (error) {
        console.error("Create TripTemplate Error:", error);
        return NextResponse.json({ error: "Failed to create trip template" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, defaultCapacity, ...data } = body;

        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (defaultCapacity) data.capacity = parseInt(defaultCapacity);

        const template = await prisma.tripTemplate.update({
            where: { id },
            data,
            include: { route: true }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Update TripTemplate Error:", error);
        return NextResponse.json({ error: "Failed to update trip template" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.tripTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete TripTemplate Error:", error);
        return NextResponse.json({ error: "Failed to delete trip template" }, { status: 500 });
    }
}
