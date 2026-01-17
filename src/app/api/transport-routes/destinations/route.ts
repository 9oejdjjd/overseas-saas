
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");


        if (!from) {
            return NextResponse.json({ error: "From location is required" }, { status: 400 });
        }

        // Find routes starting from 'from'
        const routes = await prisma.transportRoute.findMany({
            where: {
                from: { name: from },
                isActive: true
            },
            include: {
                to: true
            },
            distinct: ['toId']
        });



        const destinations = routes.map(r => ({
            id: r.to.id,
            name: r.to.name,
            price: r.oneWayPrice
        }));

        return NextResponse.json(destinations);
    } catch (error) {
        console.error("Failed to fetch destinations", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
