/**
 * @file useProfessionsManager.ts
 * @description خطاف مخصص (Custom Hook) للتحكم بنموذج البيانات والعمليات الخاصة بقسم المهن والتخصصات.
 * يتولى إدارة الإضافة والتعديل والحذف والتحديث التلقائي الصامت لخط المهن وحالات التوليد.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { useState, useEffect, useMemo } from "react";

export interface ProfessionFormData {
    name: string;
    slug: string;
    passingScore: number;
    examDuration: number;
    questionCount: number;
    description: string;
    enabledQuestionTypes: string;
    isActive: boolean;
    algorithmConfig?: any;
}

const initialFormData: ProfessionFormData = {
    name: "",
    slug: "",
    passingScore: 60,
    examDuration: 60,
    questionCount: 30,
    description: "",
    enabledQuestionTypes: "MCQ",
    isActive: true,
    algorithmConfig: null
};

export function useProfessionsManager() {
    const [professions, setProfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState<ProfessionFormData>(initialFormData);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [algorithmModalProf, setAlgorithmModalProf] = useState<any>(null);

    /**
     * جلب قوائم المهن والتخصصات من السيرفر
     * @param silent إذا كانت true يتم الجلب بالخلفية دون إظهار مؤشر التحميل الرئيسي
     */
    const fetchProfessions = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch("/api/mock/admin/professions");
            const data = await res.json();
            if (Array.isArray(data)) {
                setProfessions(data);
            }
        } catch (e) {
            console.error("[useProfessionsManager] Failed to fetch professions:", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // جلب البيانات الأساسية عند التحميل لأول مرة
    useEffect(() => {
        fetchProfessions(false);
    }, []);

    // تفعيل التحديث التلقائي الصامت في الخلفية كل 3 ثوانٍ
    // في حال وجود عمليات توليد أسئلة جارية بواسطة الذكاء الاصطناعي (AI Jobs PROCESSING)
    useEffect(() => {
        const interval = setInterval(() => {
            const isGenerating = professions.some(
                (p: any) => p.aiJobs?.filter((j: any) => j.status === "PROCESSING").length > 0
            );
            if (isGenerating || aiLoading) {
                fetchProfessions(true);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [professions, aiLoading]);

    /**
     * فتح نموذج إضافة مهنة جديدة وتهيئته بقيم افتراضية ورابط عشوائي فريد
     */
    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            ...initialFormData,
            slug: `job-${Math.random().toString(36).substring(2, 8)}`
        });
        setShowAdd(true);
    };

    /**
     * فتح نموذج التعديل لمهنة معينة وتعبئته بالبيانات الموجودة
     */
    const openEditModal = (prof: any) => {
        setEditingId(prof.id);
        setFormData({
            name: prof.name,
            slug: prof.slug,
            passingScore: prof.passingScore,
            examDuration: prof.examDuration,
            questionCount: prof.questionCount,
            description: prof.description || "",
            enabledQuestionTypes: prof.enabledQuestionTypes || "MCQ",
            isActive: prof.isActive !== false,
            algorithmConfig: prof.algorithmConfig || null
        });
        setShowAdd(true);
    };

    /**
     * حفظ البيانات المكتوبة بالنموذج (سواء إضافة جديدة POST أو تعديل PUT)
     */
    const handleSave = async () => {
        if (!formData.name) {
            alert("اسم المهنة مطلوب");
            return;
        }
        
        const finalSlug = formData.slug.trim() || `job-${Math.random().toString(36).substring(2, 8)}`;
        setSaving(true);
        try {
            const endpoint = editingId ? `/api/mock/admin/professions/${editingId}` : "/api/mock/admin/professions";
            const method = editingId ? "PUT" : "POST";
            
            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, slug: finalSlug })
            });

            if (res.ok) {
                setShowAdd(false);
                fetchProfessions();
            } else {
                const data = await res.json();
                alert(data.error || "فشل في حفظ بيانات المهنة");
            }
        } catch (e) {
            console.error("[useProfessionsManager] Failed to save profession:", e);
            alert("حدث خطأ غير متوقع أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    /**
     * حذف المهنة بالكامل بما في ذلك جميع الأسئلة وجلسات الاختبار المرتبطة بها
     */
    const deleteProfession = async (id: string, name: string) => {
        const confirmMessage = `⚠️ تحذير: هل أنت متأكد من حذف مهنة "${name}" بالكامل؟\nسيتم حذف جميع أسئلتها وجلساتها الاختبارية نهائياً. هذا الإجراء لا يمكن التراجع عنه!`;
        if (!confirm(confirmMessage)) return;
        
        try {
            const res = await fetch(`/api/mock/admin/professions/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                fetchProfessions();
            } else {
                alert(data.error || "حدث خطأ أثناء الحذف");
            }
        } catch (e) {
            console.error("[useProfessionsManager] Failed to delete profession:", e);
            alert("فشل في الاتصال بالخادم لحذف المهنة");
        }
    };

    // ترشيح وتصفية المهن محلياً حسب حقل البحث المكتوب
    const filteredProfessions = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return professions;
        return professions.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.slug.toLowerCase().includes(query)
        );
    }, [professions, searchTerm]);

    return {
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
        setAiLoading,
        algorithmModalProf,
        setAlgorithmModalProf,
        
        // العمليات
        openAddModal,
        openEditModal,
        handleSave,
        deleteProfession,
        fetchProfessions
    };
}
