import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;

        const session = await prisma.examSession.findUnique({
            where: { token },
            include: {
                profession: true,
                applicant: {
                    select: { fullName: true }
                },
                questions: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        },
                    }
                },
                purchase: {
                    include: { package: true }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Invalid session" }, { status: 404 });
        }

        if (session.status !== "SUBMITTED" && session.status !== "EXPIRED" && session.status !== "TIMEOUT") {
            return NextResponse.json({ error: "Result is not available yet" }, { status: 400 });
        }

        // === ACCESS CONTROL ===
        // Check if the viewer is an admin (bypass restrictions)
        const adminSession = await getServerSession(authOptions);
        const isAdmin = adminSession && hasPermission(adminSession.user.role, "MANAGE_SYSTEM");

        if (!isAdmin) {
            // For non-admins: verify they are the original exam taker
            const viewerIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
            const viewerFingerprint = request.headers.get("x-device-fingerprint") || "";

            // Extract base fingerprint for comparison
            let sessionBaseFingerprint = session.deviceFingerprint || "";
            if (sessionBaseFingerprint.includes("-")) {
                sessionBaseFingerprint = sessionBaseFingerprint.split("-")[0];
            }
            let viewerBaseFingerprint = viewerFingerprint;
            if (viewerBaseFingerprint.includes("-")) {
                viewerBaseFingerprint = viewerBaseFingerprint.split("-")[0];
            }

            // Allow access if IP matches OR fingerprint matches
            const ipMatch = viewerIp !== "unknown" && session.ipAddress === viewerIp;
            const fpMatch = viewerBaseFingerprint && sessionBaseFingerprint && viewerBaseFingerprint === sessionBaseFingerprint;

            if (!ipMatch && !fpMatch) {
                // Return a limited result (score only, no answers/explanations)
                return NextResponse.json({
                    id: session.id,
                    token: session.token,
                    score: Number(session.score || 0),
                    passingScore: session.passingScore,
                    isPassed: session.isPassed,
                    startedAt: session.startedAt,
                    completedAt: session.completedAt,
                    visitorName: session.applicant?.fullName || session.visitorName || "زائر",
                    professionName: session.profession.name,
                    isRegistered: !!session.applicantId,
                    restricted: true,
                    questions: [] // No questions/answers for unauthorized viewers
                });
            }
        }

        // === PACKAGE FEATURES CONTROL ===
        let showResultScore = true;
        let showResultQuestions = true;
        let showResultCorrectAnswers = true;

        if (session.purchase?.package) {
            showResultScore = session.purchase.package.showResultScore;
            showResultQuestions = session.purchase.package.showResultQuestions;
            showResultCorrectAnswers = session.purchase.package.showResultCorrectAnswers;
        }

        // Format full result data (authorized viewer)
        const result = {
            id: session.id,
            token: session.token,
            score: showResultScore ? Number(session.score || 0) : null,
            passingScore: session.passingScore,
            isPassed: showResultScore ? session.isPassed : null,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            visitorName: session.applicant?.fullName || session.visitorName || "زائر",
            professionName: session.profession.name,
            isRegistered: !!session.applicantId,
            restricted: false,
            packageFeatures: { showResultScore, showResultQuestions, showResultCorrectAnswers },
            questions: session.questions.map((sq: any) => {
                const baseQ: any = {
                    id: sq.id,
                    axis: sq.question.axis,
                    isCorrect: sq.isCorrect,
                    selectedOptionId: sq.selectedOptionId,
                };

                if (showResultQuestions) {
                    baseQ.questionId = sq.questionId;
                    baseQ.type = sq.question.type;
                    baseQ.imageUrl = sq.question.imageUrl;
                    baseQ.text = sq.question.text;
                    baseQ.explanation = showResultCorrectAnswers ? sq.question.explanation : null;
                    baseQ.options = sq.question.options.map((opt: any) => ({
                        id: opt.id,
                        text: opt.text,
                        isCorrect: showResultCorrectAnswers ? opt.isCorrect : undefined
                    }));
                } else {
                    baseQ.text = "محتوى السؤال محجوب. قم بالاشتراك في باقة متقدمة للاطلاع على الأسئلة.";
                    baseQ.options = [];
                }

                return baseQ;
            })
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error("Fetch Result Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
