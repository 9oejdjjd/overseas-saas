"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, Briefcase, Clock, ClipboardList, Sparkles, Filter, ShieldCheck, HelpCircle, ArrowLeft, Wrench, Truck, Scissors, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/mock/LandingComponents";

interface Profession {
    id: string;
    name: string;
    slug: string;
    questionCount: number;
    examDuration: number;
}

interface GuideClientProps {
    initialProfessions: Profession[];
}

// Sectors Details with colors and step details
const sectors = [
    {
        id: "construction",
        name: "قطاع التشييد والبناء",
        desc: "يشمل المهن الكهربائية، السباكة، الدهان، اللياسة، والحدادة المسلحة.",
        icon: Wrench,
        color: "text-blue-405",
        glowColor: "shadow-blue-500/15 border-blue-500/30",
        bgClass: "from-[#0c2340] to-[#0f2e54]",
        tag: "التشييد والبناء",
        steps: [
            { title: "التأهيل التجريبي", desc: "محاكاة نظرية وعملية بالمنصة" },
            { title: "حجز الموعد", desc: "تحديد المركز والوقت الأنسب" },
            { title: "فحص الهيئة المعتمد", desc: "الاختبار الحرفي الميداني" },
            { title: "نيل الاعتماد المهني", desc: "الحصول على شهادة مزاولة المهنة" }
        ]
    },
    {
        id: "transport",
        name: "قطاع النقل والخدمات",
        desc: "يشمل سائقي النقل الثقيل والخفيف، عمال التحميل والتنزيل والخدمات اللوجستية.",
        icon: Truck,
        color: "text-emerald-405",
        glowColor: "shadow-emerald-500/15 border-emerald-500/30",
        bgClass: "from-[#052b1b] to-[#0d442a]",
        tag: "النقل والخدمات",
        steps: [
            { title: "تدريب على الإشارات واللوائح", desc: "محاكاة قوانين الفحص السعودي" },
            { title: "حجز موعد الفحص الميداني", desc: "تأمين حجز سريع بالمركز" },
            { title: "الاختبار الفعلي والمواصلات", desc: "الانطلاق للمركز ومرافق فني معتمد" },
            { title: "إصدار رخصة الاعتماد", desc: "اعتماد رسمي لمزاولة المهنة بالمملكة" }
        ]
    },
    {
        id: "textile",
        name: "قطاع النسيج والصناعة",
        desc: "يشمل الخياطة الرجالية والنسائية، نسيج السجاد، والمهن الصناعية الخفيفة.",
        icon: Scissors,
        color: "text-purple-405",
        glowColor: "shadow-purple-500/15 border-purple-500/30",
        bgClass: "from-[#291147] to-[#3a1a63]",
        tag: "النسيج والصناعة",
        steps: [
            { title: "اختبار فني وتصميم", desc: "تدريب على آلات النسيج والقياسات" },
            { title: "تسجيل المعاملات والملفات", desc: "تنظيم مستندات المهنة ورفعها" },
            { title: "التقييم الحسي والميكانيكي", desc: "فحص عملي لدقة الغرز والتفصيل" },
            { title: "الاعتماد الدولي المعتمد", desc: "ترقية تصنيفك المهني وشهادتك" }
        ]
    }
];

