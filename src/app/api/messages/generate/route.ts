import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getBaseUrl } from "@/lib/baseUrl";

// Helper for date formatting with Arabic Output
const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    return format(new Date(date), "eeee yyyy/MM/dd", { locale: ar });
};

// Helper for Time Formatting to AM/PM Arabic Style
const formatArabicTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "";
    let [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "م" : "ص";
    h = h % 12 || 12; // Convert 0 to 12
    return `${h}:${minutes} ${ampm}`;
};

// Helper: Robust Phone Variants Generator
const getPhoneVariants = (phone: string | null | undefined) => {
    if (!phone) return [];
    const clean = phone.replace(/\D/g, "");
    const variants = [phone, clean];
    if (phone.startsWith("+")) {
        variants.push(phone.slice(1));
    } else {
        variants.push(`+${phone}`);
    }
    const local = clean.replace(/^967/, "");
    if (local !== clean) {
        variants.push(local);
        variants.push(`0${local}`);
    } else {
        variants.push(`967${clean}`);
        variants.push(`+967${clean}`);
    }
    return [...new Set(variants)];
};

// Helper: Normalize Arabic spelling variants for robust matching
const normalizeArabicText = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
        .trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .toLowerCase();
};

// Helper: Smart Profession Lookup (with robust normalization and token matching)
async function findActiveProfession(professionQuery: string | null | undefined) {
    if (professionQuery && professionQuery.trim()) {
        const queryNormalized = normalizeArabicText(professionQuery);

        // Fetch all active professions to do smart normalized matching in memory
        let allProfessions = await prisma.profession.findMany({ where: { isActive: true } });

        const performMatch = (profList: typeof allProfessions) => {
            // 1. Exact normalized match (trimming both sides)
            let matched = profList.find(p => normalizeArabicText(p.name.trim()) === queryNormalized);
            if (matched) return matched;

            // 2. Normalized contains match
            matched = profList.find(p => {
                const pNorm = normalizeArabicText(p.name.trim());
                return pNorm.includes(queryNormalized) || queryNormalized.includes(pNorm);
            });
            if (matched) return matched;

            // 3. Normalized tokens overlap match
            const queryTokens = queryNormalized.split(/\s+/).filter(t => t.length > 2);
            if (queryTokens.length > 0) {
                matched = profList.find(p => {
                    const pNorm = normalizeArabicText(p.name.trim());
                    const matchingTokens = queryTokens.filter(t => pNorm.includes(t));
                    return matchingTokens.length >= Math.min(2, queryTokens.length);
                });
                if (matched) return matched;
            }

            // 4. Slug match
            const slugified = professionQuery.trim().toLowerCase().replace(/\s+/g, '-');
            const matchedSlug = profList.find(p => p.slug && p.slug.toLowerCase().includes(slugified));
            if (matchedSlug) return matchedSlug;

            // 5. Collapsed (no‑space) match
            const collapsedQuery = queryNormalized.replace(/\s+/g, '');
            const matchedCollapsed = profList.find(p => {
              const pNorm = normalizeArabicText(p.name).replace(/\s+/g, '');
              return pNorm.includes(collapsedQuery) || collapsedQuery.includes(pNorm);
            });
            if (matchedCollapsed) return matchedCollapsed;

            return null;
        };

        let resultMatch = performMatch(allProfessions);
        if (resultMatch) return resultMatch;

        // Fallback: If no match found in active professions, search ALL professions (including inactive ones like "محاسب")
        const allProfsFallback = await prisma.profession.findMany({});
        resultMatch = performMatch(allProfsFallback);
        if (resultMatch) return resultMatch;
    }

    // No fallback - return null to prevent creating sessions for wrong profession
    return null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { applicantId, phone, trigger, ticketId, purchaseId, customVars = {} } = body;

        if ((!applicantId && !phone && !purchaseId) || !trigger) {
            return NextResponse.json({ error: "Missing applicantId/phone/purchaseId or trigger" }, { status: 400 });
        }

        // 1. Fetch Template
        const template = await prisma.messagingTemplate.findFirst({
            where: { trigger }
        });

        if (!template) {
            return NextResponse.json({ error: `لا يوجد قالب معرف للنوع: ${trigger}` }, { status: 404 });
        }

        let text = template.body;

        // 2. Fetch Applicant or Visitor Data
        let applicantData: any = null;
        let mockPurchase: any = null;

        if (applicantId) {
            applicantData = await prisma.applicant.findUnique({
                where: { id: applicantId },
                include: {
                    location: true,
                    examCenter: true,
                    transportFrom: true,
                }
            });
            if (!applicantData) {
                // Check if it's an AgentClient
                const agentClient = await prisma.agentClient.findUnique({
                    where: { id: applicantId },
                    include: {
                        agent: { select: { companyName: true } }
                    }
                });

                if (agentClient) {
                    applicantData = {
                        id: agentClient.id,
                        fullName: agentClient.fullName,
                        phone: agentClient.phone,
                        whatsappNumber: agentClient.whatsappNumber || agentClient.phone,
                        profession: agentClient.profession || null,
                        isAgentClient: true,
                        agentName: agentClient.agent?.companyName || "وكيل معتمد"
                    };
                }
            }
            if (!applicantData) {
                return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
            }
        } else if (purchaseId) {
            // Find Visitor directly by Purchase ID
            mockPurchase = await prisma.mockExamPurchase.findUnique({
                where: { id: purchaseId },
                include: { package: true }
            });
            if (!mockPurchase) {
                return NextResponse.json({ error: "الزائر غير موجود" }, { status: 404 });
            }
            applicantData = {
                id: null, // signifies visitor
                fullName: mockPurchase.buyerName || "زائر",
                phone: mockPurchase.phone,
                whatsappNumber: mockPurchase.phone,
                profession: mockPurchase.profession || null,
            };
        } else if (phone) {
            // Visitor Case with robust phone variants matching
            const uniquePhones = getPhoneVariants(phone);

            mockPurchase = await prisma.mockExamPurchase.findFirst({
                where: {
                    OR: [
                        { phone: { in: uniquePhones } },
                        { phone: { endsWith: phone.replace(/^\+?967/, '') } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                include: { package: true }
            });
            if (!mockPurchase) {
                return NextResponse.json({ error: "الزائر غير موجود" }, { status: 404 });
            }
            applicantData = {
                id: null, // signifies visitor
                fullName: mockPurchase.buyerName || "زائر",
                phone: mockPurchase.phone,
                whatsappNumber: mockPurchase.phone,
                profession: mockPurchase.profession || null,
            };
        }

        // 3. Fetch Ticket Data if requested
        let ticket = null;
        if (ticketId && applicantId) {
            ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: { trip: true, returnTrip: true }
            });
        } else if (applicantId) {
            // Fallback to active ticket if any
            ticket = await prisma.ticket.findFirst({
                where: { applicantId: applicantId, status: { in: ['ISSUED', 'ACTIVE'] } },
                include: { trip: true, returnTrip: true },
                orderBy: { createdAt: 'desc' }
            });
        }

        // --- Replacements ---

        // Basic Info
        text = text.replace(/{name}/g, applicantData.fullName || "");
        text = text.replace(/{applicantCode}|{applicant_code}/g, applicantData.applicantCode || "");
        text = text.replace(/{phone}/g, applicantData.phone || "");
        text = text.replace(/{profession}/g, (applicantData.profession || "").trim());
        text = text.replace(/{email}/g, applicantData.platformEmail || "");
        text = text.replace(/{password}/g, applicantData.platformPassword || "");

        // --- Exam Link Injection (search for active sessions or auto-create) ---
        if (text.includes("{examLink}") || text.includes("{mockLink}")) {
            let activeSession = null;
            
            if (applicantId && applicantData && !applicantData.isAgentClient) {
                activeSession = await prisma.examSession.findFirst({
                    where: { applicantId: applicantId, status: { in: ["NEW", "STARTED", "RESUMED"] } },
                    orderBy: { createdAt: "desc" }
                });
            } else if (applicantId && applicantData && applicantData.isAgentClient) {
                const orders = await prisma.agentExamOrder.findMany({
                    where: { clientId: applicantId, sessionId: { not: null } },
                    select: { sessionId: true }
                });
                const sessionIds = orders.map(o => o.sessionId as string).filter(Boolean);
                
                if (sessionIds.length > 0) {
                    activeSession = await prisma.examSession.findFirst({
                        where: { id: { in: sessionIds }, status: { in: ["NEW", "STARTED", "RESUMED"] } },
                        orderBy: { createdAt: "desc" }
                    });
                }
            } else if (mockPurchase) {
                activeSession = await prisma.examSession.findFirst({
                    where: { purchaseId: mockPurchase.id, status: { in: ["NEW", "STARTED", "RESUMED"] } },
                    orderBy: { createdAt: "desc" }
                });
            }

            // Auto-create session if none exists
            if (!activeSession && applicantData && !applicantData.isAgentClient) {
                try {
                    // Try applicant's profession first
                    let profession = await findActiveProfession(applicantData.profession);

                    // For registered applicants: if profession not found, check their MockExamPurchase profession
                    if (!profession && applicantId) {
                        const reqPhone = applicantData.phone || applicantData.whatsappNumber || "";
                        const phoneVariants = getPhoneVariants(reqPhone);
                        const purchaseWithProfession = await prisma.mockExamPurchase.findFirst({
                            where: {
                                OR: [
                                    { applicantId: applicantId },
                                    ...(phoneVariants.length > 0 ? [{ phone: { in: phoneVariants } }] : [])
                                ],
                                profession: { not: null }
                            },
                            orderBy: { updatedAt: 'desc' }
                        });
                        if (purchaseWithProfession?.profession) {
                            profession = await findActiveProfession(purchaseWithProfession.profession);
                            if (profession) {
                                applicantData.profession = profession.name;
                                text = text.replace(/{profession}/g, profession.name);
                            }
                        }
                    }

                    if (profession) {
                        // Fill profession name if applicant's profession text was empty
                        if (!applicantData.profession) {
                            applicantData.profession = profession.name;
                            text = text.replace(/{profession}/g, profession.name);
                        }

                        // Find active purchases to link and check credits if available
                        const reqPhoneNum = applicantData.phone || applicantData.whatsappNumber || "";
                        const uniquePhones = getPhoneVariants(reqPhoneNum);

                        const purchases = await prisma.mockExamPurchase.findMany({
                            where: {
                                OR: [
                                    ...(applicantId ? [{ applicantId: applicantId }] : []),
                                    ...(uniquePhones.length > 0 ? [{ phone: { in: uniquePhones } }] : [])
                                ],
                                status: { in: ["ACTIVE", "PAID"] },
                            },
                            orderBy: { createdAt: "desc" }
                        });

                        const activePurchase = purchases.find(p => {
                            const isExpired = p.expiresAt && p.expiresAt < new Date();
                            const hasAvailableCredits = p.totalCredits === -1 || p.usedCredits < p.totalCredits;
                            return !isExpired && hasAvailableCredits;
                        });

                        if (activePurchase) {
                            // Deduct a credit if applicable
                            if (activePurchase.totalCredits !== -1) {
                                await prisma.mockExamPurchase.update({
                                    where: { id: activePurchase.id },
                                    data: { usedCredits: { increment: 1 } }
                                });
                            }

                            const prevSessionsCount = await prisma.examSession.count({
                                where: {
                                    professionId: profession.id,
                                    OR: [
                                        ...(applicantId ? [{ applicantId }] : []),
                                        { visitorPhone: activePurchase.phone },
                                        { visitorPhone: activePurchase.phone.replace(/^\+/, "") }
                                    ]
                                }
                            });

                            activeSession = await prisma.examSession.create({
                                data: {
                                    type: applicantId ? "PRIVATE" : "PUBLIC",
                                    status: "NEW",
                                    professionId: profession.id,
                                    passingScore: profession.passingScore,
                                    attemptNumber: prevSessionsCount + 1,
                                    applicantId: applicantId || null,
                                    purchaseId: activePurchase.id,
                                    visitorPhone: activePurchase.phone,
                                    visitorName: activePurchase.buyerName
                                }
                            });
                        } else if (applicantId) {
                            // Registered applicant in system without a separate MockExamPurchase record
                            const prevSessionsCount = await prisma.examSession.count({
                                where: {
                                    professionId: profession.id,
                                    applicantId: applicantId
                                }
                            });

                            activeSession = await prisma.examSession.create({
                                data: {
                                    type: "PRIVATE",
                                    status: "NEW",
                                    professionId: profession.id,
                                    passingScore: profession.passingScore,
                                    attemptNumber: prevSessionsCount + 1,
                                    applicantId: applicantId,
                                    visitorPhone: applicantData.phone || applicantData.whatsappNumber || null,
                                    visitorName: applicantData.fullName || null
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error("[Generate] Failed to auto-create exam session:", err);
                }
            }

            if (activeSession) {
                const baseUrl = getBaseUrl(request);
                const fullUrl = `${baseUrl}/session/${activeSession.token}`;
                text = text.replace(/{examLink}|{mockLink}/g, fullUrl);
            } else {
                text = text.replace(/{examLink}|{mockLink}/g, "رابط الاختبار غير متاح حالياً");
            }
        }

        // Clean up empty profession references if any
        text = text.replace(/لمهن[ةه]\s*،/g, "للاختبار التجريبي،");
        text = text.replace(/لمهن[ةه]\s*ق/g, "للاختبار التجريبي ق");

        // Location & Map (Safe from undefined)
        const cityName = applicantData.location?.name || applicantData.examLocation || "";
        const centerName = applicantData.examCenter?.name || "";
        const address = applicantData.examCenter?.address || applicantData.location?.address || "";
        const mapUrl = applicantData.examCenter?.locationUrl || applicantData.location?.locationUrl || "";

        text = text.replace(/{location}|{city}|{examLocation}/g, cityName);
        text = text.replace(/{centerName}|{center_name}/g, centerName);
        text = text.replace(/{locationAddress}|{location_address}/g, address);
        text = text.replace(/{locationUrl}|{location_url}/g, mapUrl);

        // Dates & Times
        if (applicantData.examDate) {
            text = text.replace(/{examDate}|{exam_date}/g, formatDate(applicantData.examDate));
        } else {
            text = text.replace(/{examDate}|{exam_date}/g, "سيتم تحديده لاحقاً");
        }

        if (applicantData.examTime) {
            text = text.replace(/{examTime}|{exam_time}/g, formatArabicTime(applicantData.examTime));
        } else {
            text = text.replace(/{examTime}|{exam_time}/g, "سيتم تحديده لاحقاً");
        }

        // Ticket Replacements
        if (ticket) {
            text = text.replace(/{ticketNumber}|{ticket_number}/g, ticket.ticketNumber || "");
            text = text.replace(/{transportCompany}/g, ticket.transportCompany || "");
            text = text.replace(/{departureLocation}/g, ticket.departureLocation || "");
            text = text.replace(/{arrivalLocation}/g, ticket.arrivalLocation || "");
            text = text.replace(/{departureDate}/g, formatDate(ticket.departureDate));
            text = text.replace(/{departureTime}/g, ticket.trip?.departureTime ? formatArabicTime(ticket.trip.departureTime) : "");
            text = text.replace(/{busNumber}/g, ticket.busNumber || "");
            text = text.replace(/{seatNumber}/g, ticket.seatNumber || "");
        } else {
            text = text.replace(/{ticketNumber}|{ticket_number}/g, "");
            text = text.replace(/{transportCompany}/g, "");
            text = text.replace(/{departureLocation}/g, "");
            text = text.replace(/{arrivalLocation}/g, "");
            text = text.replace(/{departureDate}/g, "");
            text = text.replace(/{departureTime}/g, "");
            text = text.replace(/{busNumber}/g, "");
            text = text.replace(/{seatNumber}/g, "");
        }

        // Custom Variables Replacement (Overrides)
        if (customVars && typeof customVars === "object") {
            Object.keys(customVars).forEach((key) => {
                const val = customVars[key];
                if (val !== undefined && val !== null) {
                    const reg = new RegExp(`{${key}}`, "g");
                    text = text.replace(reg, String(val));
                }
            });
        }

        return NextResponse.json({
            message: text,
            phone: applicantData.whatsappNumber || applicantData.phone
        });

    } catch (error) {
        console.error("Error generating message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
