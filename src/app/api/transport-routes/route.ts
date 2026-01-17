import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ARABIC_TO_ENGLISH: Record<string, string> = {
    "صنعاء": "SANAA",
    "تعز": "TAIZ",
    "عدن": "ADEN",
    "حضرموت": "HADDRAMOT",
    "مأرب": "MAREB",
    "الحديدة": "HODEIDAH",
    "إب": "IBB"
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromParam = searchParams.get('from')?.trim();
        const toParam = searchParams.get('to')?.trim();

        if (!fromParam || !toParam) {
            return NextResponse.json({ error: "Missing from or to parameters" }, { status: 400 });
        }

        let whereClause: any = { isActive: true };

        const buildLocationQuery = (param: string) => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
            if (isUUID) return { id: param };

            // Resolve Arabic to English if possible
            const mappedEnglish = ARABIC_TO_ENGLISH[param] ||
                Object.entries(ARABIC_TO_ENGLISH).find(([k, v]) => param.includes(k))?.[1];

            const orConditions: any[] = [
                { code: param },
                { name: { equals: param, mode: 'insensitive' } },
                { name: { contains: param, mode: 'insensitive' } }
            ];

            if (mappedEnglish) {
                orConditions.push({ name: { contains: mappedEnglish, mode: 'insensitive' } });
            }

            return { OR: orConditions };
        };

        if (fromParam) whereClause.from = buildLocationQuery(fromParam);
        if (toParam) whereClause.to = buildLocationQuery(toParam);

        const route = await prisma.transportRoute.findFirst({
            where: whereClause,
            include: {
                from: { select: { name: true, code: true } },
                to: { select: { name: true, code: true } },
            }
        });

        if (!route) {
            // Try reverse route lookup if implicit bidirectional logic is desired? 
            // Usually not, but if users make mistakes, maybe? 
            // For now, strict directional.
            return NextResponse.json({ error: "Route not found" }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error) {
        console.error("Transport Route Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch route" },
            { status: 500 }
        );
    }
}
