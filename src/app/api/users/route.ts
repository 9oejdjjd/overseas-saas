import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Users Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, role } = body;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "REGISTRATION_STAFF",
                createdBy: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: "USER_CREATED",
                details: `Created user: ${user.name} (${user.email})`,
                userId: session.user.id,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("User Creation Error:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
