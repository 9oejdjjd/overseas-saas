/**
 * @file QuestionsManager.tsx
 * @description مكون إدارة بنك الأسئلة المطور (QuestionsManager) بعد إعادة هيكلته.
 * يوظف هذا المكون الخطاف المخصص (useQuestionsManager) ويربط المكونات الفرعية للفلاتر والبطاقات والشريط العائم.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

"use client";

import React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionsImportModal } from "./QuestionsImportModal";
import { ImageQuestionsImportModal } from "./ImageQuestionsImportModal";
import { DuplicateScannerModal } from "./DuplicateScannerModal";
import { EditQuestionModal } from "./EditQuestionModal";
import { useQuestionsManager } from "@/hooks/mock-exams/useQuestionsManager";
import { QuestionsFilters } from "./questions/QuestionsFilters";
import { QuestionCard } from "./questions/QuestionCard";
import { QuestionsBulkActionBar } from "./questions/QuestionsBulkActionBar";

export function QuestionsManager() {
    const qManager = useQuestionsManager();
    const {
        questions,
        professions,
        loading,
        deletingBulk,
        
        // التصفية والفرز
        filterProfession,
        setFilterProfession,
        searchProfession,
        setSearchProfession,
        dropdownOpen,
        setDropdownOpen,
        filterAxis,
        setFilterAxis,
        filterType,
        setFilterType,
        filterDifficulty,
        setFilterDifficulty,
        filterCognitiveLevel,
        setFilterCognitiveLevel,
        sortOrder,
        setSortOrder,
        
        // الاختيارات والحسابات
        selectedIds,
        setSelectedIds,
        pagination,
        editingQuestion,
        setEditingQuestion,
        
        dynamicAxes,
        fetchQuestions,
        deleteQuestion,
        bulkDeleteQuestions,
        toggleSelect
    } = qManager;

    return (
        <div className="space-y-6" dir="rtl">
            {/* رأس لوحة تحكم الأسئلة والأزرار التشغيلية */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150 shadow-sm">
                <div className="text-right">
                    <h2 className="text-base font-black text-gray-900">بنك الأسئلة والمحاور الفنية</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">تتبع الأسئلة المتاحة، وراجع تفاصيل الخيارات والشرح الفني لكل تخصص.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline"
                        onClick={() => fetchQuestions(pagination.page)} 
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:bg-indigo-50 border-gray-250 bg-white px-3 py-2 rounded-xl transition-all shadow-sm font-bold flex-1 justify-center sm:flex-none h-9"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        تحديث
                    </Button>
                    <QuestionsImportModal professions={professions} onSuccess={() => fetchQuestions(pagination.page)} />
                    <ImageQuestionsImportModal professions={professions} onSuccess={() => fetchQuestions(pagination.page)} />
                    <DuplicateScannerModal professions={professions} onSuccess={() => fetchQuestions(pagination.page)} />
                </div>
            </div>

            {/* قسم الفلاتر المتقدمة لبنك الأسئلة */}
            <QuestionsFilters
                professions={professions}
                searchProfession={searchProfession}
                setSearchProfession={setSearchProfession}
                filterProfession={filterProfession}
                setFilterProfession={setFilterProfession}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                filterAxis={filterAxis}
                setFilterAxis={setFilterAxis}
                dynamicAxes={dynamicAxes}
                filterType={filterType}
                setFilterType={setFilterType}
                filterCognitiveLevel={filterCognitiveLevel}
                setFilterCognitiveLevel={setFilterCognitiveLevel}
                filterDifficulty={filterDifficulty}
                setFilterDifficulty={setFilterDifficulty}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />

            {/* تفاصيل الاختيار الكلي وجدول الأسئلة */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-24 gap-2">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                    <p className="text-xs text-gray-400 font-bold">جاري تحميل الأسئلة...</p>
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-xs">
                    لا توجد أسئلة حالية تطابق الفلاتر المحددة. يرجى تعديل خيارات التصفية أو توليد أسئلة جديدة.
                </div>
            ) : (
                <>
                    {/* شريط معلومات التحديد الكلي */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 px-4 py-3 rounded-xl border border-gray-200/80 text-xs gap-2 shadow-sm font-bold">
                        <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer select-none">
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
                                className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            />
                            تحديد جميع الأسئلة المعروضة بالصفحة
                        </label>
                        <span className="text-[11px] font-black text-gray-500">تم تحديد {selectedIds.length} سؤال من أصل {questions.length}</span>
                    </div>

                    {/* شبكة بطاقات الأسئلة الفردية */}
                    <div className="grid grid-cols-1 gap-4 mt-2">
                        {questions.map((q) => (
                            <QuestionCard
                                key={q.id}
                                q={q}
                                selectedIds={selectedIds}
                                toggleSelect={toggleSelect}
                                setEditingQuestion={setEditingQuestion}
                                deleteQuestion={deleteQuestion}
                            />
                        ))}
                    </div>

                    {/* ترقيم وتوزيع الصفحات */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6 py-4">
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={pagination.page <= 1} 
                                onClick={() => fetchQuestions(pagination.page - 1)}
                                className="h-8 text-xs font-bold rounded-lg"
                            >
                                الصفحة السابقة
                            </Button>
                            <span className="text-xs text-gray-500 font-black">صفحة {pagination.page} من {pagination.totalPages}</span>
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={pagination.page >= pagination.totalPages} 
                                onClick={() => fetchQuestions(pagination.page + 1)}
                                className="h-8 text-xs font-bold rounded-lg"
                            >
                                الصفحة التالية
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* نافذة تعديل بيانات وخصائص السؤال */}
            {editingQuestion && (
                <EditQuestionModal 
                    isOpen={!!editingQuestion} 
                    setIsOpen={(open) => !open && setEditingQuestion(null)} 
                    question={editingQuestion} 
                    professions={professions}
                    onSuccess={() => { 
                        setEditingQuestion(null); 
                        fetchQuestions(pagination.page); 
                    }} 
                />
            )}

            {/* الشريط العائم للعمليات والحذف الجماعي */}
            <QuestionsBulkActionBar
                selectedCount={selectedIds.length}
                setSelectedIds={setSelectedIds}
                bulkDeleteQuestions={bulkDeleteQuestions}
                deletingBulk={deletingBulk}
            />
        </div>
    );
}
