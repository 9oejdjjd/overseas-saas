
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const destination = searchParams.get("destination");

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);

        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);

        const tickets = await prisma.ticket.findMany({
            where: {
                departureDate: {
                    gte: dateStart,
                    lte: dateEnd
                },
                status: { not: "CANCELLED" },
                ...(destination ? { arrivalLocation: destination } : {})
            },
            include: {
                applicant: {
                    select: {
                        fullName: true,
                        phone: true,
                        passportNumber: true,
                        applicantCode: true // PNR
                    }
                }
            },
            orderBy: {
                ticketNumber: "asc"
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Failed to fetch manifest", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
