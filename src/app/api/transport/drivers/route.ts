import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const drivers = await prisma.driver.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(drivers);
    } catch (error) {
        console.error("Fetch Drivers Error:", error);
        return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, licenseNo, isActive } = body;

        const driver = await prisma.driver.create({
            data: {
                name,
                phone,
                licenseNo,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Create Driver Error:", error);
        return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, phone, licenseNo, isActive } = body;

        const driver = await prisma.driver.update({
            where: { id },
            data: {
                name,
                phone,
                licenseNo,
                isActive
            }
        });

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Update Driver Error:", error);
        return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.driver.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Driver Error:", error);
        return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
    }
}
