
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
            tripId,
            stopId, // Optional: if boarding from an intermediate stop
            seatNumber,
            tripType = "ONE_WAY",
            price, // Optional: Price override from frontend
            agentName,
            boardingPoint,
            companions = [] // Array of { name: string }
        } = body;

        // Fetch Applicant
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            include: { location: true }
        });

        if (!applicant) {
            return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
        }

        // Fetch Trip
        if (!tripId) {
            return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
        }

        const trip = await prisma.scheduledTrip.findUnique({
            where: { id: tripId },
            include: { fromDestination: true, toDestination: true, stops: { include: { destination: true } } }
        });

        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        const totalPassengers = 1 + companions.length;
        if (trip.bookedSeats + totalPassengers > trip.capacity) {
            return NextResponse.json({ error: "Trip does not have enough seats" }, { status: 400 });
        }

        // Determine Price and Locations
        // Use provided price if available, otherwise fallback to trip default
        let finalPrice = price !== undefined ? Number(price) : Number(trip.price);

        let departureLocation = trip.fromDestination.name;
        let arrivalLocation = trip.toDestination.name;
        let departureDate = trip.date;
        let busNumber = trip.busNumber;
        let departureTime = trip.departureTime;

        // Check if Stop is selected
        if (stopId) {
            const stop = trip.stops.find((s: any) => s.id === stopId);
            if (stop) {
                // If price wasn't overridden, use stop price
                if (price === undefined) finalPrice = Number(stop.price);
                departureLocation = stop.destination.name;
                departureTime = stop.departureTime || trip.departureTime;
            }
        }

        // Check Return Trip
        let returnTripData = null;
        if (body.returnTripId) {
            const returnTrip = await prisma.scheduledTrip.findUnique({
                where: { id: body.returnTripId },
                include: { fromDestination: true, toDestination: true }
            });

            if (!returnTrip) {
                return NextResponse.json({ error: "Return trip not found" }, { status: 404 });
            }

            if (returnTrip.bookedSeats + totalPassengers > returnTrip.capacity) {
                return NextResponse.json({ error: "Return trip does not have enough seats" }, { status: 400 });
            }
            returnTripData = returnTrip;
        }

        // Generate Ticket Number
        const ticketNumber = "TKT-" + Math.floor(100000 + Math.random() * 900000);
        
        // Generate Companion Data
        const companionsData = companions.map((c: any) => ({
            name: c.name,
            ticketNumber: "TKT-" + Math.floor(100000 + Math.random() * 900000)
        }));

        // Transaction
        const ticket = await prisma.$transaction(async (tx) => {
            // 1. Create Ticket
            const newTicket = await tx.ticket.create({
                data: {
                    applicantId,
                    ticketNumber,
                    busNumber,
                    seatNumber,
                    departureDate: departureDate,
                    departureLocation,
                    arrivalLocation,
                    transportCompany: "أوفرسيز",
                    tripId,

                    // Return Details
                    returnTripId: returnTripData?.id,
                    returnBusNumber: returnTripData?.busNumber,
                    // returnSeatNumber: "AUTO", // Logic for seat assignment if needed

                    agentName,
                    boardingPoint,
                    companions: companionsData.length > 0 ? companionsData : undefined,

                    status: "ISSUED"
                },
            });

            // 2. Update Trip Seats (Outbound)
            await tx.scheduledTrip.update({
                where: { id: tripId },
                data: { bookedSeats: { increment: totalPassengers } }
            });

            // 3. Update Trip Seats (Return)
            if (returnTripData) {
                await tx.scheduledTrip.update({
                    where: { id: returnTripData.id },
                    data: { bookedSeats: { increment: totalPassengers } }
                });
            }

            // 4. Update Applicant Financials
            let applicantCharge = 0;
            // Charge for Applicant
            if (!applicant.hasTransportation) applicantCharge += finalPrice;
            // Charge for companions
            if (companions.length > 0) applicantCharge += (finalPrice * companions.length);

            if (applicantCharge > 0) {
                await tx.applicant.update({
                    where: { id: applicantId },
                    data: {
                        hasTransportation: true,
                        transportType: tripType,
                        totalAmount: { increment: applicantCharge },
                        remainingBalance: { increment: applicantCharge },
                    }
                });
            }

            // 5. Record Financial Statement (Ledger) for tickets
            if (!applicant.hasTransportation) {
                await tx.transaction.create({
                    data: {
                        applicantId,
                        amount: finalPrice,
                        type: "CHARGE",
                        category: "TRANSPORT",
                        description: `تذكرة سفر رقم ${ticketNumber} للخط ${departureLocation} - ${arrivalLocation} بتاريخ ${new Date(departureDate).toLocaleDateString('ar-EG')}`,
                        locationId: applicant.locationId
                    }
                });
            }

            if (companions.length > 0) {
                await tx.transaction.create({
                    data: {
                        applicantId,
                        amount: finalPrice * companions.length,
                        type: "CHARGE",
                        category: "TRANSPORT_COMPANION",
                        description: `تذاكر سفر للمرافقين للخط ${departureLocation} - ${arrivalLocation} بتاريخ ${new Date(departureDate).toLocaleDateString('ar-EG')} - مرافق للمتقدم ${applicant.fullName}`,
                        locationId: applicant.locationId
                    }
                });
            }

            return newTicket;
        });

        // Auto-record transport operational expense
        try {
            // Lookup actual transport cost from TransportRouteDefault
            const routeDefault = await prisma.transportRouteDefault.findFirst({
                where: {
                    fromDestination: { name: departureLocation },
                    toDestination: { name: arrivalLocation }
                },
                select: { cost: true, costRoundTrip: true }
            });

            const isRoundTrip = tripType === "ROUND_TRIP";
            const transportCost = routeDefault
                ? Number(isRoundTrip ? (routeDefault.costRoundTrip || routeDefault.cost) : routeDefault.cost)
                : 0;

            const totalTransportCost = transportCost * totalPassengers;
            const applicantLabel = `${applicant.fullName}${applicant.applicantCode ? ` (${applicant.applicantCode})` : ''}`;
            const tripTypeLabel = isRoundTrip ? 'ذهاب وعودة' : 'ذهاب';
            const expenseDesc = `تكلفة النقل البري لـ ${applicantLabel}${companions.length > 0 ? ` ومرافقيه (${companions.length})` : ''} ونوع الرحلة ${tripTypeLabel} (${departureLocation} ← ${arrivalLocation})`;

            if (totalTransportCost > 0) {
                await prisma.transaction.create({
                    data: {
                        applicantId,
                        amount: totalTransportCost,
                        type: "EXPENSE",
                        category: "TRANSPORT_COST",
                        description: expenseDesc,
                        notes: `تذكرة: ${ticketNumber}`,
                        locationId: applicant.locationId || null,
                        isPending: true,
                    }
                });
            }
        } catch (expError) {
            console.error("Failed to record transport expense (non-blocking):", expError);
        }

        // Auto-send ticket issuance notification
        try {
            const { autoSendMessage } = await import("@/lib/autoSendMessage");
            autoSendMessage(applicantId, "ON_TICKET_ISSUE", { ticketId: ticket.id })
                .catch(e => console.error("[AutoSend] ON_TICKET_ISSUE error:", e));
        } catch (e) {
            console.error("[AutoSend] Failed to import autoSendMessage:", e);
        }

        return NextResponse.json(ticket);

    } catch (error) {
        console.error("Ticket Creation Error:", error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
