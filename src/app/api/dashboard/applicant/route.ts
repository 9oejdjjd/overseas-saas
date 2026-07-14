import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // 1. Fetch associated Applicant profile
        const email = session.user.email || "";
        let applicant = null;

        if (email) {
            applicant = await prisma.applicant.findUnique({
                where: { platformEmail: email },
                include: {
                    examCenter: {
                        select: { name: true, address: true, locationUrl: true }
                    },
                    location: {
                        select: { name: true }
                    },
                    transportFrom: {
                        select: { name: true }
                    },
                    ticket: {
                        select: {
                            ticketNumber: true,
                            busNumber: true,
                            seatNumber: true,
                            departureDate: true,
                            departureLocation: true,
                            arrivalLocation: true,
                            transportCompany: true,
                            status: true
                        }
                    }
                }
            });
        }

        // If no profile found by email, try searching by name or return null
        if (!applicant && session.user.name) {
            applicant = await prisma.applicant.findFirst({
                where: { fullName: session.user.name },
                include: {
                    examCenter: {
                        select: { name: true, address: true, locationUrl: true }
                    },
                    location: {
                        select: { name: true }
                    },
                    transportFrom: {
                        select: { name: true }
                    },
                    ticket: {
                        select: {
                            ticketNumber: true,
                            busNumber: true,
                            seatNumber: true,
                            departureDate: true,
                            departureLocation: true,
                            arrivalLocation: true,
                            transportCompany: true,
                            status: true
                        }
                    }
                }
            });
        }

        // 2. Fetch mock exam purchases (subscriptions) linked by phone or applicantId
        let purchases: any[] = [];
        let examSessions: any[] = [];

        if (applicant) {
            const phone = applicant.phone;
            const phoneWithoutPlus = phone ? phone.replace(/^\+/, "") : "";
            
            purchases = await prisma.mockExamPurchase.findMany({
                where: {
                    OR: [
                        { applicantId: applicant.id },
                        ...(phone ? [{ phone: phone }] : []),
                        ...(phoneWithoutPlus ? [{ phone: phoneWithoutPlus }] : [])
                    ]
                },
                include: {
                    package: {
                        select: {
                            name: true,
                            nameEn: true,
                            examCredits: true,
                            price: true,
                            isFree: true,
                            validityDays: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            // 3. Fetch exam sessions matching applicantId or phone
            examSessions = await prisma.examSession.findMany({
                where: {
                    OR: [
                        { applicantId: applicant.id },
                        ...(phone ? [{ visitorPhone: phone }] : []),
                        ...(phoneWithoutPlus ? [{ visitorPhone: phoneWithoutPlus }] : [])
                    ]
                },
                include: {
                    profession: {
                        select: { name: true, slug: true, questionCount: true, examDuration: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        }

        // 4. Get active professions for test launcher
        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                questionCount: true,
                examDuration: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({
            applicant,
            purchases,
            examSessions,
            professions
        });

    } catch (error) {
        console.error("Applicant Dashboard API Error:", error);
        return NextResponse.json({ error: "Failed to fetch applicant dashboard metrics" }, { status: 500 });
    }
}
