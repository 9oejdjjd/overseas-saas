import prisma from "../src/lib/prisma";

async function main() {
    const result = await prisma.profession.updateMany({
        where: { questionCount: 20 },
        data: { questionCount: 30 }
    });
    console.log(`✅ Updated ${result.count} professions from 20 to 30 questions.`);
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
