"use client";

import { useState, useEffect } from "react";
import { ExtendedApplicant } from "@/types/applicant";
import { formatDateLocal } from "@/components/ui/date-picker";

interface UseApplicantExamProps {
    applicant: ExtendedApplicant;
    onUpdate: () => void;
    viewMode: "setup" | "admin";
}

export function useApplicantExam({ applicant, onUpdate, viewMode }: UseApplicantExamProps) {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [pricingPackages, setPricingPackages] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [serviceConfig, setServiceConfig] = useState<{ registrationPrice: number } | null>(null);
    const [activeVouchers, setActiveVouchers] = useState<any[]>([]);
    const [useVoucher, setUseVoucher] = useState<{ id: string, notes?: string, discountPercent?: number } | null>(null);

    const isExamScheduled = !!(applicant.examDate && applicant.examTime);
    const [status, setStatus] = useState(applicant.status || "");
    const isFailedOrAbsent = ["FAILED", "ABSENT", "CANCELLED"].includes(applicant.status);

    const showEditButton = viewMode === "admin" && (isExamScheduled || isFailedOrAbsent);

    const [formData, setFormData] = useState({
        examDate: applicant.examDate ? new Date(applicant.examDate).toISOString().split('T')[0] : "",
        examTime: applicant.examTime || "",
        examLocation: applicant.examLocation || applicant.location?.name || "",
        examCenter: applicant.examCenterId || "",
    });

    const [availableCenters, setAvailableCenters] = useState<any[]>([]);

    // Fetch Locations, Vouchers and Pricing on mount
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/pricing/packages', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setPricingPackages(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch packages", err);
            }
        };

        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setLocations(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch locations", err);
            }
        };

        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/pricing/config', { cache: 'no-store' });
                if (res.ok) {
                    setServiceConfig(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch config", err);
            }
        };

        const fetchVouchers = async () => {
            try {
                const res = await fetch(`/api/vouchers?applicantId=${applicant.id}&activeOnly=true`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const validVouchers = data.filter((v: any) =>
                        ['EXAM', 'EXAM_RETAKE', 'FULL_PROGRAM'].includes(v.type)
                    );
                    setActiveVouchers(validVouchers);
                    if (validVouchers.length > 0) {
                        setUseVoucher(validVouchers[0]);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (viewMode === 'admin' || isEditing || !isExamScheduled) {
            fetchPricing();
            fetchLocations();
            fetchConfig();
            fetchVouchers();
        }
    }, [viewMode, isEditing, isExamScheduled, applicant.id]);

    // Update available centers when location changes
    useEffect(() => {
        const selectedLoc = locations.find(l => l.name === formData.examLocation);
        setAvailableCenters(selectedLoc ? selectedLoc.examCenters || [] : []);

        if (selectedLoc && formData.examCenter) {
            const centerExists = selectedLoc.examCenters?.some((c: any) => c.id === formData.examCenter);
            if (!centerExists) {
                setFormData(prev => ({ ...prev, examCenter: "" }));
            }
        }
    }, [formData.examLocation, locations]);

    const handleScheduleExam = async () => {
        if (!formData.examDate) {
            alert("Please select a date");
            return;
        }

        const isReschedule = isExamScheduled;
        const isRetake = isFailedOrAbsent;

        let feeAmount = 0;
        let confirmMsg = isReschedule ? "هل أنت متأكد من تغيير موعد الاختبار؟" : "تأكيد موعد الاختبار؟";

        if (isRetake) {
            feeAmount = serviceConfig?.registrationPrice || 16000;

            if (useVoucher) {
                const discount = useVoucher.discountPercent || 100;
                const originalFee = feeAmount;
                feeAmount = Math.max(0, originalFee * (1 - discount / 100));

                if (feeAmount === 0) {
                    confirmMsg = `سيتم استخدام قسيمة إعفاء للصرف (${discount}% خصم).\nالمبلغ المطلوب: 0 ر.ي\nهل أنت موافق؟`;
                } else {
                    confirmMsg = `سيتم استخدام قسيمة خصم (${discount}%).\nالرسوم الأصلية: ${originalFee.toLocaleString()}\nالرسوم بعد الخصم: ${feeAmount.toLocaleString()} ر.ي\nهل أنت موافق؟`;
                }
            } else {
                confirmMsg = `المتقدم (راسب/غائب). سيتم احتساب رسوم إعادة اختبار: ${feeAmount.toLocaleString()} ر.ي.\nهل أنت موافق؟`;
            }
        } else if (isReschedule && (applicant.reschedulePolicy?.rescheduleCount ?? 0) >= (applicant.reschedulePolicy?.maxFreeChanges ?? 1)) {
            confirmMsg += `\nسيتم احتساب رسوم تغيير موعد: ${applicant.reschedulePolicy?.changeFee} ر.ي.`;
        }

        if (confirm(confirmMsg) === false) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examDate: formData.examDate,
                    examTime: formData.examTime,
                    examLocation: formData.examLocation,
                    examCenterId: formData.examCenter,
                    scheduleExam: true,
                    isRetake: isRetake,
                    feeAmount: feeAmount,
                    voucherId: useVoucher?.id
                }),
            });

            if (res.ok) {
                alert(isRetake ? "تمت إعادة الجدولة واحتساب الرسوم" : "تم حفظ الموعد بنجاح");
                setIsEditing(false);
                onUpdate();
            }
        } catch (error) {
            alert("خطأ في العملية");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (newStatus === applicant.status) return;
        if (!confirm(`هل أنت متأكد من تحديث الحالة إلى ${newStatus}؟`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                alert("تم تحديث الحالة بنجاح");
                onUpdate();
            }
        } catch (error) {
            alert("فشل تحديث الحالة");
        } finally {
            setLoading(false);
        }
    };

    const handleSetDate = (date: Date | undefined) => {
        const dateStr = date ? formatDateLocal(date) : "";
        setFormData(prev => ({ ...prev, examDate: dateStr }));
    };

    return {
        loading,
        setLoading,
        isEditing,
        setIsEditing,
        pricingPackages,
        locations,
        serviceConfig,
        activeVouchers,
        useVoucher,
        setUseVoucher,
        isExamScheduled,
        status,
        setStatus,
        isFailedOrAbsent,
        showEditButton,
        formData,
        setFormData,
        availableCenters,
        handleScheduleExam,
        updateStatus,
        handleSetDate
    };
}
