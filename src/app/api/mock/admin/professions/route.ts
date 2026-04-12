import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(request.url);
        const isActive = url.searchParams.get("isActive");

        const where: any = {};
        if (isActive !== null) {
            where.isActive = isActive === "true";
        }

        const professions = await prisma.profession.findMany({
            where,
            include: {
                _count: {
                    select: { questions: true, examSessions: true }
                },
                aiJobs: {
                    where: { 
                        status: "PROCESSING",
                        updatedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // Ignore ghost jobs stuck for over 15 mins
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(professions);
    } catch (error) {
        console.error("GET Professions Error:", error);
        return NextResponse.json({ error: "Failed to fetch professions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug, description, examDuration, questionCount, passingScore, isActive } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
        }

        const existingSlug = await prisma.profession.findUnique({ where: { slug } });
        if (existingSlug) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }

        const profession = await prisma.profession.create({
            data: {
                name,
                slug,
                description,
                examDuration: examDuration ? Number(examDuration) : 60,
                questionCount: questionCount ? Number(questionCount) : 20,
                passingScore: passingScore ? Number(passingScore) : 60,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(profession);
    } catch (error) {
        console.error("POST Profession Error:", error);
        return NextResponse.json({ error: "Failed to create profession" }, { status: 500 });
    }
}
