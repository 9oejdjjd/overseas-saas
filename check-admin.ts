
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "admin@example.com" },
    });
    console.log("Admin user found:", user ? "YES" : "NO");
    if (user) console.log("Role:", user.role);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
