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
        const type = url.searchParams.get("type");
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");

        const where: any = {};
        if (professionId) where.professionId = professionId;
        if (type) where.type = type;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { visitorName: { contains: search, mode: "insensitive" } },
                { visitorPhone: { contains: search } },
                { applicant: { fullName: { contains: search, mode: "insensitive" } } },
                { applicant: { whatsappNumber: { contains: search } } }
            ];
        }

        const sessionsList = await prisma.examSession.findMany({
            where,
            include: {
                profession: { select: { name: true, id: true, maxAttempts: true } },
                applicant: { select: { fullName: true, whatsappNumber: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        return NextResponse.json(sessionsList);
    } catch (error) {
        console.error("GET Sessions Error:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

// Generate a Private Exam Session or Grant Extra Attempt
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { applicantId, professionId, grantExtraAttempt, visitorPhone } = body;

        // Grant extra attempt for public visitor
        if (grantExtraAttempt && visitorPhone && professionId) {
            const profession = await prisma.profession.findUnique({ where: { id: professionId } });
            if (!profession) return NextResponse.json({ error: "Profession not found" }, { status: 404 });

            // Increase maxAttempts for this specific visitor by creating a new session with incremented attempt number
            const prevAttempts = await prisma.examSession.count({
                where: { professionId, visitorPhone, status: "SUBMITTED" }
            });

            const newSession = await prisma.examSession.create({
                data: {
                    type: "PUBLIC",
                    professionId,
                    visitorName: body.visitorName || "محاولة إضافية",
                    visitorPhone,
                    passingScore: profession.passingScore,
                    attemptNumber: prevAttempts + 1
                }
            });

            return NextResponse.json({ token: newSession.token, url: `/mock/session/${newSession.token}` });
        }

        // Generate Private session for registered applicant
        if (!applicantId || !professionId) {
            return NextResponse.json({ error: "Applicant and Profession are required" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({
            where: { id: professionId },
            include: { _count: { select: { questions: { where: { isActive: true } } } } }
        });

        if (!profession) {
            return NextResponse.json({ error: "Profession not found" }, { status: 404 });
        }

        if (profession._count.questions < profession.questionCount) {
            return NextResponse.json({ error: "Not enough questions in bank to generate exam." }, { status: 400 });
        }

        // Count previous attempts for this applicant
        const prevAttempts = await prisma.examSession.count({
            where: { professionId, applicantId, status: "SUBMITTED" }
        });

        const newSession = await prisma.examSession.create({
            data: {
                type: "PRIVATE",
                professionId: profession.id,
                applicantId: applicantId,
                passingScore: profession.passingScore,
                attemptNumber: prevAttempts + 1
            }
        });

        return NextResponse.json({ token: newSession.token, url: `/mock/session/${newSession.token}` });
    } catch (error) {
        console.error("POST Session Error:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
