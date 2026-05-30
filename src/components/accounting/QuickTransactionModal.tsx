"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Search, User, Loader2 } from "lucide-react";
import { useQuickTransaction } from "@/hooks/accounting/useQuickTransaction";
import { cn } from "@/lib/utils";

interface QuickTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickTransactionModal({ isOpen, onClose, onSuccess }: QuickTransactionModalProps) {
    const {
        step,
        setStep,
        type,
        setType,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSelectedApplicant,
        selectedApplicant,
        loadingSearch,
        amount,
        setAmount,
        discountAmount,
        setDiscountAmount,
        description,
        setDescription,
        isSubmitting,
        handleSubmit
    } = useQuickTransaction({ isOpen, onClose, onSuccess });

    const isPayment = type === "PAYMENT";
    const isExpense = type === "EXPENSE";
    const isWithdrawal = type === "WITHDRAWAL";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        تسجيل معاملة مالية جديدة
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Transaction Type Toggle with visual feedback */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100/50 dark:border-slate-900">
                        <button
                            onClick={() => { setType("PAYMENT"); setStep(1); }}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                isPayment 
                                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                            )}
                        >
                            سند قبض (إيراد)
                        </button>
                        <button
                            onClick={() => { setType("EXPENSE"); setSelectedApplicant(null); }}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                isExpense 
                                    ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                            )}
                        >
                            سند صرف (مصروف)
                        </button>
                        <button
                            onClick={() => { setType("WITHDRAWAL"); setStep(1); }}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                isWithdrawal 
                                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                            )}
                        >
                            مسحوبات / إرجاع
                        </button>
                    </div>

                    {/* Step 1: Select Applicant (Only for Payments OR Withdrawal linked to applicant) */}
                    {(isPayment || isWithdrawal) && !selectedApplicant ? (
                        <div className="space-y-3.5 animate-fade-in">
                            <Label className="text-xs font-bold text-slate-750 dark:text-slate-300">البحث عن المتقدم (المرتبط بالعملية)</Label>
                            <div className="relative">
                                <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                                    className="pr-10 h-10.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {loadingSearch && (
                                <div className="text-center py-2 text-slate-400 text-xs flex items-center justify-center gap-1.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                    <span>جاري البحث في قاعدة البيانات...</span>
                                </div>
                            )}

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {searchResults.map((app: any) => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApplicant(app)}
                                        className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-all group shadow-sm hover:border-emerald-100 dark:hover:border-emerald-900/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                                                <User className="h-4.5 w-4.5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{app.fullName}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{app.passportNumber || "لا يوجد جواز"}</p>
                                            </div>
                                        </div>
                                        <div className="text-left shrink-0">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">المتبقي</span>
                                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">{Number(app.remainingBalance).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && !loadingSearch && (
                                    <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">لا توجد نتائج مطابقة</div>
                                )}
                            </div>

                            {/* Skip Button for General Withdrawal (Not linked to applicant) */}
                            {isWithdrawal && (
                                <button
                                    onClick={() => setSelectedApplicant({ id: null, fullName: "مسحوبات عامة" })}
                                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 underline w-full text-center mt-2 block transition-colors"
                                >
                                    تسجيل مسحوبات عامة (غير مرتبطة بمشترك)
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {/* Selected Applicant Summary with Glowing Accent */}
                            {selectedApplicant && (
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/35 rounded-xl">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">{selectedApplicant.fullName}</p>
                                            {selectedApplicant.id && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">الرصيد الحالي: {Number(selectedApplicant.remainingBalance).toLocaleString()} ر.ي</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedApplicant(null)} 
                                        className="h-8 text-xs hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold"
                                    >
                                        تغيير
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className={isPayment ? "" : "col-span-2"}>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">المبلغ (ر.ي)</Label>
                                    <Input
                                        type="number"
                                        className={cn(
                                            "text-lg font-black h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-emerald-500",
                                            isPayment ? "text-emerald-600 dark:text-emerald-400" : isExpense ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                                        )}
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {isPayment && (
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">خصم إضافي (ر.ي)</Label>
                                        <Input
                                            type="number"
                                            className="text-lg font-black h-11 text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-emerald-500"
                                            placeholder="0"
                                            value={discountAmount}
                                            onChange={e => setDiscountAmount(e.target.value)}
                                        />
                                        {discountAmount && Number(discountAmount) > 0 && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                                                سيُخصم {Number(discountAmount).toLocaleString()} ر.ي من مبلغ المتقدم المتبقي
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوصف والبيان المالي</Label>
                                    <Input
                                        placeholder="مثال: دفعة مقدمة للاعتماد، رسوم النقل وحجز الباص..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4 gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-10.5">إلغاء</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || !description || (isPayment && !selectedApplicant) || isSubmitting}
                        className={cn(
                            "font-bold px-5 shadow-md rounded-xl h-10.5 transition-all text-white",
                            isPayment 
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none" 
                                : isWithdrawal 
                                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100 dark:shadow-none" 
                                : "bg-rose-600 hover:bg-rose-700 shadow-rose-100 dark:shadow-none"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-1.5 animate-spin" />
                                جاري المعالجة...
                            </>
                        ) : (
                            "اعتماد وتأكيد العملية"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
