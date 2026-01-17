
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        if (!q) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                OR: [
                    { ticketNumber: q },
                    { applicant: { applicantCode: q } }
                ]
            },
            include: {
                applicant: {
                    select: {
                        fullName: true,
                        phone: true,
                        applicantCode: true
                    }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Search error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
