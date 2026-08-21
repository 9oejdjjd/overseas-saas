import React from "react";
import { ShieldCheck, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AccreditationTab() {
    return (
        <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#074388]/10 text-[#074388] rounded-xl text-right">
                    <ShieldCheck className="h-6 w-6 shrink-0 text-[#074388]" />
                    <div className="flex-1">
                        <h4 className="font-black text-sm">وكالة معتمدة رسمياً لدى بوابة الاعتماد المهني</h4>
                        <p className="text-[11px] text-slate-650 dark:text-slate-350 mt-0.5">تتمتع وكالتكم بصلاحية إرسال الاختبارات التجريبية للمتقدمين والحصول على عمولات الشراء المعتمدة.</p>
                    </div>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-650 dark:text-slate-300 text-right">
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <Check size={14} className="text-[#55943b] shrink-0 mt-0.5" />
                        <span>تسعير مخصص للوكالة لجميع الاختبارات والباقات يتم خصمه تلقائياً من رصيد المحفظة عند الحجز.</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <Check size={14} className="text-[#55943b] shrink-0 mt-0.5" />
                        <span>صلاحية الوصول إلى نتائج وتقارير أداء كافة المتقدمين المسجلين عبر وكالتكم.</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <Check size={14} className="text-[#55943b] shrink-0 mt-0.5" />
                        <span>دعم فني وخدمة عملاء مخصصة لمتابعة شحن المحفظة وحل أي استفسارات.</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
