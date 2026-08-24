import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getBaseUrl();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    // Dynamic pages (Professions & Blog Articles)
    try {
        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
        });

        const articles = await prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                publishedAt: { lte: new Date() }
            },
            select: { slug: true, updatedAt: true }
        });

        const professionPages: MetadataRoute.Sitemap = professions.flatMap((prof) => [
            // Landing/detail page for each profession
            {
                url: `${baseUrl}/professions/${prof.slug}`,
                lastModified: prof.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.9,
            },
            // Registration page for each profession  
            {
                url: `${baseUrl}/${prof.slug}`,
                lastModified: prof.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.8,
            },
        ]);

        const blogPages: MetadataRoute.Sitemap = articles.map((art) => ({
            url: `${baseUrl}/blog/${art.slug}`,
            lastModified: art.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

        return [...staticPages, ...professionPages, ...blogPages];
    } catch (error) {
        console.warn("Failed to generate sitemap professions or articles:", error);
        return staticPages;
    }
}
