"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadCloud, AlertCircle, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    question: any;
    professions: any[];
    onSuccess: () => void;
}

const AXIS_OPTIONS = [
    { value: "HEALTH_SAFETY", label: "الصحة والسلامة" },
    { value: "PROFESSION_KNOWLEDGE", label: "المعرفة المهنية" },
    { value: "GENERAL_SKILLS", label: "المهارات العامة" },
    { value: "OCCUPATIONAL_SAFETY", label: "السلامة المهنية" },
    { value: "CORRECT_METHODS", label: "الطرق الصحيحة" },
    { value: "PROFESSIONAL_BEHAVIOR", label: "السلوك المهني" },
    { value: "TOOLS_AND_EQUIPMENT", label: "الأدوات والمعدات" },
    { value: "EMERGENCIES_FIRST_AID", label: "الطوارئ والإسعافات" }
];

export function EditQuestionModal({ isOpen, setIsOpen, question, professions, onSuccess }: Props) {
    const [axis, setAxis] = useState("");
    const [difficulty, setDifficulty] = useState("HARD");
    const [cognitiveLevel, setCognitiveLevel] = useState("K2");
    
    const [text, setText] = useState("");
    const [explanation, setExplanation] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    
    const [options, setOptions] = useState([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (question && isOpen) {
            setAxis(question.axis || "");
            setDifficulty(question.difficulty || "HARD");
            setCognitiveLevel(question.cognitiveLevel || "K2");
            setText(question.text || "");
            setExplanation(question.explanation || "");
            setImageUrl(question.imageUrl || "");

            // pad options to 4 if needed (except true/false)
            let parsedOpts = question.options?.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })) || [];
            if (question.type !== "TRUE_FALSE") {
                while (parsedOpts.length < 4) parsedOpts.push({ text: "", isCorrect: false });
            }
            setOptions(parsedOpts);
        }
    }, [question, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        setError(null);
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/mock/admin/upload-image", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            
            if (res.ok && data.url) {
                setImageUrl(data.url);
            } else {
                setError(data.error || "فشل رفع الصورة");
            }
        } catch (err) {
            setError("حدث خطأ أثناء رفع الصورة");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        setError(null);

        if (!text.trim()) return setError("يجب إدخال نص السؤال");

        const filledOptions = question.type === "TRUE_FALSE" ? options.slice(0, 2) : options;
        
        if (filledOptions.some((o: any) => !o.text.trim())) return setError("جميع الخيارات يجب أن تكون ممتلئة");
        if (filledOptions.filter((o: any) => o.isCorrect).length !== 1) return setError("يجب تحديد إجابة صحيحة واحدة فقط");

        setIsLoading(true);

        try {
            const res = await fetch(`/api/mock/admin/questions/${question.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    explanation,
                    difficulty,
                    cognitiveLevel,
                    axis,
                    imageUrl: imageUrl || null,
                    options: filledOptions,
                    isActive: true
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "حدث خطأ أثناء التعديل");
            } else {
                setIsOpen(false);
                onSuccess();
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال");
        } finally {
            setIsLoading(false);
        }
    };

    if (!question) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-blue-800">تعديل السؤال</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المهنة</Label>
                                <Input disabled value={professions.find(p => p.id === question.professionId)?.name || "غير محدد"} className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label>المحور</Label>
                                <Select value={axis} onValueChange={setAxis}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>
                                        {AXIS_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>نوع السؤال</Label>
                                <Input disabled value={question.type} className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label>الصعوبة</Label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HARD">صعب 🔴</SelectItem>
                                        <SelectItem value="EXPERT">صعب جداً 💀</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>المستوى المعرفي</Label>
                            <Select value={cognitiveLevel} onValueChange={setCognitiveLevel}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="K1">K1 تذكر</SelectItem>
                                    <SelectItem value="K2">K2 تطبيق</SelectItem>
                                    <SelectItem value="K3">K3 تقييم</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>نص السؤال</Label>
                            <Textarea 
                                placeholder="اكتب نص السؤال هنا..." 
                                className="h-24"
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>توجيه / شرح الإجابة</Label>
                            <Textarea 
                                placeholder="شرح مبسط يظهر للطالب عند المراجعة..." 
                                className="h-16"
                                value={explanation}
                                onChange={e => setExplanation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-blue-500" /> 
                                صورة مرفقة مع السؤال
                            </Label>
                            
                            {imageUrl ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                                    <img src={imageUrl} alt="مرفق السؤال" className="w-full h-32 object-contain" />
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="absolute top-2 left-2 h-7 px-2 text-xs"
                                        onClick={() => setImageUrl("")}
                                    >
                                        حذف الصورة
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors relative">
                                    {isUploadingImage ? (
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span className="text-sm">جاري الرفع...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <UploadCloud className="h-8 w-8 text-slate-400" />
                                            <span className="text-sm font-medium">اضغط لرفع صورة من جهازك</span>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 mt-6">
                            <Label>خيارات الإجابة (اختر الإجابة الصحيحة)</Label>
                            
                            {question.type === "TRUE_FALSE" ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {options.slice(0,2).map((opt, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => {
                                                const newOpts = [...options];
                                                newOpts[0].isCorrect = i === 0;
                                                newOpts[1].isCorrect = i === 1;
                                                setOptions(newOpts);
                                            }}
                                            className={`p-4 rounded-xl border-2 cursor-pointer text-center font-bold transition-all ${opt.isCorrect ? (i === 0 ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700') : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            {opt.text}
                                            {opt.isCorrect && <CheckCircle2 className="h-5 w-5 mx-auto mt-2" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {options.map((opt, i) => (
                                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={`shrink-0 rounded-full w-8 h-8 p-0 ${opt.isCorrect ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                onClick={() => {
                                                    const newOpts = [...options];
                                                    newOpts.forEach((o, idx) => o.isCorrect = (idx === i));
                                                    setOptions(newOpts);
                                                }}
                                            >
                                                {opt.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : (i + 1)}
                                            </Button>
                                            <Input 
                                                value={opt.text}
                                                onChange={e => {
                                                    const newOpts = [...options];
                                                    newOpts[i].text = e.target.value;
                                                    setOptions(newOpts);
                                                }}
                                                placeholder={`الخيار ${i + 1}`}
                                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm font-bold">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || isUploadingImage} className="bg-blue-600 hover:bg-blue-700 min-w-32">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "حفظ التعديلات"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
