import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

// PUT: Update an existing category
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, nameEn, slug, description } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const finalSlug = slugify(slug || name);

        // Check if category exists
        const categoryExists = await prisma.category.findUnique({
            where: { id }
        });

        if (!categoryExists) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check conflicts with other categories (excluding this one)
        const conflict = await prisma.category.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { name },
                    { slug: finalSlug }
                ]
            }
        });

        if (conflict) {
            return NextResponse.json({ error: "Another category with this name or slug already exists." }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                nameEn: nameEn || null,
                slug: finalSlug,
                description: description || null
            }
        });

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        console.error("PUT Category Error:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE: Delete a category
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true }
                }
            }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Prevent deletion if articles are assigned to it
        if (category._count.articles > 0) {
            return NextResponse.json({ 
                error: `Cannot delete category because it contains ${category._count.articles} article(s). Reassign them first.` 
            }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
        console.error("DELETE Category Error:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
