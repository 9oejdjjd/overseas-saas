/**
 * @file ProfessionsManager.tsx
 * @description مكون إدارة المهن والتخصصات المطور (ProfessionsManager) بعد إعادة هيكلته.
 * يستفيد هذا المكون من الخطاف المخصص (useProfessionsManager) لربط المكونات الفرعية لشبكة المهن ونموذج الإدخال بشكل مجزأ تماماً.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

"use client";

import React from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfessionsManager } from "@/hooks/mock-exams/useProfessionsManager";
import { ProfessionCard } from "./professions/ProfessionCard";
import { ProfessionFormSheet } from "./professions/ProfessionFormSheet";
import { ProfessionAlgorithmModal } from "./ProfessionAlgorithmModal";

export function ProfessionsManager() {
    const profManager = useProfessionsManager();
    const {
        professions,
        filteredProfessions,
        loading,
        showAdd,
        setShowAdd,
        searchTerm,
        setSearchTerm,
        formData,
        setFormData,
        editingId,
        saving,
        aiLoading,
        algorithmModalProf,
        setAlgorithmModalProf,
        openAddModal,
        openEditModal,
        handleSave,
        deleteProfession,
        fetchProfessions
    } = profManager;

    if (loading) {
        return (
            <div className="p-20 flex flex-col justify-center items-center gap-2" dir="rtl">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                <p className="text-xs text-gray-400 font-bold">جاري تحميل المهن والتخصصات...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* رأس الصفحة وفلاتر البحث وإضافة المهن */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-2xl border border-gray-150 shadow-sm gap-4">
                <div className="text-right">
                    <h2 className="text-base font-black text-gray-900">المهن والتخصصات الفنية</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">إدارة وتعديل قوائم المهن المتاحة ومفاتيح التوجيه الخاصة بالذكاء الاصطناعي.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* بحث محلي عن المهن */}
                    <div className="relative w-full md:w-64 shadow-sm rounded-xl overflow-hidden">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="بحث عن مهنة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-9 bg-white border-gray-250 placeholder-gray-400 text-xs h-9"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => fetchProfessions()}
                            className="flex items-center gap-1.5 text-xs font-bold border-gray-250 bg-white h-9"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> 
                            تحديث
                        </Button>
                        <Button 
                            onClick={openAddModal} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
                        >
                            <Plus className="h-4 w-4 ml-1" /> 
                            إضافة مهنة جديدة
                        </Button>
                    </div>
                </div>
            </div>

            {/* شبكة عرض كروت المهن */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessions.map((prof) => (
                    <ProfessionCard
                        key={prof.id}
                        prof={prof}
                        aiLoading={aiLoading}
                        deleteProfession={deleteProfession}
                        setAlgorithmModalProf={setAlgorithmModalProf}
                        openEditModal={openEditModal}
                    />
                ))}
                
                {filteredProfessions.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400 font-bold text-xs bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl">
                        لا توجد مهن مطابقة للبحث أو مدخلة حالياً.
                    </div>
                )}
            </div>

            {/* المنسدلة الجانبية لنموذج المهن */}
            <ProfessionFormSheet
                showAdd={showAdd}
                setShowAdd={setShowAdd}
                editingId={editingId}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                handleSave={handleSave}
            />

            {/* نافذة خوارزميات ومحاور الأسئلة */}
            <ProfessionAlgorithmModal 
                profession={algorithmModalProf} 
                isOpen={!!algorithmModalProf} 
                onClose={() => setAlgorithmModalProf(null)} 
                onSaved={fetchProfessions} 
            />
        </div>
    );
}
