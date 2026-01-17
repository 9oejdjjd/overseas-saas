import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Search, User, Loader2 } from "lucide-react";

interface QuickTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickTransactionModal({ isOpen, onClose, onSuccess }: QuickTransactionModalProps) {
    const [step, setStep] = useState(1);
    const [type, setType] = useState<"PAYMENT" | "EXPENSE" | "WITHDRAWAL">("PAYMENT");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Transaction Data
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setType("PAYMENT");
            setSearchQuery("");
            setSearchResults([]);
            setSelectedApplicant(null);
            setAmount("");
            setDescription("");
        }
    }, [isOpen]);

    // Search Applicants
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                setLoadingSearch(true);
                fetch(`/api/applicants?search=${searchQuery}&limit=5`)
                    .then(res => res.json())
                    .then(data => {
                        // API returns an array of applicants directly
                        if (Array.isArray(data)) {
                            setSearchResults(data);
                        } else {
                            // Fallback in case API changes later
                            setSearchResults(data.applicants || []);
                        }
                    })
                    .catch(console.error)
                    .finally(() => setLoadingSearch(false));
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const body = {
                type,
                amount: Number(amount),
                description,
                notes: description,
                applicantId: selectedApplicant?.id || null,
                category: type === "PAYMENT" ? "GENERAL_PAYMENT" : "GENERAL_EXPENSE"
            };

            const res = await fetch("/api/accounting/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert("فشلت العملية");
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>تسجيل معاملة مالية جديدة</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Transaction Type Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setType("PAYMENT"); setStep(1); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === "PAYMENT" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            سند قبض (إيراد)
                        </button>
                        <button
                            onClick={() => { setType("EXPENSE"); setSelectedApplicant(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === "EXPENSE" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            سند صرف (مصروف)
                        </button>
                        <button
                            onClick={() => { setType("WITHDRAWAL"); setStep(1); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === "WITHDRAWAL" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            مسحوبات / إرجاع
                        </button>
                    </div>

                    {/* Step 1: Select Applicant (Only for Payments OR Refund/Withdrawal linked to applicant) */}
                    {(type === "PAYMENT" || type === "WITHDRAWAL") && !selectedApplicant ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <Label>البحث عن المتقدم (المرتبط بالمعاملة)</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                                    className="pr-9"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {loadingSearch && <div className="text-center py-2 text-gray-400 text-xs"><Loader2 className="h-4 w-4 animate-spin inline ml-2" />جاري البحث...</div>}

                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {searchResults.map(app => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApplicant(app)}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{app.fullName}</p>
                                                <p className="text-xs text-gray-500">{app.passportNumber || "لا يوجد جواز"}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs text-gray-500 block">المتبقي</span>
                                            <span className="text-sm font-bold text-red-600">{Number(app.remainingBalance).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && !loadingSearch && (
                                    <div className="text-center py-4 text-gray-400 text-sm">لا توجد نتائج</div>
                                )}
                            </div>

                            {/* Skip Button for General Withdrawal (Not linked to applicant) */}
                            {type === "WITHDRAWAL" && (
                                <button
                                    onClick={() => setSelectedApplicant({ id: null, fullName: "مسحوبات عامة" })}
                                    className="text-xs text-gray-500 underline w-full text-center mt-2 hover:text-gray-800"
                                >
                                    تسجيل مسحوبات عامة (غير مرتبطة بمشترك)
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {/* Selected Applicant Summary */}
                            {selectedApplicant && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">{selectedApplicant.fullName}</p>
                                            {selectedApplicant.id && <p className="text-xs text-blue-700">الرصيد الحالي: {Number(selectedApplicant.remainingBalance).toLocaleString()} ر.ي</p>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)} className="h-8 text-xs">تغيير</Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>المبلغ (ر.ي)</Label>
                                    <Input
                                        type="number"
                                        className="text-lg font-bold"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>ملاحظات / وصف</Label>
                                    <Input
                                        placeholder="مثال: دفعة مقدمة، رسوم اختبار..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || !description || ((type === "PAYMENT") && !selectedApplicant) || isSubmitting}
                        className={type === "PAYMENT" ? "bg-green-600 hover:bg-green-700" : type === "WITHDRAWAL" ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد العملية"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
