import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitorName, visitorPhone, professionSlug } = body;

        if (!visitorName || !visitorPhone || !professionSlug) {
            return NextResponse.json({ error: "Name, WhatsApp number, and profession are required" }, { status: 400 });
        }

        const profession = await prisma.profession.findUnique({
            where: { slug: professionSlug },
            include: { _count: { select: { questions: { where: { isActive: true } } } } }
        });

        if (!profession || !profession.isActive) {
            return NextResponse.json({ error: "Profession not found or inactive" }, { status: 404 });
        }

        if (profession._count.questions < profession.questionCount) {
            return NextResponse.json({ error: "Not enough questions in bank for this profession to start exam." }, { status: 400 });
        }

        // Check attempt limits - count previous SUBMITTED sessions for this visitor+profession
        const previousAttempts = await prisma.examSession.count({
            where: {
                professionId: profession.id,
                visitorPhone: visitorPhone,
                status: "SUBMITTED"
            }
        });

        if (previousAttempts >= profession.maxAttempts) {
            return NextResponse.json({
                error: `لقد استنفذت جميع محاولاتك (${profession.maxAttempts} محاولات). يرجى التواصل مع الإدارة للحصول على محاولات إضافية.`
            }, { status: 403 });
        }

        const session = await prisma.examSession.create({
            data: {
                type: "PUBLIC",
                professionId: profession.id,
                visitorName: visitorName,
                visitorPhone: visitorPhone,
                passingScore: profession.passingScore,
                attemptNumber: previousAttempts + 1
            }
        });

        // Redirect URL format handled by frontend, just return token
        return NextResponse.json({ token: session.token, professionName: profession.name });
    } catch (error) {
        console.error("Public Session Init Error:", error);
        return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
    }
}
