
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            basePrice,
            routeFromId,
            routeToId,
            passengerType,
            tripType,
            busClass,
            bookingDate,
            travelDate
        } = body;

        let finalPrice = Number(basePrice || 0);

        // 0. Check for Route Defaults (TransportRouteDefault)
        // This overrides the sum of trips if a specific route price is defined
        if (routeFromId && routeToId) {
            const routeDefault = await prisma.transportRouteDefault.findUnique({
                where: {
                    fromDestinationId_toDestinationId: {
                        fromDestinationId: routeFromId,
                        toDestinationId: routeToId
                    }
                }
            });

            if (routeDefault) {
                if (tripType === 'ROUND_TRIP' && routeDefault.priceRoundTrip) {
                    finalPrice = Number(routeDefault.priceRoundTrip);
                } else if (tripType === 'ONE_WAY' && routeDefault.price) {
                    // Optional: Override one-way too if desired, strictly following "Route Price"
                    // finalPrice = Number(routeDefault.price); 
                    // User focused on Round Trip, but let's leave one-way as is (sum of stops) for now unless requested, 
                    // OR apply it if basePrice seems off? 
                    // Actually, usually Route Price is the standard. Let's start with Round Trip as explicitly requested.
                }
            }
        }

        let breakdown: any[] = [{ label: "السعر الأساسي", amount: finalPrice }];

        /* DISABLE LEGACY PRICING RULES AS REQUESTED
        // Fetch active rules
        const rules = await prisma.transportPricingRule.findMany({
            where: { isActive: true },
            orderBy: { priority: 'asc' }
        });

        // Current Dates
        const travel = new Date(travelDate || new Date());
        const booking = new Date(bookingDate || new Date());

        for (const rule of rules) {
             // ... logic skipped ...
        }
        */

        // Ensure no negative
        if (finalPrice < 0) finalPrice = 0;

        return NextResponse.json({
            originalPrice: basePrice,
            finalPrice: Number(finalPrice.toFixed(2)),
            breakdown
        });

    } catch (error) {
        console.error("Pricing Engine Error", error);
        return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
    }
}
