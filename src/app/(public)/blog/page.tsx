import { Metadata } from "next";
import BlogClient from "./BlogClient";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "المدونة المعرفية والدليل الشامل | بوابة الاعتماد المهني",
    description: "تصفح أهم النصائح والمقالات والأدلة الفنية والعملية لتأهيل واجتياز اختبارات الاعتماد المهني السعودي وتسهيل إجراءات استقدام وتأشيرات العمل.",
    keywords: "مدونة الاعتماد المهني, دليل فحص العمالة, نصائح الفحص المهني, اختبارات تجريبية, بوابة الاعتماد المهني",
    alternates: {
        canonical: "/blog",
    },
};

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function BlogPage() {
    let articles: any[] = [];
    let popularArticles: any[] = [];
    let categories: any[] = [];

    try {
        articles = await prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                publishedAt: {
                    lte: new Date(),
                },
            },
            include: {
                category: true,
                author: true,
                tags: true,
            },
            orderBy: {
                publishedAt: "desc",
            },
        });

        popularArticles = await prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                publishedAt: {
                    lte: new Date(),
                },
            },
            include: {
                category: true,
            },
            orderBy: {
                views: "desc",
            },
            take: 3,
        });

        categories = await prisma.category.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        });
    } catch (error) {
        console.warn("Failed to fetch articles for blog page during build/render:", error);
    }

    const categoryNames = ["الكل", ...categories.map((c: any) => c.name)];

    return (
        <BlogClient 
            initialArticles={JSON.parse(JSON.stringify(articles))} 
            initialPopular={JSON.parse(JSON.stringify(popularArticles))} 
            initialCategories={categoryNames}
        />
    );
}
