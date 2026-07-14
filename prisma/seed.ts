import { PrismaClient, ExamLocation } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding pricing packages...');

    const packages = [
        // Full Packages (Platform + Exam + Transportation)
        {
            name: 'باقة تعز الكاملة',
            location: ExamLocation.TAIZ,
            price: 150000, // سعر مثالي
            actualCost: 120000,
            active: true,
        },
        {
            name: 'باقة عدن الكاملة',
            location: ExamLocation.ADEN,
            price: 180000,
            actualCost: 145000,
            active: true,
        },
        {
            name: 'باقة حضرموت الكاملة',
            location: ExamLocation.HADRAMOUT,
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
            location: ExamLocation.TAIZ,
            price: 50000,
            actualCost: 40000,
            active: true,
        },
        {
            name: 'مواصلات عدن فقط',
            location: ExamLocation.ADEN,
            price: 80000,
            actualCost: 65000,
            active: true,
        },
        {
            name: 'مواصلات حضرموت فقط',
            location: ExamLocation.HADRAMOUT,
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

    console.log('Seeding default wallet accounts...');
    const wallets = [
        {
            name: 'محفظة الكريمي (أم فلوس)',
            nameEn: 'Kuraimi Wallet (M-Floos)',
            accountNumber: '12345678',
            accountName: 'مؤسسة الاعتماد المهني',
            isActive: true,
            icon: 'kuraimi',
            instructions: 'قم بتحويل الرسوم المطلوبة إلى رقم حساب الكريمي الموضح أعلاه. يرجى إدخال رقم العملية المكون من 7 إلى 8 أرقام بدقة لتأكيد الاشتراك وتفعيل الباقة تلقائياً فوراً.',
        },
        {
            name: 'محفظة ون كاش (One Cash)',
            nameEn: 'One Cash Wallet',
            accountNumber: '777263111',
            accountName: 'بوابة الاعتماد المهني',
            isActive: true,
            icon: 'onecash',
            instructions: 'قم بالتحويل إلى رقم محفظة ون كاش الموضح أعلاه. بمجرد التحويل، اكتب الرقم المرجعي للعملية في الحقل المخصص أدناه للتأكيد الآلي السريع.',
        },
        {
            name: 'محفظة جوال بي (Jawwal Pay)',
            nameEn: 'Jawwal Pay Wallet',
            accountNumber: '777263112',
            accountName: 'بوابة الاعتماد المهني',
            isActive: true,
            icon: 'jawwalpay',
            instructions: 'قم بالتحويل إلى رقم محفظة جوال بي الموضح أعلاه، ثم أدخل رقم العملية لتأكيد الحوالة والاشتراك في ثوانٍ.',
        }
    ];

    for (const wallet of wallets) {
        const existing = await prisma.walletAccount.findFirst({ where: { name: wallet.name } });
        if (existing) {
            await prisma.walletAccount.update({ where: { id: existing.id }, data: wallet });
        } else {
            await prisma.walletAccount.create({ data: wallet });
        }
    }
    console.log('✅ Wallet accounts seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
