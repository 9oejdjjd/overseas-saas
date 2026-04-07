import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import MockRegistrationClient from "./MockRegistrationClient";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profession = await prisma.profession.findUnique({
    where: { slug },
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
      <MockRegistrationClient />
    </>
  );
}
