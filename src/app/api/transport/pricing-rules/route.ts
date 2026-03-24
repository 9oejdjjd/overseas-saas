
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const rules = await prisma.transportPricingRule.findMany({
            orderBy: { priority: 'desc' },
            where: { isActive: true }
        });
        return NextResponse.json(rules);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // body: { name, priority, scope, conditions, action }
        const {
            name,
            priority,
            routeFromId,
            routeToId,
            passengerType,
            tripType,
            busClass,
            seasonStartDate,
            seasonEndDate,
            minAdvanceBookingHours,
            actionType,
            amount
        } = body;

        if (!name || !actionType || amount == null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rule = await prisma.transportPricingRule.create({
            data: {
                name,
                priority: Number(priority || 0),
                routeFromId,
                routeToId,
                passengerType: passengerType || null,
                tripType: tripType || null,
                busClass: busClass || null,
                seasonStartDate: seasonStartDate ? new Date(seasonStartDate) : null,
                seasonEndDate: seasonEndDate ? new Date(seasonEndDate) : null,
                minAdvanceBookingHours: minAdvanceBookingHours ? Number(minAdvanceBookingHours) : null,
                actionType,
                amount: Number(amount)
            }
        });
        return NextResponse.json(rule);
    } catch (error) {
        console.error("Create Rule Error", error);
        return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.transportPricingRule.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
