import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

// Helper: Smart Profession Lookup with Fallback
async function findActiveProfession(professionQuery: string | null | undefined) {
    if (professionQuery && professionQuery.trim()) {
        const trimmed = professionQuery.trim();
        // 1. Exact match
        let prof = await prisma.profession.findFirst({
            where: { name: trimmed, isActive: true }
        });
        if (prof) return prof;

        // 2. Insensitive / Contains match
        prof = await prisma.profession.findFirst({
            where: { name: { contains: trimmed, mode: 'insensitive' }, isActive: true }
        });
        if (prof) return prof;

        // 3. Slug match
        const slugified = trimmed.toLowerCase().replace(/\s+/g, '-');
        prof = await prisma.profession.findFirst({
            where: { slug: { contains: slugified }, isActive: true }
        });
        if (prof) return prof;

        // 4. Reverse contains match
        const allProfessions = await prisma.profession.findMany({ where: { isActive: true } });
        const matchedProf = allProfessions.find(p => trimmed.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(trimmed.toLowerCase()));
        if (matchedProf) return matchedProf;
    }

    // 5. Fallback: First active profession so session creation never fails
    const fallbackProf = await prisma.profession.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
    });
    return fallbackProf;
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
            const phoneVariants = [
                phone,
                phone.startsWith('+') ? phone.slice(1) : `+${phone}`,
                phone.replace(/^\+?967/, ''),
                phone.startsWith('0') ? phone.slice(1) : `0${phone}`
            ];
            const uniquePhones = [...new Set(phoneVariants)];

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
            
            if (applicantId) {
                activeSession = await prisma.examSession.findFirst({
                    where: { applicantId: applicantId, status: { in: ["NEW", "STARTED", "RESUMED"] } },
                    orderBy: { createdAt: "desc" }
                });
            } else if (mockPurchase) {
                activeSession = await prisma.examSession.findFirst({
                    where: { purchaseId: mockPurchase.id, status: { in: ["NEW", "STARTED", "RESUMED"] } },
                    orderBy: { createdAt: "desc" }
                });
            }

            // Auto-create session if none exists
            if (!activeSession) {
                try {
                    const profession = await findActiveProfession(applicantData.profession);
                    if (profession) {
                        // Fill profession name if applicant's profession text was empty
                        if (!applicantData.profession) {
                            applicantData.profession = profession.name;
                            text = text.replace(/{profession}/g, profession.name);
                        }

                        // Find active purchase to link and check credits
                        const reqPhoneNum = applicantData.phone || applicantData.whatsappNumber || "";
                        const phoneWithoutPlus = reqPhoneNum ? reqPhoneNum.replace(/^\+/, "") : "";
                        const uniquePhones = reqPhoneNum ? [reqPhoneNum, phoneWithoutPlus, reqPhoneNum.startsWith('+') ? reqPhoneNum.slice(1) : `+${reqPhoneNum}`] : [];

                        let activePurchase = await prisma.mockExamPurchase.findFirst({
                            where: {
                                OR: [
                                    ...(applicantId ? [{ applicantId: applicantId }] : []),
                                    ...(uniquePhones.length > 0 ? [{ phone: { in: uniquePhones } }] : [])
                                ],
                                status: { in: ["ACTIVE", "PAID"] },
                            },
                            orderBy: { createdAt: "desc" }
                        });

                        if (activePurchase) {
                            if (activePurchase.totalCredits !== -1 && activePurchase.usedCredits >= activePurchase.totalCredits) {
                                activePurchase = null;
                            }
                            if (activePurchase?.expiresAt && activePurchase.expiresAt < new Date()) {
                                activePurchase = null;
                            }
                        }

                        // Auto-assign free package if none active and trigger is exam link
                        if (!activePurchase && trigger === "ON_MOCK_EXAM_LINK") {
                            const freePackage = await prisma.mockExamPackage.findFirst({
                                where: { isFree: true, isActive: true },
                                orderBy: { sortOrder: "asc" }
                            });

                            if (freePackage) {
                                activePurchase = await prisma.mockExamPurchase.create({
                                    data: {
                                        phone: reqPhoneNum || "000000000",
                                        buyerName: applicantData.fullName,
                                        applicantId: applicantId || null,
                                        packageId: freePackage.id,
                                        totalCredits: freePackage.examCredits,
                                        amount: 0,
                                        isPaid: true,
                                        status: "ACTIVE",
                                        activatedAt: new Date(),
                                        expiresAt: freePackage.validityDays ? new Date(Date.now() + freePackage.validityDays * 24 * 60 * 60 * 1000) : null
                                    }
                                });
                            }
                        }

                        // Deduct a credit if applicable
                        if (activePurchase && activePurchase.totalCredits !== -1) {
                            await prisma.mockExamPurchase.update({
                                where: { id: activePurchase.id },
                                data: { usedCredits: { increment: 1 } }
                            });
                        }

                        const sessionData: any = {
                            type: applicantId ? "PRIVATE" : "PUBLIC",
                            status: "NEW",
                            professionId: profession.id,
                            passingScore: profession.passingScore,
                            attemptNumber: activePurchase ? (activePurchase.usedCredits + 1) : 1
                        };
                        
                        if (applicantId) {
                            sessionData.applicantId = applicantId;
                        }
                        if (activePurchase) {
                            sessionData.purchaseId = activePurchase.id;
                            sessionData.visitorPhone = activePurchase.phone;
                            sessionData.visitorName = activePurchase.buyerName;
                        } else {
                            sessionData.visitorPhone = applicantData.phone;
                            sessionData.visitorName = applicantData.fullName;
                        }

                        activeSession = await prisma.examSession.create({
                            data: sessionData
                        });
                    }
                } catch (err) {
                    console.error("[Generate] Failed to auto-create exam session:", err);
                }
            }

            if (activeSession) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
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
