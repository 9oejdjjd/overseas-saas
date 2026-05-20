const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log("Connected to DB via Prisma");

        // Alter Question.axis to Text
        await prisma.$executeRawUnsafe(`ALTER TABLE "Question" ALTER COLUMN "axis" TYPE TEXT USING "axis"::text;`);
        console.log("Successfully altered axis column to TEXT.");

        // Drop default value if it exists
        await prisma.$executeRawUnsafe(`ALTER TABLE "Question" ALTER COLUMN "axis" DROP DEFAULT;`);
        console.log("Dropped default value from axis.");

    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
