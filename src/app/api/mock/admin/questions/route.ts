import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(request.url);
        const professionId = url.searchParams.get("professionId");
        const isActive = url.searchParams.get("isActive");

        const where: any = {};
        if (professionId) where.professionId = professionId;
        if (isActive !== null) where.isActive = isActive === "true";

        const questions = await prisma.question.findMany({
            where,
            include: {
                options: true,
                profession: { select: { name: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error("GET Questions Error:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId, text, explanation, difficulty, isActive, options } = body;

        if (!professionId || !text || !options || !Array.isArray(options) || options.length !== 4) {
            return NextResponse.json({ error: "Invalid data. Must provide text and exactly 4 options." }, { status: 400 });
        }

        const correctCount = options.filter(opt => opt.isCorrect).length;
        if (correctCount !== 1) {
            return NextResponse.json({ error: "Exactly one option must be correct." }, { status: 400 });
        }

        const question = await prisma.question.create({
            data: {
                professionId,
                text,
                explanation,
                difficulty: difficulty || "MEDIUM",
                isActive: isActive ?? true,
                options: {
                    create: options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false
                    }))
                }
            },
            include: { options: true }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("POST Question Error:", error);
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }
}
