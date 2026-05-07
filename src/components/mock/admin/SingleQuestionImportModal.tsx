"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlusCircle, UploadCloud, AlertCircle, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react";

interface Props {
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

export function SingleQuestionImportModal({ professions, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    
    const [professionId, setProfessionId] = useState("");
    const [axis, setAxis] = useState("");
    const [type, setType] = useState("MCQ");
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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetForm = () => {
        setText("");
        setExplanation("");
        setImageUrl("");
        setOptions([
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
        ]);
        setError(null);
        setSuccessMessage(null);
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        if (newType === "TRUE_FALSE") {
            setOptions([
                { text: "صح", isCorrect: true },
                { text: "خطأ", isCorrect: false }
            ]);
        } else {
            setOptions([
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false }
            ]);
        }
    };

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
        setSuccessMessage(null);

        if (!professionId || !axis) return setError("يجب اختيار المهنة والمحور");
        if (!text.trim()) return setError("يجب إدخال نص السؤال");

        const filledOptions = type === "TRUE_FALSE" ? options.slice(0, 2) : options;
        
        if (filledOptions.some(o => !o.text.trim())) return setError("جميع الخيارات يجب أن تكون ممتلئة");
        if (filledOptions.filter(o => o.isCorrect).length !== 1) return setError("يجب تحديد إجابة صحيحة واحدة فقط");

        setIsLoading(true);

        const questionPayload = {
            text,
            explanation,
            difficulty,
            cognitiveLevel,
            imageUrl: imageUrl || null,
            options: filledOptions
        };

        try {
            const res = await fetch("/api/mock/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professionId,
                    axis,
                    mode: "append", // Append mode prevents accidental replacement
                    questionType: type, // Pass the type here to be used in the backend
                    questions: [questionPayload]
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "حدث خطأ أثناء الإضافة");
            } else if (data.failed > 0) {
                setError(data.errors[0]?.reason || "لم يتم إضافة السؤال. قد يكون مكرراً.");
            } else {
                setSuccessMessage("تم إضافة السؤال بنجاح!");
                setTimeout(() => {
                    resetForm();
                    onSuccess();
                    // Keep modal open so admin can add another question quickly
                }, 1500);
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    إضافة سؤال مفرد
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-emerald-800">إضافة سؤال جديد (مع إمكانية إرفاق صورة)</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Right Column: Settings & Text */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المهنة</Label>
                                <Select value={professionId} onValueChange={setProfessionId}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>
                                        {professions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                                <Select value={type} onValueChange={handleTypeChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MCQ">اختيار من متعدد</SelectItem>
                                        <SelectItem value="TRUE_FALSE">صح أو خطأ</SelectItem>
                                        <SelectItem value="FILL_BLANK">إكمال الفراغات</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            <Label>نص السؤال</Label>
                            <Textarea 
                                placeholder="اكتب نص السؤال هنا..." 
                                className="h-24"
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>توجيه / شرح الإجابة (اختياري)</Label>
                            <Textarea 
                                placeholder="شرح مبسط يظهر للطالب عند المراجعة..." 
                                className="h-16"
                                value={explanation}
                                onChange={e => setExplanation(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Left Column: Image & Options */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-blue-500" /> 
                                صورة مرفقة مع السؤال (اختياري)
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
                            
                            {type === "TRUE_FALSE" ? (
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
                
                {successMessage && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 text-sm font-bold">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || isUploadingImage} className="bg-emerald-600 hover:bg-emerald-700 min-w-32">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "حفظ السؤال"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
