import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const updatedTx = await prisma.transaction.update({
            where: { id },
            data: {
                ...(body.amount !== undefined && { amount: Number(body.amount) }),
                ...(body.notes !== undefined && { notes: body.notes }),
                ...(body.isPending !== undefined && { isPending: body.isPending })
            }
        });

        return NextResponse.json(updatedTx);
    } catch (error) {
        console.error("Failed to update transaction:", error);
        return NextResponse.json(
            { error: "Failed to update transaction" },
            { status: 500 }
        );
    }
}
