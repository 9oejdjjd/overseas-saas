
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- LOCATIONS ---");
    const locations = await prisma.location.findMany();
    console.table(locations.map(l => ({ id: l.id, name: l.name, code: l.code })));

    console.log("\n--- TRANSPORT ROUTES ---");
    const routes = await prisma.transportRoute.findMany({
        include: {
            from: true,
            to: true
        }
    });

    routes.forEach(r => {
        console.log(`Route: ${r.from.name} -> ${r.to.name}`);
        console.log(`  Prices: OneWay=${r.oneWayPrice}, RoundTrip=${r.roundTripPrice}`);
        console.log(`  IDs: ${r.fromId} -> ${r.toId}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
