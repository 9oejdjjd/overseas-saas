"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, UploadCloud, AlertCircle, FileJson, CheckCircle2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const JSON_TEMPLATE = `[
  {
    "text": "نص السؤال هنا؟",
    "explanation": "شرح الإجابة المفصل",
    "difficulty": "HARD",
    "cognitiveLevel": "K2",
    "options": [
      { "text": "الخيار الأول", "isCorrect": false },
      { "text": "الخيار الثاني", "isCorrect": true },
      { "text": "الخيار الثالث", "isCorrect": false },
      { "text": "الخيار الرابع", "isCorrect": false }
    ]
  }
]`;

export function QuestionsImportModal({ professions, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"input" | "preview" | "report">("input");
    
    // Form State
    const [professionId, setProfessionId] = useState("");
    const [axis, setAxis] = useState("");
    const [mode, setMode] = useState("skip_duplicates");
    const [jsonText, setJsonText] = useState("");
    const [parsedData, setParsedData] = useState<any[]>([]);
    
    // Action State
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) setJsonText(event.target.result as string);
        };
        reader.readAsText(file);
    };

    const validateAndPreview = () => {
        setError(null);
        if (!professionId) return setError("يجب اختيار المهنة أولاً");
        if (!axis) return setError("يجب اختيار المحور أولاً");
        if (!jsonText.trim()) return setError("يجب إدخال كود الـ JSON أو رفع ملف");

        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) return setError("يجب أن يكون الـ JSON عبارة عن مصفوفة Array [...]");
            if (parsed.length === 0) return setError("المصفوفة فارغة. لا يوجد أسئلة.");

            // Client-side generic shape check
            for (let i = 0; i < parsed.length; i++) {
                const q = parsed[i];
                if (!q.text) return setError(`السؤال رقم ${i + 1} يفتقد لنص السؤال 'text'`);
                if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                    return setError(`السؤال رقم ${i + 1} يجب أن يحتوي على 4 خيارات بالضبط`);
                }
                const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                if (correctCount !== 1) {
                    return setError(`السؤال رقم ${i + 1} يجب أن يحتوي على خيار واحد صحيح فقط`);
                }
            }

            setParsedData(parsed);
            setStep("preview");
        } catch (err: any) {
            setError("خطأ في قراءة ملف الـ JSON: الرجاء التأكد من صحة الصيغة. " + err.message);
        }
    };

    const handleImport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/mock/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professionId,
                    axis,
                    mode,
                    questions: parsedData
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "حدث خطأ غير متوقع أثناء الاستيراد");
                setStep("input");
            } else {
                setReport(data);
                setStep("report");
                onSuccess(); // Refresh question list in background
            }
        } catch (e) {
            setError("حدث خطأ في الاتصال بالخادم");
            setStep("input");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep("input");
        setJsonText("");
        setParsedData([]);
        setReport(null);
        setError(null);
    };

    // Calculate stats for preview
    const previewStats = useMemo(() => {
        if (!parsedData.length) return null;
        let hard = 0, medium = 0, easy = 0, k1 = 0, k2 = 0;
        parsedData.forEach(q => {
            if (q.difficulty === "HARD") hard++;
            else if (q.difficulty === "EASY") easy++;
            else medium++;

            if (q.cognitiveLevel === "K1") k1++;
            else k2++;
        });
        return { total: parsedData.length, hard, medium, easy, k1, k2 };
    }, [parsedData]);

    const getDynamicPrompt = () => {
        const professionName = professions.find(p => p.id === professionId)?.name || "[اسم المهنة]";
        const axisName = AXIS_OPTIONS.find(a => a.value === axis)?.label || "[اسم المحور]";

        return `أريد منك العمل كخبير وممتحن في إعداد امتحانات الاعتماد المهني والهندسي.
الرجاء توليد 30 سؤالاً مهنياً لمهنة "${professionName}" وتحديداً في محور "${axisName}".

التفاصيل والشروط:
- 2 أسئلة بمستوى صعوبة MEDIUM.
- 28 سؤال بمستوى صعوبة HARD.
- توزيع المستوى المعرفي (cognitiveLevel) يجب أن يكون كالتالي بالنصف:
  * 15 سؤال بمستوى K1: أسئلة مباشرة تعتمد على التذكر ومعرفة الأساسيات، ولكن يجب أن تكون صعبة وعميقة (وليست سطحية).
  * 15 سؤال بمستوى K2: أسئلة تعتمد على مواقف وسيناريوهات عمل حقيقية تحتاج لتفكير تطبيقي وتجاوب مع مشكلات.
- كل سؤال يجب أن يحتوي على 4 خيارات، خيار واحد فقط هو الصحيح بشكل قطعي.
- اكتب شرحاً دقيقاً لكل إجابة.

الرجاء إرجاع النتيجة حصرياً بصيغة مصفوفة JSON التالية بدون أي نصوص إضافية:

