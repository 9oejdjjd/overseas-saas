
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const destinations = await prisma.transportDestination.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(destinations);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch destinations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const destination = await prisma.transportDestination.create({
            data: { name, nameEn: body.nameEn, nameAr: body.nameAr, code }
        });
        return NextResponse.json(destination);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create destination" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, code } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const destination = await prisma.transportDestination.update({
            where: { id },
            data: { name, nameEn: body.nameEn, nameAr: body.nameAr, code }
        });
        return NextResponse.json(destination);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update destination" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        // Soft delete the destination by setting isActive to false
        const destination = await prisma.transportDestination.update({
            where: { id },
            data: { isActive: false }
        });
        return NextResponse.json(destination);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete destination" }, { status: 500 });
    }
}

