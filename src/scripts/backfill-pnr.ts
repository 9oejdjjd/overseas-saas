
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to generate a random 6-character code (A-Z, 0-9)
function generatePNR() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function main() {
    console.log("Starting PNR Backfill...");

    // 1. Get all applicants with no code
    const applicants = await prisma.applicant.findMany({
        where: { applicantCode: null },
    });

    console.log(`Found ${applicants.length} applicants without PNR.`);

    for (const app of applicants) {
        let uniqueCode = generatePNR();
        let isUnique = false;

        // Ensure uniqueness (simple check, collisions unlikely for small datasets but good practice)
        while (!isUnique) {
            const existing = await prisma.applicant.findUnique({
                where: { applicantCode: uniqueCode },
            });
            if (!existing) {
                isUnique = true;
            } else {
                uniqueCode = generatePNR();
            }
        }

        await prisma.applicant.update({
            where: { id: app.id },
            data: { applicantCode: uniqueCode },
        });

        console.log(`Updated ${app.email || app.fullName}: ${uniqueCode}`);
    }

    console.log("Backfill complete! 🚀");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
