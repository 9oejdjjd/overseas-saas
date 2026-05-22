import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// ========================================
// SUSPICION SCORING ENGINE
// ========================================

interface SuspicionResult {
    score: number;
    level: "CLEAN" | "WATCH" | "SUSPICIOUS" | "CRITICAL";
    reasons: string[];
}

function calculateSuspicion(group: {
    allNames: Set<string>;
    allPhones: Set<string>;
    allIps: Set<string>;
    allFingerprints: Set<string>;
    totalAttempts: number;
    isBanned: boolean;
    sessions: any[];
    type?: string;
}): SuspicionResult {
    // If the candidate is PRIVATE (officially registered), completely bypass all suspicion checking rules
    if (group.type === "PRIVATE") {
        return { score: 0, level: "CLEAN", reasons: [] };
    }

    let score = 0;
    const reasons: string[] = [];

    // --- Rule 1: Same Fingerprint + Multiple Names (40 pts) ---
    // This means the SAME device was used with different identities → definite fraud
    if (group.allFingerprints.size >= 1 && group.allNames.size > 1) {
        score += 40;
        reasons.push(`نفس الجهاز استخدم ${group.allNames.size} أسماء مختلفة`);
    }

    // --- Rule 2: Same Fingerprint + Multiple Phones (40 pts) ---
    if (group.allFingerprints.size >= 1 && group.allPhones.size > 1) {
        score += 40;
        reasons.push(`نفس الجهاز استخدم ${group.allPhones.size} أرقام مختلفة`);
    }

    // --- Rule 3: Same IP + Multiple Different Phones (30 pts for 3+) ---
    if (group.allIps.size >= 1 && group.allPhones.size >= 3) {
        score += 30;
        reasons.push(`${group.allPhones.size} أرقام مختلفة من نفس عنوان الشبكة`);
    } else if (group.allIps.size >= 1 && group.allPhones.size === 2) {
        score += 15;
        reasons.push(`رقمان مختلفان من نفس عنوان الشبكة`);
    }

    // --- Rule 4: Same Phone + Multiple Names (20 pts) ---
    if (group.allPhones.size === 1 && group.allNames.size > 1) {
        score += 20;
        reasons.push(`نفس الرقم استخدم ${group.allNames.size} أسماء مختلفة`);
    }

    // --- Rule 5: Excessive Attempts (10 pts per attempt beyond 3) ---
    if (group.totalAttempts > 3) {
        const extraAttempts = group.totalAttempts - 3;
        score += Math.min(extraAttempts * 10, 30);
        reasons.push(`تجاوز الحد المجاني بـ ${extraAttempts} محاولات إضافية (${group.totalAttempts} إجمالي)`);
    }

    // --- Rule 6: Previously Banned (50 pts) ---
    if (group.isBanned) {
        score += 50;
        reasons.push(`محظور سابقاً من قبل الإدارة`);
    }

    // Determine level
    let level: SuspicionResult["level"] = "CLEAN";
    if (score >= 60) level = "CRITICAL";
    else if (score >= 30) level = "SUSPICIOUS";
    else if (score >= 10) level = "WATCH";

    return { score, level, reasons };
}

// Helper: Extract base fingerprint (browserId only)
function extractBaseFingerprint(fp: string | null): string | null {
    if (!fp) return null;
    return fp.includes("-") ? fp.split("-")[0] : fp;
}

