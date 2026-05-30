"use client";

import { usePoliciesList } from "@/hooks/pricing/usePoliciesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Bus, Save, AlertTriangle, Pencil, X, Clock, HelpCircle } from "lucide-react";
import { PolicyForm } from "./PolicyForm";
import { cn } from "@/lib/utils";

export function PoliciesList() {
    const {
        policies,
        config,
        loading,
        isEditing,
        setIsEditing,
        handleSaveConfig,
        updateConfig,
        handleDeletePolicy,
        handleCreatePolicy,
        fetchData
    } = usePoliciesList();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-muted-foreground text-sm animate-pulse font-medium">جاري جلب سياسات الإلغاء والتعديل...</p>
            </div>
        );
    }

    const examPolicies = policies.filter(p => p.category.startsWith("EXAM"));
    const transportPolicies = policies.filter(p => !p.category.startsWith("EXAM"));

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* 1. Global Exam Rules */}
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg font-bold">
                                <span className="p-1 bg-indigo-100/80 rounded text-indigo-700">
                                    <AlertTriangle className="h-5 w-5" />
                                </span>
                                القواعد العامة والقيود الزمنية للاختبارات
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                المحددات الزمنية الصارمة والقيود الأمنية المطبقة افتراضياً على مستوى النظام
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button 
                                    onClick={() => setIsEditing(true)} 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> تعديل القواعد
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        onClick={() => { setIsEditing(false); fetchData(); }} 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-slate-500 border-slate-200 hover:bg-slate-50 transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" /> إلغاء
                                    </Button>
                                    <Button 
                                        onClick={handleSaveConfig} 
                                        size="sm" 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all shadow-md shadow-indigo-100"
                                    >
                                        <Save className="h-3.5 w-3.5" /> حفظ القواعد
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Max Changes Allowed */}
                        <div className={cn(
                            "p-4 rounded-xl border transition-all duration-300",
                            isEditing ? "bg-white border-indigo-200" : "bg-slate-50/50 border-slate-100"
                        )}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700">سقف عدد مرات التعديل</label>
                                    <HelpCircle className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={config.maxAllowedExamChanges}
                                        onChange={e => updateConfig("maxAllowedExamChanges", Number(e.target.value))}
                                        className={cn(
                                            "text-center font-extrabold text-lg [direction:ltr] rounded-lg",
                                            isEditing ? "border-indigo-300 bg-white" : "border-transparent bg-slate-100 text-slate-700"
                                        )}
                                        lang="en"
                                        disabled={!isEditing}
                                    />
                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">محاولات</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    الحد الأقصى المسموح للمتقدم لإعادة جدولة أو تعديل موعد اختباره.
                                </p>
                            </div>
                        </div>

                        {/* Modification deadline */}
                        <div className={cn(
                            "p-4 rounded-xl border transition-all duration-300",
                            isEditing ? "bg-white border-indigo-200" : "bg-slate-50/50 border-slate-100"
                        )}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700">المهلة القصوى للتعديل</label>
                                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={config.examModificationDeadline}
                                        onChange={e => updateConfig("examModificationDeadline", Number(e.target.value))}
                                        className={cn(
                                            "text-center font-extrabold text-lg [direction:ltr] rounded-lg",
                                            isEditing ? "border-indigo-300 bg-white" : "border-transparent bg-slate-100 text-slate-700"
                                        )}
                                        lang="en"
                                        disabled={!isEditing}
                                    />
                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">ساعة قبل الاختبار</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    لن يسمح النظام للمشتركين بتعديل مواعيد اختبارهم إذا تبقى وقت أقل من هذه الساعات.
                                </p>
                            </div>
                        </div>

                        {/* Cancellation deadline */}
                        <div className={cn(
                            "p-4 rounded-xl border transition-all duration-300",
                            isEditing ? "bg-white border-indigo-200" : "bg-slate-50/50 border-slate-100"
                        )}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700">المهلة القصوى للإلغاء</label>
                                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={config.examCancellationDeadline}
                                        onChange={e => updateConfig("examCancellationDeadline", Number(e.target.value))}
                                        className={cn(
                                            "text-center font-extrabold text-lg [direction:ltr] rounded-lg",
                                            isEditing ? "border-indigo-300 bg-white" : "border-transparent bg-slate-100 text-slate-700"
                                        )}
                                        lang="en"
                                        disabled={!isEditing}
                                    />
                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">ساعة قبل الاختبار</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    يتم حظر الإلغاء واسترداد الرسوم نهائياً للمتقدمين بمجرد تخطي هذا التوقيت التنازلي.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Fee Policies */}
            <PolicySection
                title="سياسات وغرامات الاختبارات"
                description="الغرامات والخصومات المطبقة عند تعديل أو إلغاء مواعيد الاختبارات ضمن المدد المتاحة"
                icon={<FileText className="h-5 w-5 text-indigo-600" />}
                type="EXAM"
                policies={examPolicies}
                onDelete={handleDeletePolicy}
                onCreatePolicy={handleCreatePolicy}
            />

            <PolicySection
                title="سياسات وغرامات خدمات النقل"
                description="غرامات الإلغاء، تعديل حجز تذاكر الحافلات، وعدم الحضور للرحلات المغادرة"
                icon={<Bus className="h-5 w-5 text-emerald-600" />}
                type="TRANSPORT"
                policies={transportPolicies}
                onDelete={handleDeletePolicy}
                onCreatePolicy={handleCreatePolicy}
            />
        </div>
    );
}

type PolicySectionProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    type: "EXAM" | "TRANSPORT";
    policies: any[];
    onDelete: (id: string) => void;
    onCreatePolicy: (policy: any) => Promise<boolean>;
};

function PolicySection({ title, description, icon, type, policies, onDelete, onCreatePolicy }: PolicySectionProps) {
    return (
        <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-slate-800 text-base font-bold">
                            <span className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg">
                                {icon}
                            </span>
                            {title}
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs">{description}</CardDescription>
                    </div>
                    <PolicyForm type={type} onCreatePolicy={onCreatePolicy} />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4 font-bold text-slate-600 text-xs">السياسة والوصف</th>
                                <th className="px-5 py-4 font-bold text-slate-600 text-xs">نوع الإجراء</th>
                                <th className="px-5 py-4 font-bold text-slate-600 text-xs text-left ltr">الشرط الزمني</th>
                                <th className="px-5 py-4 font-bold text-slate-600 text-xs text-left ltr">قيمة الغرامة</th>
                                <th className="px-5 py-4 font-bold text-slate-600 text-xs text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {policies.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                                    <td className="px-5 py-4">
                                        <span className="font-bold text-slate-800 block">{p.name}</span>
                                        <span className="text-[10px] text-slate-400 block mt-0.5">مُطبقة تلقائياً</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge 
                                            variant="outline"
                                            className={cn(
                                                "font-semibold rounded-full text-xs px-2.5 py-0.5",
                                                p.category.includes("CANCEL") 
                                                    ? "bg-rose-50 border-rose-100 text-rose-700" 
                                                    : p.category.includes("MOD") 
                                                        ? "bg-amber-50 border-amber-100 text-amber-700" 
                                                        : "bg-purple-50 border-purple-100 text-purple-700"
                                            )}
                                        >
                                            {getCategoryLabel(p.category)}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-xs text-left ltr text-slate-600">
                                        {formatCondition(p.condition, p.hoursTrigger)}
                                    </td>
                                    <td className="px-5 py-4 text-left ltr">
                                        <span className="font-extrabold text-rose-600 text-sm">
                                            {Number(p.feeAmount).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-rose-400 ml-1">ر.ي</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("هل أنت متأكد من رغبتك في حذف هذه السياسة بشكل نهائي؟")) {
                                                    onDelete(p.id);
                                                }
                                            }} 
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all h-8 w-8"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {policies.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                                        لا توجد سياسات غرامات أو خصومات مسجلة حالياً لهذا القسم.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function getCategoryLabel(cat: string) {
    const map: Record<string, string> = {
        "EXAM_CANCELLATION": "إلغاء حجز اختبار",
        "EXAM_MODIFICATION": "تعديل موعد اختبار",
        "CANCELLATION": "إلغاء تذكرة النقل",
        "MODIFICATION": "تعديل حجز النقل",
        "NO_SHOW": "عدم حضور للرحلة",
        "ROUTE_CHANGE": "تغيير طريق الرحلة"
    };
    return map[cat] || cat;
}

function formatCondition(cond: string, hours: number | null) {
    if (!hours) return "دائماً وبدون شروط (Always)";
    if (cond === "LESS_THAN") return `< ${hours} Hours before event`;
    if (cond === "GREATER_THAN") return `> ${hours} Hours before event`;
    return `${hours} Hours before event`;
}

