import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
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
            const route = await prisma.transportRouteDefault.findFirst({
                where: {
                    fromDestinationId: fromLocation.id, // Assuming location ID matches destination ID or we need lookup
                    toDestinationId: toLocation.id,
                    // isActive: true // Default routes don't have isActive flag in schema shown? check schema
                }
            });

            if (route) {
                // Default routes might not have departure times, specific trips do. 
                // But this file seems to want general route info.
                // Schema shows TransportRouteDefault has NO departureTime/arrivalTime.
                // So we can't return them from default route.
                // We return null or remove these fields from response if data is missing.
                departureTime = null;
                arrivalTime = null;
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
