require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const policies = await prisma.cancellationPolicy.findMany();
    console.log("Found " + policies.length + " policies:");
    console.log(JSON.stringify(policies, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
