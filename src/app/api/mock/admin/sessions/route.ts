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
            take: 500
        });

        // Group sessions by Device Fingerprint, Applicant ID, or Visitor Phone
        const groupedMap = new Map<string, any>();

        sessionsList.forEach((session: any) => {
            // Priority for grouping: ApplicantId > DeviceFingerprint > VisitorPhone > Token
            const groupKey = session.applicantId || session.deviceFingerprint || session.visitorPhone || session.token;
            
            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    id: groupKey,
                    displayName: session.applicant?.fullName || session.visitorName || "غير معروف",
                    displayPhone: session.applicant?.whatsappNumber || session.visitorPhone || "لا يوجد",
                    type: session.type,
                    profession: session.profession,
                    allNames: new Set<string>(),
                    allPhones: new Set<string>(),
                    sessions: [],
                    bestScore: 0,
                    lastScore: 0,
                    isPassed: false,
                    totalAttempts: 0,
                    status: session.status,
                    createdAt: session.createdAt
                });
            }

            const group = groupedMap.get(groupKey);
            
            const name = session.applicant?.fullName || session.visitorName;
            if (name) group.allNames.add(name);
            
            const phone = session.applicant?.whatsappNumber || session.visitorPhone;
            if (phone) group.allPhones.add(phone);

            group.sessions.push(session);
            group.totalAttempts += 1;

            if (session.status === "SUBMITTED" && session.score) {
                const scoreNum = Number(session.score);
                if (scoreNum > group.bestScore) group.bestScore = scoreNum;
                // Since sessions are ordered by desc, the first one encountered is the latest
                if (group.sessions.length === 1) {
                    group.lastScore = scoreNum;
                }
                if (scoreNum >= session.passingScore) {
                    group.isPassed = true;
                }
            }

            // Keep status of the latest session
            if (group.sessions.length === 1) {
                group.status = session.status;
            }
        });

        const finalGroupedList = Array.from(groupedMap.values()).map(g => ({
            ...g,
            allNames: Array.from(g.allNames),
            allPhones: Array.from(g.allPhones),
            isSuspicious: g.allNames.size > 1 || g.allPhones.size > 1
        }));

        return NextResponse.json(finalGroupedList);
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

            return NextResponse.json({ token: newSession.token, url: `/session/${newSession.token}` });
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

        return NextResponse.json({ token: newSession.token, url: `/session/${newSession.token}` });
    } catch (error) {
        console.error("POST Session Error:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
