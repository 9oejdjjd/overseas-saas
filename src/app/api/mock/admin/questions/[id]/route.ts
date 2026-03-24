import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { text, explanation, difficulty, isActive, options } = body;

        // Perform transactional update for question and options
        const question = await prisma.$transaction(async (tx) => {
            const updatedQuestion = await tx.question.update({
                where: { id },
                data: { text, explanation, difficulty, isActive }
            });

            if (options && Array.isArray(options) && options.length > 0) {
                // Remove old options and insert new
                await tx.questionOption.deleteMany({ where: { questionId: id } });
                await tx.questionOption.createMany({
                    data: options.map(opt => ({
                        questionId: id,
                        text: opt.text,
                        isCorrect: opt.isCorrect || false
                    }))
                });
            }

            return await tx.question.findUnique({ where: { id }, include: { options: true } });
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("PUT Question Error:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.question.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Question Error:", error);
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    }
}
