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
        const authSession = await getServerSession(authOptions);
        const isAdmin = authSession && hasPermission(authSession.user.role, "MANAGE_SYSTEM");
        const isSessionOwner = authSession?.user?.id && session.applicantId === authSession.user.id;

        if (!isAdmin && !isSessionOwner) {
            // For non-admins/non-owners: verify they are the original exam taker
            const viewerIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
            const viewerFingerprint = request.headers.get("x-device-fingerprint") || "";

            // Robust IP cleaning
            const cleanIp = (ip: string) => {
                if (!ip) return "";
                let cleaned = ip.trim();
                if (cleaned.startsWith("::ffff:")) {
                    cleaned = cleaned.substring(7);
                }
                return cleaned;
            };

            const sessionIp = cleanIp(session.ipAddress || "");
            const viewerIps = viewerIp.split(",").map(ip => cleanIp(ip));

            // Smart subnet matching to handle dynamic mobile network IPs
            const isSubnetMatch = (ip1: string, ip2: string) => {
                if (!ip1 || !ip2) return false;
                const parts1 = ip1.split(".");
                const parts2 = ip2.split(".");
                if (parts1.length === 4 && parts2.length === 4) {
                    return parts1[0] === parts2[0] && parts1[1] === parts2[1] && parts1[2] === parts2[2];
                }
                const segments1 = ip1.split(":");
                const segments2 = ip2.split(":");
                if (segments1.length >= 4 && segments2.length >= 4) {
                    return segments1[0] === segments2[0] && 
                           segments1[1] === segments2[1] && 
                           segments1[2] === segments2[2] && 
                           segments1[3] === segments2[3];
                }
                return false;
            };

            const ipExactMatch = sessionIp && viewerIps.includes(sessionIp);
            const ipSubnetMatch = sessionIp && viewerIps.some(vip => isSubnetMatch(sessionIp, vip));

            // Parse composite device fingerprint (browserFingerprint-localStorageUUID)
            const parseFingerprint = (fp: string) => {
                if (!fp) return { base: "", local: "" };
                const parts = fp.split("-");
                return {
                    base: parts[0] || "",
                    local: parts[1] || ""
                };
            };

            const sessFp = parseFingerprint(session.deviceFingerprint || "");
            const viewFp = parseFingerprint(viewerFingerprint);

            const baseMatch = sessFp.base && viewFp.base && sessFp.base !== "fallback" && viewFp.base !== "fallback" && sessFp.base === viewFp.base;
            const localMatch = sessFp.local && viewFp.local && sessFp.local === viewFp.local;
            const fpMatch = baseMatch || localMatch;

            // Relaxed authorization to prevent false positives:
            // 1. Private sessions (registered users) can view their results on any device.
            // 2. If fingerprinting is blocked, missing, or unknown in DB/client, we bypass locking.
            const isPrivateSession = session.type === "PRIVATE";
            const isFingerprintMissing = !sessFp.base || !viewFp.base || sessFp.base === "unknown" || viewFp.base === "unknown";

            const isAuthorized = isPrivateSession || ipExactMatch || ipSubnetMatch || fpMatch || isFingerprintMissing;

            if (!isAuthorized) {
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
