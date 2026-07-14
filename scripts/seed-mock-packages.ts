import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up existing MockExamPackages...");
    const deleted = await prisma.mockExamPackage.deleteMany({});
    console.log(`Deleted ${deleted.count} old mock exam packages.`);

    console.log("Creating 9 mock exam packages...");

    const packages = [
        // 1. Mock exam packages only (باقات اختبارات تجريبية فقط)
        {
            name: "الباقة التجريبية البرونزية",
            nameEn: "Bronze Mock Exam Package",
            description: "باقة أساسية تحتوي على 3 محاولات للاختبارات التجريبية لقياس المستوى والاستعداد الأولي.",
            badge: "خيار اقتصادي",
            color: "from-amber-600 to-amber-700",
            icon: "Award",
            examCredits: 3,
            includesRegistration: false,
            includesTransport: false,
            price: 1500,
            priceSAR: 15,
            examPrice: 1500,
            validityDays: 30,
            isFeatured: false,
            isActive: true,
            sortOrder: 1,
            features: JSON.stringify([
                "3 محاولات اختبار كاملة",
                "أسئلة تحاكي الاختبار الفعلي",
                "تقرير تفصيلي بمستوى الأداء",
                "صلاحية لمدة 30 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "الباقة التجريبية الفضية",
            nameEn: "Silver Mock Exam Package",
            description: "باقة متكاملة تحتوي على 7 محاولات للاستعداد المكثف وتطوير نقاط الضعف.",
            badge: "الأكثر مبيعاً",
            color: "from-slate-400 to-slate-500",
            icon: "Award",
            examCredits: 7,
            includesRegistration: false,
            includesTransport: false,
            price: 3000,
            priceSAR: 30,
            examPrice: 3000,
            validityDays: 60,
            isFeatured: true,
            isActive: true,
            sortOrder: 2,
            features: JSON.stringify([
                "7 محاولات اختبار كاملة",
                "مراجعة الإجابات الصحيحة والخاطئة",
                "دعم كامل لجميع أنواع الأسئلة",
                "صلاحية لمدة 60 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "الباقة التجريبية الذهبية",
            nameEn: "Gold Mock Exam Package",
            description: "الباقة التجريبية القصوى مع 15 محاولة اختبار وتدريبات شاملة لكل المحتوى لضمان النجاح.",
            badge: "خيار المحترفين",
            color: "from-yellow-500 to-yellow-600",
            icon: "Award",
            examCredits: 15,
            includesRegistration: false,
            includesTransport: false,
            price: 5000,
            priceSAR: 50,
            examPrice: 5000,
            validityDays: 90,
            isFeatured: false,
            isActive: true,
            sortOrder: 3,
            features: JSON.stringify([
                "15 محاولة اختبار كاملة",
                "مراجعة الإجابات والحلول التفصيلية",
                "تحليل أداء متقدم ومقارن",
                "صلاحية لمدة 90 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },

        // 2. Mock exam packages + Registration (باقات تجريبية + التسجيل)
        {
            name: "باقة التسجيل الفضية",
            nameEn: "Silver Registration Package",
            description: "تشمل 5 محاولات اختبار تجريبي + حجز موعد والتسجيل الرسمي في اختبار الاعتماد المهني.",
            badge: "توفير رائع",
            color: "from-blue-500 to-blue-600",
            icon: "FileText",
            examCredits: 5,
            includesRegistration: true,
            includesTransport: false,
            price: 12000,
            priceSAR: 120,
            examPrice: 2000,
            validityDays: 90,
            isFeatured: false,
            isActive: true,
            sortOrder: 4,
            features: JSON.stringify([
                "5 محاولات اختبار تجريبي",
                "التسجيل وحجز الموعد الرسمي بالكامل",
                "تغطية رسوم المعاملة الإدارية للتسجيل",
                "صلاحية دائرية لمدة 90 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "باقة التسجيل الذهبية",
            nameEn: "Gold Registration Package",
            description: "الباقة المثالية تشمل 10 محاولات اختبار تجريبي كاملة بالإضافة إلى خدمة حجز موعد والتسجيل الرسمي للاعتماد.",
            badge: "شامل التسجيل والتحضير",
            color: "from-indigo-600 to-indigo-700",
            icon: "FileText",
            examCredits: 10,
            includesRegistration: true,
            includesTransport: false,
            price: 15000,
            priceSAR: 150,
            examPrice: 4000,
            validityDays: 120,
            isFeatured: true,
            isActive: true,
            sortOrder: 5,
            features: JSON.stringify([
                "10 محاولات اختبار تجريبي",
                "التسجيل وحجز الموعد الرسمي بالكامل",
                "أولوية في حجز المواعيد المفضلة",
                "صلاحية دائرية لمدة 120 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "باقة التسجيل البلاتينية",
            nameEn: "Platinum Registration Package",
            description: "الباقة الشاملة مع 20 محاولة اختبار تجريبي وخدمة التسجيل الرسمي وحجز الموعد الفوري للاعتماد المهني.",
            badge: "موصى به للمؤسسات",
            color: "from-purple-600 to-purple-700",
            icon: "FileText",
            examCredits: 20,
            includesRegistration: true,
            includesTransport: false,
            price: 20000,
            priceSAR: 200,
            examPrice: 7000,
            validityDays: 180,
            isFeatured: false,
            isActive: true,
            sortOrder: 6,
            features: JSON.stringify([
                "20 محاولة اختبار تجريبي",
                "التسجيل وحجز الموعد الرسمي بالكامل",
                "استشارات دعم ومتابعة فنية كاملة",
                "صلاحية دائرية لمدة 180 يوم"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },

        // 3. Mock exam packages + Registration + Transport (باقات تجريبية + التسجيل + المواصلات)
        {
            name: "الباقة المتكاملة الفضية",
            nameEn: "Silver Integrated Package",
            description: "الباقة المريحة مع 5 محاولات اختبار وتأكيد حجز موعد التسجيل بالإضافة إلى تذكرة نقل مجانية لمركز الاختبار.",
            badge: "كل شيء في تذكرة واحدة",
            color: "from-teal-600 to-teal-700",
            icon: "Truck",
            examCredits: 5,
            includesRegistration: true,
            includesTransport: true,
            transportType: "BUS",
            price: 25000,
            priceSAR: 250,
            examPrice: 2000,
            validityDays: 90,
            isFeatured: false,
            isActive: true,
            sortOrder: 7,
            features: JSON.stringify([
                "5 محاولات اختبار تجريبي",
                "التسجيل وحجز الموعد الرسمي بالكامل",
                "تذكرة مواصلات ذهاب وإياب لمركز الاختبار",
                "تنسيق موعد الحافلة مع موعد الاختبار تلقائياً"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "الباقة المتكاملة الذهبية",
            nameEn: "Gold Integrated Package",
            description: "الباقة الكاملة والأكثر شعبية: تشمل 12 محاولة اختبار تجريبي والتسجيل الرسمي وحجز الموعد وتأكيد تذكرة النقل للطلاب والمتقدمين.",
            badge: "الأكثر تميزاً وراحة",
            color: "from-emerald-600 to-emerald-700",
            icon: "Truck",
            examCredits: 12,
            includesRegistration: true,
            includesTransport: true,
            transportType: "BUS",
            price: 30000,
            priceSAR: 300,
            examPrice: 4000,
            validityDays: 180,
            isFeatured: true,
            isActive: true,
            sortOrder: 8,
            features: JSON.stringify([
                "12 محاولة اختبار تجريبي كاملة",
                "التسجيل وحجز الموعد الرسمي بالكامل",
                "تذكرة مواصلات VIP ذهاب وإياب",
                "وجبة خفيفة ومستلزمات اختبار مجانية"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        },
        {
            name: "الباقة المتكاملة البلاتينية",
            nameEn: "Platinum Integrated Package",
            description: "باقة الـ VIP القصوى: 25 محاولة اختبار تجريبي، والتسجيل وحجز موعد الاعتماد الرسمي الفوري، بالإضافة إلى تأمين النقل الخاص والمريح للغاية.",
            badge: "خدمة كبار الشخصيات",
            color: "from-rose-600 to-rose-700",
            icon: "Truck",
            examCredits: 25,
            includesRegistration: true,
            includesTransport: true,
            transportType: "VIP_CAR",
            price: 40000,
            priceSAR: 400,
            examPrice: 8000,
            validityDays: 360,
            isFeatured: false,
            isActive: true,
            sortOrder: 9,
            features: JSON.stringify([
                "25 محاولة اختبار تجريبي كاملة",
                "التسجيل وحجز الموعد الرسمي الفوري بالكامل",
                "تذكرة نقل خاصة بسيارة VIP مريحة",
                "خدمة دعم وتحديثات مخصصة على مدار الساعة"
            ]),
            allowedQuestionTypes: "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE"
        }
    ];

    for (const pkg of packages) {
        await prisma.mockExamPackage.create({
            data: {
                ...pkg,
                features: JSON.parse(pkg.features)
            }
        });
        console.log(`Created MockExamPackage: ${pkg.name}`);
    }

    console.log("✅ Successfully created all 9 mock exam packages!");
}

main()
    .catch((err) => {
        console.error("Error seeding mock packages:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
