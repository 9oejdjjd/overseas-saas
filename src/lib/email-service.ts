import imaps from "imap-simple";
import { simpleParser } from "mailparser";
import prisma from "@/lib/prisma";

// Configuration (Temporary Hardcoded for testing, move to .env later)
const CONFIG = {
    imap: {
        user: "alaa@overseas-travels.com",
        password: "1r^3f9Ko5",
        host: "overseas-travels.com",
        port: 993,
        tls: true,
        authTimeout: 3000,
    },
    sourceDomain: "pacc.sa", // no-reply@pacc.sa
};

export type EmailSyncResult = {
    processed: number;
    updated: number;
    errors: number;
    logs: string[];
};

export async function syncEmailsFromServer(): Promise<EmailSyncResult> {
    const result: EmailSyncResult = {
        processed: 0,
        updated: 0,
        errors: 0,
        logs: [],
    };

    let connection: any = null;

    try {
        result.logs.push("Connecting to IMAP server...");
        connection = await imaps.connect(CONFIG);
        result.logs.push("Connected successfully.");

        await connection.openBox("INBOX");

        // Search for unread emails (Temporary: from ANYONE for testing)
        const searchCriteria = ["UNSEEN"];
        // const searchCriteria = ["UNSEEN", ["FROM", CONFIG.sourceDomain]]; // Original Production Logic

        const fetchOptions = {
            bodies: ["HEADER", "TEXT"],
            markSeen: true, // Mark as read after processing
        };

        result.logs.push(`Searching for unread emails (Testing Mode: from ANY source)...`);
        const messages = await connection.search(searchCriteria, fetchOptions);
        result.logs.push(`Found ${messages.length} email(s).`);

        for (const message of messages) {
            result.processed++;

            try {
                const parts = imaps.getParts(message.attributes.struct);

                // Handle parts to find TEXT body
                let all = message.parts.filter((part: any) => part.which === "TEXT");

                // Sometimes body might be empty or struct is complex, simple handling:
                const id = message.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";

                // Safely access body part
                const bodyPart = all.length > 0 ? all[0].body : "";

                // Parse email
                const parsed = await simpleParser(idHeader + bodyPart);

                // Extract headers safely
                const headerPart = message.parts.find((part: any) => part.which === "HEADER");
                const subject = headerPart?.body?.subject?.[0] || "(No Subject)";
                const fromAddress = headerPart?.body?.from?.[0] || "(Unknown Sender)";

                const bodyText = parsed.text || parsed.html || "";  // Use HTML if text is empty

                result.logs.push(`Processing: "${subject}" from ${fromAddress}`);

                // 1. EXTRACT RECIPIENT (MAPPING)
                const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

                // Gather all emails found in Body AND Subject
                let candidateEmails: string[] = [];

                const bodyEmails = bodyText.match(emailRegex) || [];
                const subjectEmails = subject.match(emailRegex) || [];

                candidateEmails = [...new Set([...bodyEmails, ...subjectEmails])]; // Unique emails

                // Filter out system emails
                candidateEmails = candidateEmails.filter(e =>
                    !e.includes("overseas-travels.com") &&
                    !e.includes("pacc.sa") &&
                    !e.includes("google.com")
                );

                if (candidateEmails.length === 0) {
                    result.logs.push(`No potential applicant emails found in content.`);
                    continue;
                }

                result.logs.push(`Candidates: ${candidateEmails.join(", ")}`);

                // Find applicant in DB
                let applicant = null;
                for (const email of candidateEmails) {
                    applicant = await prisma.applicant.findFirst({
                        where: {
                            OR: [
                                { platformEmail: { contains: email, mode: 'insensitive' } },
                            ]
                        }
                    });
                    if (applicant) {
                        result.logs.push(`Matched Applicant: ${applicant.fullName} (${applicant.platformEmail})`);
                        break;
                    }
                }

                if (!applicant) {
                    result.logs.push(`No matching applicant found in DB.`);
                    continue;
                }

                // 2. DETERMINE STATUS
                let newStatus = "";
                const content = (subject + " " + bodyText).toLowerCase();

                if (content.includes("activate") || content.includes("تفعيل") || content.includes("welcome")) {
                    newStatus = "ACCOUNT_CREATED";
                } else if (content.includes("exam scheduled") || content.includes("موعد الاختبار") || content.includes("booking confirmed")) {
                    newStatus = "EXAM_SCHEDULED";
                } else if (content.includes("passed") || content.includes("اجتياز") || content.includes("congratulations") || content.includes("مبروك")) {
                    newStatus = "PASSED";
                } else if (content.includes("failed") || content.includes("لم تجتز") || content.includes("not passed") || content.includes("نعتذر")) {
                    newStatus = "FAILED";
                }

                if (newStatus && newStatus !== applicant.status) {
                    await prisma.applicant.update({
                        where: { id: applicant.id },
                        data: { status: newStatus as any }
                    });

                    await prisma.activityLog.create({
                        data: {
                            action: "AUTO_STATUS_UPDATE",
                            details: `Automated update via Email: Changed status to ${newStatus}. Source: ${subject}`,
                            applicantId: applicant.id,
                        }
                    });

                    result.updated++;
                    result.logs.push(`✅ UPDATED: ${applicant.fullName} -> ${newStatus}`);
                } else {
                    result.logs.push(`ℹ️ No status change (Current: ${applicant.status}, Detected: ${newStatus || 'None'})`);
                }

            } catch (err) {
                result.errors++;
                result.logs.push(`Error processing message: ${err}`);
            }
        }

    } catch (error) {
        result.errors++;
        result.logs.push(`Connection error: ${error}`);
    } finally {
        if (connection) {
            try {
                connection.end();
            } catch (e) { }
        }
    }

    return result;
}
