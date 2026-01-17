"use client";

import { useState } from "react";
import { ExtendedApplicant, Transaction, Ticket as TicketType, ActivityLog } from "@/types/applicant";
import { ApplicantInfoTab } from "./applicants/ApplicantInfoTab";
import { ApplicantFinanceTab } from "./applicants/ApplicantFinanceTab";
import { ApplicantTicketTab } from "./applicants/ApplicantTicketTab";
import { ApplicantExamTab } from "./applicants/ApplicantExamTab";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicantSetupWizardProps {
    applicant: ExtendedApplicant;
    transactions: Transaction[];
    ticket: TicketType | null;
    pricingPackages: any[];
    transportRoute: any;
    cancellationPolicies: any[];
    onUpdate: () => void;
}

export function ApplicantSetupWizard({
    applicant,
    transactions,
    ticket,
    pricingPackages,
    transportRoute,
    cancellationPolicies,
    onUpdate
}: ApplicantSetupWizardProps) {

    // Calculate current step based on data
    const hasPlatform = !!applicant.platformEmail;
    const hasExam = !!(applicant.examDate && applicant.examTime);
    const hasTicket = !!ticket;

    // Use internal state for wizard steps, but default to the first incomplete step
    // 1: Info (Platform Setup)
    // 2: Exam (Schedule)
    // 3: Ticket (Issue) -- NEW ORDER
    // 4: Finance (Payment) -- NEW ORDER

    const [currentStep, setCurrentStep] = useState<number>(() => {
        if (!hasPlatform) return 1;
        if (!hasExam) return 2;
        // If ticket is needed (hasTransportation) and not issued yet, go to 3.
        // If ticket issued or not needed, go to 4.
        if (applicant.hasTransportation && !hasTicket) return 3;
        return 4;
    });

    const isStepLocked = (step: number) => {
        if (step === 1) return false;
        if (step === 2) return !hasPlatform;
        if (step === 3) return !hasExam; // To issue ticket, must have exam scheduled? Let's assume sequential.
        if (step === 4) {
            // Finance is last. Accessible if previous steps done?
            // If transport required, need ticket first?
            // Or maybe just let it be accessible after Exam if ticket skipped?
            return !hasExam;
        }
        return true;
    };

    return (
        <div className="flex flex-col h-full bg-white relative">

            {/* Step Indicators */}
            <div className="flex items-center justify-between px-10 py-4 bg-slate-50 border-b">
                {[
                    { id: 1, label: "بيانات المنصة" },
                    { id: 2, label: "حجز الموعد" },
                    { id: 3, label: "إصدار التذكرة" },
                    { id: 4, label: "الأمور المالية" }
                ].map((step, index) => (
                    <div key={step.id}
                        className={cn(
                            "flex items-center gap-2 cursor-pointer transition-all",
                            currentStep === step.id ? "text-blue-600 font-bold" : "text-gray-400",
                            isStepLocked(step.id) && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !isStepLocked(step.id) && setCurrentStep(step.id)}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm",
                            currentStep === step.id ? "border-blue-600 bg-white" : "border-gray-300 bg-gray-100"
                        )}>
                            {step.id}
                        </div>
                        <span className="text-sm hidden sm:block">{step.label}</span>
                        {index < 3 && <div className="w-10 h-[2px] bg-gray-200 mx-2 hidden md:block" />}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto min-h-[400px]">

                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            المرحلة الأولى: يرجى إدخال بيانات الدخول للمنصة (البريد الإلكتروني وكلمة المرور) للمتابعة.
                        </div>
                        <ApplicantInfoTab applicant={applicant} isPlatformRegistered={hasPlatform} onUpdate={onUpdate} />

                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setCurrentStep(2)} disabled={!hasPlatform}>
                                التالي: حجز الموعد
                                <ChevronLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            المرحلة الثانية: تحديد موعد ومكان الاختبار. (لا يمكن التعديل بعد الحفظ هنا).
                        </div>
                        <ApplicantExamTab applicant={applicant} onUpdate={onUpdate} viewMode="setup" />

                        <div className="flex justify-between mt-4">
                            <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                <ChevronRight className="h-4 w-4 ml-2" />
                                السابق
                            </Button>
                            <Button onClick={() => setCurrentStep(3)} disabled={!hasExam}>
                                التالي: إصدار التذكرة
                                <ChevronLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Ticket (Swapped) */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            المرحلة الثالثة: إصدار تذكرة السفر (إن وجد). لا يمكن الإلغاء من هنا.
                        </div>
                        <ApplicantTicketTab
                            applicant={applicant}
                            ticket={ticket}
                            onUpdate={onUpdate}
                            viewMode="setup"
                            cancellationPolicies={cancellationPolicies}
                        />
                        <div className="flex justify-between mt-4">
                            <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                <ChevronRight className="h-4 w-4 ml-2" />
                                السابق
                            </Button>
                            <Button onClick={() => setCurrentStep(4)}>
                                التالي: الأمور المالية
                                <ChevronLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Finance (Swapped) */}
                {currentStep === 4 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            المرحلة الرابعة: مراجعة الرسوم وإضافة الدفعات.
                        </div>
                        <ApplicantFinanceTab
                            applicant={applicant}
                            transactions={transactions}
                            pricingPackages={pricingPackages}
                            transportRoute={transportRoute}
                            onUpdate={onUpdate}
                        />

                        <div className="flex justify-between mt-4">
                            <Button variant="outline" onClick={() => setCurrentStep(3)}>
                                <ChevronRight className="h-4 w-4 ml-2" />
                                السابق
                            </Button>
                            {/* Finish Button usually leads to close, but we'll leave it as end of flow */}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
