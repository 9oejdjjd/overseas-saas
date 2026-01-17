import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(locations);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const location = await prisma.location.create({
            data: {
                name: body.name,
                code: body.code,
                address: body.address,
                locationUrl: body.locationUrl,
            }
        });

        return NextResponse.json(location);
    } catch (error) {
        console.error("Create Location Error", error);
        return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
    }
}
