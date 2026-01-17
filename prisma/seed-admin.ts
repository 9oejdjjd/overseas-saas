
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash("admin123", 10);

    const user = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            name: "System Admin",
            password: adminPassword,
            role: "ADMIN",
        },
    });

    console.log("Admin user created:", user.email);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