async function autoResolveExpiredSessions() {
    const now = new Date();
    try {
        // Query all active sessions to see if any have timed out
        const inProgressSessions = await prisma.examSession.findMany({
            where: {
                status: { in: ["NEW", "STARTED", "RESUMED"] }
            },
            include: {
                profession: {
                    select: {
                        examDuration: true
                    }
                },
                questions: {
                    select: {
                        selectedOptionId: true
                    }
                }
            }
        });

        const updates = inProgressSessions.map(async (sess: any) => {
            const duration = sess.profession?.examDuration || 60;
            const refTime = sess.startedAt || sess.createdAt;
            
            // Expiry threshold: start or creation time + duration + 5 minutes grace buffer
            const expiryTime = new Date(new Date(refTime).getTime() + duration * 60 * 1000 + 5 * 60 * 1000);
            
            if (now > expiryTime) {
                // Count how many questions were answered in this session
                const answeredCount = sess.questions.filter((q: any) => q.selectedOptionId !== null).length;
                
                // If they answered >=1 question, transition to TIMEOUT ("لم يكمل الاختبار")
                // Otherwise, transition to EXPIRED ("لم يدخل الاختبار")
                const newStatus = answeredCount > 0 ? "TIMEOUT" : "EXPIRED";
                
                return prisma.examSession.update({
                    where: { id: sess.id },
                    data: { status: newStatus }
                });
            }
            return null;
        });

        await Promise.all(updates.filter(Boolean));
    } catch (err) {
        console.error("Error running autoResolveExpiredSessions:", err);
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Run self-healing auto-resolution on-the-fly
        await autoResolveExpiredSessions();

        const url = new URL(request.url);
        const professionId = url.searchParams.get("professionId");
        const type = url.searchParams.get("type");
        const statusFilter = url.searchParams.get("status");
        const search = url.searchParams.get("search");
        const suspicionFilter = url.searchParams.get("suspicion"); // "ALL" | "WATCH" | "SUSPICIOUS" | "CRITICAL"

        const where: any = {};
        if (professionId) where.professionId = professionId;
        if (type) where.type = type;
        if (statusFilter) where.status = statusFilter;
        if (search) {
            where.OR = [
                { visitorName: { contains: search, mode: "insensitive" } },
                { visitorPhone: { contains: search } },
                { applicant: { fullName: { contains: search, mode: "insensitive" } } },
                { applicant: { whatsappNumber: { contains: search } } },
                { ipAddress: { contains: search } }
            ];
        }

        const sessionsList = await prisma.examSession.findMany({
            where,
            include: {
                profession: { select: { name: true, id: true, maxAttempts: true } },
                applicant: { select: { fullName: true, whatsappNumber: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 1000
        });

        // ========================================
        // INTELLIGENT GROUPING (Fingerprint-first)
        // ========================================
        // Step 1: Group by base fingerprint first (most reliable device identifier)
        // Step 2: Sub-group ungrouped sessions by phone number
        // Step 3: Apply suspicion scoring to each group

        const groupedMap = new Map<string, any>();

        sessionsList.forEach((sess: any) => {
            const baseFp = extractBaseFingerprint(sess.deviceFingerprint);
            
            // Priority: Fingerprint > ApplicantId > Phone > Token
            let groupKey: string;
            if (baseFp && baseFp !== "fallback" && baseFp !== "unknown") {
                groupKey = `fp:${baseFp}`;
            } else if (sess.applicantId) {
                groupKey = `app:${sess.applicantId}`;
            } else if (sess.visitorPhone) {
                groupKey = `ph:${sess.visitorPhone}`;
            } else {
                groupKey = `tok:${sess.token}`;
            }

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    id: groupKey,
                    displayName: sess.applicant?.fullName || sess.visitorName || "غير معروف",
                    displayPhone: sess.applicant?.whatsappNumber || sess.visitorPhone || "لا يوجد",
                    type: sess.type,
                    profession: sess.profession,
                    allNames: new Set<string>(),
                    allPhones: new Set<string>(),
                    allIps: new Set<string>(),
                    allFingerprints: new Set<string>(),
                    allProfessions: new Set<string>(),
                    sessions: [],
                    bestScore: 0,
                    lastScore: 0,
                    hasSetLastScore: false,
                    isPassed: false,
                    totalAttempts: 0,
                    isBanned: false,
                    status: sess.status,
                    createdAt: sess.createdAt
                });
            }

            const group = groupedMap.get(groupKey);

            // Collect identity data
            const name = sess.applicant?.fullName || sess.visitorName;
            if (name) group.allNames.add(name);

            const phone = sess.applicant?.whatsappNumber || sess.visitorPhone;
            if (phone) group.allPhones.add(phone);

            if (sess.ipAddress && sess.ipAddress !== "unknown") group.allIps.add(sess.ipAddress);
            
            if (baseFp && baseFp !== "fallback" && baseFp !== "unknown") {
                group.allFingerprints.add(baseFp);
            }

            if (sess.profession?.name) group.allProfessions.add(sess.profession.name);

            group.sessions.push(sess);
            group.totalAttempts += 1;

            if (sess.isBanned) group.isBanned = true;

            if (sess.status === "SUBMITTED" && sess.score !== null) {
                const scoreNum = Number(sess.score);
                if (scoreNum > group.bestScore) group.bestScore = scoreNum;
                if (!group.hasSetLastScore) {
                    group.lastScore = scoreNum;
                    group.hasSetLastScore = true;
                }
                if (scoreNum >= sess.passingScore) {
                    group.isPassed = true;
                }
            }

            // Keep status of the latest session
            if (group.sessions.length === 1) {
                group.status = sess.status;
            }
        });

        // Apply suspicion scoring and serialize
        const finalGroupedList = Array.from(groupedMap.values()).map(g => {
            const suspicion = calculateSuspicion(g);

            return {
                id: g.id,
                displayName: g.displayName,
                displayPhone: g.displayPhone,
                type: g.type,
                profession: g.profession,
                allNames: Array.from(g.allNames),
                allPhones: Array.from(g.allPhones),
                allIps: Array.from(g.allIps),
                allFingerprints: Array.from(g.allFingerprints),
                allProfessions: Array.from(g.allProfessions),
                sessions: g.sessions,
                bestScore: g.bestScore,
                lastScore: g.lastScore,
                isPassed: g.isPassed,
                totalAttempts: g.totalAttempts,
                isBanned: g.isBanned,
                status: g.status,
                createdAt: g.createdAt,
                // Suspicion data
                suspicionScore: suspicion.score,
                suspicionLevel: suspicion.level,
                suspicionReasons: suspicion.reasons,
                isSuspicious: suspicion.level !== "CLEAN" // backward compat
            };
        });

        // Apply suspicion filter if provided
        let filtered = finalGroupedList;
        if (suspicionFilter && suspicionFilter !== "ALL") {
            if (suspicionFilter === "ANY") {
                filtered = finalGroupedList.filter(g => g.suspicionLevel !== "CLEAN");
            } else {
                filtered = finalGroupedList.filter(g => g.suspicionLevel === suspicionFilter);
            }
        }

        return NextResponse.json(filtered);
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

            // Normalize phone for consistent matching
            const normalizedPhone = visitorPhone.replace(/[\s\-\(\)]/g, "");

            // Count ALL consumed attempts (SUBMITTED, EXPIRED, TIMEOUT)
            const prevAttempts = await prisma.examSession.count({
                where: { 
                    OR: [
                        { visitorPhone: normalizedPhone },
                        { visitorPhone: normalizedPhone.replace(/^\+/, "") },
                        { visitorPhone: visitorPhone }
                    ],
                    status: { in: ["SUBMITTED", "EXPIRED", "TIMEOUT"] } 
                }
            });

            const newSession = await prisma.examSession.create({
                data: {
                    type: "PUBLIC",
                    professionId,
                    visitorName: body.visitorName || "محاولة إضافية",
                    visitorPhone: normalizedPhone,
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

// Ban/Update session — enhanced to ban all related identities
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { sessionId, status } = body;

        if (!sessionId || !status) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (status === "EXPIRED" || status === "BANNED") {
            // Get the session to find related identities
            const targetSession = await prisma.examSession.findUnique({
                where: { id: sessionId }
            });

            if (!targetSession) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            // Build conditions to find ALL related sessions
            const relatedConditions: any[] = [];
            if (targetSession.visitorPhone) {
                relatedConditions.push({ visitorPhone: targetSession.visitorPhone });
                const phoneWithoutPlus = targetSession.visitorPhone.replace(/^\+/, "");
                relatedConditions.push({ visitorPhone: phoneWithoutPlus });
            }
            if (targetSession.deviceFingerprint) {
                const baseFp = extractBaseFingerprint(targetSession.deviceFingerprint);
                if (baseFp) {
                    relatedConditions.push({ deviceFingerprint: { startsWith: baseFp } });
                }
            }

            // Ban ALL related sessions (same phone or same fingerprint)
            if (relatedConditions.length > 0) {
                await prisma.examSession.updateMany({
                    where: { OR: relatedConditions },
                    data: { isBanned: true }
                });
            }

            // Also ban the specific session
            const updated = await prisma.examSession.update({
                where: { id: sessionId },
                data: { status: "EXPIRED", isBanned: true }
            });

            return NextResponse.json(updated);
        }

        // Regular status update
        const allowedTransitions: Record<string, string[]> = {
            "NEW": ["EXPIRED"],
            "STARTED": ["EXPIRED", "TIMEOUT"],
            "RESUMED": ["EXPIRED", "TIMEOUT"],
        };

        const targetSession = await prisma.examSession.findUnique({ where: { id: sessionId } });
        if (!targetSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const allowed = allowedTransitions[targetSession.status] || [];
        if (!allowed.includes(status)) {
            return NextResponse.json({ 
                error: `لا يمكن تغيير الحالة من ${targetSession.status} إلى ${status}` 
            }, { status: 400 });
        }

        const updated = await prisma.examSession.update({
            where: { id: sessionId },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH Session Error:", error);
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}
