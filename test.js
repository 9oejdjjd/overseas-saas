const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sc = await prisma.serviceConfig.findFirst();
  const pp = await prisma.pricingPackage.findMany();
  console.log("ServiceConfig:", sc);
  console.log("PricingPackages:", pp);
}

run().finally(() => prisma.$disconnect());
