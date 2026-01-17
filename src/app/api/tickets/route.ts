import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const {
            applicantId,
            busNumber,
            seatNumber,
            departureDate,
            departureLocation,
            arrivalLocation,
            transportCompany,
            tripType = "ONE_WAY" // Default
        } = body;

        // Fetch Applicant to check current status
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            include: { location: true }
        });

        if (!applicant) {
            return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
        }

        // Pricing Logic
        let addedPrice = 0;
        let routeFound = false;

        // Condition: Only add price if user didn't have transportation previously
        // OR if we decide this action always incurs cost. 
        // Based on user request: "In case created without transport... activate... add amount".
        // If created WITH transport, price is already in total.
        if (!applicant.hasTransportation && departureLocation && arrivalLocation) {
            // Find Locations
            const fromLoc = await prisma.location.findFirst({ where: { name: departureLocation } });
            const toLoc = await prisma.location.findFirst({ where: { name: arrivalLocation } });

            if (fromLoc && toLoc) {
                // Find Route
                const route = await prisma.transportRoute.findFirst({
                    where: {
                        OR: [
                            { fromId: fromLoc.id, toId: toLoc.id },
                            // { fromId: toLoc.id, toId: fromLoc.id } // Pricing might be directional
                        ]
                    }
                });

                if (route) {
                    addedPrice = tripType === "ROUND_TRIP"
                        ? Number(route.roundTripPrice)
                        : Number(route.oneWayPrice);
                    routeFound = true;
                }
            }
        }

        // Generate Ticket Number
        const ticketNumber = "TKT-" + Math.floor(100000 + Math.random() * 900000);

        // Transaction handling associated with ticket creation
        const ticket = await prisma.$transaction(async (tx) => {
            // 1. Create Ticket
            const newTicket = await tx.ticket.create({
                data: {
                    applicantId,
                    ticketNumber,
                    busNumber,
                    seatNumber,
                    departureDate: new Date(departureDate),
                    departureLocation,
                    arrivalLocation,
                    transportCompany,
                },
            });

            // 2. Update Applicant if Price added
            if (addedPrice > 0 || !applicant.hasTransportation) {
                await tx.applicant.update({
                    where: { id: applicantId },
                    data: {
                        hasTransportation: true,
                        transportType: tripType, // Update preference
                        totalAmount: { increment: addedPrice },
                        remainingBalance: { increment: addedPrice },
                        // Also update transportFrom relation if we found the location?
                        // Simple string update for now is tricky as schema uses ID.
                    }
                });

                // 3. Log Financial Transaction if price added
                if (addedPrice > 0) {
                    // Wait, totalAmount increase is NOT a transaction (Payment/Expense). 
                    // It's a change in the Invoice.
                    // But we can log activity.
                }
            }

            return newTicket;
        });

        // Log Activity
        try {
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_ISSUED",
                    details: `Issued Ticket ${ticketNumber}. Added Price: ${addedPrice}`,
                    applicantId,
                    userId: session.user?.id,
                },
            });
        } catch (e) {
            console.error("Log failed", e);
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Ticket Creation Error:", error);
        return NextResponse.json(
            { error: "Failed to create ticket" },
            { status: 500 }
        );
    }
}
