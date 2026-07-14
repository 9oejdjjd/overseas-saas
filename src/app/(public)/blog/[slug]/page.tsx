import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { Footer } from "@/components/mock/LandingComponents";
import Link from "next/link";
import { 
    Calendar, ArrowRight, Share2, 
    Bookmark, Sparkles, BookOpen, Facebook, Twitter, Link2
} from "lucide-react";

interface ArticlePageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ preview?: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const article = await prisma.article.findUnique({
        where: { slug },
        include: { author: true }
    });

    if (!article) {
        return {
            title: "المقال غير موجود | الاعتماد المهني",
        };
    }

    const title = article.metaTitle || `${article.title} | بوابة الاعتماد المهني`;
    const description = article.metaDescription || article.summary || article.title;

    return {
        title,
        description,
        keywords: article.metaKeywords || "الاعتماد المهني, الفحص المهني السعودي, اخبار الاعتماد",
        alternates: {
            canonical: article.canonicalUrl || `/blog/${article.slug}`,
        },
        openGraph: {
            title: article.ogTitle || title,
            description: article.ogDescription || description,
            type: "article",
            publishedTime: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
            modifiedTime: article.updatedAt.toISOString(),
            authors: ["بوابة الاعتماد المهني"],
            images: [
                {
                    url: article.ogImage || article.featuredImage || "https://images.unsplash.com/photo-1581092921461-eab62e97a780",
                    width: 1200,
                    height: 630,
                    alt: article.title,
                }
            ],
        },
    };
}

