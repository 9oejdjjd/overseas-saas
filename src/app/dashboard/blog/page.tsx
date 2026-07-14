"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import { 
    Plus, Search, RefreshCw, Edit, Trash2, Calendar, Eye, 
    BookOpen, Tag, Users, FolderOpen, AlertCircle, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

// Helper components for Access Denied and Loading
function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-slate-100 rounded-3xl shadow-sm w-full animate-in fade-in-50" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">عذراً، الوصول غير مصرح به</h2>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed">
                ليس لديك الصلاحيات الكافية للوصول إلى إدارة الأخبار والمقالات. يرجى مراجعة المسؤول المالي أو مدير النظام للحصول على الصلاحيات المطلوبة.
            </p>
        </div>
    );
}

export default function BlogDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // UI state
    const [articles, setArticles] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [authors, setAuthors] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    
    // Modal states
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [authorModalOpen, setAuthorModalOpen] = useState(false);
    
    // Create new entity states (modals)
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategorySlug, setNewCategorySlug] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [newAuthorName, setNewAuthorName] = useState("");
    const [newAuthorTitle, setNewAuthorTitle] = useState("");
    const [newAuthorBio, setNewAuthorBio] = useState("");
    
    const [submitting, setSubmitting] = useState(false);

    // Fetch initial data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Get articles
            let url = `/api/dashboard/blog/articles?search=${encodeURIComponent(search)}`;
            if (selectedCategory !== "all") url += `&categoryId=${selectedCategory}`;
            if (selectedStatus !== "all") url += `&status=${selectedStatus}`;
            
            const resArticles = await fetch(url);
            const dataArticles = await resArticles.json();
            if (dataArticles.success) setArticles(dataArticles.articles);

            // Get categories
            const resCats = await fetch("/api/dashboard/blog/categories");
            const dataCats = await resCats.json();
            if (dataCats.success) setCategories(dataCats.categories);

            // Get authors
            const resAuthors = await fetch("/api/dashboard/blog/authors");
            const dataAuthors = await resAuthors.json();
            if (dataAuthors.success) setAuthors(dataAuthors.authors);

            // Get tags
            const resTags = await fetch("/api/dashboard/blog/tags");
            const dataTags = await resTags.json();
            if (dataTags.success) setTags(dataTags.tags);

        } catch (error) {
            console.error("Failed to load CMS data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, search, selectedCategory, selectedStatus]);

    // Handle Article Delete
    const handleDeleteArticle = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المقال نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
        
        try {
            const res = await fetch(`/api/dashboard/blog/articles/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setArticles(articles.filter(a => a.id !== id));
            } else {
                alert(data.error || "فشل حذف المقال");
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الحذف");
        }
    };

    // Quick Add Category
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/dashboard/blog/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName, slug: newCategorySlug })
            });
            const data = await res.json();
            if (data.success) {
                setCategories([...categories, data.category]);
                setNewCategoryName("");
                setNewCategorySlug("");
                setCategoryModalOpen(false);
            } else {
                alert(data.error || "فشل إضافة التصنيف");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Add Tag
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/dashboard/blog/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName })
            });
            const data = await res.json();
            if (data.success) {
                setTags([...tags, data.tag]);
                setNewTagName("");
                setTagModalOpen(false);
            } else {
                alert(data.error || "فشل إضافة الوسم");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Add Author
    const handleAddAuthor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAuthorName) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/dashboard/blog/authors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newAuthorName, title: newAuthorTitle, bio: newAuthorBio })
            });
            const data = await res.json();
            if (data.success) {
                setAuthors([...authors, data.author]);
                setNewAuthorName("");
                setNewAuthorTitle("");
                setNewAuthorBio("");
                setAuthorModalOpen(false);
            } else {
                alert(data.error || "فشل إضافة الكاتب");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // Session loader
    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#16539a]" />
                <p className="text-slate-400 text-xs animate-pulse font-bold">جاري التحقق من الصلاحيات...</p>
            </div>
        );
    }

    // Role-based Access check
    const allowedRoles = ["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT", "FOLLOW_UP_STAFF"];
    if (!session || !allowedRoles.includes(session.user.role)) {
        return <AccessDenied />;
    }

    const canEdit = session.user.role === "ADMIN" || session.user.role === "REGISTRATION_STAFF";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PUBLISHED":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">منشور</Badge>;
            case "DRAFT":
                return <Badge className="bg-slate-400 hover:bg-slate-500 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">مسودة</Badge>;
            case "SCHEDULED":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">مجدول</Badge>;
            case "ARCHIVED":
                return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">أرشيف</Badge>;
            default:
                return <Badge className="bg-slate-400 text-white text-[10px]">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto text-right animate-in fade-in-50 duration-500" dir="rtl">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الأخبار والمقالات (News CMS)</h1>
                    <p className="text-slate-500 text-xs">إدارة محتوى المدونة، تحسين الـ SEO، تصنيفات المقالات، وملفات المؤلفين.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {/* Refresh button */}
                    <Button 
                        onClick={fetchData} 
                        variant="outline" 
                        size="icon"
                        className="rounded-xl border-slate-200 h-10 w-10 hover:bg-slate-50 transition-colors shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    {/* Modals launchers */}
                    <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs">
                                <FolderOpen className="w-4 h-4 text-[#16539a]" />
                                إدارة التصنيفات ({categories.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="text-right" dir="rtl">
                            <form onSubmit={handleAddCategory}>
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black text-slate-800">إضافة تصنيف جديد</DialogTitle>
                                    <DialogDescription className="text-xs text-slate-400">
                                        التصنيفات تساعد في تنظيم المقالات للمستخدمين في الموقع العام.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 my-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500">اسم التصنيف (بالعربية)</label>
                                        <Input 
                                            value={newCategoryName} 
                                            onChange={(e) => setNewCategoryName(e.target.value)} 
                                            placeholder="مثال: توجيهات فنية" 
                                            className="rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500">الرابط الصديق / Slug (اختياري)</label>
                                        <Input 
                                            value={newCategorySlug} 
                                            onChange={(e) => setNewCategorySlug(e.target.value)} 
                                            placeholder="مثال: technical-guide" 
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="rounded-xl text-xs font-bold">إلغاء</Button>
                                    <Button type="submit" disabled={submitting} className="bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl text-xs font-bold">
                                        {submitting ? "جاري الإضافة..." : "حفظ التصنيف"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={tagModalOpen} onOpenChange={setTagModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs">
                                <Tag className="w-4 h-4 text-[#5c9e45]" />
                                إدارة الوسوم ({tags.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="text-right" dir="rtl">
                            <form onSubmit={handleAddTag}>
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black text-slate-800">إضافة وسم جديد</DialogTitle>
                                    <DialogDescription className="text-xs text-slate-400">
                                        الوسوم (Tags) تعزز الترابط الداخلي بين المقالات والـ SEO.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 my-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500">اسم الوسم</label>
                                        <Input 
                                            value={newTagName} 
                                            onChange={(e) => setNewTagName(e.target.value)} 
                                            placeholder="مثال: الفحص المهني" 
                                            className="rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button type="button" variant="outline" onClick={() => setTagModalOpen(false)} className="rounded-xl text-xs font-bold">إلغاء</Button>
                                    <Button type="submit" disabled={submitting} className="bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl text-xs font-bold">
                                        {submitting ? "جاري الإضافة..." : "حفظ الوسم"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>



                    {/* New Article Button */}
                    {canEdit && (
                        <Button 
                            onClick={() => router.push("/dashboard/blog/new")} 
                            className="bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl font-bold flex items-center gap-2 text-xs h-10 px-5 shadow-md shadow-blue-900/10"
                        >
                            <Plus className="w-4 h-4" />
                            كتابة مقال جديد
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Area Card */}
            <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="البحث في المقالات..."
                                className="pr-10 rounded-xl bg-slate-50 focus:bg-white text-xs h-11 border-slate-250"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="rounded-xl bg-slate-50 text-xs h-11 border-slate-250">
                                    <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent className="text-right" dir="rtl">
                                    <SelectItem value="all">كل التصنيفات</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="rounded-xl bg-slate-50 text-xs h-11 border-slate-250">
                                    <SelectValue placeholder="اختر حالة النشر" />
                                </SelectTrigger>
                                <SelectContent className="text-right" dir="rtl">
                                    <SelectItem value="all">كل الحالات</SelectItem>
                                    <SelectItem value="PUBLISHED">منشور</SelectItem>
                                    <SelectItem value="DRAFT">مسودة</SelectItem>
                                    <SelectItem value="SCHEDULED">مجدول</SelectItem>
                                    <SelectItem value="ARCHIVED">أرشيف</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Articles Table Card */}
            <Card className="border border-slate-200/80 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-[#16539a]" />
                            <p className="text-slate-400 text-xs font-bold">جاري تحميل جدول المقالات...</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-20 bg-white">
                            <BookOpen size={44} className="text-slate-300 mx-auto mb-4" />
                            <h4 className="font-bold text-slate-800 text-base mb-1">لم نجد أي مقالات متطابقة</h4>
                            <p className="text-slate-400 text-xs font-semibold">قم بتغيير كلمات البحث أو الفلاتر، أو ابدأ بكتابة مقال جديد.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                        <TableHead className="text-right font-black text-slate-700 py-4 pr-6">المقال والخبر</TableHead>
                                        <TableHead className="text-right font-black text-slate-700 py-4">التصنيف</TableHead>

                                        <TableHead className="text-right font-black text-slate-700 py-4">حالة النشر</TableHead>
                                        <TableHead className="text-right font-black text-slate-700 py-4">تاريخ النشر</TableHead>
                                        <TableHead className="text-right font-black text-slate-700 py-4">المشاهدات</TableHead>
                                        <TableHead className="text-left font-black text-slate-700 py-4 pl-6">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articles.map((article) => (
                                        <TableRow key={article.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                            <TableCell className="py-4 pr-6">
                                                <div className="space-y-1">
                                                    <span className="font-black text-slate-800 hover:text-[#16539a] cursor-pointer transition-colors block text-sm">
                                                        {article.title}
                                                    </span>
                                                    <span className="text-[10px] font-latin font-bold text-slate-400 block tracking-wide">
                                                        /{article.slug}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="border-blue-100 bg-blue-50 text-[#16539a] text-[10px] px-2 py-0.5 rounded-lg font-bold">
                                                    {article.category?.name || "بدون تصنيف"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getStatusBadge(article.status)}
                                            </TableCell>
                                            <TableCell className="py-4 text-xs font-latin text-slate-500 font-semibold">
                                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("ar-SA", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric"
                                                }) : "-"}
                                            </TableCell>
                                            <TableCell className="py-4 text-xs font-latin text-slate-500 font-semibold">
                                                <div className="flex items-center gap-1">
                                                    <Eye size={12} className="text-slate-400" />
                                                    <span>{article.views}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 pl-6 text-left">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {article.status === "PUBLISHED" && (
                                                        <a 
                                                            href={`/blog/${article.slug}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                                            title="عرض في الموقع العام"
                                                        >
                                                            <ExternalLink size={15} />
                                                        </a>
                                                    )}
                                                    
                                                    {canEdit && (
                                                        <>
                                                            <Button
                                                                onClick={() => router.push(`/dashboard/blog/edit/${article.id}`)}
                                                                variant="outline"
                                                                size="icon"
                                                                className="rounded-xl border-slate-200 hover:border-blue-200 hover:text-blue-650 h-8 w-8 transition-all"
                                                                title="تعديل المقال"
                                                            >
                                                                <Edit size={14} />
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteArticle(article.id)}
                                                                variant="outline"
                                                                size="icon"
                                                                className="rounded-xl border-slate-200 hover:border-red-200 hover:text-red-650 h-8 w-8 transition-all"
                                                                title="حذف المقال"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
