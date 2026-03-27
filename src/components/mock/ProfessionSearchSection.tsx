"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, Briefcase, PlayCircle } from "lucide-react";

export function ProfessionSearchSection() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [professions, setProfessions] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedSlug, setSelectedSlug] = useState("");

    useEffect(() => {
        fetch("/api/mock/public/professions")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProfessions(data);
            })
            .catch(err => console.error(err));
    }, []);

    const filtered = professions
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    const handleSelect = (slug: string, name: string) => {
        setSearchQuery(name);
        setSelectedSlug(slug);
        setShowResults(false);
    };

    const handleStart = () => {
        if (selectedSlug) {
            router.push(`/professions/${selectedSlug}`);
        } else if (filtered.length > 0) {
            router.push(`/professions/${filtered[0].slug}`);
        }
    };

    return (
        <section id="search" className="py-20 md:py-24 relative overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="bg-gradient-to-br from-[#0a0f1c] to-[#16539a] rounded-[2rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5c9e45] rounded-full blur-[120px] opacity-15 transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[100px] opacity-15 transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                        <div className="text-white text-right">
                            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
                                ابحث عن تصنيفك المهني <br />
                                <span className="text-[#5c9e45]">وبادر بتجربة التقييم الآن</span>
                            </h2>
                            <p className="text-base md:text-lg text-slate-300 mb-6 max-w-lg leading-relaxed">
                                نوفر بيئة اختبار تحاكي المعايير الرسمية للاعتماد المهني في مختلف التخصصات. ابحث عن مهنتك، وقيّم جاهزيتك مجاناً وبكل موثوقية.
                            </p>
                        </div>

                        <div className="relative w-full max-w-lg mx-auto lg:mx-0">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative w-full">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Briefcase size={18} />
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
                                        className="w-full h-14 bg-white border-2 border-transparent focus:border-[#5c9e45] rounded-xl pl-4 pr-11 text-base text-slate-800 placeholder-slate-400 shadow-xl transition-all focus:outline-none"
                                    />
                                    
                                    <AnimatePresence>
                                        {showResults && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2 max-h-60 overflow-y-auto"
                                            >
                                                {filtered.length > 0 ? (
                                                    filtered.map((prof) => (
                                                        <button 
                                                            key={prof.id}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent onBlur from hiding the list before click is processed
                                                                handleSelect(prof.slug, prof.name);
                                                            }}
                                                            className="w-full text-right flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                                                        >
                                                            <div className="font-bold text-slate-700 group-hover:text-[#16539a]">{prof.name}</div>
                                                            <ChevronLeft size={16} className="text-slate-300 group-hover:text-[#5c9e45] transform transition-transform group-hover:-translate-x-1" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-5 text-center text-slate-500 text-sm">
                                                        لم نجد مهنتك. جرّب اسم آخر.
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button 
                                    onClick={handleStart}
                                    disabled={!selectedSlug && filtered.length === 0}
                                    className="h-14 px-7 bg-[#5c9e45] hover:bg-[#4d853a] disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-green-900/30 transition-all flex items-center justify-center gap-2 shrink-0"
                                >
                                    <PlayCircle size={18} />
                                    ابدأ الآن
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            {showResults && <div className="fixed inset-0 z-0" onClick={() => setShowResults(false)} />}
        </section>
    );
}
