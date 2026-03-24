import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { plateNumber: 'asc' }
        });
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error("Fetch Vehicles Error:", error);
        return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plateNumber, name, capacity, busClass, isActive } = body;

        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber,
                name,
                capacity: parseInt(capacity) || 50,
                busClass: busClass || 'STANDARD',
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Create Vehicle Error:", error);
        return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, plateNumber, name, capacity, busClass, isActive } = body;

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                plateNumber,
                name,
                capacity: capacity ? parseInt(capacity) : undefined,
                busClass,
                isActive
            }
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Update Vehicle Error:", error);
        return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.vehicle.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Vehicle Error:", error);
        return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
    }
}
