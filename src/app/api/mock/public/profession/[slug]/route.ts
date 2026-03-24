import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        const profession = await prisma.profession.findUnique({
            where: { slug, isActive: true },
            select: { name: true, examDuration: true, questionCount: true }
        });

        if (!profession) {
            return NextResponse.json({ error: "Profession not found or inactive" }, { status: 404 });
        }

        return NextResponse.json(profession);
    } catch (error) {
        console.error("GET Profession By Slug Error:", error);
        return NextResponse.json({ error: "Failed to fetch profession" }, { status: 500 });
    }
}
