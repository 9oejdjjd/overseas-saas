"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Clock, Sparkles } from "lucide-react";

type PolicyFormProps = {
    type: "EXAM" | "TRANSPORT";
    onCreatePolicy: (policy: {
        name: string;
        category: string;
        hoursTrigger: number | null;
        condition: string;
        feeAmount: number;
    }) => Promise<boolean>;
};

export function PolicyForm({ type, onCreatePolicy }: PolicyFormProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState(type === "EXAM" ? "EXAM_CANCELLATION" : "CANCELLATION");
    const [condition, setCondition] = useState("LESS_THAN");
    const [hours, setHours] = useState("24");
    const [fee, setFee] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Helper to generate descriptive Arabic name
    const generateName = useCallback(() => {
        const action = category.includes("CANCEL") ? "إلغاء" : category.includes("MOD") ? "تعديل" : "عدم حضور (No Show)";
        const cond = condition === "LESS_THAN" ? "قبل أقل من" : "قبل أكثر من";
        const hourStr = hours ? `${hours} ساعة` : "أي وقت";
        setName(`غرامة ${action} ${cond} ${hourStr}`);
    }, [category, condition, hours]);

    const handleSave = async () => {
        if (!name.trim()) {
            generateName();
        }
        setIsSaving(true);
        try {
            const success = await onCreatePolicy({
                name: name || `غرامة سياسة جديدة`,
                category,
                hoursTrigger: hours ? Number(hours) : null,
                condition,
                feeAmount: Number(fee) || 0
            });
            if (success) {
                setOpen(false);
                setName("");
                setFee("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
                    <Plus className="h-4 w-4" /> إضافة سياسة جديدة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                            <Clock className="h-4 w-4" />
                        </span>
                        إضافة سياسة جديدة ({type === "EXAM" ? "الاختبارات" : "النقل"})
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs">
                        قم بتحديد المحددات الزمنية والقيمة المالية المفروضة كغرامة أو رسوم إضافية
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    {/* Action Category Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">نوع الإجراء المستهدف</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full text-right rounded-xl border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {type === "EXAM" ? (
                                    <>
                                        <SelectItem value="EXAM_CANCELLATION">إلغاء حجز اختبار (Refund Penalty)</SelectItem>
                                        <SelectItem value="EXAM_MODIFICATION">تعديل موعد اختبار (Rescheduling Fee)</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="CANCELLATION">إلغاء تذكرة النقل (Ticket Cancel Penalty)</SelectItem>
                                        <SelectItem value="MODIFICATION">تعديل مسار/موعد الرحلة (Ticket Change Fee)</SelectItem>
                                        <SelectItem value="NO_SHOW">عدم الحضور للرحلة (No Show Fine)</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Condition & Hours Trigger */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">الشرط الزمني</Label>
                            <Select value={condition} onValueChange={setCondition}>
                                <SelectTrigger className="w-full text-right rounded-xl border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="LESS_THAN">أقل من (&lt;)</SelectItem>
                                    <SelectItem value="GREATER_THAN">أكثر من (&gt;)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">نطاق الساعات</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={hours} 
                                    onChange={e => setHours(e.target.value)} 
                                    className="pl-14 text-left font-bold rounded-xl border-slate-200 [direction:ltr]"
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ساعة</span>
                            </div>
                        </div>
                    </div>

                    {/* Penalty/Fine Price */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">قيمة الغرامة المطبقة</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                value={fee} 
                                onChange={e => setFee(e.target.value)} 
                                className="pl-14 py-5 text-left font-extrabold text-lg text-rose-600 bg-rose-50/20 border-rose-100 rounded-xl [direction:ltr]" 
                                placeholder="0" 
                            />
                            <span className="absolute left-4 top-3 text-xs font-black text-rose-500">ر.ي</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                            {category.includes("CANCEL") 
                                ? "تنبيه: سيتم خصم هذا المبلغ من محفظة المسترجع تلقائياً." 
                                : "تنبيه: سيُطالب المتقدم بدفع هذا الرسم كشرط لإتمام العملية."}
                        </p>
                    </div>

                    {/* Policy Name Description */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-slate-700">اسم المسمى التوضيحي للسياسة</Label>
                            <button 
                                type="button"
                                onClick={generateName} 
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all"
                            >
                                <Sparkles className="h-3 w-3 text-indigo-500" />
                                صياغة تلقائية ذكية
                            </button>
                        </div>
                        <Input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="مثال: غرامة إلغاء مبكر قبل 24 ساعة من الانطلاق" 
                            className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full mt-3 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md shadow-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="h-4 w-4" /> 
                        {isSaving ? "جاري الحفظ..." : "حفظ وتفعيل السياسة"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
