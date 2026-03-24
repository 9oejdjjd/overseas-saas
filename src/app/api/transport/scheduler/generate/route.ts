import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Generate trips for a given number of days ahead
// This endpoint can be triggered manually via UI or by a Vercel cron job
export async function POST() {
    try {
        const GENERATION_WINDOW_DAYS = 14; 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + GENERATION_WINDOW_DAYS);

        // Fetch all active templates
        const templates = await prisma.tripTemplate.findMany({
            where: {
                startDate: { lte: targetDate },
                OR: [
                    { endDate: null },
                    { endDate: { gte: today } }
                ]
            },
            include: {
                route: {
                    include: {
                        stops: {
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                }
            }
        });

        const createdTrips = [];
        const skippedTrips = []; // Track already generated

        // For each template, we check each day in the window
        for (const template of templates) {
            for (let i = 0; i <= GENERATION_WINDOW_DAYS; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(currentDate.getDate() + i);

                // Check if current date is within template start/end dates
                if (currentDate < template.startDate) continue;
                if (template.endDate && currentDate > template.endDate) continue;

                // Check Recurrence Rule
                if (!doesRuleMatchDate(template.recurrenceRule, currentDate)) {
                    continue;
                }

                const firstStopId = template.route.stops[0]?.destinationId;
                const lastStopId = template.route.stops[template.route.stops.length - 1]?.destinationId;

                // Check if a trip for this template already exists on this date
                const existingTrip = await prisma.scheduledTrip.findFirst({
                    where: {
                        templateId: template.id,
                        date: currentDate,
                    }
                });

                if (existingTrip) {
                    skippedTrips.push(existingTrip.id);
                    continue; // Skip, already generated
                }

                // Generate Trip Name
                const routeName = template.route.name;
                const dateString = currentDate.toISOString().split('T')[0];
                const tripNumber = `TRP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

                // Create Trip & Stops
                const trip = await prisma.scheduledTrip.create({
                    data: {
                        tripNumber,
                        fromDestinationId: firstStopId,
                        toDestinationId: lastStopId,
                        routeId: template.routeId,
                        templateId: template.id,
                        date: currentDate,
                        departureTime: template.departureTime,
                        status: 'SCHEDULED', // from Enum
                        price: 0, // Should be calculated or fetched from RoutePricing logic separately 
                        capacity: template.capacity,
                        busClass: template.busClass,
                        driverId: template.defaultDriverId,
                        vehicleId: template.defaultVehicleId,
                        // Create Stops based on Route Stops
                        stops: {
                            create: template.route.stops.map(stop => {
                                const arrivalObj = calculateArrivalTime(currentDate, template.departureTime, stop.minutesFromStart);
                                const departureObj = calculateDepartureTime(currentDate, template.departureTime, stop.minutesFromStart, stop.stopDurationMinutes);
                                
                                return {
                                    destinationId: stop.destinationId,
                                    routeStopId: stop.id,
                                    arrivalTime: formatTimeOnly(arrivalObj),
                                    departureDate: departureObj, // Uses the correctly incremented date obj
                                    departureTime: formatTimeOnly(departureObj),
                                    price: stop.priceFromStart || 0,
                                    orderIndex: stop.orderIndex 
                                };
                            })
                        }
                    }
                });

                createdTrips.push(trip.id);
            }
        }

        return NextResponse.json({
            message: "Generation completed",
            createdTripsCount: createdTrips.length,
            skippedTripsCount: skippedTrips.length,
            windowDays: GENERATION_WINDOW_DAYS
        });

    } catch (error) {
        console.error("Generate Trips Error:", error);
        return NextResponse.json({ error: "Failed to generate trips" }, { status: 500 });
    }
}

// Helpers
function doesRuleMatchDate(rule: string, date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    
    switch (rule) {
        case 'DAILY':
            return true;
        case 'WEEKDAYS':
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
        case 'WEEKENDS':
            return dayOfWeek === 0 || dayOfWeek === 6; // Sun/Sat
        case 'WEEKLY_FRI':
            return dayOfWeek === 5; // Friday
        default:
            return false;
    }
}

function calculateArrivalTime(baseDate: Date, timeStr: string, minutesToAdd: number): Date {
    const date = new Date(baseDate);
    const [hours, mins] = timeStr.split(':').map(Number);
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return date;
}

function calculateDepartureTime(baseDate: Date, timeStr: string, minutesToAdd: number, durationLimit: number): Date {
    const date = new Date(baseDate);
    const [hours, mins] = timeStr.split(':').map(Number);
    date.setHours(hours, mins + minutesToAdd + durationLimit, 0, 0);
    return date;
}

function formatTimeOnly(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5); // Returns HH:MM
}
