
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
        const routes = await prisma.transportRouteDefault.findMany({
            where: {
                fromDestination: { name: from },
                // isActive: true
            },
            include: {
                toDestination: true
            },
            distinct: ['toDestinationId']
        });



        const destinations = routes.map((r: { toDestination: { id: any; name: any; }; price: any; }) => ({
            id: r.toDestination.id,
            name: r.toDestination.name,
            price: r.price
        }));

        return NextResponse.json(destinations);
    } catch (error) {
        console.error("Failed to fetch destinations", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
