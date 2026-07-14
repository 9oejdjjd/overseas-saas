import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { ArticleStatus } from "@prisma/client";

// GET: Fetch list of articles for dashboard with filtering and search
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("categoryId") || undefined;
        const authorId = searchParams.get("authorId") || undefined;
        const status = searchParams.get("status") || undefined;

        // Build filtering query
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { summary: { contains: search, mode: "insensitive" } }
            ];
        }

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        if (authorId) {
            whereClause.authorId = authorId;
        }

        if (status) {
            whereClause.status = status as ArticleStatus;
        }

        const articles = await prisma.article.findMany({
            where: whereClause,
            include: {
                category: {
                    select: { name: true, nameEn: true, slug: true }
                },
                author: {
                    select: { name: true, title: true, avatar: true }
                },
                tags: {
                    select: { id: true, name: true, slug: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ success: true, articles });
    } catch (error: any) {
        console.error("GET Articles Error:", error);
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }
}

// POST: Create a new article
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            slug,
            content,
            summary,
            featuredImage,
            status,
            readTime,
            isFeatured,
            publishedAt,
            authorId,
            categoryId,
            tags = [], // Expecting array of Tag IDs: string[]
            
            // SEO fields
            metaTitle,
            metaDescription,
            metaKeywords,
            ogTitle,
            ogDescription,
            ogImage,
            canonicalUrl,
            actionButtonText,
            actionButtonUrl
        } = body;

        // Validations
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

        const finalSlug = slugify(slug || title);
        if (!finalSlug) return NextResponse.json({ error: "A valid slug could not be generated from the title." }, { status: 400 });

        // Check if slug is unique
        const existingSlug = await prisma.article.findUnique({
            where: { slug: finalSlug }
        });

        if (existingSlug) {
            return NextResponse.json({ error: "An article with this slug already exists. Please choose a different URL slug." }, { status: 400 });
        }

        // Handle Lifecycle / Publish Date
        let parsedPublishDate: Date | null = null;
        let finalStatus = status || ArticleStatus.DRAFT;

        if (finalStatus === ArticleStatus.PUBLISHED) {
            // If published, default to current date/time if not supplied
            parsedPublishDate = publishedAt ? new Date(publishedAt) : new Date();
        } else if (finalStatus === ArticleStatus.SCHEDULED) {
            if (!publishedAt) {
                return NextResponse.json({ error: "Publish date is required for scheduled articles." }, { status: 400 });
            }
            parsedPublishDate = new Date(publishedAt);
            // If the date is in the past, automatically mark it as PUBLISHED
            if (parsedPublishDate <= new Date()) {
                finalStatus = ArticleStatus.PUBLISHED;
            }
        } else if (publishedAt) {
            parsedPublishDate = new Date(publishedAt);
        }

        // Calculate a default read time if not provided
        const wordCount = content.trim().split(/\s+/).length;
        const calculatedReadTime = readTime || Math.max(1, Math.ceil(wordCount / 200));

        // Connect Tags relation format
        const tagsConnection = tags.map((tagId: string) => ({ id: tagId }));

        const article = await prisma.article.create({
            data: {
                title,
                slug: finalSlug,
                content,
                summary: summary || null,
                featuredImage: featuredImage || null,
                status: finalStatus as ArticleStatus,
                readTime: calculatedReadTime,
                isFeatured: !!isFeatured,
                publishedAt: parsedPublishDate,
                
                author: authorId ? { connect: { id: authorId } } : undefined,
                category: { connect: { id: categoryId } },
                tags: { connect: tagsConnection },

                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                metaKeywords: metaKeywords || null,
                ogTitle: ogTitle || null,
                ogDescription: ogDescription || null,
                ogImage: ogImage || featuredImage || null,
                canonicalUrl: canonicalUrl || null,
                actionButtonText: actionButtonText || null,
                actionButtonUrl: actionButtonUrl || null
            },
            include: {
                category: true,
                author: true,
                tags: true
            }
        });

        return NextResponse.json({ success: true, article });
    } catch (error: any) {
        console.error("POST Article Error:", error);
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
    }
}
