import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { ArticleStatus } from "@prisma/client";

// GET: Fetch a single article by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                category: true,
                author: true,
                tags: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, article });
    } catch (error: any) {
        console.error("GET Article Error:", error);
        return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
    }
}

// PUT: Update an existing article
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
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

        // Check if article exists
        const existingArticle = await prisma.article.findUnique({
            where: { id }
        });

        if (!existingArticle) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // Validations
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

        const finalSlug = slugify(slug || title);
        if (!finalSlug) return NextResponse.json({ error: "A valid slug is required." }, { status: 400 });

        // Check slug uniqueness (excluding current article)
        const slugConflict = await prisma.article.findFirst({
            where: {
                id: { not: id },
                slug: finalSlug
            }
        });

        if (slugConflict) {
            return NextResponse.json({ error: "An article with this slug already exists. Please choose a different URL slug." }, { status: 400 });
        }

        // Handle Lifecycle / Publish Date
        let parsedPublishDate: Date | null = existingArticle.publishedAt;
        let finalStatus = status || existingArticle.status;

        if (status) {
            if (finalStatus === ArticleStatus.PUBLISHED) {
                // If it is published, default to current date/time if no publish date is set
                parsedPublishDate = publishedAt ? new Date(publishedAt) : (existingArticle.publishedAt || new Date());
            } else if (finalStatus === ArticleStatus.SCHEDULED) {
                if (!publishedAt) {
                    return NextResponse.json({ error: "Publish date is required for scheduled articles." }, { status: 400 });
                }
                parsedPublishDate = new Date(publishedAt);
                if (parsedPublishDate <= new Date()) {
                    finalStatus = ArticleStatus.PUBLISHED;
                }
            } else if (status === ArticleStatus.DRAFT || status === ArticleStatus.ARCHIVED) {
                // Keep the date but update status
                parsedPublishDate = publishedAt ? new Date(publishedAt) : existingArticle.publishedAt;
            }
        }

        // Calculate a default read time if not provided
        const wordCount = content.trim().split(/\s+/).length;
        const calculatedReadTime = readTime || Math.max(1, Math.ceil(wordCount / 200));

        // Connect Tags relation using set (replaces all tags)
        const tagsConnection = tags.map((tagId: string) => ({ id: tagId }));

        const article = await prisma.article.update({
            where: { id },
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
                
                author: authorId ? { connect: { id: authorId } } : { disconnect: true },
                category: { connect: { id: categoryId } },
                tags: { set: tagsConnection },

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
        console.error("PUT Article Error:", error);
        return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
    }
}

// DELETE: Delete an existing article
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const articleExists = await prisma.article.findUnique({
            where: { id }
        });

        if (!articleExists) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        await prisma.article.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Article deleted successfully" });
    } catch (error: any) {
        console.error("DELETE Article Error:", error);
        return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
    }
}
