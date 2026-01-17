const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = [
        {
            name: "تعديل موعد الاختبار",
            trigger: "ON_EXAM_RESCHEDULE",
            type: "WHATSAPP",
            body: "عزيزي {name}،\nتم تعديل موعد اختبارك إلى تاريخ {exam_date}.\nيرجى العلم أن التعديل متاح مرة واحدة فقط.\nبالتوفيق!"
        },
        {
            name: "تذكير قبل الاختبار (3 أيام)",
            trigger: "ON_EXAM_REMINDER_3DAYS",
            type: "WHATSAPP",
            body: "تذكير 🔔\nباقي 3 أيام على موعد اختبارك: {exam_date}.\nيرجى مراجعة المتطلبات والتأكد من الجاهزية."
        },
        {
            name: "تذكير قبل الاختبار (يومين)",
            trigger: "ON_EXAM_REMINDER_2DAYS",
            type: "WHATSAPP",
            body: "تذكير 🔔\nباقي يومين على موعد اختبارك.\nالموقع: {location}."
        },
        {
            name: "تذكير قبل الاختبار (يوم واحد)",
            trigger: "ON_EXAM_REMINDER_1DAY",
            type: "WHATSAPP",
            body: "تذكير هام 🚨\nاختبارك غداً بتاريخ {exam_date}.\nنتمنى لك التوفيق والنجاح!"
        },
        {
            name: "تذكرة سفر (مع التذكرة)",
            trigger: "ON_TICKET_ISSUED_MEDIA",
            type: "WHATSAPP",
            body: "تم قص تذكرة السفر 🎫\nمرفق لكم التذكرة الإلكترونية.\nالاسم: {name}\nرقم التذكرة: {ticket_number}\nالتاريخ: {travel_date}"
        },
        {
            name: "تعديل رحلة سفر",
            trigger: "ON_TRIP_CHANGE",
            type: "WHATSAPP",
            body: "تنبيه تغيير رحلة ⚠️\nتم تعديل بيانات رحلتكم.\nالموعد الجديد: {travel_date}\nيرجى الحضور قبل الموعد بساعة."
        }
    ];

    for (const t of templates) {
        const exists = await prisma.messagingTemplate.findUnique({
            where: { trigger: t.trigger }
        });

        if (!exists) {
            await prisma.messagingTemplate.create({ data: t });
            console.log(`Created template: ${t.name}`);
        } else {
            console.log(`Template exists: ${t.name}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
