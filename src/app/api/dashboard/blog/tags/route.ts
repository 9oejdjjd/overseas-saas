import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

// GET: List all tags for the dashboard
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const tags = await prisma.tag.findMany({
            include: {
                _count: {
                    select: { articles: true }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ success: true, tags });
    } catch (error: any) {
        console.error("GET Tags Error:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

// POST: Create a new tag
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug } = body;

        if (!name) {
            return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
        }

        const finalSlug = slugify(slug || name);

        if (!finalSlug) {
            return NextResponse.json({ error: "Failed to generate a valid slug." }, { status: 400 });
        }

        // Check if slug or name exists
        const existingTag = await prisma.tag.findFirst({
            where: {
                OR: [
                    { name },
                    { slug: finalSlug }
                ]
            }
        });

        if (existingTag) {
            return NextResponse.json({ error: "A tag with this name or slug already exists." }, { status: 400 });
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                slug: finalSlug
            }
        });

        return NextResponse.json({ success: true, tag });
    } catch (error: any) {
        console.error("POST Tag Error:", error);
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}
