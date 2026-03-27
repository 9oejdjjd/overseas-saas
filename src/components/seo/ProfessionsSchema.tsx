import prisma from "@/lib/prisma";
import { SchemaMarkup } from "./SchemaMarkup";

export async function ProfessionsSchema() {
  try {
    const professions = await prisma.profession.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, description: true }
    });

    if (!professions || professions.length === 0) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local-pacc.sa"; // Fallback URL

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": professions.map((prof, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Course",
          "name": `اختبار تجريبي: ${prof.name}`,
          "description": prof.description || `اختبار مهني تجريبي يحاكي اختبار الاعتماد لمهنة ${prof.name}`,
          "provider": {
            "@type": "Organization",
            "name": "بوابة الاعتماد المهني"
          },
          "url": `${baseUrl}/${prof.slug}`
        }
      }))
    };

    return <SchemaMarkup schema={itemListSchema} />;
  } catch (error) {
    console.warn("Failed to generate Professions schema during build:", error);
    return null;
  }
}
