"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVoucherRefund } from "@/hooks/accounting/useVoucherRefund";

interface VoucherRefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function VoucherRefundModal({ isOpen, onClose, onSuccess }: VoucherRefundModalProps) {
    const {
        searchTerm,
        handleSearch,
        applicants,
        selectedApplicant,
        setSelectedApplicant,
        vouchers,
        loading,
        processingId,
        handleSelectApplicant,
        getVoucherAmount,
        handleRefund,
        handleClose
    } = useVoucherRefund({ onSuccess, onClose });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        استرداد القسائم (التعويضات المالية)
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                        استرداد نقدي لقسائم التعويض الممنوحة مسبقاً. سيتم تسجيل هذه المعاملة كمسحوبات نقدية وتعديل الأرصدة.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!selectedApplicant ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative">
                                <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="ابحث عن متقدم (الاسم، الجواز، الكود)..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pr-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl"
                                />
                            </div>
                            <div className="h-[280px] border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/40 rounded-xl p-2.5 overflow-y-auto pr-1">
                                {applicants.length === 0 && searchTerm.length > 2 && (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">لا توجد نتائج مطابقة</div>
                                )}
                                {applicants.map((app: any) => (
                                    <div
                                        key={app.id}
                                        onClick={() => handleSelectApplicant(app)}
                                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer rounded-xl border border-transparent hover:border-slate-150 dark:hover:border-slate-800 transition-all mb-1 last:mb-0 bg-white dark:bg-slate-900 shadow-sm"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{app.fullName}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{app.passportNumber || "لا يوجد جواز"}</p>
                                        </div>
                                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 font-bold px-3 py-1 text-[10px] rounded-lg">
                                            اختيار المتقدم
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/35 shadow-inner">
                                <div>
                                    <p className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">{selectedApplicant.fullName}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">قسائم التعويض المتاحة للاسترداد الفوري</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedApplicant(null)} 
                                    className="h-8 w-8 p-0 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 rounded-full"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex flex-col justify-center items-center py-10 gap-2">
                                    <Loader2 className="animate-spin h-7 w-7 text-emerald-500" />
                                    <span className="text-xs text-slate-400">جاري قراءة سجل القسائم...</span>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {vouchers.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/20 dark:bg-slate-900">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                            <p className="font-bold text-sm">لا توجد قسائم تعويض نشطة</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">لا يتوفر لدى هذا المشترك قسائم بنوع تعويض مالي غير مستخدمة.</p>
                                        </div>
                                    ) : (
                                        vouchers.map((v: any) => {
                                            const amount = getVoucherAmount(v);
                                            return (
                                                <div 
                                                    key={v.id} 
                                                    className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-250 dark:hover:border-emerald-900/60 transition-all bg-white dark:bg-slate-900 shadow-sm gap-4"
                                                >
                                                    <div className="space-y-1 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950 font-bold text-[10px] rounded-lg shrink-0">
                                                                تعويض مالي
                                                            </Badge>
                                                            <span className="font-black text-slate-800 dark:text-slate-100 text-lg font-mono">
                                                                {amount.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">ر.ي</span>
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">تاريخ الإصدار: {new Date(v.createdAt).toLocaleDateString("ar-EG")}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleRefund(v)}
                                                        disabled={processingId === v.id}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm text-xs rounded-xl h-9 px-4 shrink-0 transition-all"
                                                    >
                                                        {processingId === v.id ? (
                                                            <Loader2 className="animate-spin h-4 w-4" />
                                                        ) : (
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        )}
                                                        استرداد نقدي
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
