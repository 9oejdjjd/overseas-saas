"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Layers, CheckCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuestionsImportModal } from "./QuestionsImportModal";
import { DuplicateScannerModal } from "./DuplicateScannerModal";

export function QuestionsManager() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterProfession, setFilterProfession] = useState<string>("ALL");
    const [searchProfession, setSearchProfession] = useState<string>("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mock/admin/questions");
            const data = await res.json();
            if (Array.isArray(data)) setQuestions(data);
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

    useEffect(() => {
        fetchQuestions();
        fetchProfessions();
    }, []);

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
        "EASY": "bg-green-100 text-green-700 border-green-200",
        "MEDIUM": "bg-blue-100 text-blue-700 border-blue-200",
        "HARD": "bg-red-100 text-red-700 border-red-200"
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">بنك الأسئلة</h2>
                    <p className="text-sm text-gray-500">عرض وإدارة الأسئلة المولدة أو المضافة لكل مهنة</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={fetchQuestions} className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex-1 justify-center sm:flex-none">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <QuestionsImportModal professions={professions} questions={questions} onSuccess={fetchQuestions} />
                    <DuplicateScannerModal professions={professions} onSuccess={fetchQuestions} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
                    <p className="text-gray-500">لا يوجد أسئلة في بنك الأسئلة حالياً. استخدم تبويب المهن لتوليد أسئلة.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-4">
                        <div className="max-w-md relative">
                            <label className="text-xs font-bold text-gray-600 mb-2 block">ابحث أو صنف حسب المهنة</label>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input 
                                    className="pr-9 bg-gray-50 focus:bg-white transition-colors text-sm"
                                    placeholder="اكتب بضعة أحرف من اسم المهنة..."
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
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-blue-600 border-b"
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
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-2">
                        {questions.filter(q => {
                            if (filterProfession !== "ALL" && q.professionId !== filterProfession) return false;
                            return true;
                        }).map((q, idx) => {
                            const correctOption = q.options?.find((o: any) => o.isCorrect);
                            return (
                            <div key={q.id} className="border rounded-xl p-5 bg-white shadow-sm">
                                <div className="flex flex-wrap gap-2 items-center mb-3">
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                        {q.profession?.name}
                                    </Badge>
                                    <Badge variant="outline" className={diffColors[q.difficulty] || "bg-gray-100"}>
                                        {q.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                                        <Layers className="h-3 w-3" />
                                        {axisLabels[q.axis] || q.axis}
                                    </Badge>
                                    <Badge variant="outline" className={q.cognitiveLevel === "K1" 
                                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                                        : "bg-purple-50 text-purple-700 border-purple-200"}>
                                        {q.cognitiveLevel === "K1" ? "K1 تذكر" : "K2 تطبيق"}
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-4">{q.text}</h3>
                                
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
                        );
                    })}
                    {questions.filter(q => {
                        if (filterProfession !== "ALL" && q.professionId !== filterProfession) return false;
                        return true;
                    }).length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                            لا توجد أسئلة لهذه المهنة حالياً.
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    );
}
