import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

// GET: List all categories for the dashboard
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { articles: true }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        console.error("GET Categories Error:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST: Create a new category
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, nameEn, slug, description } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Auto-generate slug if not provided, or slugify the provided one
        const finalSlug = slugify(slug || name);

        if (!finalSlug) {
            return NextResponse.json({ error: "Failed to generate a valid slug. Please specify it manually." }, { status: 400 });
        }

        // Check if slug or name already exists
        const existingCategory = await prisma.category.findFirst({
            where: {
                OR: [
                    { name },
                    { slug: finalSlug }
                ]
            }
        });

        if (existingCategory) {
            return NextResponse.json({ error: "A category with this name or slug already exists." }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                nameEn: nameEn || null,
                slug: finalSlug,
                description: description || null
            }
        });

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        console.error("POST Category Error:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