${JSON_TEMPLATE}
`;
    };

    const copyTemplate = () => {
        navigator.clipboard.writeText(getDynamicPrompt());
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setTimeout(resetForm, 300);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <FileDown className="h-4 w-4" />
                    استيراد أسئلة (JSON)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1">
                        <span className="text-xl">استيراد الأسئلة بالجملة</span>
                        <span className="text-sm font-normal text-gray-500">
                            أدخل الأسئلة دفعة واحدة باستخدام ملف JSON لتسريع الإدخال اليدوي.
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {/* STEP 1: INPUT */}
                    {step === "input" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>المهنة المستهدفة</Label>
                                    <Select value={professionId} onValueChange={setProfessionId}>
                                        <SelectTrigger><SelectValue placeholder="اختر المهنة" /></SelectTrigger>
                                        <SelectContent>
                                            {professions.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>المحور المعرفي</Label>
                                    <Select value={axis} onValueChange={setAxis}>
                                        <SelectTrigger><SelectValue placeholder="اختر المحور" /></SelectTrigger>
                                        <SelectContent>
                                            {AXIS_OPTIONS.map(a => (
                                                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>طريقة الاستيراد والتعارض</Label>
                                    <Select value={mode} onValueChange={setMode}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="skip_duplicates">تخطي المكرر وإضافة الجديد</SelectItem>
                                            <SelectItem value="replace_axis_questions">مسح كل أسئلة هذا المحور بالكامل ثم الاستيراد</SelectItem>
                                            <SelectItem value="append">إضافة (رفض التكرار مع إظهار خطأ)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>محتوى ملف JSON</Label>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={(e) => {
                                            copyTemplate();
                                            const btn = e.currentTarget;
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = 'تم النسخ بنجاح!';
                                            btn.classList.add('text-green-600', 'border-green-600');
                                            setTimeout(() => {
                                                btn.innerHTML = originalText;
                                                btn.classList.remove('text-green-600', 'border-green-600');
                                            }, 2000);
                                        }} className="h-7 text-xs flex items-center">
                                            <Copy className="h-3 w-3 ml-1" /> نسخ Prompt للأدوات (ChatGPT)
                                        </Button>
                                        <div className="relative">
                                            <Button variant="secondary" size="sm" className="h-7 text-xs">
                                                <UploadCloud className="h-3 w-3 ml-1" /> رفع ملف
                                            </Button>
                                            <input 
                                                type="file" accept=".json" 
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Textarea 
                                    className="font-mono text-left opacity-90 h-64 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors custom-scrollbar" 
                                    dir="ltr" 
                                    placeholder="يلصق محتوى مصفوفة ال JSON هنا..."
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button onClick={validateAndPreview} size="lg" className="w-full sm:w-auto">متابعة ومعاينة</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === "preview" && previewStats && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl">
                                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <FileJson className="h-5 w-5" />
                                    تم قراءة وتحليل الـ JSON بنجاح
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-gray-500 mb-1">إجمالي الأسئلة</p>
                                        <p className="text-xl font-bold">{previewStats.total}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-gray-500 mb-1">توزيع الصعوبة</p>
                                        <p className="font-bold text-red-600">{previewStats.hard} صعب <span className="text-gray-300 mx-1">|</span> <span className="text-blue-600">{previewStats.medium} م</span></p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-gray-500 mb-1">المستوى المعرفي</p>
                                        <p className="font-bold text-purple-700">{previewStats.k2} تطبيق (K2)</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                        <p className="text-gray-500 mb-1">وضعية الإدخال</p>
                                        <p className="font-bold text-orange-600 text-xs mt-1">
                                            {mode === "replace_axis_questions" ? "استبدال المحور بالكامل" : 
                                             mode === "skip_duplicates" ? "تجاوز المكرر" : "إضافة (رفض التكرار)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-gray-500">معاينة أول سؤالين (للتأكد):</Label>
                                {parsedData.slice(0, 2).map((q, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                                        <p className="font-bold mb-2">{q.text}</p>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <Badge variant="outline">{q.difficulty || "MEDIUM"}</Badge>
                                            <Badge variant="outline">{q.cognitiveLevel || "K2"}</Badge>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                            {q.options.map((opt: any, i: number) => (
                                                <div key={i} className={`p-2 rounded ${opt.isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 border border-gray-200'}`}>
                                                    {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setStep("input")} disabled={isLoading}>الرجوع للتعديل</Button>
                                <Button onClick={handleImport} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
                                    {isLoading ? "جاري الإدخال..." : "تأكيد واستيراد الأسئلة"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REPORT */}
                    {step === "report" && report && (
                        <div className="space-y-6">
                            <div className="text-center py-6 bg-green-50 rounded-xl border border-green-100">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-green-900">تم اكتمال عملية الاستيراد</h3>
                                <p className="text-green-700 mt-1">المهنة: {professions.find(p=>p.id===professionId)?.name} | {AXIS_OPTIONS.find(a=>a.value===axis)?.label}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg bg-gray-50">
                                    <p className="text-3xl font-bold text-green-600">{report.imported}</p>
                                    <p className="text-sm text-gray-500 mt-1">تم إدخاله بنجاح</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg bg-gray-50">
                                    <p className="text-3xl font-bold text-orange-500">{report.skippedDuplicates}</p>
                                    <p className="text-sm text-gray-500 mt-1">مكرر تم تجاوزه</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg bg-gray-50">
                                    <p className="text-3xl font-bold text-red-600">{report.failed}</p>
                                    <p className="text-sm text-gray-500 mt-1">أسئلة فاشلة (أخطاء)</p>
                                </div>
                            </div>

                            {report.errors?.length > 0 && (
                                <div className="mt-4 border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 p-3 border-b border-red-100 font-bold text-red-800 text-sm">
                                        تفاصيل الأخطاء والمشاكل ({report.errors.length})
                                    </div>
                                    <div className="max-h-60 overflow-y-auto bg-gray-50 p-0 text-sm">
                                        <table className="w-full text-right">
                                            <tbody className="divide-y">
                                                {report.errors.map((err: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-100">
                                                        <td className="p-3 w-12 text-gray-400 font-mono text-xs">#{err.index + 1}</td>
                                                        <td className="p-3 text-red-700 font-medium w-1/3">{err.reason}</td>
                                                        <td className="p-3 text-gray-600 truncate max-w-xs">{err.text}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setIsOpen(false)}>إغلاق النافذة</Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
