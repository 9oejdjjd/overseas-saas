
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get("from");
        const toDate = searchParams.get("to");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Auto-update past scheduled trips to DEPARTED (تم انطلاق الرحلة)
        await prisma.scheduledTrip.updateMany({
            where: {
                status: 'SCHEDULED',
                date: { lt: today }
            },
            data: { status: 'DEPARTED' }
        });

        const where: any = {};
        if (fromDate && toDate) {
            where.date = { gte: new Date(fromDate), lte: new Date(toDate) };
        } else if (fromDate) {
            where.date = { gte: new Date(fromDate) };
        } else if (toDate) {
            where.date = { lte: new Date(toDate) };
        }

        const trips = await prisma.scheduledTrip.findMany({
            where,
            include: {
                fromDestination: true,
                toDestination: true,
                stops: { include: { destination: true }, orderBy: { orderIndex: 'asc' } },
                _count: { select: { tickets: true } }
            },
            orderBy: { date: 'asc' }
        });
        return NextResponse.json(trips);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
    }
}

async function generateTripNumber() {
    // Format: TR-{YEAR}-{SEQUENCE} e.g. TR-2024-0001
    const year = new Date().getFullYear();
    const count = await prisma.scheduledTrip.count();
    return `TR-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // body: { fromId, toId, date, time, price, capacity, busNumber, driverName, daysToRepeat, stops }

        const { 
            templateId,
            fromId, toId, date, time, arrivalDate, arrivalTime, price, capacity, busNumber, driverName, daysToRepeat, stops 
        } = body;

        const startDate = new Date(date);
        const repeatCount = daysToRepeat ? parseInt(daysToRepeat) : 1;
        const createdTrips = [];

        for (let i = 0; i < repeatCount; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const tripNumber = await generateTripNumber();

            // If creating from template
            if (templateId) {
                const template = await prisma.tripTemplate.findUnique({
                    where: { id: templateId },
                    include: { route: { include: { stops: { orderBy: { orderIndex: 'asc' } } } } }
                });

                if (!template) throw new Error("Template not found");

                const firstStopId = template.route.stops[0]?.destinationId;
                const lastStopId = template.route.stops[template.route.stops.length - 1]?.destinationId;
                
                const tripTime = time || template.departureTime;

                // Simple helper locally for time logic instead of importing
                const calculateArrivalTime = (dateObj: Date, depTime: string, addMins: number) => {
                    const [h, m] = depTime.split(':').map(Number);
                    const d = new Date(dateObj);
                    d.setHours(h, m + addMins, 0, 0);
                    return d;
                };

                const formatTimeOnly = (d: Date) => d.toTimeString().split(' ')[0].substring(0, 5);

                const trip = await prisma.scheduledTrip.create({
                    data: {
                        tripNumber,
                        fromDestinationId: firstStopId,
                        toDestinationId: lastStopId,
                        routeId: template.routeId,
                        templateId: template.id,
                        date: currentDate,
                        departureTime: tripTime,
                        status: 'SCHEDULED',
                        price: price || 0,
                        capacity: capacity || template.capacity,
                        busNumber: busNumber || template.defaultVehicleId,
                        driverId: driverName || template.defaultDriverId, // UI sends ID in this field for templates usually or we can ignore
                        stops: {
                            create: template.route.stops.map(stop => {
                                const arrObj = calculateArrivalTime(currentDate, tripTime, stop.minutesFromStart);
                                const depObj = calculateArrivalTime(currentDate, tripTime, stop.minutesFromStart + stop.stopDurationMinutes);
                                return {
                                    destinationId: stop.destinationId,
                                    routeStopId: stop.id,
                                    arrivalTime: formatTimeOnly(arrObj),
                                    departureDate: depObj,
                                    departureTime: formatTimeOnly(depObj),
                                    price: 0,
                                    boardingPoint: stop.boardingPoint || null,
                                    orderIndex: stop.orderIndex
                                };
                            })
                        }
                    }
                });
                createdTrips.push(trip);
                continue;
            }

            // Normal custom creation (Legacy)
            let currentArrivalDate = null;
            if (arrivalDate) {
                const startArrival = new Date(arrivalDate);
                currentArrivalDate = new Date(startArrival);
                currentArrivalDate.setDate(startArrival.getDate() + i);
            }

            const trip = await prisma.scheduledTrip.create({
                data: {
                    tripNumber,
                    fromDestinationId: fromId,
                    toDestinationId: toId,
                    date: currentDate,
                    departureTime: time,
                    arrivalDate: currentArrivalDate,
                    arrivalTime: arrivalTime,
                    price: price,
                    capacity: capacity || 50,
                    busNumber,
                    driverName,
                    status: 'SCHEDULED',
                    stops: {
                        create: stops?.map((stop: any, idx: number) => ({
                            destinationId: stop.destinationId,
                            departureDate: stop.departureDate ? new Date(stop.departureDate) : null,
                            departureTime: stop.departureTime,
                            price: stop.price,
                            boardingPoint: stop.boardingPoint || null,
                            orderIndex: idx
                        }))
                    }
                }
            });
            createdTrips.push(trip);
        }

        return NextResponse.json({ count: createdTrips.length, trips: createdTrips });
    } catch (error) {
        console.error("Create Trip Error", error);
        return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.scheduledTrip.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, fromId, toId, date, time, arrivalDate, arrivalTime, price, capacity, busNumber, driverName, stops, status } = body;

        const updateData: any = {
            fromDestinationId: fromId,
            toDestinationId: toId,
            date: new Date(date),
            departureTime: time,
            arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
            arrivalTime: arrivalTime,
            price: price,
            capacity: capacity,
            busNumber,
            driverName,
            status
        };

        // If stops are provided, we need to handle them. 
        // Simplest strategy: delete existing and recreate.
        if (stops) {
            updateData.stops = {
                deleteMany: {},
                create: stops.map((stop: any, idx: number) => ({
                    destinationId: stop.destinationId,
                    departureDate: stop.departureDate ? new Date(stop.departureDate) : null,
                    departureTime: stop.departureTime,
                    price: stop.price,
                    boardingPoint: stop.boardingPoint || null,
                    orderIndex: idx
                }))
            };
        }

        const trip = await prisma.scheduledTrip.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(trip);
    } catch (error) {
        console.error("Update Trip Error", error);
        return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
    }
}
