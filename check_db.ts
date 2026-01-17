
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Checking Locations ---");
        const locations = await prisma.location.findMany();
        locations.forEach(l => console.log(`Location: '${l.name}' (ID: ${l.id})`));

        console.log("\n--- Checking Transport Routes ---");
        const routes = await prisma.transportRoute.findMany({
            include: { from: true, to: true },
            where: { isActive: true }
        });

        if (routes.length === 0) {
            console.log("No active routes found!");
        } else {
            routes.forEach(r => {
                console.log(`Route: '${r.from.name}' -> '${r.to.name}' | Price: ${r.oneWayPrice}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