export default async function SingleArticlePage({ params, searchParams }: ArticlePageProps) {
    const { slug } = await params;
    const query = await searchParams;
    const isPreview = query.preview === "true";

    // Fetch the article
    const article = await prisma.article.findUnique({
        where: { slug },
        include: {
            category: true,
            author: true,
            tags: true
        }
    });

    // Handle 404 or Drafts (unless it is a preview request)
    if (!article) notFound();
    if (article.status !== "PUBLISHED" && !isPreview) notFound();

    // Increment view count dynamically on production/view (not previews)
    if (!isPreview) {
        try {
            await prisma.article.update({
                where: { id: article.id },
                data: { views: { increment: 1 } }
            });
        } catch (err) {
            console.error("Failed to increment views:", err);
        }
    }

    // Fetch related articles (from same category, excluding current one)
    const relatedArticles = await prisma.article.findMany({
        where: {
            categoryId: article.categoryId,
            id: { not: article.id },
            status: "PUBLISHED",
            publishedAt: { lte: new Date() }
        },
        take: 3,
        orderBy: { publishedAt: "desc" }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local-pacc.sa";
    const articleUrl = `${baseUrl}/blog/${article.slug}`;

    // Dynamic JSON-LD NewsArticle Schema
    const newsArticleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl
        },
        "headline": article.title,
        "description": article.summary || article.title,
        "image": [
            article.featuredImage || "https://images.unsplash.com/photo-1581092921461-eab62e97a780"
        ],
        "datePublished": article.publishedAt || article.createdAt,
        "dateModified": article.updatedAt,
        "author": {
            "@type": "Organization",
            "name": "بوابة الاعتماد المهني"
        },
        "publisher": {
            "@type": "Organization",
            "name": "بوابة الاعتماد المهني",
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`
            }
        }
    };

    const formattedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString("ar-SA", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    return (
        <>
            <SchemaMarkup schema={newsArticleSchema} />

            <main className="min-h-screen pt-32 pb-0 bg-gradient-to-b from-[#f8fafc] via-slate-50 to-white font-sans text-slate-800 relative overflow-hidden" dir="rtl">
                
                {/* Ambient Decorative Blur */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-[#5c9e45]/5 rounded-full blur-[130px] pointer-events-none" />

                {/* Main Article Container */}
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-right">
                    
                    {/* Preview Warning Badge */}
                    {isPreview && (
                        <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-4 py-3 rounded-2xl mb-6 font-bold text-xs flex items-center gap-2 justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            <span>أنت تشاهد نسخة معاينة للمقال المسودة. لن تظهر هذه الصفحة للمستخدمين حتى تنشرها.</span>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="mb-6">
                        <Link 
                            href="/blog" 
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#16539a] transition-colors bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm"
                        >
                            <ArrowRight size={14} className="ml-1" />
                            العودة إلى المدونة والدليل المهني
                        </Link>
                    </div>

                    {/* Category & Date details */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="px-3.5 py-1.5 bg-blue-50 border border-blue-100 text-[#16539a] text-xs font-black rounded-xl shadow-sm">
                            {article.category?.name || "عام"}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                            <div className="flex items-center gap-1.5"><Calendar size={13} /> {formattedDate}</div>
                        </div>
                    </div>

                    {/* Article Title */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight border-b border-slate-100 pb-6">
                        {article.title}
                    </h1>

                    {/* Large Featured Image */}
                    {article.featuredImage && (
                        <div className="rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl mb-12 aspect-[16/9] relative bg-slate-100">
                            <img 
                                src={article.featuredImage} 
                                alt={article.title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Summary Excerpt Box */}
                    {article.summary && (
                        <div className="bg-[#16539a]/5 border-r-4 border-[#16539a] p-6 rounded-l-2xl rounded-r-sm mb-8">
                            <p className="text-slate-700 text-sm font-bold leading-relaxed">
                                {article.summary}
                            </p>
                        </div>
                    )}

                    {/* HTML Content (Styled Article View) */}
                    <article className="prose prose-blue max-w-none text-slate-800 leading-relaxed font-sans text-sm md:text-base space-y-6">
                        <div 
                            dangerouslySetInnerHTML={{ __html: article.content }} 
                            className="blog-content-body min-h-[300px]"
                        />
                    </article>

                    {/* Action Button (CTA) */}
                    {article.actionButtonText && article.actionButtonUrl && (
                        <div className="mt-12 mb-8 flex justify-center">
                            <Link 
                                href={article.actionButtonUrl} 
                                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#16539a] to-[#1a5ea8] text-white px-8 py-4 rounded-2xl font-black text-lg overflow-hidden shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-1 transition-all duration-300"
                            >
                                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></span>
                                <span className="relative">{article.actionButtonText}</span>
                                <ArrowRight size={20} className="relative group-hover:-translate-x-1 transition-transform rotate-180" />
                            </Link>
                        </div>
                    )}

                    {/* Tags Section */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center border-t border-slate-200/80 pt-6 mt-12 mb-8">
                            <span className="text-xs font-bold text-slate-400 ml-1">الوسوم:</span>
                            {article.tags.map((tag: any) => (
                                <span 
                                    key={tag.id} 
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-550 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Share Widget */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 mt-8 mb-16">
                        <span className="text-xs font-bold text-slate-450 flex items-center gap-1.5">
                            <Share2 size={14} className="text-[#16539a]" />
                            هل أعجبك المقال؟ شاركه مع الآخرين:
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <a 
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#3b5998] hover:text-white transition-colors flex items-center justify-center text-slate-500"
                                title="مشاركة عبر فيسبوك"
                            >
                                <Facebook size={14} />
                            </a>
                            <a 
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#1da1f2] hover:text-white transition-colors flex items-center justify-center text-slate-500"
                                title="مشاركة عبر تويتر"
                            >
                                <Twitter size={14} />
                            </a>
                            <a 
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + " " + articleUrl)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#25d366] hover:text-white transition-colors flex items-center justify-center text-slate-500"
                                title="مشاركة عبر واتساب"
                            >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.48-.002 9.932-4.437 9.935-9.88.001-2.636-1.024-5.113-2.887-6.978C16.45 1.88 13.985 1.878 12.012 1.878c-5.485 0-9.94 4.43-9.943 9.876-.002 1.802.476 3.562 1.383 5.122l-.955 3.498 3.582-.939z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Related Articles Section */}
                    {relatedArticles.length > 0 && (
                        <div className="border-t border-slate-200/80 pt-12 mb-16">
                            <h3 className="text-xl font-black text-slate-900 mb-8">مقالات ذات صلة قد تهمك</h3>
                            
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedArticles.map((rel) => (
                                    <Link 
                                        key={rel.id} 
                                        href={`/blog/${rel.slug}`}
                                        className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-[#16539a]/20 transition-all flex flex-col justify-between group"
                                    >
                                        <div className="space-y-3">
                                            {rel.featuredImage && (
                                                <div className="rounded-xl overflow-hidden aspect-[16/10] bg-slate-50 border border-slate-100">
                                                    <img src={rel.featuredImage} alt={rel.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-[#16539a] transition-colors line-clamp-2">
                                                {rel.title}
                                            </h4>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold pt-4 flex items-center justify-between">
                                            <span>{new Date(rel.publishedAt || rel.createdAt).toLocaleDateString("ar-SA")}</span>
                                            <span className="text-[#16539a] font-bold group-hover:underline flex items-center gap-0.5">
                                                اقرأ الآن
                                                <ArrowRight size={10} className="rotate-180" />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                <Footer />
            </main>
            
            {/* Global Typography styles for CMS content */}
            <style dangerouslySetInnerHTML={{ __html: `
                .blog-content-body h2 {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin-top: 1.75rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.3;
                }
                .blog-content-body h3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    line-height: 1.3;
                }
                .blog-content-body p {
                    font-size: 1rem;
                    color: #334155;
                    line-height: 1.75;
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .blog-content-body ul {
                    list-style-type: disc;
                    padding-right: 1.5rem;
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    font-size: 1rem;
                    color: #334155;
                    line-height: 1.75;
                }
                .blog-content-body ol {
                    list-style-type: decimal;
                    padding-right: 1.5rem;
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    font-size: 1rem;
                    color: #334155;
                    line-height: 1.75;
                }
                .blog-content-body li {
                    margin-bottom: 0.25rem;
                }
                .blog-content-body blockquote {
                    border-right: 4px solid #16539a;
                    padding: 0.5rem 1rem;
                    margin: 1.25rem 0;
                    background-color: #f8fafc;
                    color: #475569;
                    font-style: italic;
                    border-radius: 0.25rem 0 0 0.25rem;
                }
                .blog-content-body a {
                    color: #16539a;
                    text-decoration: underline;
                    font-weight: bold;
                }
                .blog-content-body pre {
                    background-color: #0f172a;
                    color: #f1f5f9;
                    padding: 1rem;
                    border-radius: 0.75rem;
                    overflow-x: auto;
                    font-family: monospace;
                    font-size: 0.875rem;
                    margin: 1.25rem 0;
                }
                .blog-content-body img {
                    border-radius: 1rem;
                    margin: 1.5rem auto;
                    max-width: 100%;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                }
            `}} />
        </>
    );
}
