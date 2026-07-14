import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting data migration...");
    
    try {
        // Find all applicants that have a transportFromId
        const applicants = await prisma.applicant.findMany({
            where: {
                transportFromId: { not: null }
            }
        });
        
        console.log(`Found ${applicants.length} applicants with transportFromId.`);
        
        // Get all locations
        const locations = await prisma.location.findMany();
        
        // Get all transport destinations
        const destinations = await prisma.transportDestination.findMany();
        
        let updatedCount = 0;
        let nullifiedCount = 0;
        
        for (const app of applicants) {
            // Find the location name for this old transportFromId
            const loc = locations.find(l => l.id === app.transportFromId);
            if (loc) {
                // Find matching destination
                const dest = destinations.find(d => 
                    d.name === loc.name || 
                    (loc.nameEn && d.nameEn === loc.nameEn) || 
                    (loc.nameAr && d.nameAr === loc.nameAr)
                );
                
                if (dest) {
                    await prisma.applicant.update({
                        where: { id: app.id },
                        data: { transportFromId: dest.id }
                    });
                    updatedCount++;
                } else {
                    // No matching destination found, set to null to avoid constraint error
                    await prisma.applicant.update({
                        where: { id: app.id },
                        data: { transportFromId: null }
                    });
                    nullifiedCount++;
                }
            } else {
                // Location doesn't exist anymore, set to null
                await prisma.applicant.update({
                    where: { id: app.id },
                    data: { transportFromId: null }
                });
                nullifiedCount++;
            }
        }
        
        console.log(`Migration complete. Updated: ${updatedCount}, Nullified: ${nullifiedCount}`);
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
