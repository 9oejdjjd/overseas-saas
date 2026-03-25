import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching admin users...");
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" }
    });

    if (admins.length === 0) {
        console.log("No ADMIN users found in the database!");
        return;
    }

    const admin = admins[0];
    console.log(`Found Admin: ${admin.email}`);

    const newPassword = "admin";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
    });

    console.log(`✅ Password for ${admin.email} has been reset successfully to: ${newPassword}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
