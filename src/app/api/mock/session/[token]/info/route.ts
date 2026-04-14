import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { profession: true, applicant: true }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        return NextResponse.json({
            id: session.id,
            type: session.type,
            status: session.status,
            profession: {
                name: session.profession.name,
                examDuration: session.profession.examDuration,
                questionCount: session.profession.questionCount,
                passingScore: session.profession.passingScore,
            },
            visitorName: session.visitorName,
            visitorPhone: session.visitorPhone,
            applicantId: session.applicantId,
            applicant: session.applicant ? {
                fullName: session.applicant.fullName,
                whatsappNumber: session.applicant.whatsappNumber,
                phone: (session.applicant as any).phone || null
            } : null
        });

    } catch (error) {
        console.error("Session Info Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
