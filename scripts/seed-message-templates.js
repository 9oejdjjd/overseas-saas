// Seed script for new contextual message templates
// Run with: node scripts/seed-message-templates.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const templates = [
    {
        name: "رسالة ترحيب - بيانات الحساب",
        type: "WHATSAPP",
        trigger: "ON_ACCOUNT_CREATED",
        subject: null,
        body: `مرحباً {name}! 👋

تم إنشاء حسابك بنجاح على منصة الاختبارات.

📧 البريد الإلكتروني: {email}
🔑 كلمة المرور: {password}

يرجى الاحتفاظ ببيانات الدخول هذه، ستحتاجها للدخول إلى المنصة يوم الاختبار.

لأي استفسار، لا تتردد في التواصل معنا.

مع تمنياتنا لك بالتوفيق! 🎯`,
        active: true,
    },
    {
        name: "تأكيد موعد الاختبار",
        type: "WHATSAPP",
        trigger: "ON_EXAM_SCHEDULED",
        subject: null,
        body: `مرحباً {name}! 📅

تم تحديد موعد اختبارك بنجاح.

📆 التاريخ: {exam_date}
⏰ الوقت: {exam_time}
📍 المكان: {location}

📧 بيانات الدخول للمنصة:
البريد: {email}
كلمة المرور: {password}

يرجى الحضور قبل الموعد بـ 30 دقيقة على الأقل.

بالتوفيق! 🙏`,
        active: true,
    },
    {
        name: "تفاصيل تذكرة السفر",
        type: "WHATSAPP",
        trigger: "ON_TICKET_ISSUED",
        subject: null,
        body: `مرحباً {name}! 🚌

تم إصدار تذكرة سفرك بنجاح!

🎫 رقم التذكرة: {ticket_number}
📅 تاريخ السفر: {travel_date}
🚏 من: {departure_location}
📍 إلى: {arrival_location}
🚌 رقم الباص: {bus_number}
💺 رقم المقعد: {seat_number}

شركة النقل: {transport_company}

يرجى الحضور إلى نقطة الانطلاق قبل موعد المغادرة بـ 15 دقيقة.

رحلة سعيدة! 🎉`,
        active: true,
    },
    {
        name: "تهنئة بالنجاح",
        type: "WHATSAPP",
        trigger: "ON_PASS",
        subject: null,
        body: `🎉 مبروك {name}! 🎊

يسعدنا إبلاغك بأنك اجتزت الاختبار بنجاح!

ألف مبروك على هذا الإنجاز الرائع.

سيتم التواصل معك قريباً بخصوص الخطوات التالية.

مع أطيب التمنيات! 🌟`,
        active: true,
    },
    {
        name: "رسالة تشجيع - الرسوب",
        type: "WHATSAPP",
        trigger: "ON_FAIL",
        subject: null,
        body: `مرحباً {name},

نأسف لإبلاغك بأن نتيجة اختبارك لم تكن كما كنت تأمل.

لا تقلق! يمكنك إعادة الاختبار بعد فترة المراجعة.

تواصل معنا لتحديد موعد جديد.

لا تيأس، النجاح قادم! 💪`,
        active: true,
    },
    {
        name: "تعديل تذكرة السفر",
        type: "WHATSAPP",
        trigger: "ON_TICKET_MODIFIED",
        subject: null,
        body: `مرحباً {name},

تم تعديل تذكرة سفرك.

🎫 رقم التذكرة: {ticket_number}
📅 تاريخ السفر الجديد: {travel_date}
🚏 من: {departure_location}
📍 إلى: {arrival_location}

يرجى مراجعة التفاصيل الجديدة.

شكراً لتفهمك! 🙏`,
        active: true,
    },
    {
        name: "إلغاء تذكرة السفر",
        type: "WHATSAPP",
        trigger: "ON_TICKET_CANCELLED",
        subject: null,
        body: `مرحباً {name},

نؤكد لك أنه تم إلغاء تذكرة سفرك رقم {ticket_number}.

إذا كان لديك أي استفسار، يرجى التواصل معنا.

شكراً لتفهمك.`,
        active: true,
    },
];

async function main() {
    console.log('🔄 بدء إضافة قوالب الرسائل الجديدة...');

    for (const template of templates) {
        try {
            // Check if template with this trigger already exists
            const existing = await prisma.messagingTemplate.findUnique({
                where: { trigger: template.trigger },
            });

            if (existing) {
                console.log(`⏩ القالب "${template.name}" موجود مسبقاً، تخطي...`);
                continue;
            }

            await prisma.messagingTemplate.create({
                data: template,
            });
            console.log(`✅ تم إضافة: ${template.name}`);
        } catch (error) {
            console.error(`❌ فشل إضافة ${template.name}:`, error.message);
        }
    }

    console.log('\n🎉 تم الانتهاء من إضافة القوالب!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
