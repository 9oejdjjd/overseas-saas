
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
            data: { name, code }
        });
        return NextResponse.json(destination);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create destination" }, { status: 500 });
    }
}
