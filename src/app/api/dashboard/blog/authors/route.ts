import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all authors for the dashboard
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const authors = await prisma.author.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: { articles: true }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ success: true, authors });
    } catch (error: any) {
        console.error("GET Authors Error:", error);
        return NextResponse.json({ error: "Failed to fetch authors" }, { status: 500 });
    }
}

// POST: Create a new author profile
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, title, avatar, bio, userId } = body;

        if (!name) {
            return NextResponse.json({ error: "Author name is required" }, { status: 400 });
        }

        // If userId is provided, check if it's already linked to another author
        if (userId) {
            const existingAuthorLink = await prisma.author.findUnique({
                where: { userId }
            });

            if (existingAuthorLink) {
                return NextResponse.json({ error: "This system user is already linked to an author profile." }, { status: 400 });
            }
        }

        const author = await prisma.author.create({
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
        console.error("POST Author Error:", error);
        return NextResponse.json({ error: "Failed to create author profile" }, { status: 500 });
    }
}
