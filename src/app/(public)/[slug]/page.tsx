import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import MockRegistrationClient from "./MockRegistrationClient";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profession = await prisma.profession.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          questions: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!profession) {
    return {
      title: "التخصص غير موجود | الاعتماد المهني",
    };
  }

  return {
    title: `اختبار تجريبي: ${profession.name} | الاعتماد المهني`,
    description: profession.description || `اختبار مهني تجريبي يحاكي اختبار الاعتماد لمهنة ${profession.name}`,
    openGraph: {
      title: `اختبار تجريبي: ${profession.name} | الاعتماد المهني`,
      description: profession.description || `اختبار مهني تجريبي يحاكي اختبار الاعتماد لمهنة ${profession.name}`,
      type: "website",
    },
  };
}

export default async function ProfessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profession = await prisma.profession.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          questions: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!profession || !profession.isActive) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local-pacc.sa";

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "المهن",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": profession.name,
        "item": `${baseUrl}/${profession.slug}`
      }
    ]
  };

  // Course/Service Schema
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `اختبار تجريبي: ${profession.name}`,
    "description": profession.description || `يساعدك هذا الاختبار التجريبي على معرفة مستواك والتحضير لاختبار الاعتماد المهني الحقيقي لمهنة ${profession.name}.`,
    "provider": {
      "@type": "Organization",
      "name": "بوابة الاعتماد المهني",
      "sameAs": baseUrl
    },
    "offers": {
      "@type": "Offer",
      "category": "Free",
      "priceCurrency": "SAR",
      "price": "0"
    }
  };

  return (
    <>
      <SchemaMarkup schema={breadcrumbSchema} />
      <SchemaMarkup schema={courseSchema} />
      
      {profession._count.questions < profession.questionCount ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 mt-16 w-full max-w-4xl mx-auto z-10 relative">
          <div className="bg-red-500/10 text-red-500 p-8 rounded-2xl max-w-xl w-full border border-red-500/20 glass-panel shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 font-kufi text-red-600 dark:text-red-400">عذراً، الاختبار غير متاح حالياً</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-2">
              يرجى المحاولة في وقت لاحق.
            </p>
          </div>
        </div>
      ) : (
        <MockRegistrationClient />
      )}
    </>
  );
}
