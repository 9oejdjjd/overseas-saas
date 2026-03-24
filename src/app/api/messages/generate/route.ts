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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { applicantId, trigger, ticketId, customVars = {} } = body;

        if (!applicantId || !trigger) {
            return NextResponse.json({ error: "Missing applicantId or trigger" }, { status: 400 });
        }

        // 1. Fetch Template
        const template = await prisma.messagingTemplate.findFirst({
            where: { trigger }
        });

        if (!template) {
            return NextResponse.json({ error: `لا يوجد قالب معرف للنوع: ${trigger}` }, { status: 404 });
        }

        let text = template.body;

        // 2. Fetch Applicant Data
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            include: {
                location: true,
                examCenter: true,
                transportFrom: true,
            }
        });

        if (!applicant) {
            return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
        }

        // 3. Fetch Ticket Data if requested
        let ticket = null;
        if (ticketId) {
            ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: { trip: true, returnTrip: true }
            });
        } else {
            // Fallback to active ticket if any
            ticket = await prisma.ticket.findFirst({
                where: { applicantId: applicantId, status: { in: ['ISSUED', 'ACTIVE'] } },
                include: { trip: true, returnTrip: true },
                orderBy: { createdAt: 'desc' }
            });
        }

        // --- Replacements ---

        // Basic Info
        text = text.replace(/{name}/g, applicant.fullName || "");
        text = text.replace(/{applicantCode}|{applicant_code}/g, applicant.applicantCode || "");
        text = text.replace(/{phone}/g, applicant.phone || "");
        text = text.replace(/{profession}/g, applicant.profession || "");
        text = text.replace(/{email}/g, applicant.platformEmail || "");
        text = text.replace(/{password}/g, applicant.platformPassword || "");

        // --- Exam Link Injection (search for active sessions or auto-create) ---
        if (text.includes("{examLink}") || text.includes("{mockLink}")) {
            let activeSession = await prisma.examSession.findFirst({
                where: { applicantId: applicantId, status: { in: ["NEW", "STARTED"] } },
                orderBy: { createdAt: "desc" }
            });

            // Auto-create session if none exists, based on applicant's profession
            if (!activeSession && applicant.profession) {
                try {
                    const profession = await prisma.profession.findFirst({
                        where: { name: applicant.profession, isActive: true }
                    });
                    if (profession) {
                        activeSession = await prisma.examSession.create({
                            data: {
                                type: "PRIVATE",
                                status: "NEW",
                                professionId: profession.id,
                                applicantId: applicantId,
                                passingScore: profession.passingScore,
                            }
                        });
                    }
                } catch (err) {
                    console.error("[Generate] Failed to auto-create exam session:", err);
                }
            }

            if (activeSession) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const fullUrl = `${baseUrl}/mock/session/${activeSession.token}`;
                text = text.replace(/{examLink}|{mockLink}/g, fullUrl);
            } else {
                text = text.replace(/{examLink}|{mockLink}/g, "رابط الاختبار غير متاح حالياً");
            }
        }


        // Location & Map (Safe from undefined)
        const cityName = applicant.location?.name || applicant.examLocation || "";
        const centerName = applicant.examCenter?.name || "";
        const address = applicant.examCenter?.address || applicant.location?.address || "";
        const mapUrl = applicant.examCenter?.locationUrl || applicant.location?.locationUrl || "";

        text = text.replace(/{location}|{city}|{examLocation}/g, cityName);
        text = text.replace(/{centerName}|{center_name}/g, centerName);
        text = text.replace(/{locationAddress}|{location_address}/g, address);
        text = text.replace(/{locationUrl}|{location_url}/g, mapUrl);

        // Dates & Times
        if (applicant.examDate) {
            text = text.replace(/{examDate}|{exam_date}/g, formatDate(applicant.examDate));
        } else {
            text = text.replace(/{examDate}|{exam_date}/g, "غير محدد");
        }

        if (applicant.examTime) {
            text = text.replace(/{examTime}|{exam_time}/g, formatArabicTime(applicant.examTime));
        } else {
            text = text.replace(/{examTime}|{exam_time}/g, "غير محدد");
        }

        // Ticket Replacements
        if (ticket) {
            text = text.replace(/{ticketNumber}|{ticket_number}/g, ticket.ticketNumber || "");
            text = text.replace(/{transportCompany}|{transport_company}/g, ticket.transportCompany || "");
            text = text.replace(/{departureLocation}|{departure_location}/g, ticket.departureLocation || "");
            text = text.replace(/{arrivalLocation}|{arrival_location}/g, ticket.arrivalLocation || "");
            text = text.replace(/{busNumber}|{bus_number}/g, ticket.trip?.busNumber || ticket.busNumber || "");
            text = text.replace(/{seatNumber}|{seat_number}/g, ticket.seatNumber || "");

            // For Cancel Ticket we need departure date usually linked to the old ticket
            const tDate = ticket.trip?.date || ticket.departureDate;
            text = text.replace(/{departureDate}|{travelDate}|{new_travel_date}/g, formatDate(tDate));

            if (ticket.trip?.departureTime) {
                text = text.replace(/{departureTime}/g, formatArabicTime(ticket.trip.departureTime));
            } else {
                text = text.replace(/{departureTime}/g, "غير محدد");
            }

            text = text.replace(/{destination}/g, ticket.arrivalLocation || "");
        }

        // Inject Custom Variables (like voucher codes from props)
        if (customVars) {
            for (const [key, value] of Object.entries(customVars)) {
                const regex = new RegExp(`{${key}}`, "g");
                text = text.replace(regex, value as string);
            }
        }

        // Clean up unreplaced curly braces just in case, but usually better left for debug
        // text = text.replace(/\{[a-zA-Z_]+\}/g, "غير متوفر");

        return NextResponse.json({
            templateName: template.name,
            message: text,
            phone: applicant.whatsappNumber || applicant.phone
        });

    } catch (error) {
        console.error("Error generating message:", error);
        return NextResponse.json({ error: "Failed to generate message" }, { status: 500 });
    }
}
