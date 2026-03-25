import { SchemaMarkup } from "./SchemaMarkup";

export function GlobalSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local-pacc.sa"; // Fallback URL

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "بوابة الاعتماد المهني",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "منصة متخصصة تقدم اختبارات تجريبية مجانية للعمالة لتجهيزهم لاختبار الاعتماد المهني السعودي.",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "بوابة الاعتماد المهني",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "هل الاختبار التجريبي مجاني بالكامل؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "نعم، جميع الاختبارات التجريبية على بوابة الاعتماد المهني مجانية 100% ولا تتطلب أي رسوم على الإطلاق."
        }
      },
      {
        "@type": "Question",
        "name": "كيف يمكنني معرفة نتيجتي في الاختبار؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "تظهر النتيجة فور انتهائك من تسليم الاختبار التجريبي، كما سنرسل لك عبر تطبيق الواتساب تفاصيل نتيجتك ونقاط القوة والضعف لرفع جاهزيتك للاختبار الحقيقي."
        }
      },
      {
        "@type": "Question",
        "name": "هل أسئلة الاختبار التجريبي مشابهة لاختبار الاعتماد المهني السعودي الأساسي؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "نعم، أسئلتنا مصممة بعناية ودقة تامة بواسطة خبراء لتحاكي محاور وأسئلة الاختبار الحقيقي الخاص بالاعتماد المهني، مما يوفر لك فرصة تدريب ممتازة قبل موعد الاختبار المعتمد."
        }
      }
    ]
  };

  return (
    <>
      <SchemaMarkup schema={organizationSchema} />
      <SchemaMarkup schema={websiteSchema} />
      <SchemaMarkup schema={faqSchema} />
    </>
  );
}
