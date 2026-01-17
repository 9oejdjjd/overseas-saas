import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("⚠️  Starting partial database reset...");
    console.log("   Preserving: Users, Locations, Routes, Settings...");
    console.log("   Deleting: Applicants, Tickets, Transactions, Logs...");

    // 1. Delete Child Tables first (to satisfy Foreign Keys)

    // Delete Activity Logs
    const activities = await prisma.activityLog.deleteMany({});
    console.log(`✅ Deleted ${activities.count} Activity Logs`);

    // Delete Message Logs
    const messages = await prisma.messageLog.deleteMany({});
    console.log(`✅ Deleted ${messages.count} Message Logs`);

    // Delete Vouchers
    const vouchers = await prisma.voucher.deleteMany({});
    console.log(`✅ Deleted ${vouchers.count} Vouchers`);

    // Delete Transactions
    const transactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${transactions.count} Transactions`);

    // Delete Tickets
    const tickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${tickets.count} Tickets`);

    // Delete Documents
    const documents = await prisma.document.deleteMany({});
    console.log(`✅ Deleted ${documents.count} Documents`);

    // 2. Delete Main Table
    // Delete Applicants
    const applicants = await prisma.applicant.deleteMany({});
    console.log(`✅ Deleted ${applicants.count} Applicants`);

    console.log("🎉 Database cleanup completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
