import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                examDuration: true,
                questionCount: true,
                passingScore: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(professions);
    } catch (error) {
        console.error("Public GET Professions Error:", error);
        return NextResponse.json({ error: "Failed to fetch professions" }, { status: 500 });
    }
}
