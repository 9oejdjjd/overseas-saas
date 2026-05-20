"use client";

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User, X, Tag } from "lucide-react";
import { ExtendedApplicant } from "@/types/applicant";
import { useApplicantData } from "@/hooks/useApplicantData";
import { ApplicantSetupWizard } from "./ApplicantSetupWizard";
import { VisitorDetailView } from "./applicants/VisitorDetailView";

interface Props {
    applicant: ExtendedApplicant | null;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function ApplicantDetailModal({ applicant: initialApplicant, open, onClose, onUpdate }: Props) {
    const isVisitor = !!(initialApplicant as any)?.isVisitor;

    const {
        applicant,
        transactions,
        ticket,
        pricingPackages,
        transportRoute,
        cancellationPolicies,
        refresh
    } = useApplicantData(open && !isVisitor ? initialApplicant : null);

    const handleUpdate = () => {
        if (!isVisitor) refresh();
        onUpdate();
    };

    if (!initialApplicant) return null;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="overflow-y-auto w-[650px] sm:w-[900px] max-w-full p-0 gap-0 bg-white sm:rounded-l-xl border-l shadow-2xl transition-all duration-300">

                {/* Visually hidden title for accessibility */}
                <span className="sr-only">
                    <SheetTitle>تفاصيل {isVisitor ? 'الزائر' : 'المتقدم'}: {initialApplicant.fullName}</SheetTitle>
                    <SheetDescription>عرض وتعديل بيانات {isVisitor ? 'الزائر' : 'المتقدم'}</SheetDescription>
                </span>

                {/* Header */}
                <div className={`${isVisitor ? 'bg-orange-700' : 'bg-gray-900'} text-white p-4 flex justify-between items-center shadow-lg z-10 relative`}>
                    <div className="flex items-center gap-3">
                        <div className={`${isVisitor ? 'bg-orange-500' : 'bg-blue-600'} p-2 rounded-lg`}>
                            {isVisitor ? <Tag className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                {initialApplicant.fullName}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                {isVisitor ? (
                                    <span className="bg-orange-600 px-2 py-0.5 rounded text-white">زائر</span>
                                ) : (
                                    <span className="font-mono">{(initialApplicant as any).applicantCode}</span>
                                )}
                                {!isVisitor && <span className="w-1 h-1 bg-gray-500 rounded-full" />}
                                <span>{(initialApplicant as any).profession || initialApplicant.phone}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                {isVisitor ? (
                    <VisitorDetailView
                        visitor={initialApplicant}
                        onUpdate={handleUpdate}
                        onClose={onClose}
                    />
                ) : applicant ? (
                    <ApplicantSetupWizard
                        applicant={applicant}
                        transactions={transactions}
                        ticket={ticket}
                        pricingPackages={pricingPackages}
                        transportRoute={transportRoute}
                        cancellationPolicies={cancellationPolicies}
                        onUpdate={handleUpdate}
                    />
                ) : (
                    <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
                )}

            </SheetContent>
        </Sheet>
    );
}
