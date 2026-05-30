"use client";

import { useState, useEffect } from "react";
import { ExtendedApplicant } from "@/types/applicant";

interface UseApplicantInfoProps {
    applicant: ExtendedApplicant;
    onUpdate?: () => void;
}

export function useApplicantInfo({ applicant, onUpdate }: UseApplicantInfoProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [platformData, setPlatformData] = useState({
        email: applicant.platformEmail || "",
        password: applicant.platformPassword || ""
    });
    const [professions, setProfessions] = useState<any[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [basicInfo, setBasicInfo] = useState({
        fullName: applicant.fullName || "",
        firstName: applicant.firstName || "",
        lastName: applicant.lastName || "",
        passportNumber: applicant.passportNumber || "",
        passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined as Date | undefined,
        dob: applicant.dob ? new Date(applicant.dob) : undefined as Date | undefined,
        nationalId: applicant.nationalId || "",
        profession: applicant.profession || "",
        phone: applicant.phone || "",
        whatsappNumber: applicant.whatsappNumber || ""
    });
    const [loading, setLoading] = useState(false);
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [savingBasic, setSavingBasic] = useState(false);

    // Fetch professions list on mount
    useEffect(() => {
        fetch("/api/mock/admin/professions")
            .then(res => res.json())
            .then(data => setProfessions(data))
            .catch(console.error);
    }, []);

    // Sync local state when applicant changes (fixes stale data bug)
    useEffect(() => {
        setPlatformData({
            email: applicant.platformEmail || "",
            password: applicant.platformPassword || ""
        });
        setBasicInfo({
            fullName: applicant.fullName || "",
            firstName: applicant.firstName || "",
            lastName: applicant.lastName || "",
            passportNumber: applicant.passportNumber || "",
            passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined,
            dob: applicant.dob ? new Date(applicant.dob) : undefined,
            nationalId: applicant.nationalId || "",
            profession: applicant.profession || "",
            phone: applicant.phone || "",
            whatsappNumber: applicant.whatsappNumber || ""
        });
        setIsEditingBasic(false);
    }, [applicant.id, applicant]);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSaveBasicInfo = async () => {
        setSavingBasic(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: basicInfo.fullName,
                    firstName: basicInfo.firstName,
                    lastName: basicInfo.lastName,
                    passportNumber: basicInfo.passportNumber,
                    passportExpiry: basicInfo.passportExpiry,
                    dob: basicInfo.dob,
                    nationalId: basicInfo.nationalId,
                    profession: basicInfo.profession,
                    phone: basicInfo.phone,
                    whatsappNumber: basicInfo.whatsappNumber
                }),
            });

            if (res.ok) {
                alert("تم تحديث البيانات الأساسية بنجاح");
                setIsEditingBasic(false);
                if (onUpdate) onUpdate();
            } else {
                alert("فشل التحديث");
            }
        } catch (e) {
            console.error(e);
            alert("خطأ في الاتصال");
        } finally {
            setSavingBasic(false);
        }
    };

    const handleSaveCredentials = async () => {
        if (!platformData.email) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/applicants/${applicant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platformEmail: platformData.email,
                    platformPassword: platformData.password,
                    updateStatus: true
                }),
            });

            if (res.ok) {
                alert("تم حفظ بيانات المنصة بنجاح");
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            alert("خطأ في حفظ البيانات");
        } finally {
            setLoading(false);
        }
    };

    return {
        copiedField,
        platformData,
        setPlatformData,
        professions,
        dropdownOpen,
        setDropdownOpen,
        basicInfo,
        setBasicInfo,
        loading,
        isEditingBasic,
        setIsEditingBasic,
        savingBasic,
        copyToClipboard,
        handleSaveBasicInfo,
        handleSaveCredentials
    };
}
