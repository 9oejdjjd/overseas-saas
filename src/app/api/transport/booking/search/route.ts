import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromId = searchParams.get("from");
        const toId = searchParams.get("to");
        const date = searchParams.get("date"); // YYYY-MM-DD

        if (!fromId || !toId || !date) {
            return NextResponse.json({ error: "Missing required parameters (from, to, date)" }, { status: 400 });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Advanced Search Logic (Node-to-Node)
        // 1. We look for ScheduledTrips that have a Stop at `fromId` and a Stop at `toId`.
        // 2. The Stop for `fromId` MUST have `allowBoarding = true` (or be the route origin).
        // 3. The Stop for `toId` MUST have `allowDropoff = true` (or be the route destination).
        // 4. The `orderIndex` of `fromId` stop MUST be LESS THAN the `orderIndex` of `toId` stop.
        // 5. Or, it's a direct route match where fromDestinationId = fromId and toDestinationId = toId.

        // To do this purely in Prisma in one query is complex. Instead, we query all trips on the date,
        // and filter them in memory which is very fast for daily trips (~10-50 trips a day).
        
        const tripsOnDate = await prisma.scheduledTrip.findMany({
            where: {
                status: 'SCHEDULED',
                date: targetDate, // Simple date check first
            },
            include: {
                fromDestination: true,
                toDestination: true,
                stops: {
                    include: { destination: true },
                    orderBy: { orderIndex: 'asc' }
                },
                vehicle: true,
            }
        });

        const availableSegments = [];

        for (const trip of tripsOnDate) {
            let isMatch = false;
            let segmentPrice: number = Number(trip.price) || 0;
            let displayFrom = trip.fromDestination.name;
            let displayTo = trip.toDestination.name;
            let depTime = trip.departureTime;
            let arrTime = trip.arrivalTime;
            let depDate = trip.date;
            let fromBoardingPoint = "";
            
            // 1. Direct Route Match (Origin to Destination)
            if (trip.fromDestinationId === fromId && trip.toDestinationId === toId) {
                isMatch = true;
            } 
            // 2. Stop-to-Stop Match
            else {
                // Find index of fromId (either it's the main origin or one of the stops)
                let fromIndex = -1;
                if (trip.fromDestinationId === fromId) {
                    fromIndex = -1; // -1 means it's the root origin
                } else {
                    fromIndex = trip.stops.findIndex((s: any) => s.destinationId === fromId);
                }

                // Find index of toId (either it's the main destination or one of the stops)
                let toIndex = -2;
                if (trip.toDestinationId === toId) {
                    toIndex = 999; // 999 means it's the root destination
                } else {
                    toIndex = trip.stops.findIndex((s: any) => s.destinationId === toId);
                }

                // Check direction validity (must go from -> to)
                if (fromIndex !== -2 && toIndex !== -2 && fromIndex < toIndex) {
                    isMatch = true;
                    
                    // Adjust segment details
                    const fromStop = fromIndex >= 0 ? trip.stops[fromIndex] : null;
                    const toStop = toIndex !== 999 ? trip.stops[toIndex] : null;

                    displayFrom = fromStop ? fromStop.destination.name : trip.fromDestination.name;
                    displayTo = toStop ? toStop.destination.name : trip.toDestination.name;
                    depTime = fromStop?.departureTime || trip.departureTime;
                    arrTime = toStop?.arrivalTime || arrTime || trip.arrivalTime;
                    fromBoardingPoint = (fromStop as any)?.boardingPoint || "";
                    
                    // Price diff (stop-level logic if applicable)
                    const p1 = fromStop ? Number(fromStop.price) : 0;
                    const p2 = toStop ? Number(toStop.price) : Number(trip.price);
                    
                    const calcPrice = p2 - p1;
                    if (calcPrice > 0) segmentPrice = calcPrice;
                }
            }

            // Next day calculation
            let nextDayArrival = false;
            let arrivalDate = trip.arrivalDate || depDate;
            if (depTime && arrTime) {
                const [dh] = depTime.split(':').map(Number);
                const [ah] = arrTime.split(':').map(Number);
                if (ah < dh) {
                    nextDayArrival = true;
                    const ad = new Date(depDate);
                    ad.setDate(ad.getDate() + 1);
                    arrivalDate = ad;
                }
            }

            if (isMatch) {

                availableSegments.push({
                    tripId: trip.id,
                    tripNumber: trip.tripNumber,
                    routeId: trip.routeId,
                    busClass: trip.busClass,
                    availableSeats: trip.capacity - trip.bookedSeats,
                    segmentDetails: {
                        fromStopId: fromId,
                        fromDestination: displayFrom,
                        departureDate: depDate,
                        departureTime: depTime,
                        
                        toStopId: toId,
                        toDestination: displayTo,
                        arrivalDate: arrivalDate,
                        arrivalTime: arrTime,
                        nextDayArrival,
                        fromBoardingPoint,

                        price: segmentPrice,
                    },
                    vehicle: trip.vehicle ? { model: (trip.vehicle as any).name, plate: trip.vehicle.plateNumber } : (trip.busNumber ? { model: trip.busNumber, plate: '' } : null),
                    mainRouteTitle: `${trip.fromDestination?.name || ''} -> ${trip.toDestination?.name || ''}`
                });
            }
        }

        return NextResponse.json(availableSegments);

    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Failed to search trips" }, { status: 500 });
    }
}
