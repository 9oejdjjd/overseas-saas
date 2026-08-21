import React, { useState, useEffect } from "react";
import { Search, Loader2, Lock, ArrowRight, ArrowLeft, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step2ProfessionProps {
    selectedProfession: any;
    setSelectedProfession: (prof: any) => void;
    isProfessionLocked: boolean;
    onNext: () => void;
    onPrev: () => void;
}

export function Step2Profession({
    selectedProfession,
    setSelectedProfession,
    isProfessionLocked,
    onNext,
    onPrev
}: Step2ProfessionProps) {
    const [professions, setProfessions] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/agent/professions")
            .then((res) => res.json())
            .then((data) => {
                const list = data.data || data.professions || (Array.isArray(data) ? data : []);
                setProfessions(list);

                // If locked (profession matches selected name), find exact matching object
                if (isProfessionLocked && selectedProfession?.name) {
                    const found = list.find((p: any) => p.name === selectedProfession.name);
                    if (found) setSelectedProfession(found);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [isProfessionLocked, selectedProfession?.name]);

    const filtered = Array.isArray(professions)
        ? professions.filter((p) => (p.name || "").toLowerCase().includes(search.toLowerCase()))
        : [];

    return (
        <div className="space-y-6 text-right">
            <div className="flex flex-col text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">اختيار مهنة الاختبار</h2>
                <p className="text-gray-500 dark:text-slate-400">حدد المهنة التي ترغب في ربط المتقدم بها</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {/* Lock Warning / Informational Alert */}
                <div className="p-3.5 bg-blue-50 dark:bg-slate-900/40 text-blue-700 dark:text-blue-300 border border-blue-150 dark:border-blue-900/30 rounded-xl text-xs font-bold leading-relaxed">
                    {isProfessionLocked ? (
                        <div className="flex items-start gap-2">
                            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                تنبيه: المهنة مغلقة حالياً لوجود باقة أو اختبارات نشطة لم يستكملها المتقدم بعد. سيتم ربط هذا الشراء بالمهنة المحددة مسبقاً تلقائياً.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                            <span>
                                ملاحظة: يتم تحديد المهنة مرة واحدة لكل طلب (فمثلاً إذا تم طلب عدة اختبارات لنفس العميل في هذا الطلب، فلن يكون بالإمكان تغيير المهنة إلا بعد اكتمال كافة الاختبارات). يرجى الاختيار بدقة.
                            </span>
                        </div>
                    )}
                </div>

                {!isProfessionLocked && (
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="ابحث عن مهنة..."
                            className="pr-10 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                )}

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#074388]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                        {filtered.map((prof) => {
                            const isSelected = selectedProfession?.id === prof.id || selectedProfession?.name === prof.name;
                            const disabledCard = isProfessionLocked && !isSelected;
                            return (
                                <div
                                    key={prof.id}
                                    onClick={() => {
                                        if (disabledCard) return;
                                        setSelectedProfession(prof);
                                        if (!isProfessionLocked) {
                                            setTimeout(onNext, 300);
                                        }
                                    }}
                                    className={cn(
                                        "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm flex flex-col items-center justify-center text-center h-20",
                                        isSelected
                                            ? "border-[#074388] bg-[#074388]/5 font-bold"
                                            : disabledCard
                                            ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                                            : "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300"
                                    )}
                                >
                                    <span className="text-sm text-gray-900 dark:text-white">{prof.name}</span>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-8 text-center text-gray-500">لا توجد مهن مطابقة</div>
                        )}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onPrev}>
                        <ArrowRight className="w-4 h-4 ml-2" /> عودة
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!selectedProfession}
                        className="bg-[#074388] hover:bg-[#074388]/90 text-white font-bold"
                    >
                        متابعة <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
