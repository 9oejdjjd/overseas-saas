import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Ensure not attempting to change ID
        const { id: _, ...updateData } = body;

        if (updateData.slug) {
            if (!/^[a-z0-9-]+$/.test(updateData.slug)) {
                return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
            }
            const existingSlug = await prisma.profession.findUnique({ where: { slug: updateData.slug } });
            if (existingSlug && existingSlug.id !== id) {
                return NextResponse.json({ error: "Slug already in use by another profession" }, { status: 400 });
            }
        }

        const profession = await prisma.profession.update({
            where: { id },
            data: {
                ...updateData,
                examDuration: updateData.examDuration ? Number(updateData.examDuration) : undefined,
                questionCount: updateData.questionCount ? Number(updateData.questionCount) : undefined,
                passingScore: updateData.passingScore ? Number(updateData.passingScore) : undefined,
            }
        });

        return NextResponse.json(profession);
    } catch (error) {
        console.error("PUT Profession Error:", error);
        return NextResponse.json({ error: "Failed to update profession" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Ensure no active sessions depend on it before deleting
        const activeSessions = await prisma.examSession.count({
            where: { professionId: id, status: { in: ['NEW', 'STARTED'] } }
        });

        if (activeSessions > 0) {
            return NextResponse.json({ error: "Cannot delete profession with active exam sessions" }, { status: 400 });
        }

        await prisma.profession.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Profession Error:", error);
        return NextResponse.json({ error: "Failed to delete profession" }, { status: 500 });
    }
}
