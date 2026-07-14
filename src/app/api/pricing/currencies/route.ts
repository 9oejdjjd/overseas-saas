import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        let currencies = await prisma.systemCurrency.findMany({
            orderBy: { code: "asc" }
        });

        // Auto-populate default SAR if empty
        if (currencies.length === 0) {
            const defaultSar = await prisma.systemCurrency.create({
                data: {
                    code: "SAR",
                    name: "ريال سعودي",
                    buyRate: 530.00,
                    sellRate: 533.00,
                    isActive: true
                }
            });
            currencies = [defaultSar];
        }

        return NextResponse.json(currencies);
    } catch (error) {
        console.error("GET Currencies Error:", error);
        return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, buyRate, sellRate } = body;

        if (!code || !name || buyRate === undefined || sellRate === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const currency = await prisma.systemCurrency.create({
            data: {
                code: code.toUpperCase(),
                name,
                buyRate: Number(buyRate),
                sellRate: Number(sellRate),
                isActive: true
            }
        });

        return NextResponse.json(currency);
    } catch (error) {
        console.error("POST Currency Error:", error);
        return NextResponse.json({ error: "Failed to create currency" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, code, buyRate, sellRate, isActive } = body;

        if (!id && !code) {
            return NextResponse.json({ error: "ID or Code is required" }, { status: 400 });
        }

        const whereClause = id ? { id } : { code: code.toUpperCase() };

        const currency = await prisma.systemCurrency.update({
            where: whereClause,
            data: {
                buyRate: buyRate !== undefined ? Number(buyRate) : undefined,
                sellRate: sellRate !== undefined ? Number(sellRate) : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });

        return NextResponse.json(currency);
    } catch (error) {
        console.error("PATCH Currency Error:", error);
        return NextResponse.json({ error: "Failed to update currency" }, { status: 500 });
    }
}
