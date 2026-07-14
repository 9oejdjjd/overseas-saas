import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

// PUT: Update an existing tag
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
        const { name, slug } = body;

        if (!name) {
            return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
        }

        const finalSlug = slugify(slug || name);

        // Check if tag exists
        const tagExists = await prisma.tag.findUnique({
            where: { id }
        });

        if (!tagExists) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Check conflicts
        const conflict = await prisma.tag.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { name },
                    { slug: finalSlug }
                ]
            }
        });

        if (conflict) {
            return NextResponse.json({ error: "Another tag with this name or slug already exists." }, { status: 400 });
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: {
                name,
                slug: finalSlug
            }
        });

        return NextResponse.json({ success: true, tag });
    } catch (error: any) {
        console.error("PUT Tag Error:", error);
        return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
}

// DELETE: Delete a tag
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

        const tagExists = await prisma.tag.findUnique({
            where: { id }
        });

        if (!tagExists) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Dissociate from all articles and then delete (Prisma implicit many-to-many handles dissociation on cascade/delete, but let's make sure it deletes cleanly)
        await prisma.tag.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Tag deleted successfully" });
    } catch (error: any) {
        console.error("DELETE Tag Error:", error);
        return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
    }
}
