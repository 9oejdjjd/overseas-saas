import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: { 
                profession: true, 
                applicant: true,
                purchase: {
                    include: { package: true }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        // Determine correct question count
        let questionCount = session.profession.questionCount;
        const pkgQuestionsCount = session.purchase?.package?.examQuestionsCount;
        if (pkgQuestionsCount && pkgQuestionsCount > 0) {
            questionCount = pkgQuestionsCount;
        } else {
            // Fallback to active free package if it's a public session
            try {
                const freePackage = await prisma.mockExamPackage.findFirst({
                    where: { isFree: true, isActive: true },
                    select: { examQuestionsCount: true }
                });
                if (freePackage?.examQuestionsCount && freePackage.examQuestionsCount > 0) {
                    questionCount = freePackage.examQuestionsCount;
                }
            } catch (e) {
                console.error("Failed to query free package fallback for info route:", e);
            }
        }

        return NextResponse.json({
            id: session.id,
            type: session.type,
            status: session.status,
            profession: {
                name: session.profession.name,
                examDuration: session.profession.examDuration,
                questionCount: questionCount,
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
