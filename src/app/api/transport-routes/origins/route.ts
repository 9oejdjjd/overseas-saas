
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const routes = await prisma.transportRouteDefault.findMany({
            // where: { isActive: true }, // Default Routes don't have isActive? Check schema.
            // If they don't, we just fetch all or filter by existence which findMany does.
            select: {
                fromDestination: {
                    select: { id: true, name: true }
                }
            },
            distinct: ['fromDestinationId']
        });

        const origins = routes.map((r: { fromDestination: { id: any; name: any; }; }) => ({
            id: r.fromDestination.id,
            name: r.fromDestination.name
        }));

        return NextResponse.json(origins);
    } catch (error) {
        console.error("Failed to fetch origins", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
