import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get("date");

        // Default to tomorrow if no date provided
        let targetDate = new Date();
        if (dateParam) {
            targetDate = new Date(dateParam);
        } else {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        // Set start and end of day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const tickets = await prisma.ticket.findMany({
            where: {
                departureDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    in: ["ISSUED", "USED", "NO_SHOW"] // valid tickets only
                }
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        whatsappNumber: true,
                        passportNumber: true,
                        nationalId: true,
                        notes: true
                    }
                }
            },
            orderBy: [
                { transportCompany: 'asc' },
                { busNumber: 'asc' },
                { seatNumber: 'asc' }
            ]
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Manifest Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch manifest" },
            { status: 500 }
        );
    }
}
