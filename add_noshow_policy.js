
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Adding No Show Policy...");

    const policy = await prisma.cancellationPolicy.upsert({
        where: { id: 'no-show-default' }, // Using a fixed ID to avoid duplicates if rerun with uuid it would fail on unique constraints usually, but ID is UUID. We'll search by name/category first or just create.
        update: {},
        create: {
            name: "غرامة فوات الرحلة (No Show)",
            category: "NO_SHOW",
            hoursTrigger: 0,
            condition: "تطبق عند عدم حضور المسافر للرحلة",
            feeAmount: 20000, // Default fine amount (adjust as needed)
            isActive: true
        }
    });

    // Since upsert needs a unique where input, and ID is uuid, let's try findFirst.
}

async function run() {
    const existing = await prisma.cancellationPolicy.findFirst({
        where: { category: "NO_SHOW" }
    });

    if (existing) {
        console.log("No Show Policy already exists:", existing.name);
    } else {
        await prisma.cancellationPolicy.create({
            data: {
                name: "غرامة فوات الرحلة (No Show)",
                category: "NO_SHOW",
                hoursTrigger: 0,
                condition: "تطبق عند عدم حضور المسافر للرحلة",
                feeAmount: 20000,
                isActive: true
            }
        });
        console.log("Created No Show Policy successfully.");
    }
}

run()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
