import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT: Update an existing author profile
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
        const { name, title, avatar, bio, userId } = body;

        if (!name) {
            return NextResponse.json({ error: "Author name is required" }, { status: 400 });
        }

        // Check if author profile exists
        const authorExists = await prisma.author.findUnique({
            where: { id }
        });

        if (!authorExists) {
            return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
        }

        // If userId is provided, check if it's already linked to another author
        if (userId && userId !== authorExists.userId) {
            const existingAuthorLink = await prisma.author.findUnique({
                where: { userId }
            });

            if (existingAuthorLink) {
                return NextResponse.json({ error: "This system user is already linked to another author profile." }, { status: 400 });
            }
        }

        const author = await prisma.author.update({
            where: { id },
            data: {
                name,
                title: title || null,
                avatar: avatar || null,
                bio: bio || null,
                userId: userId || null
            }
        });

        return NextResponse.json({ success: true, author });
    } catch (error: any) {
        console.error("PUT Author Error:", error);
        return NextResponse.json({ error: "Failed to update author profile" }, { status: 500 });
    }
}

// DELETE: Delete an author profile
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

        const author = await prisma.author.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true }
                }
            }
        });

        if (!author) {
            return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
        }

        // Prevent deletion if the author has articles
        if (author._count.articles > 0) {
            return NextResponse.json({ 
                error: `Cannot delete author because they are linked to ${author._count.articles} article(s). Reassign them first.` 
            }, { status: 400 });
        }

        await prisma.author.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Author profile deleted successfully" });
    } catch (error: any) {
        console.error("DELETE Author Error:", error);
        return NextResponse.json({ error: "Failed to delete author profile" }, { status: 500 });
    }
}
