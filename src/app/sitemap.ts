import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local-pacc.sa";

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
    ];

    // Dynamic profession pages
    try {
        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
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

        return [...staticPages, ...professionPages];
    } catch (error) {
        console.warn("Failed to generate sitemap professions:", error);
        return staticPages;
    }
}
