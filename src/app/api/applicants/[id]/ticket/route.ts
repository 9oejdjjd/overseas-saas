import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // applicantId
) {
    try {
        const { id } = await params;
        const ticket = await prisma.ticket.findUnique({
            where: { applicantId: id }
        });

        if (!ticket) {
            return NextResponse.json(null);
        }

        // Try to find matching transport route to get departure/arrival times
        let departureTime: string | null = null;
        let arrivalTime: string | null = null;

        // Find location IDs based on names
        const fromLocation = await prisma.location.findFirst({
            where: {
                OR: [
                    { name: { contains: ticket.departureLocation, mode: 'insensitive' } },
                    { code: { contains: ticket.departureLocation, mode: 'insensitive' } }
                ]
            }
        });

        const toLocation = await prisma.location.findFirst({
            where: {
                OR: [
                    { name: { contains: ticket.arrivalLocation, mode: 'insensitive' } },
                    { code: { contains: ticket.arrivalLocation, mode: 'insensitive' } }
                ]
            }
        });

        // If we have both locations, try to find the route
        if (fromLocation && toLocation) {
            const route = await prisma.transportRoute.findFirst({
                where: {
                    fromId: fromLocation.id,
                    toId: toLocation.id,
                    isActive: true
                }
            });

            if (route) {
                departureTime = route.departureTime;
                arrivalTime = route.arrivalTime;
            }
        }

        // Return ticket with enriched time data
        return NextResponse.json({
            ...ticket,
            departureTime,
            arrivalTime
        });
    } catch (error) {
        console.error("Ticket fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
    }
}
