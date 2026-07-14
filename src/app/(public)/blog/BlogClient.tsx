"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, User, ArrowLeft, BookOpen, Clock, Sparkles, Star, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/mock/LandingComponents";

interface BlogClientProps {
    initialArticles: any[];
    initialPopular: any[];
    initialCategories: string[];
}

export default function BlogClient({ initialArticles, initialPopular, initialCategories }: BlogClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [searchQuery, setSearchQuery] = useState("");

    const blogPosts = initialArticles.map((article: any) => {
        const dateObj = new Date(article.publishedAt || article.createdAt);
        const formattedDate = dateObj.toLocaleDateString("ar-SA", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        return {
            slug: article.slug,
            title: article.title,
            desc: article.summary || "",
            date: formattedDate,
            author: article.author?.name || "كاتب الموقع",
            authorRole: article.author?.title || "خبير فني",
            readTime: `${article.readTime || 5} دقائق`,
            category: article.category?.name || "عام",
            image: article.featuredImage || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=800",
            featured: article.isFeatured
        };
    });

    const popularPosts = initialPopular.map((article: any) => ({
        title: article.title,
        slug: article.slug,
        views: `+${article.views || 0} قراءة`,
        category: article.category?.name || "عام"
    }));

    const categories = initialCategories;

    const filteredPosts = blogPosts.filter(post => {
        const matchesCategory = selectedCategory === "الكل" || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              post.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Find featured, or fall back to first post if none marked as featured
    let featuredPost = blogPosts.find(p => p.featured);
    if (!featuredPost && blogPosts.length > 0) {
        featuredPost = blogPosts[0];
    }

    return (
        <main className="min-h-screen pt-32 pb-0 bg-gradient-to-b from-[#f8fafc] via-slate-50 to-white font-sans text-slate-800 relative overflow-hidden">
            
            {/* Ambient Lights */}
            <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#16539a]/5 rounded-full blur-[110px] pointer-events-none" />
            <div className="absolute top-[30%] left-0 w-[500px] h-[500px] bg-[#5c9e45]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay pointer-events-none" />

            {/* Header Area */}
            <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/60 mb-6 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-[#5c9e45] animate-pulse" />
                    <span className="text-xs font-black text-[#16539a]">المدونة المهنية والدليل المعرفي للعمالة</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight"
                >
                    ثقافة مهنية تضمن <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16539a] to-[#5c9e45]">تميزك واجتيازك بنجاح</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
                >
                    مقالات ودراسات وخطوات مصورة بأيدي خبراء معتمدين لتسهيل طريقك لنيل الاعتماد المهني السعودي للعمل بثقة وأمان.
                </motion.p>
            </div>

            {/* 📰 SECTION 1: State-of-the-Art Editorial Magazine Grid (Featured + Side Widgets) */}
            {selectedCategory === "الكل" && searchQuery === "" && (
                <div className="max-w-7xl mx-auto px-6 mb-24 relative z-10 text-right">
                    <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                        
                        {/* A. Massive Digital Magazine Featured Article (Left/Center 2 Cols) */}
                        {featuredPost && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7 }}
                                className="lg:col-span-2 bg-gradient-to-br from-[#0c2340] via-[#0f2e54] to-slate-950 text-white rounded-[2.5rem] border border-blue-950/40 shadow-2xl overflow-hidden flex flex-col justify-between relative group"
                            >
                                {/* Grid texture */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                                <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] bg-[#16539a]/15 rounded-full blur-[90px] pointer-events-none" />
                                <div className="absolute bottom-[-30%] left-[-10%] w-[450px] h-[450px] bg-[#5c9e45]/15 rounded-full blur-[100px] pointer-events-none" />

                                <Link href={`/blog/${featuredPost.slug}`} className="flex flex-col h-full">
                                    <div className="relative h-[280px] sm:h-[350px] overflow-hidden shrink-0">
                                    <img
                                        src={featuredPost.image}
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c2340] via-[#0c2340]/20 to-transparent" />
                                    <div className="absolute top-6 right-6 px-4 py-2 bg-[#5c9e45] text-white text-[10px] font-black rounded-full shadow-lg shadow-green-950/30 flex items-center gap-1.5 z-10">
                                        <Sparkles size={11} className="animate-spin" /> مقال مميز ومقترح بقوة
                                    </div>
                                </div>

                                <div className="p-8 sm:p-10 flex flex-col justify-between flex-1 relative z-10">
                                    <div>
                                        <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-emerald-400 text-xs font-black rounded-xl mb-5 inline-block">
                                            {featuredPost.category}
                                        </span>
                                        
                                        <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-snug tracking-tight">
                                            {featuredPost.title}
                                        </h2>

                                        <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium max-w-3xl opacity-85">
                                            {featuredPost.desc}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex items-center justify-end">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                            <Calendar size={13} /> {featuredPost.date}
                                        </div>
                                    </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}

                        {/* B. Glowing "Popular Reads" Widget (Right 1 Col) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 flex flex-col justify-between overflow-hidden relative group"
                        >
                            <div className="absolute top-[-40px] left-[-40px] w-24 h-24 bg-[#16539a]/5 rounded-full blur-xl pointer-events-none" />
                            
                            <div>
                                <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
                                    <TrendingUp size={20} className="text-[#16539a]" />
                                    <h3 className="text-lg font-black text-slate-900">الأكثر قراءة ومتابعة</h3>
                                </div>

                                <div className="space-y-6">
                                    {popularPosts.map((post, idx) => (
                                        <Link 
                                            key={idx} 
                                            href={`/blog/${post.slug}`}
                                            className="block p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-300 relative group/item"
                                        >
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-[#16539a] rounded-lg">
                                                    {post.category}
                                                </span>
                                                <span className="text-[10px] font-black text-[#5c9e45] flex items-center gap-1">
                                                    <Star size={10} fill="#5c9e45" /> {post.views}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-800 group-hover/item:text-[#16539a] transition-colors leading-snug">
                                                {post.title}
                                            </h4>
                                            <div className="absolute left-3 bottom-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <ArrowUpRight size={14} className="text-[#16539a]" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Decorative badge at bottom */}
                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-450 flex items-center justify-center gap-1.5">
                                    <Sparkles size={12} className="text-[#5c9e45]" />
                                    <span>يتم التحديث تلقائياً بناءً على تقييماتكم</span>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            )}

            {/* 📰 SECTION 2: Dynamic Category & Instant Filter Actions */}
            <div className="max-w-7xl mx-auto px-6 mb-16 relative z-10 text-right">
                <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        
                        {/* Dynamic Category Pill selectors */}
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCategory(c)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                                        selectedCategory === c
                                        ? 'bg-[#16539a] text-white shadow-md shadow-blue-900/10'
                                        : 'bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Custom instant search bar */}
                        <div className="w-full lg:max-w-xs relative">
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={16} className="text-[#16539a]" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث في المقالات..."
                                className="w-full h-11 bg-slate-50 border border-slate-200/80 focus:border-[#16539a] focus:ring-4 focus:ring-blue-500/5 rounded-xl pl-4 pr-11 text-xs text-slate-800 placeholder-slate-400 shadow-inner transition-all focus:outline-none"
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* 📰 SECTION 3: Premium Editorial Masonry Grid */}
            <div className="max-w-7xl mx-auto px-6 mb-24 z-20 relative">
                {selectedCategory === "الكل" && searchQuery === "" && (
                    <div className="border-b border-slate-200 pb-4 mb-8 text-right">
                        <h3 className="text-xl font-black text-slate-900">أحدث المقالات والأدلة المضافة</h3>
                        <p className="text-slate-400 text-xs font-bold mt-1">تصفح أرشيف المقالات المنشورة مؤخراً</p>
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post, i) => (
                            <motion.div
                                key={post.slug}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                className="bg-white border border-slate-200/80 rounded-[2.2rem] shadow-md hover:shadow-xl hover:border-[#16539a]/30 transition-all duration-350 flex flex-col justify-between overflow-hidden group relative text-right"
                            >
                                {/* Top colored indicator stripe on hover */}
                                <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-[#16539a] to-[#5c9e45] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <Link href={`/blog/${post.slug}`} className="flex flex-col h-full flex-1">
                                    <div>
                                        {/* Article Image Container */}
                                    <div className="relative h-[220px] overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                        />
                                        <div className="absolute bottom-4 right-4">
                                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[#16539a] text-[9px] font-black rounded-lg border border-slate-100 shadow-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Details */}
                                    <div className="p-6">
                                        <h4 className="font-black text-slate-800 text-base md:text-lg mb-3 leading-snug group-hover:text-[#16539a] transition-colors min-h-[48px]">
                                            {post.title}
                                        </h4>
                                        <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                                            {post.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 pt-4 border-t border-slate-100/60 flex items-center justify-end">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 font-latin">
                                        <Calendar size={12} /> {post.date}
                                    </div>
                                </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Fallback state when filtering produces no match */}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm">
                        <BookOpen size={40} className="text-slate-350 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-800 text-lg mb-2">عذراً، لم نجد أي مقالات مطابقة</h4>
                        <p className="text-slate-400 text-sm font-semibold">جرّب البحث بمصطلحات أخرى أو تغيير تصنيف التصفية.</p>
                        <button 
                            onClick={() => { setSearchQuery(""); setSelectedCategory("الكل"); }}
                            className="mt-6 px-6 py-2.5 bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl text-xs font-black transition-all"
                        >
                            عرض كل المقالات
                        </button>
                    </div>
                )}
            </div>

            {/* Global Footer */}
            <Footer />
        </main>
    );
}
