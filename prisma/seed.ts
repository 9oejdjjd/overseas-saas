import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding pricing packages...');

    const packages = [
        // Full Packages (Platform + Exam + Transportation)
        {
            name: 'باقة تعز الكاملة',
            location: 'TAIZ',
            price: 150000, // سعر مثالي
            actualCost: 120000,
            active: true,
        },
        {
            name: 'باقة عدن الكاملة',
            location: 'ADEN',
            price: 180000,
            actualCost: 145000,
            active: true,
        },
        {
            name: 'باقة حضرموت الكاملة',
            location: 'HADRAMOUT',
            price: 200000,
            actualCost: 165000,
            active: true,
        },
        // Exam Only Package
        {
            name: 'التسجيل والاختبار فقط',
            location: null,
            price: 100000,
            actualCost: 80000,
            active: true,
        },
        // Transportation Only Packages
        {
            name: 'مواصلات تعز فقط',
            location: 'TAIZ',
            price: 50000,
            actualCost: 40000,
            active: true,
        },
        {
            name: 'مواصلات عدن فقط',
            location: 'ADEN',
            price: 80000,
            actualCost: 65000,
            active: true,
        },
        {
            name: 'مواصلات حضرموت فقط',
            location: 'HADRAMOUT',
            price: 100000,
            actualCost: 85000,
            active: true,
        },
    ];

    for (const pkg of packages) {
        await prisma.pricingPackage.upsert({
            where: { name: pkg.name },
            update: pkg,
            create: pkg,
        });
    }

    console.log('✅ Pricing packages seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
