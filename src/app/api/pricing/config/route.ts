import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Always fetch the 'global' config, create if not exists
        let config = await prisma.serviceConfig.findUnique({
            where: { id: "global" }
        });

        if (!config) {
            config = await prisma.serviceConfig.create({
                data: {
                    id: "global",
                    registrationPrice: 0,
                    examChangeFee: 16000,
                    maxFreeChanges: 1
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch service config" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        const config = await prisma.serviceConfig.update({
            where: { id: "global" },
            data: {
                registrationPrice: body.registrationPrice,
                examChangeFee: body.examChangeFee,
                maxFreeChanges: body.maxFreeChanges
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update service config" }, { status: 500 });
    }
}
