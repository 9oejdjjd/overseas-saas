"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCw, Layers, CheckCircle, Search, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuestionsImportModal } from "./QuestionsImportModal";
import { SingleQuestionImportModal } from "./SingleQuestionImportModal";
import { DuplicateScannerModal } from "./DuplicateScannerModal";
import { EditQuestionModal } from "./EditQuestionModal";
import { Button } from "@/components/ui/button";

export function QuestionsManager() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingBulk, setDeletingBulk] = useState(false);

    // Advanced Filters States
    const [filterProfession, setFilterProfession] = useState<string>("ALL");
    const [searchProfession, setSearchProfession] = useState<string>("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [filterAxis, setFilterAxis] = useState<string>("ALL");
    const [filterType, setFilterType] = useState<string>("ALL");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
    const [filterCognitiveLevel, setFilterCognitiveLevel] = useState<string>("ALL");
    const [sortOrder, setSortOrder] = useState<string>("desc"); // desc = newest first, asc = oldest first

    // Selection State for Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

    const fetchQuestions = async (page = 1) => {
        setLoading(true);
        try {
            let url = `/api/mock/admin/questions?page=${page}&limit=50`;
            if (filterProfession !== "ALL") url += `&professionId=${filterProfession}`;
            if (filterAxis !== "ALL") url += `&axis=${encodeURIComponent(filterAxis)}`;
            if (filterType !== "ALL") url += `&type=${filterType}`;
            if (filterCognitiveLevel !== "ALL") url += `&cognitiveLevel=${filterCognitiveLevel}`;
            if (filterDifficulty !== "ALL") url += `&difficulty=${filterDifficulty}`;
            url += `&sortOrder=${sortOrder}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.data && Array.isArray(data.data)) {
                setQuestions(data.data);
                setPagination(data.pagination);
            } else if (Array.isArray(data)) {
                setQuestions(data);
            }
            // Clear selection when queries/filters change to avoid lingering selections on different pages
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfessions = async () => {
        try {
            const res = await fetch("/api/mock/admin/professions");
            const data = await res.json();
            if (Array.isArray(data)) setProfessions(data);
        } catch (e) {
            console.error(e);
        }
    };

    // Load professions once on mount
    useEffect(() => {
        fetchProfessions();
    }, []);

    // Fetch questions whenever filters or sorting changes
    useEffect(() => {
        fetchQuestions(1);
    }, [filterProfession, filterAxis, filterType, filterCognitiveLevel, filterDifficulty, sortOrder]);

    // Reset axis filter whenever the profession changes
    useEffect(() => {
        setFilterAxis("ALL");
    }, [filterProfession]);

    // Dynamic Axes Extraction Hook
    const selectedProfessionData = useMemo(() => {
        return professions.find(p => p.id === filterProfession);
    }, [professions, filterProfession]);

    const dynamicAxes = useMemo(() => {
        if (!selectedProfessionData) return [];
        const config = selectedProfessionData.algorithmConfig as any;
        if (config && config.axes && config.axes.length > 0) {
            return config.axes.map((a: any) => ({ value: a.name, label: a.name }));
        }
        // Fallback to old hardcoded axes if config doesn't exist
        return [
            { value: "HEALTH_SAFETY", label: "الصحة والسلامة في بيئة العمل" },
            { value: "PROFESSION_KNOWLEDGE", label: "المعرفة المهنية التخصصية" },
            { value: "GENERAL_SKILLS", label: "المهارات العامة وجودة التنفيذ" },
            { value: "OCCUPATIONAL_SAFETY", label: "السلامة المهنية والمخاطر المباشرة" },
            { value: "CORRECT_METHODS", label: "الأساليب الصحيحة والقياسية للمهنة" },
            { value: "PROFESSIONAL_BEHAVIOR", label: "السلوك الوظيفي والانضباط المهني" },
            { value: "TOOLS_AND_EQUIPMENT", label: "استخدام الأدوات والمعدات وتشخيصها" },
            { value: "EMERGENCIES_FIRST_AID", label: "الطوارئ والإسعافات الأولية" }
        ];
    }, [selectedProfessionData]);

    const deleteQuestion = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال نهائياً؟")) return;
        try {
            const res = await fetch(`/api/mock/admin/questions/${id}`, { method: "DELETE" });
            if (res.ok) fetchQuestions(pagination.page);
            else alert("فشل الحذف");
        } catch (e) {
            console.error(e);
        }
    };

    const bulkDeleteQuestions = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} أسئلة محددة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        setDeletingBulk(true);
        try {
            const res = await fetch("/api/mock/admin/questions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionIds: selectedIds })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`تم حذف ${data.count || selectedIds.length} سؤال بنجاح.`);
                setSelectedIds([]);
                fetchQuestions(pagination.page);
            } else {
                alert("فشل حذف الأسئلة المحددة.");
            }
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء محاولة الحذف الجماعي.");
        } finally {
            setDeletingBulk(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const axisLabels: any = {
        "HEALTH_SAFETY": "الصحة والسلامة",
        "PROFESSION_KNOWLEDGE": "المعرفة المهنية",
        "GENERAL_SKILLS": "المهارات العامة",
        "OCCUPATIONAL_SAFETY": "السلامة المهنية",
        "CORRECT_METHODS": "الطرق الصحيحة",
        "PROFESSIONAL_BEHAVIOR": "السلوك المهني",
        "TOOLS_AND_EQUIPMENT": "الأدوات والمعدات",
        "EMERGENCIES_FIRST_AID": "الطوارئ والإسعافات"
    };

    const diffColors: any = {
        "HARD": "bg-red-100 text-red-700 border-red-200",
        "EXPERT": "bg-purple-100 text-purple-700 border-purple-200"
    };

    return (
        <div className="space-y-6">
            {/* Header section with buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">بنك الأسئلة</h2>
                    <p className="text-sm text-gray-500">عرض وإدارة الأسئلة المولدة أو المضافة لكل مهنة</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={() => fetchQuestions(pagination.page)} className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex-1 justify-center sm:flex-none">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <SingleQuestionImportModal professions={professions} onSuccess={() => fetchQuestions(pagination.page)} />
                    <QuestionsImportModal professions={professions} questions={questions} onSuccess={() => fetchQuestions(pagination.page)} />
                    <DuplicateScannerModal professions={professions} onSuccess={() => fetchQuestions(pagination.page)} />
                </div>
            </div>

            {/* Premium Filters Section - ALWAYS VISIBLE */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Profession Selector */}
                    <div className="relative">
                        <label className="text-xs font-bold text-gray-600 mb-2 block">المهنة</label>
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                className="pr-9 bg-gray-50 focus:bg-white transition-colors text-sm h-10"
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
                            <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                <div
                                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm font-bold text-blue-600 border-b"
                                    onClick={() => { setFilterProfession("ALL"); setSearchProfession(""); setDropdownOpen(false); }}
                                >
                                    عرض أسئلة جميع المهن
                                </div>
                                {professions.filter(p => p.name.includes(searchProfession)).map(p => (
                                    <div
                                        key={p.id}
                                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b last:border-0 border-gray-50"
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
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">لا توجد مهن مطابقة</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dynamic Axis Filter */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block">المحور المهني</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-gray-700"
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

                    {/* Question Type Filter */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block">نوع السؤال</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-colors font-medium text-gray-700"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="ALL">جميع الأنواع</option>
                            <option value="MCQ">اختيار من متعدد</option>
                            <option value="TRUE_FALSE">صح أو خطأ</option>
                            <option value="FILL_BLANK">إكمال الفراغ</option>
                        </select>
                    </div>

                    {/* Cognitive Level / Difficulty Filter */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block">مستوى الصعوبة / المعرفة</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-colors font-medium text-gray-700"
                            value={filterCognitiveLevel !== "ALL" ? filterCognitiveLevel : filterDifficulty !== "ALL" ? filterDifficulty : "ALL"}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "ALL") {
                                    setFilterCognitiveLevel("ALL");
                                    setFilterDifficulty("ALL");
                                } else if (val === "K1") {
                                    setFilterCognitiveLevel("K1");
                                    setFilterDifficulty("ALL");
                                } else if (val === "HARD") {
                                    setFilterCognitiveLevel("K2");
                                    setFilterDifficulty("HARD");
                                } else if (val === "EXPERT") {
                                    setFilterCognitiveLevel("K3");
                                    setFilterDifficulty("EXPERT");
                                }
                            }}
                        >
                            <option value="ALL">جميع المستويات</option>
                            <option value="K1">K1 — تذكر (المعرفة الأساسية)</option>
                            <option value="HARD">HARD — صعب وواقعي (K2)</option>
                            <option value="EXPERT">EXPERT — معقد للخبراء (K3)</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block">الترتيب الزمني</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-colors font-medium text-gray-700"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc">📥 الأحدث أولاً</option>
                            <option value="asc">📤 الأقدم أولاً</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Questions List & Selection Wrapper */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                    لا توجد أسئلة تطابق الفلاتر المحددة حالياً. يمكنك استخدام تبويب المهن لتوليد المزيد.
                </div>
            ) : (
                <>
                    {/* Bulk Selection Tool */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-200/80 text-sm gap-2">
                        <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={questions.length > 0 && selectedIds.length === questions.length}
                                ref={(el) => {
                                    if (el) {
                                        el.indeterminate = selectedIds.length > 0 && selectedIds.length < questions.length;
                                    }
                                }}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedIds(questions.map(q => q.id));
                                    } else {
                                        setSelectedIds([]);
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                            تحديد الكل في هذه الصفحة
                        </label>
                        <span className="text-xs font-bold text-gray-500">تم تحديد {selectedIds.length} من {questions.length} سؤال في هذه الصفحة</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-2">
                        {questions.map((q, idx) => {
                            return (
                                <div key={q.id} className={`border rounded-xl p-5 bg-white shadow-sm hover:border-blue-200 transition-all flex gap-4 items-start ${selectedIds.includes(q.id) ? 'border-blue-300 bg-blue-50/10' : ''}`}>
                                    {/* Individual Checkbox */}
                                    <div className="pt-1.5 flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(q.id)}
                                            onChange={() => toggleSelect(q.id)}
                                            className="h-4.5 w-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap gap-2 items-center justify-between">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                                                    {q.profession?.name}
                                                </Badge>
                                                <Badge variant="outline" className={diffColors[q.difficulty] || "bg-gray-100 font-medium"}>
                                                    {q.difficulty}
                                                </Badge>
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 font-medium">
                                                    <Layers className="h-3 w-3" />
                                                    {axisLabels[q.axis] || q.axis}
                                                </Badge>
                                                <Badge variant="outline" className={q.cognitiveLevel === "K1"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 font-medium"
                                                    : "bg-purple-50 text-purple-700 border-purple-200 font-medium"}>
                                                    {q.cognitiveLevel === "K1" ? "K1 تذكر" : q.cognitiveLevel === "K3" ? "K3 تحليل" : "K2 تطبيق"}
                                                </Badge>
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-medium">
                                                    {q.type === "TRUE_FALSE" ? "صح أو خطأ" : q.type === "FILL_BLANK" ? "إكمال الفراغ" : "اختيار من متعدد"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingQuestion(q)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-900 leading-snug">{q.text}</h3>
                                        
                                        {q.imageUrl && (
                                            <div className="mb-2 rounded-xl overflow-hidden border border-gray-200 inline-block">
                                                <img src={q.imageUrl} alt="صورة السؤال" className="h-32 object-contain bg-gray-50" />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                            {q.options?.map((opt: any) => (
                                                <div key={opt.id} className={`p-3 rounded-lg text-sm flex items-center gap-2 ${opt.isCorrect ? 'bg-green-50/70 border border-green-200 text-green-900 font-medium' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                                                    {opt.isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-gray-300"></div>}
                                                    {opt.text}
                                                </div>
                                            ))}
                                        </div>

                                        {q.explanation && (
                                            <details className="mt-3 group">
                                                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium select-none">
                                                    عرض الشرح التفصيلي
                                                </summary>
                                                <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {q.explanation}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6 py-4">
                            <Button variant="outline" disabled={pagination.page <= 1} onClick={() => fetchQuestions(pagination.page - 1)}>
                                السابق
                            </Button>
                            <span className="text-sm text-gray-600 font-medium">صفحة {pagination.page} من {pagination.totalPages}</span>
                            <Button variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchQuestions(pagination.page + 1)}>
                                التالي
                            </Button>
                        </div>
                    )}
                </>
            )}
            
            {editingQuestion && (
                <EditQuestionModal 
                    isOpen={!!editingQuestion} 
                    setIsOpen={(open) => !open && setEditingQuestion(null)} 
                    question={editingQuestion} 
                    professions={professions}
                    onSuccess={() => { setEditingQuestion(null); fetchQuestions(pagination.page); }} 
                />
            )}

            {/* Floating Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-md flex items-center justify-between gap-8 min-w-[320px] max-w-[90vw] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">تم تحديد {selectedIds.length} سؤال</span>
                        <span className="text-xs text-slate-400">يمكنك إجراء عمليات جماعية عليها</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedIds([])}
                            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-3 py-1.5 h-auto font-medium"
                        >
                            إلغاء التحديد
                        </Button>
                        <Button
                            onClick={bulkDeleteQuestions}
                            disabled={deletingBulk}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 px-4 py-2 h-auto rounded-xl border border-transparent shadow-md transition-all active:scale-95"
                        >
                            {deletingBulk ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                            )}
                            حذف المحدد ({selectedIds.length})
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
