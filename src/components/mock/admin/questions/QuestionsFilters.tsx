/**
 * @file QuestionsFilters.tsx
 * @description مكون فلاتر التصفية المتقدمة لبنك الأسئلة (QuestionsFilters).
 * يدعم فرز وتصفية الأسئلة بالاعتماد على المهنة والمحاور المهنية وتدرج مستويات الصعوبة.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QuestionsFiltersProps {
    professions: any[];
    searchProfession: string;
    setSearchProfession: (val: string) => void;
    filterProfession: string;
    setFilterProfession: (val: string) => void;
    dropdownOpen: boolean;
    setDropdownOpen: (open: boolean) => void;
    
    filterAxis: string;
    setFilterAxis: (val: string) => void;
    dynamicAxes: any[];
    
    filterType: string;
    setFilterType: (val: string) => void;
    
    filterCognitiveLevel: string;
    setFilterCognitiveLevel: (val: string) => void;
    filterDifficulty: string;
    setFilterDifficulty: (val: string) => void;
    
    sortOrder: string;
    setSortOrder: (val: string) => void;
}

export function QuestionsFilters({
    professions,
    searchProfession,
    setSearchProfession,
    filterProfession,
    setFilterProfession,
    dropdownOpen,
    setDropdownOpen,
    
    filterAxis,
    setFilterAxis,
    dynamicAxes,
    
    filterType,
    setFilterType,
    
    filterCognitiveLevel,
    setFilterCognitiveLevel,
    filterDifficulty,
    setFilterDifficulty,
    
    sortOrder,
    setSortOrder
}: QuestionsFiltersProps) {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* اختيار وتصفية بالمهنة */}
                <div className="relative">
                    <label className="text-[11px] font-bold text-gray-500 mb-2 block">المهنة</label>
                    <div className="relative">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pr-9 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-slate-400 transition-all text-xs h-9 font-medium"
                            placeholder="ابحث بالمهنة..."
                            value={searchProfession}
                            onChange={(e) => {
                                setSearchProfession(e.target.value);
                                setFilterProfession("ALL");
                                setDropdownOpen(true);
                            }}
                            onFocus={() => setDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                        />
                    </div>
                    {dropdownOpen && (
                        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                            <div
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-xs font-black text-indigo-600 border-b border-gray-50"
                                onClick={() => { 
                                    setFilterProfession("ALL"); 
                                    setSearchProfession(""); 
                                    setDropdownOpen(false); 
                                }}
                            >
                                عرض أسئلة جميع المهن
                            </div>
                            {professions.filter(p => p.name.includes(searchProfession)).map(p => (
                                <div
                                    key={p.id}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-xs font-bold text-gray-700 border-b last:border-0 border-gray-50"
                                    onClick={() => {
                                        setFilterProfession(p.id);
                                        setSearchProfession(p.name);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    {p.name}
                                </div>
                            ))}
                            {professions.filter(p => p.name.includes(searchProfession)).length === 0 && (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center font-bold">لا توجد مهن مطابقة</div>
                            )}
                        </div>
                    )}
                </div>

                {/* تصفية بالمحور المهني */}
                <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-2 block">المحور المهني</label>
                    <select
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-slate-400 text-xs transition-all font-bold text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        value={filterAxis}
                        onChange={(e) => setFilterAxis(e.target.value)}
                        disabled={filterProfession === "ALL"}
                    >
                        <option value="ALL">
                            {filterProfession === "ALL" ? "⚠️ اختر مهنة أولاً لرؤية محاورها" : "جميع المحاور"}
                        </option>
                        {dynamicAxes.map((a: any) => (
                            <option key={a.value} value={a.value}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* تصفية بنوع السؤال */}
                <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-2 block">نوع السؤال</label>
                    <select
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-slate-400 text-xs transition-all font-bold text-gray-700 cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="ALL">جميع الأنواع</option>
                        <option value="MCQ">اختيار من متعدد</option>
                        <option value="TRUE_FALSE">صح أو خطأ</option>
                        <option value="FILL_BLANK">إكمال الفراغ</option>
                        <option value="IMAGE">أسئلة الصور (مصورة)</option>
                    </select>
                </div>

                {/* تصفية بالصعوبة والـ Cognitive Level */}
                <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-2 block">مستوى الصعوبة / المعرفة</label>
                    <select
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-slate-400 text-xs transition-all font-bold text-gray-700 cursor-pointer"
                        value={filterCognitiveLevel}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "ALL") {
                                setFilterCognitiveLevel("ALL");
                                setFilterDifficulty("ALL");
                            } else if (val === "K1") {
                                setFilterCognitiveLevel("K1");
                                setFilterDifficulty("ALL");
                            } else if (val === "K2") {
                                setFilterCognitiveLevel("K2");
                                setFilterDifficulty("HARD");
                            } else if (val === "K3") {
                                setFilterCognitiveLevel("K3");
                                setFilterDifficulty("EXPERT");
                            } else if (val === "K4") {
                                setFilterCognitiveLevel("K4");
                                setFilterDifficulty("HARD");
                            } else if (val === "K5") {
                                setFilterCognitiveLevel("K5");
                                setFilterDifficulty("HARD");
                            }
                        }}
                    >
                        <option value="ALL">جميع المستويات</option>
                        <option value="K1">K1 — تذكر (المعرفة الأساسية)</option>
                        <option value="K2">K2 — تطبيق (صعب وواقعي)</option>
                        <option value="K3">K3 — تحليل وتقييم (معقد للخبراء)</option>
                        <option value="K4">K4 — فهم وتطبيق أساسي (سهل/متوسط)</option>
                        <option value="K5">K5 — حل مشكلات تشغيلية (متوسط/صعب)</option>
                    </select>
                </div>

                {/* ترتيب زمني */}
                <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-2 block">الترتيب الزمني</label>
                    <select
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-slate-400 text-xs transition-all font-bold text-gray-700 cursor-pointer"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="desc">📥 الأحدث أولاً</option>
                        <option value="asc">📤 الأقدم أولاً</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
