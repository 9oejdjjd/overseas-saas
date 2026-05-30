"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/simple-toast";

interface UseQuickTransactionProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function useQuickTransaction({ isOpen, onClose, onSuccess }: UseQuickTransactionProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [type, setType] = useState<"PAYMENT" | "EXPENSE" | "WITHDRAWAL">("PAYMENT");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Transaction Details
    const [amount, setAmount] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when opening/closing
    const reset = useCallback(() => {
        setStep(1);
        setType("PAYMENT");
        setSearchQuery("");
        setSearchResults([]);
        setSelectedApplicant(null);
        setAmount("");
        setDiscountAmount("");
        setDescription("");
        setIsSubmitting(false);
        setLoadingSearch(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    // Debounced Search of Applicants
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setLoadingSearch(true);
                try {
                    const res = await fetch(`/api/applicants?search=${encodeURIComponent(searchQuery)}&limit=5`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.data && Array.isArray(data.data)) {
                            setSearchResults(data.data);
                        } else if (Array.isArray(data)) {
                            setSearchResults(data);
                        } else {
                            setSearchResults([]);
                        }
                    }
                } catch (error) {
                    console.error("Quick transaction applicant search error:", error);
                } finally {
                    setLoadingSearch(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const body = {
                type,
                amount: Number(amount),
                discountAmount: type === "PAYMENT" && discountAmount ? Number(discountAmount) : 0,
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
                toast("تم تسجيل المعاملة المالية بنجاح", "success");
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                toast(errData.error || "فشل تسجيل المعاملة", "error");
            }
        } catch (error) {
            console.error("Transaction submission failure:", error);
            toast("حدث خطأ أثناء معالجة الطلب", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        step,
        setStep,
        type,
        setType,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        selectedApplicant,
        setSelectedApplicant,
        loadingSearch,
        amount,
        setAmount,
        discountAmount,
        setDiscountAmount,
        description,
        setDescription,
        isSubmitting,
        handleSubmit,
        reset
    };
}
