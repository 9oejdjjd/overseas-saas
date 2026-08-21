import React from "react";
import { PlusCircle, AlertCircle, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallet: any;
    balance: number;
    userName: string;
}

export function TopUpModal({
    isOpen,
    onClose,
    wallet,
    balance,
    userName
}: TopUpModalProps) {
    if (!isOpen) return null;

    const companyName = wallet?.companyName || userName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 relative text-right space-y-5">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-650 dark:hover:text-white rounded-xl transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-700">
                    <div className="p-3 bg-[#55943b]/10 text-[#55943b] rounded-2xl">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-[#074388] dark:text-white">طلب شحن رصيد المحفظة</h3>
                        <p className="text-xs text-slate-400 font-medium">تعليمات شحن الرصيد والتواصل المباشر مع الحسابات.</p>
                    </div>
                </div>

                <div className="space-y-3.5 text-xs leading-relaxed text-slate-650 dark:text-slate-350">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-[#074388] dark:text-blue-300">طرق التحويل والإيداع المتاحة:</div>
                        <div className="space-y-1 text-[11px] text-slate-650 dark:text-slate-350">
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                <span>حساب بنك الكريمي:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-white">123456789</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span>حوالات النجم / شبكة الامتياز:</span>
                                <span className="font-bold text-slate-800 dark:text-white">باسم: إدارة الاعتماد المهني</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 rounded-xl text-[11px] flex items-start gap-2 border border-blue-100 dark:border-blue-900/30">
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-600" />
                        <span>بعد إتمام التحويل، يرجى إرسال إشعار أو سند الإيداع مع اسم الوكالة إلى إدارة النظام عبر الواتساب ليتم إضافة الرصيد فوراً.</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <a
                        href={`https://wa.me/967777777777?text=${encodeURIComponent(`مرحباً إدارة الاعتماد المهني، أود شحن رصيد محفظة الوكيل:\nاسم الوكالة: ${companyName}\nالرصيد الحالي: ${balance} ريال`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-11 bg-[#55943b] hover:bg-[#4a8333] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-md shadow-[#55943b]/20"
                    >
                        <MessageSquare size={15} /> إرسال إشعار الشحن عبر واتساب
                    </a>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-11 px-5 rounded-xl font-bold text-xs bg-white"
                    >
                        إغلاق
                    </Button>
                </div>
            </div>
        </div>
    );
}
