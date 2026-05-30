"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

interface UseVoucherRefundProps {
    onSuccess: () => void;
    onClose: () => void;
}

export function useVoucherRefund({ onSuccess, onClose }: UseVoucherRefundProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [applicants, setApplicants] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 3) {
            setApplicants([]);
            return;
        }

        try {
            const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}`);
            if (res.ok) {
                const data = await res.json();
                setApplicants(Array.isArray(data) ? data : (data.applicants || data.data || []));
            }
        } catch (error) {
            console.error("Voucher refund applicant search failure:", error);
        }
    };

    const handleSelectApplicant = async (app: any) => {
        setSelectedApplicant(app);
        setLoading(true);
        try {
            const res = await fetch(`/api/vouchers?applicantId=${app.id}&type=EXAM_RETAKE`);
            if (res.ok) {
                const data = await res.json();
                // Filter client side to only get valid refundable compensation vouchers
                const refundable = data.filter((v: any) =>
                    !v.isUsed &&
                    (v.category === "COMPENSATION" || (v.notes && v.notes.includes("COMPENSATION")))
                );
                setVouchers(refundable);
            }
        } catch (error) {
            console.error("Voucher refund vouchers fetch failure:", error);
            toast("حدث خطأ أثناء تحميل قسائم المتقدم", "error");
        } finally {
            setLoading(false);
        }
    };

    // Meta extraction helper for voucher value
    const getVoucherAmount = (v: any) => {
        if (v.amount) return v.amount;
        if (v.notes && v.notes.includes("META")) {
            try {
                const meta = JSON.parse(v.notes.split("META:")[1].replace("]", ""));
                return meta.balance || meta.amount || 0;
            } catch (e) { 
                return 0; 
            }
        }
        return 0;
    };

    const handleRefund = async (voucher: any) => {
        const amount = getVoucherAmount(voucher);
        
        // Use custom confirmation message
        const confirmMsg = `هل أنت متأكد من استرداد مبلغ ${amount.toLocaleString()} ر.ي نقداً للمتقدم؟ سيتم تعطيل القسيمة.`;
        if (!window.confirm(confirmMsg)) return;

        setProcessingId(voucher.id);
        try {
            const res = await fetch("/api/vouchers/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voucherId: voucher.id, notes: "Refunded from Accounting Page" })
            });

            if (res.ok) {
                toast("تم استرداد مبلغ القسيمة بنجاح نقداً للمتقدم", "success");
                setVouchers(prev => prev.filter(v => v.id !== voucher.id));
                onSuccess();
            } else {
                const err = await res.json();
                toast(err.error || "فشل استرداد القسيمة", "error");
            }
        } catch (e) {
            console.error("Refund processing error:", e);
            toast("حدث خطأ أثناء معالجة الاسترداد", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const reset = useCallback(() => {
        setSearchTerm("");
        setApplicants([]);
        setSelectedApplicant(null);
        setVouchers([]);
        setProcessingId(null);
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    return {
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
        reset,
        handleClose
    };
}
