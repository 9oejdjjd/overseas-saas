/**
 * @file useQuestionsManager.ts
 * @description خطاف مخصص (Custom Hook) لإدارة وعمليات بنك الأسئلة والبحث والتصفية المتطورة والفرز الزمني والاختيار والحذف الجماعي.
 * يسهل فصل واجهة الأسئلة عن منطق جلب وترتيب وإلغاء البيانات.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { useState, useEffect, useMemo } from "react";

export function useQuestionsManager() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [professions, setProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingBulk, setDeletingBulk] = useState(false);

    // فلاتر التصفية والفرز المتقدمة
    const [filterProfession, setFilterProfession] = useState<string>("ALL");
    const [searchProfession, setSearchProfession] = useState<string>("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [filterAxis, setFilterAxis] = useState<string>("ALL");
    const [filterType, setFilterType] = useState<string>("ALL");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
    const [filterCognitiveLevel, setFilterCognitiveLevel] = useState<string>("ALL");
    const [sortOrder, setSortOrder] = useState<string>("desc"); // desc = الأحدث أولاً، asc = الأقدم أولاً

    // معرّفات الصفوف المحددة للإجراءات الجماعية
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

    /**
     * جلب قائمة الأسئلة بناءً على الفلاتر والصفحة المحددة
     * @param page رقم الصفحة المطلوب جلبها
     */
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
            // مسح التحديدات الجماعية عند تغيير الفلاتر لتجنب الاختيارات المعلقة بين الصفحات
            setSelectedIds([]);
        } catch (e) {
            console.error("[useQuestionsManager] Failed to fetch questions:", e);
        } finally {
            setLoading(false);
        }
    };

    /**
     * جلب قوائم المهن للتصفيات الجانبية
     */
    const fetchProfessions = async () => {
        try {
            const res = await fetch("/api/mock/admin/professions");
            const data = await res.json();
            if (Array.isArray(data)) {
                setProfessions(data);
            }
        } catch (e) {
            console.error("[useQuestionsManager] Failed to fetch professions:", e);
        }
    };

    // تحميل المهن مرة واحدة عند بدء التشغيل
    useEffect(() => {
        fetchProfessions();
    }, []);

    // جلب الأسئلة تلقائياً عند تعديل أي فلتر أو تغيير في خيارات الفرز
    useEffect(() => {
        fetchQuestions(1);
    }, [filterProfession, filterAxis, filterType, filterCognitiveLevel, filterDifficulty, sortOrder]);

    // تصفير فلتر المحاور تلقائياً في حال تعديل المهنة المختارة
    useEffect(() => {
        setFilterAxis("ALL");
    }, [filterProfession]);

    // تحديد بيانات المهنة الحالية المختارة
    const selectedProfessionData = useMemo(() => {
        return professions.find(p => p.id === filterProfession);
    }, [professions, filterProfession]);

    // صياغة واستخراج المحاور المهنية للمهنة المحددة ديناميكياً لتفعيل فلاترها
    const dynamicAxes = useMemo(() => {
        if (!selectedProfessionData) return [];
        const config = selectedProfessionData.algorithmConfig as any;
        if (config && config.axes && config.axes.length > 0) {
            return config.axes.map((a: any) => ({ value: a.name, label: a.name }));
        }
        // محاور مهنية افتراضية في حال عدم وجود إعدادات خوارزمية مسبقة
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

    /**
     * حذف سؤال فردي نهائياً
     */
    const deleteQuestion = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال نهائياً؟")) return;
        try {
            const res = await fetch(`/api/mock/admin/questions/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchQuestions(pagination.page);
            } else {
                alert("فشل حذف السؤال من الخادم");
            }
        } catch (e) {
            console.error("[useQuestionsManager] Failed to delete question:", e);
        }
    };

    /**
     * حذف الأسئلة المحددة جماعياً (Bulk Delete)
     */
    const bulkDeleteQuestions = async () => {
        if (selectedIds.length === 0) return;
        const confirmMsg = `هل أنت متأكد من حذف ${selectedIds.length} أسئلة محددة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`;
        if (!confirm(confirmMsg)) return;
        
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
            console.error("[useQuestionsManager] Failed to execute bulk delete:", e);
            alert("حدث خطأ غير متوقع أثناء الحذف الجماعي");
        } finally {
            setDeletingBulk(false);
        }
    };

    /**
     * تحديد/إلغاء تحديد معرّف سؤال معين
     */
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return {
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
        
        // العمليات الجماعية والتعديل
        selectedIds,
        setSelectedIds,
        pagination,
        editingQuestion,
        setEditingQuestion,
        
        // دوال مخرجات ومحاور
        dynamicAxes,
        selectedProfessionData,
        fetchQuestions,
        deleteQuestion,
        bulkDeleteQuestions,
        toggleSelect
    };
}
