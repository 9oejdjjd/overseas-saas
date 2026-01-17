
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const searchTerm = "ZZMOFT";
    console.log(`Searching for: ${searchTerm}`);

    const applicant = await prisma.applicant.findFirst({
        where: {
            OR: [
                { applicantCode: { contains: searchTerm, mode: 'insensitive' } },
                { fullName: { contains: searchTerm, mode: 'insensitive' } }
            ]
        }
    });

    if (applicant) {
        console.log("Found applicant:", applicant.id, applicant.fullName, applicant.applicantCode);
    } else {
        console.log("Applicant NOT found in DB.");
    }

    // List all applicants to be sure
    const all = await prisma.applicant.findMany({ select: { applicantCode: true, fullName: true } });
    console.log("Total applicants:", all.length);
    console.log("First 5 codes:", all.slice(0, 5).map(a => a.applicantCode).join(", "));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
