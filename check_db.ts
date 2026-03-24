
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Checking Locations ---");
        const locations = await prisma.location.findMany();
        locations.forEach(l => console.log(`Location: '${l.name}' (ID: ${l.id})`));

        console.log("\n--- Checking Transport Routes (Defaults) ---");
        const routes = await prisma.transportRouteDefault.findMany({
            include: { fromDestination: true, toDestination: true },
        });

        if (routes.length === 0) {
            console.log("No active routes found!");
        } else {
            routes.forEach(r => {
                console.log(`Route: '${r.fromDestination.name}' -> '${r.toDestination.name}' | Price: ${r.price}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
