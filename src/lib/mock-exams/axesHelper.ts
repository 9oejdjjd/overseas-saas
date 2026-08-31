/**
 * @file axesHelper.ts
 * @description وحدة المساعدة لمعالجة واستيراد وتدوير محاور وحصص المهن (Axes & Quota Helper).
 * تقوم بتحليل وتدقيق الـ JSON واستخراج المحاور وضبط مجموع الحصص تلقائياً ليطابق عدد أسئلة الاختبار.
 * 
 * @author Senior Software Engineer & Systems Architect
 */

import { AxisConfig } from "@/components/mock/admin/ProfessionAlgorithmModal";

export interface ParseAxesResult {
    success: boolean;
    axes: AxisConfig[];
    error: string | null;
}

/**
 * ضبط وإعادة توازن حصص المحاور تلقائياً ليصبح مجموعها مطابقاً تماماً لعدد الأسئلة المطلوب
 */
export function equalizeAxesQuotas(axes: AxisConfig[], targetQuestionCount: number): AxisConfig[] {
    if (!axes || axes.length === 0) return [];
    const targetCount = Math.max(1, Number(targetQuestionCount) || 30);

    const updated = axes.map(a => ({
        ...a,
        quota: Math.max(1, Math.round(Number(a.quota) || 1))
    }));

    let currentSum = updated.reduce((sum, a) => sum + a.quota, 0);

    if (currentSum !== targetCount && updated.length > 0) {
        const delta = targetCount - currentSum;
        // تعديل الحصة على المحور صاحب أكبر حصة أو أول محور
        let maxIdx = 0;
        for (let i = 1; i < updated.length; i++) {
            if (updated[i].quota > updated[maxIdx].quota) {
                maxIdx = i;
            }
        }
        updated[maxIdx].quota = Math.max(1, updated[maxIdx].quota + delta);
    }

    return updated;
}

/**
 * تحليل نص JSON الملصق واستخراج مصفوفة المحاور وتدقيقها
 */
export function parseAxesJson(jsonText: string, targetQuestionCount: number = 30): ParseAxesResult {
    if (!jsonText || !jsonText.trim()) {
        return { success: false, axes: [], error: "الرجاء إدخال أو لصق كود الـ JSON الخاص بالمحاور" };
    }

    try {
        let cleaned = jsonText.trim();
        // استخراج الكائن أو المصفوفة
        const objStart = cleaned.indexOf('{');
        const arrStart = cleaned.indexOf('[');

        let parsed: any;
        if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
            const objEnd = cleaned.lastIndexOf('}');
            if (objEnd !== -1) {
                cleaned = cleaned.substring(objStart, objEnd + 1);
            }
            parsed = JSON.parse(cleaned);
            parsed = parsed.axes || parsed.topics || parsed.data || [];
        } else if (arrStart !== -1) {
            const arrEnd = cleaned.lastIndexOf(']');
            if (arrEnd !== -1) {
                cleaned = cleaned.substring(arrStart, arrEnd + 1);
            }
            parsed = JSON.parse(cleaned);
        } else {
            return { success: false, axes: [], error: "لم يتم العثور على JSON صالح يحتوي على محاور" };
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            return { success: false, axes: [], error: "كود הـ JSON لا يحتوي على مصفوفة محاور صالحة" };
        }

        const rawAxes: AxisConfig[] = parsed.map((item: any) => ({
            id: crypto.randomUUID(),
            name: String(item.name || item.axis || item.title || "محور تخصصي").trim(),
            quota: Math.max(1, Math.round(Number(item.quota || item.count || item.questions) || 1))
        })).filter(a => a.name.length > 0);

        if (rawAxes.length === 0) {
            return { success: false, axes: [], error: "لم يتم العثور على أي محور بأسماء صالحة" };
        }

        const balancedAxes = equalizeAxesQuotas(rawAxes, targetQuestionCount);

        return {
            success: true,
            axes: balancedAxes,
            error: null
        };

    } catch (err: any) {
        return {
            success: false,
            axes: [],
            error: `خطأ في تحليل صيغة הـ JSON: ${err.message}`
        };
    }
}
