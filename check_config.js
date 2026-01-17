const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const config = await prisma.serviceConfig.findMany();
    console.log("Current Config:", config);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
