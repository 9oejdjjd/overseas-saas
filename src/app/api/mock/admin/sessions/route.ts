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
    allEmails: Set<string>;
    allIps: Set<string>;
    allFingerprints: Set<string>;
    totalAttempts: number;
    maxAttempts?: number;
    isBanned: boolean;
    type?: string;
    hasPurchase?: boolean;
    customerType?: string;
}, defaultFreeCredits: number = 2): SuspicionResult {
    // Exempt both registered applicants (PRIVATE), paying mock customers, and agent clients from suspicion scoring
    if (group.type === "PRIVATE" || group.hasPurchase || group.customerType === "AGENT_CLIENT") {
        return { score: 0, level: "CLEAN", reasons: [] };
    }

    let score = 0;
    const reasons: string[] = [];

    // --- Rule 1: Same Email + Multiple Phones (40 pts) ---
    if (group.allEmails.size >= 1 && group.allPhones.size > 1) {
        score += 40;
        reasons.push(`نفس الإيميل استخدم ${group.allPhones.size} أرقام هواتف مختلفة`);
    }

    // --- Rule 2: Same Email + Multiple Names (30 pts) ---
    if (group.allEmails.size >= 1 && group.allNames.size > 1) {
        score += 30;
        reasons.push(`نفس الإيميل استخدم ${group.allNames.size} أسماء مختلفة`);
    }

    // --- Rule 3: Same Fingerprint + Multiple Names (40 pts) ---
    // This means the SAME device was used with different identities → definite fraud
    if (group.allFingerprints.size >= 1 && group.allNames.size > 1) {
        score += 40;
        reasons.push(`نفس الجهاز استخدم ${group.allNames.size} أسماء مختلفة`);
    }

    // --- Rule 4: Same Fingerprint + Multiple Phones (40 pts) ---
    if (group.allFingerprints.size >= 1 && group.allPhones.size > 1) {
        score += 40;
        reasons.push(`نفس الجهاز استخدم ${group.allPhones.size} أرقام مختلفة`);
    }

    // --- Rule 5: Same IP + Multiple Different Phones (30 pts for 3+) ---
    if (group.allIps.size >= 1 && group.allPhones.size >= 3) {
        score += 30;
        reasons.push(`${group.allPhones.size} أرقام مختلفة من نفس عنوان الشبكة`);
    } else if (group.allIps.size >= 1 && group.allPhones.size === 2) {
        score += 15;
        reasons.push(`رقمان مختلفان من نفس عنوان الشبكة`);
    }

    // --- Rule 6: Same Phone + Multiple Names (20 pts) ---
    if (group.allPhones.size === 1 && group.allNames.size > 1) {
        score += 20;
        reasons.push(`نفس الرقم استخدم ${group.allNames.size} أسماء مختلفة`);
    }

    // --- Rule 7: Excessive Attempts (dynamic based on free package credits) ---
    const allowedLimit = group.maxAttempts || defaultFreeCredits;
    if (group.totalAttempts > allowedLimit) {
        const extraAttempts = group.totalAttempts - allowedLimit;
        score += Math.min(extraAttempts * 10, 30);
        reasons.push(`تجاوز الحد المسموح بـ ${extraAttempts} محاولات إضافية (${group.totalAttempts} إجمالي)`);
    }

    // --- Rule 8: Previously Banned (50 pts) ---
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

        // Fetch default free package credits for dynamic fallback
        const freePkg = await prisma.mockExamPackage.findFirst({
            where: { isFree: true, isActive: true },
            select: { examCredits: true }
        });
        const defaultFreeCredits = freePkg?.examCredits ?? 2;

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

        // Exclude agent client sessions that have NOT been started yet (status is NEW)
        where.NOT = [
            {
                agentOrderId: { not: null },
                status: "NEW"
            }
        ];

        const sessionsList = await prisma.examSession.findMany({
            where,
            include: {
                profession: { select: { name: true, id: true, maxAttempts: true } },
                applicant: { select: { fullName: true, whatsappNumber: true } },
                purchase: { include: { package: true } },
                agentOrder: {
                    include: {
                        agent: { select: { companyName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 1000
        });

        // Fetch mock purchases for all session applicants/phones to resolve maxAttempts
        const applicantIds = sessionsList.map((s: any) => s.applicantId).filter(Boolean);
        const phones = sessionsList.map((s: any) => s.visitorPhone || s.applicant?.whatsappNumber).filter(Boolean);
        const uniquePhones = [...new Set(phones)];
        const cleanPhones = uniquePhones.map(p => p.replace(/\D/g, ""));
        const allPhoneVariants = [...new Set([...uniquePhones, ...cleanPhones.map(p => `+${p}`), ...cleanPhones])];

        const mockPurchases = (applicantIds.length > 0 || allPhoneVariants.length > 0) ? await prisma.mockExamPurchase.findMany({
            where: {
                OR: [
                    { applicantId: { in: applicantIds } },
                    { phone: { in: allPhoneVariants } }
                ]
            },
            include: { package: true },
            orderBy: { createdAt: 'desc' }
        }) : [];

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

            // Find matched purchases for this session's phone or applicantId
            const sPhone = sess.visitorPhone || sess.applicant?.whatsappNumber;
            const userPurchases = mockPurchases.filter((p: any) =>
                (sess.applicantId && p.applicantId === sess.applicantId) ||
                (sPhone && (p.phone === sPhone || p.phone.replace(/\D/g, "") === sPhone.replace(/\D/g, "")))
            );

            // Exclude free package purchases if there is at least one purchased/paid package
            const nonFreePurchases = userPurchases.filter((p: any) => p.package ? !p.package.isFree : Number(p.amount) > 0);
            const purchasesToUse = nonFreePurchases.length > 0 ? nonFreePurchases : userPurchases;

            // Sort purchases to prioritize active and paid ones
            purchasesToUse.sort((x: any, y: any) => {
                const xFree = (x.package?.isFree || Number(x.amount || 0) === 0) ? 1 : 0;
                const yFree = (y.package?.isFree || Number(y.amount || 0) === 0) ? 1 : 0;
                if (xFree !== yFree) return xFree - yFree;

                const xPaid = x.isPaid ? 1 : 0;
                const yPaid = y.isPaid ? 1 : 0;
                if (xPaid !== yPaid) return yPaid - xPaid;

                return new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime();
            });

            const matchedPurchase = purchasesToUse[0] || sess.purchase || null;
            const resolvedMaxAttempts = matchedPurchase?.totalCredits ?? defaultFreeCredits;
            const resolvedHasPurchase = !!matchedPurchase;
            const resolvedCustomerType = sess.agentOrderId 
                ? "AGENT_CLIENT" 
                : (sess.type === "PRIVATE" ? "APPLICANT" : (matchedPurchase ? "CUSTOMER" : "VISITOR"));

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    id: groupKey,
                    displayName: sess.applicant?.fullName || sess.visitorName || "غير معروف",
                    displayPhone: sess.applicant?.whatsappNumber || sess.visitorPhone || "لا يوجد",
                    type: sess.type,
                    profession: sess.profession,
                    allNames: new Set<string>(),
                    allPhones: new Set<string>(),
                    allEmails: new Set<string>(),
                    allIps: new Set<string>(),
                    allFingerprints: new Set<string>(),
                    allProfessions: new Set<string>(),
                    sessions: [],
                    bestScore: 0,
                    lastScore: 0,
                    hasSetLastScore: false,
                    isPassed: false,
                    totalAttempts: 0,
                    maxAttempts: resolvedMaxAttempts,
                    isBanned: false,
                    status: sess.status,
                    createdAt: sess.createdAt,
                    hasPurchase: resolvedHasPurchase,
                    customerType: resolvedCustomerType,
                    agentName: sess.agentOrder?.agent?.companyName || null
                });
            }

            const group = groupedMap.get(groupKey);

            if (resolvedMaxAttempts > group.maxAttempts) {
                group.maxAttempts = resolvedMaxAttempts;
            }
            if (resolvedHasPurchase) {
                group.hasPurchase = true;
                if (group.type !== "PRIVATE" && group.customerType !== "AGENT_CLIENT") group.customerType = "CUSTOMER";
            }
            if (resolvedCustomerType === "AGENT_CLIENT") {
                group.customerType = "AGENT_CLIENT";
                group.agentName = sess.agentOrder?.agent?.companyName || null;
            }

            // Collect identity data
            const name = sess.applicant?.fullName || sess.visitorName;
            if (name) group.allNames.add(name);

            const phone = sess.applicant?.whatsappNumber || sess.visitorPhone;
            if (phone) group.allPhones.add(phone);

            const email = sess.applicant?.platformEmail || sess.visitorEmail;
            if (email) group.allEmails.add(email);

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
            const suspicion = calculateSuspicion(g, defaultFreeCredits);

            return {
                id: g.id,
                displayName: g.displayName,
                displayPhone: g.displayPhone,
                type: g.type,
                customerType: g.customerType,
                agentName: g.agentName,
                hasPurchase: g.hasPurchase,
                profession: g.profession,
                allNames: Array.from(g.allNames),
                allPhones: Array.from(g.allPhones),
                allEmails: Array.from(g.allEmails),
                allIps: Array.from(g.allIps),
                allFingerprints: Array.from(g.allFingerprints),
                allProfessions: Array.from(g.allProfessions),
                sessions: g.sessions,
                bestScore: g.bestScore,
                lastScore: g.lastScore,
                isPassed: g.isPassed,
                totalAttempts: g.totalAttempts,
                maxAttempts: g.maxAttempts,
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

            // Count ALL previous attempts for this visitor phone and profession
            const prevAttempts = await prisma.examSession.count({
                where: { 
                    professionId,
                    OR: [
                        { visitorPhone: normalizedPhone },
                        { visitorPhone: normalizedPhone.replace(/^\+/, "") },
                        { visitorPhone: visitorPhone }
                    ]
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
            where: { professionId, applicantId }
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
