
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start deleting trips...');

    // Unlink tickets first to avoid foreign key constraint errors
    const ticketsUpdate = await prisma.ticket.updateMany({
        where: { tripId: { not: null } },
        data: { tripId: null }
    });
    console.log(`Unlinked ${ticketsUpdate.count} tickets.`);

    // Delete all stops first (though cascade might handle it, better be safe)
    const stops = await prisma.scheduledTripStop.deleteMany({});
    console.log(`Deleted ${stops.count} stops.`);

    // Delete all trips
    const result = await prisma.scheduledTrip.deleteMany({});
    console.log(`Deleted ${result.count} trips.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
