import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, simulateHumanTyping, sleepRandom, parseSpintax, onWhatsApp } from "@/lib/openwa";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getBaseUrl } from "@/lib/baseUrl";

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

// Helper: Smart Profession Lookup
async function findActiveProfession(professionQuery: string | null | undefined) {
    if (professionQuery && professionQuery.trim()) {
        const queryNormalized = normalizeArabicText(professionQuery);

        const allProfessions = await prisma.profession.findMany({ where: { isActive: true } });

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

            return null;
        };

        let resultMatch = performMatch(allProfessions);
        if (resultMatch) return resultMatch;

        // Fallback: If no match found in active professions, search ALL professions (including inactive ones)
        const allProfsFallback = await prisma.profession.findMany({});
        resultMatch = performMatch(allProfsFallback);
        if (resultMatch) return resultMatch;
    }
    return null;
}

/**
 * Server-side auto-send: generates a message from a template and sends it via Evolution API.
 * Designed to be called from any API route or server action as fire-and-forget.
 * 
 * @param applicantId - The applicant's ID
 * @param trigger - Template trigger key (e.g. "ON_PASS")
 * @param options - Optional overrides
 */
export async function autoSendMessage(
    applicantId: string,
    trigger: string,
    options?: {
        ticketId?: string;
        customVars?: Record<string, string>;
        followUpTriggers?: string[];
    }
) {
    try {
        // 1. Fetch template
        const template = await prisma.messagingTemplate.findFirst({ where: { trigger } });
        if (!template) {
            console.warn(`[AutoSend] No template found for trigger: ${trigger}`);
            return { success: false, error: "Template not found" };
        }

        // 2. Fetch applicant
        const applicant = await prisma.applicant.findUnique({
            where: { id: applicantId },
            include: { location: true, examCenter: true, transportFrom: true }
        });
        if (!applicant) {
            console.warn(`[AutoSend] Applicant not found: ${applicantId}`);
            return { success: false, error: "Applicant not found" };
        }

        const phone = applicant.whatsappNumber || applicant.phone;
        if (!phone) {
            console.warn(`[AutoSend] No phone for applicant: ${applicantId}`);
            return { success: false, error: "No phone number" };
        }

        // 3. Ensure the number is registered on WhatsApp before sending
        const isOnWhatsApp = await onWhatsApp(phone);
        if (!isOnWhatsApp) {
            console.warn(`[AutoSend] Phone not on WhatsApp: ${phone}`);
            return { success: false, error: "Number not on WhatsApp" };
        }

        // 4. Build message text from body or a random variant
        let text = template.body;
        if (template.variants && Array.isArray(template.variants) && template.variants.length > 0) {
            const allOptions = [template.body, ...template.variants];
            text = allOptions[Math.floor(Math.random() * allOptions.length)] as string;
        }
        text = await replaceVariables(text, applicant, options?.ticketId, options?.customVars);
        text = parseSpintax(text);

        // Simulate human interaction before actual send
        await simulateHumanTyping(phone, text.length);

        // 4. Send via Evolution API
        const sendResult = await sendWhatsAppMessage(phone, text);
        const status = sendResult.success ? "SENT" : "PENDING"; // Saving failed as PENDING for retry

        // 5. Log to MessageLog
        await prisma.messageLog.create({
            data: {
                applicantId,
                templateId: template.id,
                trigger,
                channel: "WHATSAPP",
                message: text,
                status,
                sentAt: sendResult.success ? new Date() : undefined,
            }
        });

        // 6. Log to ActivityLog
        if (sendResult.success) {
            await prisma.activityLog.create({
                data: {
                    action: "AUTO_MESSAGE_SENT",
                    details: `إرسال تلقائي: ${template.name} (${trigger})`,
                    applicantId,
                }
            });
        }

        console.log(`[AutoSend] ${trigger} → ${phone}: ${status}`);

        // 7. Follow-up chain (e.g. ON_PASS → ON_FEEDBACK)
        if (sendResult.success && options?.followUpTriggers?.length) {
            for (const followUp of options.followUpTriggers) {
                // Random delay (15-30 seconds) to avoid patterns and overwhelming the API
                await sleepRandom(15, 30);
                await autoSendMessage(applicantId, followUp, {
                    customVars: options?.customVars
                });
            }
        }

        // 8. Built-in chain: ON_CERTIFICATE → auto-generate voucher + send ON_REFERRAL_VOUCHER
        if (sendResult.success && trigger === "ON_CERTIFICATE") {
            try {
                const voucherCode = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
                const metadata = {
                    realType: "REFERRAL",
                    category: "PERSONAL",
                    discount: 100,
                    code: voucherCode,
                    amount: 0,
                    balance: 0,
                };
                await prisma.voucher.create({
                    data: {
                        applicantId,
                        type: "EXAM_RETAKE",
                        notes: `قسيمة تسويقية للناجح [META:${JSON.stringify(metadata)}]`,
                    }
                });
                // Random delay to simulate human typing gap between messages
                await sleepRandom(15, 30);
                await autoSendMessage(applicantId, "ON_REFERRAL_VOUCHER", {
                    customVars: { voucherCode }
                });
            } catch (chainErr) {
                console.error("[AutoSend] ON_CERTIFICATE → ON_REFERRAL_VOUCHER chain error:", chainErr);
            }
        }

        return { success: sendResult.success, status };
    } catch (error) {
        console.error(`[AutoSend] Error for ${trigger}:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Send a message directly to a phone number (for non-registered visitors like mock exam takers).
 */
export async function autoSendDirectMessage(
    phone: string,
    trigger: string,
    vars: Record<string, string>
) {
    try {
        const template = await prisma.messagingTemplate.findFirst({ where: { trigger } });
        if (!template) {
            console.warn(`[AutoSendDirect] No template found for trigger: ${trigger}`);
            return { success: false };
        }

        // Ensure number is registered on WhatsApp
        const isOnWhatsApp = await onWhatsApp(phone);
        if (!isOnWhatsApp) {
            console.warn(`[AutoSendDirect] Phone not on WhatsApp: ${phone}`);
            return { success: false };
        }

        let text = template.body;
        if (template.variants && Array.isArray(template.variants) && template.variants.length > 0) {
            const allOptions = [template.body, ...template.variants];
            text = allOptions[Math.floor(Math.random() * allOptions.length)] as string;
        }
        // Robust replacement for all variables
        for (const [key, value] of Object.entries(vars)) {
            // Replace {key} regardless of case or using different naming conventions
            const placeholder = `{${key}}`;
            text = text.split(placeholder).join(value || "");
            
            // Also handle lowercase/underscore variants just in case
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (snakeKey !== key) {
                text = text.split(`{${snakeKey}}`).join(value || "");
            }
        }

        text = parseSpintax(text);

        // Simulate human interaction before actual send
        await simulateHumanTyping(phone, text.length);

        const sendResult = await sendWhatsAppMessage(phone, text);
        const status = sendResult.success ? "SENT" : "PENDING";
        
        console.log(`[AutoSendDirect] ${trigger} → ${phone}: ${status}`);

        let applicant = await prisma.applicant.findFirst({
            where: { OR: [{ whatsappNumber: phone }, { phone: phone }] }
        });

        if (applicant) {
            await prisma.messageLog.create({
                data: {
                    applicantId: applicant.id,
                    templateId: template.id,
                    trigger,
                    channel: "WHATSAPP",
                    message: text,
                    status,
                    sentAt: sendResult.success ? new Date() : undefined,
                }
            });
        }

        return { success: sendResult.success };
    } catch (error) {
        console.error(`[AutoSendDirect] Error:`, error);
        return { success: false };
    }
}

// ------ Helper: Replace all known variables ------

const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    return format(new Date(date), "eeee yyyy/MM/dd", { locale: ar });
};

const formatArabicTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "";
    let [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "م" : "ص";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
};

async function replaceVariables(
    text: string,
    applicant: any,
    ticketId?: string,
    customVars?: Record<string, string>
): Promise<string> {
    // Basic Info
    text = text.replace(/{name}/g, applicant.fullName || "");
    text = text.replace(/{applicantCode}|{applicant_code}/g, applicant.applicantCode || "");
    text = text.replace(/{phone}/g, applicant.phone || "");
    text = text.replace(/{profession}/g, applicant.profession || "");
    text = text.replace(/{email}/g, applicant.platformEmail || "");
    text = text.replace(/{password}/g, applicant.platformPassword || "");

    // Location
    // Prioritize the dedicated examLocation/examCenter over the original registration branch location
    const cityName = applicant.examLocation || applicant.location?.name || "";
    const centerName = applicant.examCenter?.name || "";
    const address = applicant.examCenter?.address || applicant.location?.address || "";
    const mapUrl = applicant.examCenter?.locationUrl || applicant.location?.locationUrl || "";

    text = text.replace(/{location}|{city}|{examLocation}/g, cityName);
    text = text.replace(/{centerName}|{center_name}/g, centerName);
    text = text.replace(/{locationAddress}|{location_address}/g, address);
    text = text.replace(/{locationUrl}|{location_url}/g, mapUrl);

    // Dates
    text = text.replace(/{examDate}|{exam_date}/g, applicant.examDate ? formatDate(applicant.examDate) : "غير محدد");
    text = text.replace(/{examTime}|{exam_time}/g, applicant.examTime ? formatArabicTime(applicant.examTime) : "غير محدد");

    // Exam Link
    if (text.includes("{examLink}") || text.includes("{mockLink}")) {
        // First, try to find an existing session (any usable status)
        let activeSession = await prisma.examSession.findFirst({
            where: { applicantId: applicant.id, status: { in: ["NEW", "STARTED"] } },
            orderBy: { createdAt: "desc" }
        });

        // If no active session, try to auto-create one based on applicant's profession
        if (!activeSession && applicant.profession) {
            try {
                const profession = await findActiveProfession(applicant.profession);
                if (profession) {
                    activeSession = await prisma.examSession.create({
                        data: {
                            type: "PRIVATE",
                            status: "NEW",
                            professionId: profession.id,
                            applicantId: applicant.id,
                            passingScore: profession.passingScore,
                        }
                    });
                    console.log(`[AutoSend] Auto-created exam session for ${applicant.fullName} (${profession.name})`);
                }
            } catch (err) {
                console.error("[AutoSend] Failed to auto-create exam session:", err);
            }
        }

        if (activeSession) {
            const baseUrl = getBaseUrl();
            text = text.replace(/{examLink}|{mockLink}/g, `${baseUrl}/session/${activeSession.token}`);
        } else {
            text = text.replace(/{examLink}|{mockLink}/g, "رابط الاختبار غير متاح حالياً");
        }
    }

    // Ticket
    if (ticketId || text.includes("{ticketNumber}")) {
        let ticket: any = null;
        if (ticketId) {
            ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { trip: true } });
        } else {
            ticket = await prisma.ticket.findFirst({
                where: { applicantId: applicant.id, status: { in: ['ISSUED', 'ACTIVE'] } },
                include: { trip: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (ticket) {
            text = text.replace(/{ticketNumber}|{ticket_number}/g, ticket.ticketNumber || "");
            text = text.replace(/{transportCompany}|{transport_company}/g, ticket.transportCompany || "");
            text = text.replace(/{departureLocation}|{departure_location}/g, ticket.departureLocation || "");
            text = text.replace(/{arrivalLocation}|{arrival_location}/g, ticket.arrivalLocation || "");
            text = text.replace(/{busNumber}|{bus_number}/g, ticket.trip?.busNumber || ticket.busNumber || "");
            text = text.replace(/{seatNumber}|{seat_number}/g, ticket.seatNumber || "");
            const tDate = ticket.trip?.date || ticket.departureDate;
            text = text.replace(/{departureDate}|{travelDate}|{new_travel_date}/g, formatDate(tDate));
            text = text.replace(/{departureTime}/g, ticket.trip?.departureTime ? formatArabicTime(ticket.trip.departureTime) : "غير محدد");
            text = text.replace(/{destination}/g, ticket.arrivalLocation || "");
        }
    }

    // Custom Variables & Result URL
    if (customVars) {
        for (const [key, value] of Object.entries(customVars)) {
            text = text.split(`{${key}}`).join(value || "");
            
            // Handle common variants
            if (key === "resultPageUrl") {
                text = text.split("{result_page_url}").join(value || "");
                text = text.split("{resultUrl}").join(value || "");
            }
        }
    }

    return text;
}

/**
 * Send a notification message when a mock exam package is activated/paid.
 */
export async function sendMockPackageActivationMessage(purchaseId: string) {
    try {
        // 1. Fetch the purchase details
        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId },
            include: { package: true }
        });

        if (!purchase || !purchase.isPaid) {
            console.warn(`[AutoSendMockPackage] Purchase not found or not paid yet: ${purchaseId}`);
            return { success: false, error: "Purchase not found or not active" };
        }

        // 2. Resolve base URL and profession slug to build direct link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
        
        let mockLink = baseUrl;
        if (purchase.profession) {
            const profession = await findActiveProfession(purchase.profession);
            if (profession) {
                mockLink = `${baseUrl}/${profession.slug}`;
            }
        }

        // 3. Format variables
        const formattedExpiryDate = purchase.expiresAt 
            ? format(new Date(purchase.expiresAt), "eeee yyyy/MM/dd", { locale: ar })
            : "غير محدد";

        const vars: Record<string, string> = {
            name: purchase.buyerName || "عزيزي المشترك",
            phone: purchase.phone,
            profession: purchase.profession || "غير محدد",
            packageName: purchase.package?.name || "باقة فردية",
            examCredits: String(purchase.totalCredits),
            amount: String(purchase.amount),
            currency: purchase.currency === "SAR" ? "ر.س" : "ر.ي",
            expiryDate: formattedExpiryDate,
            mockLink
        };

        // 4. Send the message using autoSendDirectMessage
        const result = await autoSendDirectMessage(purchase.phone, "ON_MOCK_PACKAGE_ACTIVATED", vars);
        return result;
    } catch (error) {
        console.error(`[AutoSendMockPackage] Error sending message for purchase ${purchaseId}:`, error);
        return { success: false, error: String(error) };
    }
}