export default function GuideClient({ initialProfessions }: GuideClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    // Assign categories mock helper based on keywords
    const getCategoryForProfession = (name: string) => {
        if (name.includes("بناء") || name.includes("دهان") || name.includes("لياسة") || name.includes("سباكة") || name.includes("كهربائي")) {
            return "التشييد والبناء";
        }
        if (name.includes("سائق") || name.includes("تحميل") || name.includes("تنزيل") || name.includes("توصيل")) {
            return "النقل والخدمات";
        }
        if (name.includes("خياط") || name.includes("نسيج") || name.includes("صانع")) {
            return "النسيج والصناعة";
        }
        return "أخرى";
    };

    const getSectorIdForProfession = (name: string) => {
        const cat = getCategoryForProfession(name);
        if (cat === "التشييد والبناء") return "construction";
        if (cat === "النقل والخدمات") return "transport";
        if (cat === "النسيج والصناعة") return "textile";
        return "other";
    };

    const filteredProfessions = initialProfessions.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesSector = !selectedSector || getSectorIdForProfession(p.name) === selectedSector;

        return matchesSearch && matchesSector;
    });

    return (
        <main className="min-h-screen pt-32 pb-0 bg-gradient-to-b from-[#f8fafc] via-slate-50 to-white font-sans text-slate-800 relative overflow-hidden">
            
            {/* Ambient Background Lights */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-0 w-[600px] h-[600px] bg-[#5c9e45]/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay pointer-events-none" />

            {/* Header Area */}
            <div className="max-w-6xl mx-auto px-6 text-center mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/60 mb-6 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-[#5c9e45] animate-pulse" />
                    <span className="text-xs font-black text-[#16539a]">دليل المسارات والاعتمادات المهنية التفاعلي</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight"
                >
                    خريطة المسارات المهنية <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16539a] to-[#5c9e45]">المعتمدة للفحص المهني</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
                >
                    اكتشف مسار تأهيلك المعتمد خطوة بخطوة لكل قطاع حرفي وفني. تصفح تفاصيل اختبارات الفحص المهني السعودي واستعد للنجاح والاعتماد.
                </motion.p>
            </div>

            {/* 🌐 SECTION 1: Massive Interactive Sector Cards & Roadmaps */}
            <div className="max-w-7xl mx-auto px-6 mb-24 relative z-10 text-right">
                <div className="border-b border-slate-200/80 pb-5 mb-10">
                    <h2 className="text-2xl font-black text-slate-900">خرائط الطريق للقطاعات الكبرى</h2>
                    <p className="text-slate-500 text-xs font-bold mt-1">اختر القطاع لعرض تفاصيل الخطوات المتسلسلة لنيل الاعتماد الرسمي</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {sectors.map((sector) => {
                        const SectorIcon = sector.icon;
                        const isSelected = selectedSector === sector.id;
                        
                        return (
                            <motion.div
                                key={sector.id}
                                whileHover={{ y: -5 }}
                                onClick={() => setSelectedSector(isSelected ? null : sector.id)}
                                className={`rounded-[2.5rem] p-8 border cursor-pointer transition-all duration-500 bg-gradient-to-br ${
                                    sector.bgClass
                                } text-white relative overflow-hidden flex flex-col justify-between ${
                                    isSelected 
                                        ? `ring-4 ring-[#16539a]/40 ${sector.glowColor} scale-102` 
                                        : "border-slate-800/10 shadow-lg shadow-slate-100/50"
                                }`}
                            >
                                {/* Background design grid & mesh glow */}
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px]" />
                                <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl transition-all duration-500 ${
                                    isSelected ? "bg-white/20" : ""
                                }`} />

                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center text-white shrink-0">
                                            <SectorIcon size={24} />
                                        </div>
                                        <span className={`text-[10px] font-black px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 ${
                                            isSelected ? "bg-white text-[#16539a] border-white" : ""
                                        }`}>
                                            {isSelected ? "مسار نشط" : "عرض المسار"}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-black mb-3">{sector.name}</h3>
                                    <p className="text-xs text-white/70 leading-relaxed font-medium mb-8 min-h-[40px]">{sector.desc}</p>
                                </div>

                                {/* Dynamic roadmap elements */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="text-[10px] font-black text-white/50 mb-2">خطوات رحلة الاعتماد:</div>
                                    {sector.steps.map((step, idx) => (
                                        <div key={idx} className="flex gap-3 items-start group">
                                            <div className="w-5 h-5 rounded-full bg-white/10 border border-white/25 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black group-hover:bg-white group-hover:text-[#16539a] transition-all">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white">{step.title}</h4>
                                                <p className="text-[9px] text-white/60 mt-0.5">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* 🌐 SECTION 2: Filterable Interactive Career Directory */}
            <div className="max-w-7xl mx-auto px-6 mb-28 relative z-10 text-right">
                
                {/* Search & Dynamic Filter Actions */}
                <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 mb-10 text-right relative overflow-hidden">
                    <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-[#16539a]/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Briefcase size={20} className="text-[#16539a]" />
                                <span>البحث الفوري وتوجيه المهن</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">ابحث عن مهنتك لمعاينة المواصفات والبدء مباشرة بالاختبار التجريبي</p>
                        </div>
                        
                        {/* Search Input field */}
                        <div className="w-full md:max-w-md relative">
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={18} className="text-[#16539a]" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث بمسمى المهنة (مثال: سائق، دهان، خياط)..."
                                className="w-full h-12 bg-slate-50 border border-slate-200/80 focus:border-[#16539a] focus:ring-4 focus:ring-blue-500/5 rounded-xl pl-4 pr-12 text-sm text-slate-800 placeholder-slate-400 shadow-inner transition-all focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Active Selected Sector pill */}
                    {selectedSector && (
                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 text-xs">
                            <span className="font-bold text-slate-500">القطاع المختار حالياً:</span>
                            <span className="px-3.5 py-1 bg-[#16539a] text-white rounded-full font-black flex items-center gap-1.5 shadow-sm">
                                {sectors.find(s => s.id === selectedSector)?.name}
                                <button 
                                    onClick={() => setSelectedSector(null)}
                                    className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center font-bold text-[9px] hover:bg-white/30"
                                >
                                    ✕
                                </button>
                            </span>
                        </div>
                    )}
                </div>

                {/* Directory catalog count header */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-800">قائمة التصنيفات المهنية المطابقة</h3>
                    <span className="text-xs font-black text-[#16539a] bg-blue-50 border border-blue-100/60 px-3 py-1 rounded-full font-latin">
                        {filteredProfessions.length} مهنة متاحة
                    </span>
                </div>

                {/* Professions List Directory Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredProfessions.map((prof, i) => {
                            const pCategory = getCategoryForProfession(prof.name);
                            
                            return (
                                <motion.div
                                    key={prof.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.35, delay: i * 0.02 }}
                                    whileHover={{ y: -6 }}
                                    className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-md hover:shadow-xl hover:border-[#16539a]/30 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                                >
                                    {/* Glowing Hover Border Accent */}
                                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#16539a] to-[#5c9e45] opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div>
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-655 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#16539a]/5 group-hover:text-[#16539a] transition-all">
                                                <Briefcase size={22} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-base md:text-lg group-hover:text-[#16539a] transition-colors leading-tight">
                                                    {prof.name}
                                                </h4>
                                                <span className="text-[10px] px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-450 font-bold rounded-lg mt-1.5 inline-block">
                                                    {pCategory}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50/50 p-3 rounded-xl flex items-center gap-2 border border-slate-100">
                                                <Clock size={16} className="text-[#5c9e45] shrink-0" />
                                                <div>
                                                    <div className="text-[9px] font-bold text-slate-450">مدة الفحص الرسمي</div>
                                                    <div className="text-xs font-black text-slate-700 font-latin">{prof.examDuration} دقيقة</div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50/50 p-3 rounded-xl flex items-center gap-2 border border-slate-100">
                                                <ClipboardList size={16} className="text-[#16539a] shrink-0" />
                                                <div>
                                                    <div className="text-[9px] font-bold text-slate-450">عدد أسئلة المحاكاة</div>
                                                    <div className="text-xs font-black text-slate-700 font-latin">{prof.questionCount} سؤال</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Micro-Roadmap Stepper Indicator Inside Card */}
                                        <div className="mb-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                                            <span className="flex items-center gap-1 text-[#5c9e45]"><CheckCircle2 size={10} /> تأهيل</span>
                                            <span className="w-4 h-[1px] bg-slate-200" />
                                            <span className="flex items-center gap-1 text-[#16539a]"><CheckCircle2 size={10} /> حجز</span>
                                            <span className="w-4 h-[1px] bg-slate-200" />
                                            <span className="flex items-center gap-1">اختبار</span>
                                            <span className="w-4 h-[1px] bg-slate-200" />
                                            <span className="flex items-center gap-1">اعتماد 👑</span>
                                        </div>
                                    </div>

                                    <Link 
                                        href={`/professions/${prof.slug}`}
                                        className="w-full h-12 bg-slate-50 border border-slate-100 group-hover:bg-[#16539a] group-hover:text-white rounded-xl text-xs font-bold text-slate-655 flex items-center justify-center gap-2 transition-all group-hover:shadow-md group-hover:shadow-blue-900/10 active:scale-98"
                                    >
                                        <span>التفاصيل وبدء الاستعداد التجريبي</span>
                                        <ChevronLeft size={16} className="transform transition-transform group-hover:translate-x-[-3px]" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Search fallback when no results */}
                {filteredProfessions.length === 0 && (
                    <div className="text-center py-20 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm">
                        <Briefcase size={40} className="text-slate-350 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-800 text-lg mb-2">عذراً، لم نجد أي مسارات مطابقة لبحثك</h4>
                        <p className="text-slate-400 text-sm font-semibold">جرّب البحث بمصطلحات أخرى أو إزالة قطاع التصفية النشط.</p>
                        <button 
                            onClick={() => { setSearchQuery(""); setSelectedSector(null); }}
                            className="mt-6 px-6 py-2.5 bg-[#16539a] hover:bg-[#1a5ea8] text-white rounded-xl text-xs font-black transition-all"
                        >
                            إعادة تعيين البحث والفلتر
                        </button>
                    </div>
                )}
            </div>

            {/* Global Footer */}
            <Footer />
        </main>
    );
}
