"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantInfo } from "@/hooks/applicants/useApplicantInfo";
import { CredentialsCard } from "./info/CredentialsCard";
import { PersonalDetailsView } from "./info/PersonalDetailsView";
import { PersonalDetailsForm } from "./info/PersonalDetailsForm";

interface ApplicantInfoTabProps {
    applicant: ExtendedApplicant;
    isPlatformRegistered: boolean;
    onUpdate?: () => void;
    viewMode?: "setup" | "admin";
}

export function ApplicantInfoTab({
    applicant,
    isPlatformRegistered,
    onUpdate,
    viewMode = "setup"
}: ApplicantInfoTabProps) {
    const hook = useApplicantInfo({ applicant, onUpdate });
    const { isEditingBasic, setIsEditingBasic, setBasicInfo } = hook;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-5 w-5 text-blue-600" />
                            المعلومات الأساسية والوثائق
                        </CardTitle>
                        {viewMode === 'setup' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (isEditingBasic) {
                                        // Reset to original data when cancelling
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
                                            whatsappNumber: applicant.whatsappNumber || "",
                                            platformEmail: applicant.platformEmail || "",
                                            notificationEmail: applicant.notificationEmail || ""
                                        });
                                    } else {
                                        // When entering edit mode, populate with latest applicant data
                                        setBasicInfo({
                                            fullName: applicant.fullName || "",
                                            firstName: applicant.firstName || (applicant.fullName && !applicant.firstName ? applicant.fullName.split(' ')[0] : ""),
                                            lastName: applicant.lastName || (applicant.fullName && !applicant.lastName ? applicant.fullName.split(' ').slice(1).join(' ') : ""),
                                            passportNumber: applicant.passportNumber || "",
                                            passportExpiry: applicant.passportExpiry ? new Date(applicant.passportExpiry) : undefined,
                                            dob: applicant.dob ? new Date(applicant.dob) : undefined,
                                            nationalId: applicant.nationalId || "",
                                            profession: applicant.profession || "",
                                            phone: applicant.phone || "",
                                            whatsappNumber: applicant.whatsappNumber || "",
                                            platformEmail: applicant.platformEmail || "",
                                            notificationEmail: applicant.notificationEmail || ""
                                        });
                                    }
                                    setIsEditingBasic(!isEditingBasic);
                                }}
                            >
                                {isEditingBasic ? "إلغاء" : "تعديل"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditingBasic ? (
                            <PersonalDetailsForm hook={hook} />
                        ) : (
                            <PersonalDetailsView applicant={applicant} hook={hook} />
                        )}
                    </CardContent>
                </Card>

                {/* Platform Credentials Card */}
                <CredentialsCard
                    applicant={applicant}
                    isPlatformRegistered={isPlatformRegistered}
                    viewMode={viewMode}
                    hook={hook}
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    );
}
