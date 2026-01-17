"use client";

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { User, X } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantData } from "@/hooks/useApplicantData";
import { ApplicantSetupWizard } from "./ApplicantSetupWizard";

interface Props {
    // @ts-ignore
    applicant: ExtendedApplicant | null;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function ApplicantDetailModal({ applicant: initialApplicant, open, onClose, onUpdate }: Props) {
    const {
        applicant,
        transactions,
        ticket,
        pricingPackages,
        transportRoute,
        cancellationPolicies,
        refresh
    } = useApplicantData(open ? initialApplicant : null);

    if (!applicant) return null;

    const handleUpdate = () => {
        refresh();
        onUpdate();
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="overflow-y-auto w-[650px] sm:w-[900px] max-w-full p-0 gap-0 bg-white sm:rounded-l-xl border-l shadow-2xl transition-all duration-300">

                {/* Visually hidden title for accessibility */}
                <span className="sr-only">
                    <SheetTitle>تفاصيل المتقدم: {applicant.fullName}</SheetTitle>
                    <SheetDescription>عرض وتعديل بيانات المتقدم</SheetDescription>
                </span>

                {/* Minimal Header for Wizard */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                {applicant.fullName}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="font-mono">{applicant.applicantCode}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                                <span>{applicant.profession}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Wizard View */}
                <ApplicantSetupWizard
                    applicant={applicant}
                    transactions={transactions}
                    ticket={ticket}
                    pricingPackages={pricingPackages}
                    transportRoute={transportRoute}
                    cancellationPolicies={cancellationPolicies}
                    onUpdate={handleUpdate}
                />

            </SheetContent>
        </Sheet>
    );
}
