
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const routes = await prisma.transportRoute.findMany({
            where: { isActive: true },
            select: {
                from: {
                    select: { id: true, name: true }
                }
            },
            distinct: ['fromId']
        });

        const origins = routes.map(r => ({
            id: r.from.id,
            name: r.from.name
        }));

        return NextResponse.json(origins);
    } catch (error) {
        console.error("Failed to fetch origins", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
