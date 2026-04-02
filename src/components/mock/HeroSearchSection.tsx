"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, ArrowLeft, CheckCircle, Sparkles, GraduationCap, ChevronLeft } from "lucide-react";

interface Profession {
    id: string;
    name: string;
    slug: string;
}

export function HeroSearchSection({ professions }: { professions: Profession[] }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [selectedSlug, setSelectedSlug] = useState("");

    const filteredProfessions = professions
        .filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return (
        <>
            {/* PROFESSION SEARCH */}
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="w-full max-w-xl relative group z-30"
            >
                <label className="text-sm font-bold text-slate-400/80 mb-3 block flex items-center gap-2">
                    <Search size={14} /> ابحث عن مهنتك وابدأ الاختبار:
                </label>

                <div className="relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 bg-white/10 p-2 rounded-full backdrop-blur-md">
                        <GraduationCap size={20} className="text-[#5c9e45]" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                            setSelectedSlug("");
                        }}
                        onFocus={() => setShowResults(true)}
                        onBlur={() => setShowResults(false)}
                        placeholder="ابحث عن مهنتك..."
                        className="w-full h-[60px] bg-white/[0.08] border border-white/15 focus:border-[#5c9e45]/60 rounded-2xl pl-6 pr-16 text-lg text-white placeholder-slate-400/60 backdrop-blur-xl transition-all shadow-xl focus:outline-none focus:ring-4 focus:ring-[#5c9e45]/15 focus:bg-white/[0.12]"
                    />
                    <button
                        onClick={() => {
                            if (selectedSlug) router.push(`/${selectedSlug}`);
                            else if (filteredProfessions.length > 0) router.push(`/${filteredProfessions[0].slug}`);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-gradient-to-l from-[#16539a] to-[#2563eb] w-11 h-11 flex items-center justify-center rounded-xl shadow-lg border border-white/10 hover:scale-105 transition-transform pointer-events-auto"
                    >
                        <ArrowLeft size={18} className="text-white" />
                    </button>
                </div>

                {/* AUTOCOMPLETE */}
                <AnimatePresence>
                    {showResults && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 left-0 mt-3 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 overflow-hidden z-50 flex flex-col"
                        >
                            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">نتائج البحث</span>
                                <span className="text-xs text-slate-400">{filteredProfessions.length} مهنة</span>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                                {filteredProfessions.length > 0 ? (
                                    filteredProfessions.map(prof => (
                                        <button
                                            key={prof.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setSearchQuery(prof.name);
                                                setSelectedSlug(prof.slug);
                                                setShowResults(false);
                                            }}
                                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#16539a] flex items-center justify-center font-bold">
                                                    {prof.name.substring(0, 1)}
                                                </div>
                                                <div className="text-right">
                                                    <h4 className="font-bold text-slate-800 text-base group-hover:text-[#16539a] transition-colors">{prof.name}</h4>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#5c9e45] group-hover:text-white transition-all transform group-hover:-translate-x-1">
                                                <ChevronLeft size={18} />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                        <Search className="w-8 h-8 text-slate-300 mb-3" />
                                        <p>لم نجد مهنتك. جرّب اسم آخر.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Click outside handler for dropdown */}
            {showResults && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowResults(false)}
                />
            )}
        </>
    );
}
