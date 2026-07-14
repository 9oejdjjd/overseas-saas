"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Save, ArrowRight, UploadCloud, Eye, Image as ImageIcon,
    Globe, ShieldCheck, Calendar, Lock, Unlock, HelpCircle, Plus, Info, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { slugify } from "@/lib/slugify";
import dynamic from "next/dynamic";

// Dynamically import TipTap editor to avoid SSR/hydration mismatch
const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
    ssr: false,
    loading: () => (
        <div className="border border-slate-200 rounded-2xl min-h-[350px] flex items-center justify-center bg-slate-50/50">
            <span className="text-slate-400 text-xs font-bold animate-pulse">جاري تحميل محرر النصوص...</span>
        </div>
    )
});

interface ArticleFormProps {
    articleId?: string; // If editing
}

export default function ArticleForm({ articleId }: ArticleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(!!articleId);
    const [saving, setSaving] = useState(false);
    
    // Dropdown options
    const [categories, setCategories] = useState<any[]>([]);
    const [authors, setAuthors] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);

    // Form fields
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [isSlugLocked, setIsSlugLocked] = useState(true);
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [featuredImage, setFeaturedImage] = useState("");
    const [status, setStatus] = useState("DRAFT");
    const [publishedAt, setPublishedAt] = useState("");
    const [readTime, setReadTime] = useState(5);
    const [isFeatured, setIsFeatured] = useState(false);
    const [actionButtonText, setActionButtonText] = useState("");
    const [actionButtonUrl, setActionButtonUrl] = useState("");
    
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedAuthorId, setSelectedAuthorId] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    
    // SEO Fields
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [metaKeywords, setMetaKeywords] = useState("");
    const [ogTitle, setOgTitle] = useState("");
    const [ogDescription, setOgDescription] = useState("");
    const [ogImage, setOgImage] = useState("");
    const [canonicalUrl, setCanonicalUrl] = useState("");

    // Quick Add modals
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [authorModalOpen, setAuthorModalOpen] = useState(false);
    const [newAuthorName, setNewAuthorName] = useState("");
    const [newAuthorTitle, setNewAuthorTitle] = useState("");

    // Load initial dropdowns
    const loadDropdowns = async () => {
        try {
            const [resCats, resAuthors, resTags] = await Promise.all([
                fetch("/api/dashboard/blog/categories"),
                fetch("/api/dashboard/blog/authors"),
                fetch("/api/dashboard/blog/tags")
            ]);
            const catsData = await resCats.json();
            const authorsData = await resAuthors.json();
            const tagsData = await resTags.json();
            
            if (catsData.success) setCategories(catsData.categories);
            if (authorsData.success) setAuthors(authorsData.authors);
            if (tagsData.success) setTags(tagsData.tags);
        } catch (err) {
            console.error("Failed to load options:", err);
        }
    };

    // Load article if editing
    const loadArticle = async () => {
        if (!articleId) return;
        try {
            const res = await fetch(`/api/dashboard/blog/articles/${articleId}`);
            const data = await res.json();
            if (data.success && data.article) {
                const a = data.article;
                setTitle(a.title);
                setSlug(a.slug);
                setIsSlugLocked(false); // don't overwrite manual slug of existing article
                setSummary(a.summary || "");
                setContent(a.content || "");
                setFeaturedImage(a.featuredImage || "");
                setStatus(a.status);
                setPublishedAt(a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "");
                setReadTime(a.readTime || 5);
                setIsFeatured(a.isFeatured || false);
                setActionButtonText(a.actionButtonText || "");
                setActionButtonUrl(a.actionButtonUrl || "");
                
                setSelectedCategoryId(a.categoryId);
                setSelectedAuthorId(a.authorId);
                setSelectedTagIds(a.tags?.map((t: any) => t.id) || []);
                
                // SEO
                setMetaTitle(a.metaTitle || "");
                setMetaDescription(a.metaDescription || "");
                setMetaKeywords(a.metaKeywords || "");
                setOgTitle(a.ogTitle || "");
                setOgDescription(a.ogDescription || "");
                setOgImage(a.ogImage || "");
                setCanonicalUrl(a.canonicalUrl || "");
            } else {
                alert("المقال غير موجود");
                router.push("/dashboard/blog");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDropdowns();
        if (articleId) {
            loadArticle();
        }
    }, [articleId]);

    // Handle Title change for slug generation
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        if (isSlugLocked) {
            setSlug(slugify(val));
        }
    };

    // Drag-and-drop Image Upload
    const [uploadingImage, setUploadingImage] = useState(false);
    const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/dashboard/blog/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success && data.url) {
                setFeaturedImage(data.url);
            } else {
                alert(data.error || "فشل رفع الصورة");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingImage(false);
        }
    };

    // Quick Add Category Action
    const handleQuickAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName) return;
        try {
            const res = await fetch("/api/dashboard/blog/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName })
            });
            const data = await res.json();
            if (data.success) {
                setCategories([...categories, data.category]);
                setSelectedCategoryId(data.category.id);
                setNewCatName("");
                setCatModalOpen(false);
            } else {
                alert(data.error || "فشل إضافة التصنيف");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Quick Add Author Action
    const handleQuickAddAuthor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAuthorName) return;
        try {
            const res = await fetch("/api/dashboard/blog/authors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newAuthorName, title: newAuthorTitle })
            });
            const data = await res.json();
            if (data.success) {
                setAuthors([...authors, data.author]);
                setSelectedAuthorId(data.author.id);
                setNewAuthorName("");
                setNewAuthorTitle("");
                setAuthorModalOpen(false);
            } else {
                alert(data.error || "فشل إضافة المؤلف");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Toggle selected tags
    const handleTagToggle = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
        } else {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
    };

    // Form Submit (Save / Update)
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title) return alert("عنوان المقال مطلوب");
        if (!content) return alert("محتوى المقال مطلوب");
        if (!selectedCategoryId) return alert("يرجى اختيار تصنيف للمقال");
        
        setSaving(true);

        const payload = {
            title,
            slug,
            content,
            summary,
            featuredImage,
            status,
            readTime,
            isFeatured,
            actionButtonText,
            actionButtonUrl,
            publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
            authorId: selectedAuthorId || null,
            categoryId: selectedCategoryId,
            tags: selectedTagIds,
            
            // SEO
            metaTitle,
            metaDescription,
            metaKeywords,
            ogTitle,
            ogDescription,
            ogImage,
            canonicalUrl
        };

        try {
            const url = articleId ? `/api/dashboard/blog/articles/${articleId}` : "/api/dashboard/blog/articles";
            const method = articleId ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                router.push("/dashboard/blog");
            } else {
                alert(data.error || "حدث خطأ أثناء حفظ المقال");
            }
        } catch (err) {
            console.error(err);
            alert("فشل الاتصال بالخادم لحفظ المقال");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#16539a]" />
                <p className="text-slate-400 text-xs font-bold">جاري تحميل بيانات المقال والتوجيهات...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8 max-w-7xl mx-auto text-right pb-16" dir="rtl">
            {/* Header / Actions bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push("/dashboard/blog")}
                        className="rounded-xl border-slate-200 h-10 w-10 hover:bg-slate-50 transition-colors shadow-sm p-0 flex items-center justify-center"
                    >
                        <ArrowRight className="h-5 w-5 text-slate-500" />
                    </Button>
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {articleId ? "تعديل وتحرير المقال" : "كتابة خبر ومقال جديد"}
                        </h1>
                        <p className="text-slate-400 text-[11px] font-bold">قم بتنسيق المقال وإعداد حقول الـ SEO والنشر المجدول.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (slug) window.open(`/blog/${slug}?preview=true`, "_blank");
                        }}
                        disabled={!slug}
                        className="rounded-xl border-slate-200 font-bold flex items-center gap-1.5 text-xs h-10 px-4 text-slate-650"
                    >
                        <Eye className="w-4 h-4 text-slate-450" />
                        معاينة المقال
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl font-bold flex items-center gap-2 text-xs h-10 px-5 shadow-md shadow-blue-900/10"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "جاري الحفظ..." : "حفظ ونشر المقال"}
                    </Button>
                </div>
            </div>

            {/* Split Form Grid */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                
                {/* A. Left side (Main Editor Content) - 2 Cols */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Basic details */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white">
                        <CardContent className="p-6 space-y-4">
                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">عنوان المقال الرئيسي <span className="text-red-500">*</span></label>
                                <Input
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="اكتب عنواناً جذاباً ومؤثراً للفحص المهني..."
                                    className="rounded-xl h-11 border-slate-250 font-black text-slate-800 text-sm focus:border-[#16539a]"
                                    required
                                />
                            </div>

                            {/* Slug (URL) */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    الرابط الصديق لـ SEO (Slug) <span className="text-red-500">*</span>
                                    <span title="هذا هو رابط المقال على المتصفح. يفضل أن يكون بالإنجليزية والكلمات مفصولة بشرطة (-) لنتائج بحث ممتازة.">
                                        <HelpCircle size={12} className="text-slate-400 cursor-help" />
                                    </span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(slugify(e.target.value))}
                                            disabled={isSlugLocked}
                                            placeholder="guide-to-pass-saudi-accreditation"
                                            className="rounded-xl h-11 border-slate-250 font-latin text-xs font-bold text-slate-650 pr-4 pl-12"
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-latin font-bold text-slate-400">
                                            /blog/
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsSlugLocked(!isSlugLocked)}
                                        className="h-11 w-11 rounded-xl border-slate-200 p-0 flex items-center justify-center bg-slate-50"
                                    >
                                        {isSlugLocked ? <Lock className="h-4 w-4 text-slate-400" /> : <Unlock className="h-4 w-4 text-[#16539a]" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">ملخص المقال / مقتطف (Excerpt)</label>
                                <Textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="اكتب نبذة مختصرة عن المقال تظهر في بطاقات العرض وقائمة المقالات وتستخدم كوصف ميتا (Meta Description) افتراضي لجوجل..."
                                    className="rounded-xl min-h-[90px] border-slate-250 text-xs leading-relaxed text-slate-650"
                                />
                            </div>

                            {/* Action Button */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">نص الزر الداخلي بالمقال (Call to Action)</label>
                                    <Input
                                        value={actionButtonText}
                                        onChange={(e) => setActionButtonText(e.target.value)}
                                        placeholder="مثال: سجل في الفحص المهني الآن"
                                        className="rounded-xl h-11 border-slate-250 text-xs text-slate-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">رابط الزر (URL)</label>
                                    <Input
                                        value={actionButtonUrl}
                                        onChange={(e) => setActionButtonUrl(e.target.value)}
                                        placeholder="مثال: /pricing"
                                        className="rounded-xl h-11 border-slate-250 text-xs text-slate-700 font-latin text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rich Text Editor */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                            <CardTitle className="text-sm font-black text-slate-800">محتوى المقال التفصيلي <span className="text-red-500">*</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <TiptapEditor value={content} onChange={setContent} />
                        </CardContent>
                    </Card>

                    {/* SEO Config */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6 flex flex-row items-center gap-2">
                            <Globe className="w-4 h-4 text-[#16539a]" />
                            <CardTitle className="text-sm font-black text-slate-800">إعدادات تحسين محركات البحث (Advanced SEO Control)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Meta Title */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500">عنوان الميتا (Meta Title)</label>
                                    <span className={`text-[10px] font-latin font-bold ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {metaTitle.length}/60 حرف
                                    </span>
                                </div>
                                <Input
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder={title || "دليلك الشامل للفحص المهني السعودي"}
                                    className="rounded-xl h-11 border-slate-250 text-xs text-slate-700"
                                />
                            </div>

                            {/* Meta Description */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500">وصف الميتا (Meta Description)</label>
                                    <span className={`text-[10px] font-latin font-bold ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {metaDescription.length}/160 حرف
                                    </span>
                                </div>
                                <Textarea
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder={summary || "تفاصيل ومعايير اختبارات الفحص المهني السعودي في مراكز اليمن وغيرها..."}
                                    className="rounded-xl min-h-[70px] border-slate-250 text-xs text-slate-650"
                                />
                            </div>

                            {/* Meta Keywords */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">الكلمات المفتاحية (Keywords) - مفصولة بفاصلة</label>
                                <Input
                                    value={metaKeywords}
                                    onChange={(e) => setMetaKeywords(e.target.value)}
                                    placeholder="الفحص المهني, اختبارات تجريبية, السعودية, الاعتماد المهني"
                                    className="rounded-xl h-11 border-slate-250 text-xs text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Canonical URL */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">الرابط القانوني (Canonical URL)</label>
                                    <Input
                                        value={canonicalUrl}
                                        onChange={(e) => setCanonicalUrl(e.target.value)}
                                        placeholder="https://pacc.sa/blog/original-article"
                                        className="rounded-xl h-11 border-slate-250 text-xs text-slate-700 font-latin font-semibold"
                                    />
                                </div>

                                {/* Custom OG Image */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">صورة مخصصة للمشاركة (OG Image)</label>
                                    <Input
                                        value={ogImage}
                                        onChange={(e) => setOgImage(e.target.value)}
                                        placeholder="اتركها فارغة لاستخدام الصورة البارزة افتراضياً"
                                        className="rounded-xl h-11 border-slate-250 text-xs text-slate-700 font-latin font-semibold"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* B. Right side (Metadata & Media Settings) - 1 Col */}
                <div className="space-y-6">
                    
                    {/* Publishing Lifecyle status */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                            <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#16539a]" />
                                حالة النشر والجدولة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Status */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">الحالة</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="rounded-xl h-11 border-slate-250 text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white">
                                        <SelectValue placeholder="اختر حالة النشر" />
                                    </SelectTrigger>
                                    <SelectContent className="text-right" dir="rtl">
                                        <SelectItem value="DRAFT">مسودة (Draft)</SelectItem>
                                        <SelectItem value="PUBLISHED">منشور فوراً (Published)</SelectItem>
                                        <SelectItem value="SCHEDULED">جدولة نشر زمنية (Scheduled)</SelectItem>
                                        <SelectItem value="ARCHIVED">أرشفة المقال (Archived)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Scheduled/Publish Date */}
                            {(status === "SCHEDULED" || status === "PUBLISHED") && (
                                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        تاريخ ووقت النشر 
                                        {status === "SCHEDULED" ? <span className="text-red-500">*</span> : ""}
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={publishedAt}
                                        onChange={(e) => setPublishedAt(e.target.value)}
                                        className="rounded-xl h-11 border-slate-250 text-xs font-latin text-slate-650"
                                        required={status === "SCHEDULED"}
                                    />
                                    {status === "SCHEDULED" && (
                                        <span className="text-[10px] text-slate-400 font-bold block">
                                            سيتم نشر المقال للموقع العام تلقائياً فور حلول الوقت المحدد.
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Options */}
                            <div className="pt-2 flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-650 select-none">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="rounded text-[#16539a] focus:ring-[#16539a] border-slate-350"
                                    />
                                    مقال مثبت/مميز (Featured)
                                </label>
                            </div>


                        </CardContent>
                    </Card>

                    {/* Featured Image upload card */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                            <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-[#5c9e45]" />
                                الصورة البارزة للمقال (Featured Image)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {featuredImage ? (
                                <div className="space-y-3 relative group">
                                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm aspect-[16/9] relative bg-slate-50">
                                        <img 
                                            src={featuredImage} 
                                            alt="Featured Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFeaturedImage("")}
                                            className="absolute top-2 left-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-colors"
                                            title="حذف الصورة"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-latin font-bold text-slate-400 block break-all text-left">
                                        {featuredImage}
                                    </span>
                                </div>
                            ) : (
                                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#16539a]/60 hover:bg-slate-50/50 p-6 text-center cursor-pointer transition-all duration-300 group">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFeaturedImageUpload}
                                        disabled={uploadingImage}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <UploadCloud className={`h-10 w-10 ${uploadingImage ? 'animate-pulse text-amber-500' : 'text-slate-450 group-hover:text-[#16539a]'}`} />
                                        <div>
                                            <span className="text-xs font-black text-slate-800 block">اسحب وأسقط الصورة البارزة هنا</span>
                                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">صيغ PNG, JPG, WEBP حتى 5 ميجابايت</span>
                                        </div>
                                        {uploadingImage && (
                                            <span className="text-[10px] text-amber-600 font-bold animate-pulse">جاري الرفع للـ Cloudinary...</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Taxonomy Selectors (Category, Author, Tags) */}
                    <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                            <CardTitle className="text-sm font-black text-slate-800">التصنيفات والتاغات</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Category selector */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500">التصنيف الرئيسي <span className="text-red-500">*</span></label>
                                    
                                    {/* Quick add category modal trigger */}
                                    <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-[10px] text-[#16539a] font-bold hover:underline flex items-center gap-0.5">
                                                <Plus size={10} /> تصنيف جديد
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="text-right" dir="rtl">
                                            <form onSubmit={handleQuickAddCategory}>
                                                <DialogHeader>
                                                    <DialogTitle className="text-sm font-black">إضافة تصنيف سريع</DialogTitle>
                                                </DialogHeader>
                                                <div className="my-4">
                                                    <Input 
                                                        value={newCatName}
                                                        onChange={(e) => setNewCatName(e.target.value)}
                                                        placeholder="توجيهات فنية"
                                                        className="rounded-xl text-xs h-10"
                                                        required
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit" className="bg-[#16539a] text-white rounded-xl text-xs font-bold">إضافة</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger className="rounded-xl h-11 border-slate-250 text-xs text-slate-700 bg-slate-50">
                                        <SelectValue placeholder="اختر تصنيف المقال" />
                                    </SelectTrigger>
                                    <SelectContent className="text-right" dir="rtl">
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>



                            {/* Tags Multi-select Checklist */}
                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1">الوسوم (Tags)</label>
                                <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3 max-h-[140px] overflow-y-auto space-y-1.5">
                                    {tags.map(tag => (
                                        <label key={tag.id} className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={selectedTagIds.includes(tag.id)}
                                                onChange={() => handleTagToggle(tag.id)}
                                                className="rounded text-[#16539a] focus:ring-[#16539a] border-slate-350"
                                            />
                                            {tag.name}
                                        </label>
                                    ))}
                                    {tags.length === 0 && (
                                        <span className="text-[10px] text-slate-400 font-bold block text-center py-2">لا توجد وسوم مضافة بعد.</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
