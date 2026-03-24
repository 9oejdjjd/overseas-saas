import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STANDARD_TEMPLATES = [
    {
        name: "تأكيد التسجيل الجديد",
        trigger: "ON_REGISTRATION",
        type: "WHATSAPP",
        body: "مرحبًا {name}،\n\nنؤكد لك أنه تم تسجيلك بنجاح في *الاعتماد المهني* من خلال فريق أوفرسيز المختص.\n\n📋 *تفاصيل التسجيل:*\n• رقم الملف: {applicantCode}\n• المهنة: {profession}\n\nسيتم التواصل معك في حال وجود أي تحديثات تخص طلبك."
    },
    {
        name: "تأكيد حجز موعد الاختبار",
        trigger: "ON_EXAM_SCHEDULE",
        type: "WHATSAPP",
        body: "مرحبًا {name}،\n\nنود إفادتك بأنه تم تأكيد حجز موعد اختبارك بنجاح، وبيانات الموعد كالتالي:\n\n📋 *تفاصيل الاختبار:*\n• المهنة: {profession}\n• التاريخ: {examDate}\n• الوقت: {examTime}\n• المدينة: {examLocation}\n\n📍 *عنوان مركز الاختبار:*\n{locationAddress}\n\n🗺️ *موقع المركز على الخريطة:*\n{locationUrl}\n\n⚠️ *تعليمات هامة:*\n- الحضور قبل الموعد بـ **30 دقيقة** على الأقل.\n- إحضار **جواز السفر الأصلي** فقط.\n\nنتمنى لك التوفيق، ونؤكد أننا معك في حال احتجت أي استفسار.\n\n—\n*أوفرسيز للسفريات*\nنرافقك خطوة بخطوة نحو اعتمادك المهني"
    },
    {
        name: "تهنئة بالنجاح",
        trigger: "ON_PASS",
        type: "WHATSAPP",
        body: "نبارك لك {name} 🌟\nاجتيازك لاختبار *الاعتماد المهني* بنجاح.\n\nهذا الإنجاز يعكس جديتك واستعدادك، ونتمنى لك مسيرة مهنية موفقة بإذن الله.\n\n📋 *بيانات النتيجة:*\n• المهنة: {profession}\n• حالة الاختبار: ناجح ✅\n\nفي حال رغبتك بالانتقال للخطوة التالية أو احتجت أي مساعدة إضافية، يسعدنا دعمك.\n\n—\n*أوفرسيز للسفريات*\nنرافقك خطوة بخطوة نحو اعتمادك المهني"
    },
    {
        name: "تعديل موعد الاختبار",
        trigger: "ON_EXAM_RESCHEDULE",
        type: "WHATSAPP",
        body: "مرحبًا {name}،\n\nتم تعديل موعد اختبارك بناءً على طلبك.\n\n📋 *الموعد الجديد:*\n• التاريخ: {examDate}\n• الوقت: {examTime}\n• الموقع: {examLocation}\n\nنأمل أن يكون الموعد الجديد مناسبًا لك.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "إلغاء حجز الاختبار",
        trigger: "ON_EXAM_CANCEL",
        type: "WHATSAPP",
        body: "مرحبًا {name}،\n\nيؤسفنا إبلاغك بأنه تم إلغاء موعد الاختبار الخاص بك.\n\nإذا كان لديك أي استفسار أو ترغب في حجز موعد جديد، يرجى التواصل معنا.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "تغيب عن الاختبار",
        trigger: "ON_EXAM_ABSENT",
        type: "WHATSAPP",
        body: "عزيزي {name}،\n\nلاحظنا عدم حضورك لموعد الاختبار المحدد بتاريخ {examDate}.\n\n⚠️ *يرجى التواصل معنا لتسوية الوضع وتحديد موعد جديد.*\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "إشعار نتيجة (لم يجتز)",
        trigger: "ON_FAIL",
        type: "WHATSAPP",
        body: "عزيزي {name}،\n\nنأسف لعدم اجتيازك اختبار الاعتماد المهني هذه المرة.\n\nلا تيأس، يمكنك المحاولة مرة أخرى قريباً، ونحن هنا لمساعدتك في الترتيب للاختبار القادم.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "إصدار تذكرة سفر",
        trigger: "ON_TICKET_ISSUE",
        type: "WHATSAPP",
        body: "رحلة سعيدة {name}! ✈️\n\nتم إصدار تذكرة سفرك بنجاح.\n\n🎫 *بيانات الرحلة:*\n• رقم التذكرة: {ticketNumber}\n• المسار: {route}\n• موعد المغادرة: {departureDate}\n\nيرجى التواجد في المطار قبل الرحلة بوقت كافٍ.\n\n—\n*أوفرسيز للسفريات*\nرفيق سفرك الموثوق"
    },
    {
        name: "تعديل بيانات تذكرة السفر",
        trigger: "ON_TICKET_UPDATE",
        type: "WHATSAPP",
        body: "مرحبًا {name}،\n\nتم إجراء تعديلات على تذكرة سفرك رقم {ticketNumber}.\n\n📝 *البيانات المحدثة:*\n{ticketDetails}\n\nيرجى مراجعة التفاصيل الجديدة.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "إلغاء تذكرة السفر",
        trigger: "ON_TICKET_CANCEL",
        type: "WHATSAPP",
        body: "عزيزي {name}،\n\nتم إلغاء تذكرة السفر رقم {ticketNumber} بنجاح.\n\nسيتم معالجة أي مبالغ مستردة وفقاً لسياسة الإلغاء المعتمدة.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "تغيب عن الرحلة (No-Show)",
        trigger: "ON_TICKET_NO_SHOW",
        type: "WHATSAPP",
        body: "مرحباً {name}،\n\nتم تسجيل عدم حضورك للرحلة المتجهة إلى {destination} بتاريخ {departureDate}.\n\nتذكرتك حالياً معلقة، يرجى مراجعتنا لتوضيح الإجراءات التالية.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "تذكير بموعد الاختبار (قبل 3 أيام)",
        trigger: "REMINDER_EXAM_3DAYS",
        type: "WHATSAPP",
        body: "تذكير هام {name} 🔔\n\nموعد اختبار الاعتماد المهني الخاص بك هو بعد 3 أيام بتاريخ {examDate}.\n\n✅ *تذكير:*\nيرجى التأكد من جاهزية جواز سفرك الأصلي ساري المفعول.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "تذكير بموعد الاختبار (غداً)",
        trigger: "REMINDER_EXAM_1DAY",
        type: "WHATSAPP",
        body: "غداً هو موعدك! 📅\n\nنذكرك بموعد اختبارك غداً:\n• التاريخ: {examDate}\n• الوقت: {examTime}\n• الموقع: {examLocation}\n\nنتمنى لك كل التوفيق والنجاح.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "تذكير بموعد السفر",
        trigger: "REMINDER_TRAVEL",
        type: "WHATSAPP",
        body: "رحلتك غداً! ✈️\n\nتذكير بموعد رحلتك:\n• المغادرة من: {from}\n• إلى: {to}\n• وقت المغادرة: {departureTime}\n\nيرجى التواجد قبل الموعد بساعة على الأقل.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "رابط شهادة النجاح",
        trigger: "ON_CERTIFICATE",
        type: "WHATSAPP",
        body: "مرحباً {name}،\n\nيمكنك الآن تحميل شهادة الاعتماد المهني الخاصة بك عبر الرابط التالي:\n🔗 {certificateLink}\n\nمبارك عليك هذا الإنجاز، ونتمنى لك مستقبلاً مشرقاً.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "إرسال قسيمة اختبار",
        trigger: "ON_EXAM_VOUCHER",
        type: "WHATSAPP",
        body: "مكافأة خاصة لك {name}! 🎁\n\nإليك كود قسيمة لاختبار الاعتماد المهني:\n🎫 الكود: {voucherCode}\n💰 قيمة الخصم: {discountAmount}\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "قسيمة خصم تذكرة سفر",
        trigger: "ON_TICKET_VOUCHER",
        type: "WHATSAPP",
        body: "رحلة ممتعة مع خصم خاص! 🌍\n\nاستخدم الكود {voucherCode} لتحصل على خصم مميز على رحلتك القادمة.\n⏳ صالح حتى: {expiryDate}\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "قسيمة تعويضية (محاولة أخرى)",
        trigger: "ON_RETAKE_VOUCHER",
        type: "WHATSAPP",
        body: "لا تيأس {name}، الفرص مازالت أمامك.\n\nنقدم لك خصماً خاصاً لإعادة التسجيل للاختبار.\nاستخدم الكود: {voucherCode} عند الحجز القادم.\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "طلب تقييم الخدمة",
        trigger: "ON_FEEDBACK",
        type: "WHATSAPP",
        body: "شكراً لثقتك بنا {name} 🌹\n\nرأيك يهمنا! كيف كانت تجربتك معنا؟ نود سماع ملاحظاتك لتحسين خدماتنا:\n🔗 {feedbackLink}\n\n—\n*أوفرسيز للسفريات*"
    },
    {
        name: "قسيمة مشاركة (Referral)",
        trigger: "ON_REFERRAL_VOUCHER",
        type: "WHATSAPP",
        body: "شارك تجربتك واربح! 🤝\n\nأعط هذا الكود {voucherCode} لأصدقائك ليحصلوا على خصم، وستحصل أنت على مكافأة أيضاً عند تسجيلهم.\n\n—\n*أوفرسيز للسفريات*"
    }
];

async function main() {
    console.log("🚀 Starting Template Seeding...");

    for (const template of STANDARD_TEMPLATES) {
        // We use upsert to create if new, or update if exists (to ensure trigger matches)
        // Note: Prisma Schema says 'trigger' is @unique.

        await prisma.messagingTemplate.upsert({
            where: { trigger: template.trigger },
            update: {
                // If it exists, maybe we DON'T want to overwrite the body if the user customized it?
                // But the requirement says "Replace random templates with 20 standard ones".
                // I'll update the name to match standard, but keep body if it exists?
                // Actually, let's force update body to ensure variables {name} etc are correct for the new system.
                // Or maybe just update name and type? 
                // Let's safe update: Update everything to standard defaults.
                name: template.name,
                body: template.body,
                type: template.type,
                active: true
            },
            create: {
                name: template.name,
                trigger: template.trigger,
                body: template.body,
                type: template.type,
                active: true,
                subject: template.name // Filling subject with name just in case
            }
        });
        console.log(`✅ Processed: ${template.name} (${template.trigger})`);
    }

    console.log("✨ Seeding Completed Successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
