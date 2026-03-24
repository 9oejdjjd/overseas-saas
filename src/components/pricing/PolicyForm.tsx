"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save } from "lucide-react";

export function PolicyForm({ type, onSave }: { type: "EXAM" | "TRANSPORT", onSave: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState(type === "EXAM" ? "EXAM_CANCELLATION" : "CANCELLATION");
    const [condition, setCondition] = useState("LESS_THAN");
    const [hours, setHours] = useState("24");
    const [fee, setFee] = useState("");

    // Helper to generate description
    const generateName = () => {
        const action = category.includes("CANCEL") ? "إلغاء" : "تعديل";
        const cond = condition === "LESS_THAN" ? "قبل أقل من" : "قبل أكثر من";
        setName(`غرامة ${action} ${cond} ${hours} ساعة`);
    };

    const handleSave = async () => {
        try {
            const res = await fetch("/api/pricing/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category,
                    hoursTrigger: hours ? Number(hours) : null,
                    condition,
                    feeAmount: Number(fee)
                }),
            });
            if (res.ok) {
                setOpen(false);
                onSave();
                // Reset
                setName(""); setFee("");
            }
        } catch (e) { alert("Error"); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4" /> إضافة سياسة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>إضافة سياسة جديدة ({type === "EXAM" ? "اختبارات" : "نقل"})</DialogTitle>
                    <DialogDescription>
                        تحديد الشروط الزمنية والقيمة المالية للغرامة
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>نوع الإجراء</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {type === "EXAM" ? (
                                    <>
                                        <SelectItem value="EXAM_CANCELLATION">إلغاء اختبار (Refund Policy)</SelectItem>
                                        <SelectItem value="EXAM_MODIFICATION">تعديل اختبار (Reschedule Fee)</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="CANCELLATION">إلغاء تذكرة</SelectItem>
                                        <SelectItem value="MODIFICATION">تعديل تذكرة</SelectItem>
                                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الشرط</Label>
                            <Select value={condition} onValueChange={setCondition}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LESS_THAN">أقل من (&lt;)</SelectItem>
                                    <SelectItem value="GREATER_THAN">أكثر من (&gt;)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>عدد الساعات</Label>
                            <div className="relative">
                                <Input type="number" value={hours} onChange={e => setHours(e.target.value)} />
                                <span className="absolute left-3 top-2.5 text-xs text-gray-400">ساعة</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>قيمة الغرامة / الخصم</Label>
                        <div className="relative">
                            <Input type="number" value={fee} onChange={e => setFee(e.target.value)} className="pl-12 font-bold" placeholder="0.00" />
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400">ر.ي</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {category.includes("CANCEL") ? "المبلغ الذي سيتم خصمه من المسترد" : "الرسوم الإضافية التي سيدفعها العميل"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>اسم السياسة</Label>
                            <button onClick={generateName} className="text-xs text-blue-600 hover:underline">إنشاء تلقائي</button>
                        </div>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="وصف السياسة" />
                    </div>

                    <Button onClick={handleSave} className="w-full mt-2">حفظ السياسة</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
