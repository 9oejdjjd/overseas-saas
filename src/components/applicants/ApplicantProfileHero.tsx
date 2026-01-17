"use client";

import { ExtendedApplicant, Ticket, ActivityLog } from "@/types/applicant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Copy, MapPin, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartWhatsAppButton } from "./SmartWhatsAppButton";
import { JourneyStepper } from "./JourneyStepper";

interface ApplicantProfileHeroProps {
    applicant: ExtendedApplicant;
    ticket: Ticket | null;
    activityLogs: ActivityLog[];
    onUpdate: () => void;
}

export function ApplicantProfileHero({ applicant, ticket, activityLogs, onUpdate }: ApplicantProfileHeroProps) {

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            'PASSED': { label: "ناجح", className: "bg-green-500 text-white border-green-500" },
            'FAILED': { label: "راسب", className: "bg-red-500 text-white border-red-500" },
            'EXAM_SCHEDULED': { label: "موعد محدد", className: "bg-primary text-white border-primary" },
            'ABSENT': { label: "غائب", className: "bg-orange-500 text-white border-orange-500" },
            'REGISTERED': { label: "مسجل", className: "bg-gray-500 text-white border-gray-500" },
        };
        return configs[status] || { label: status, className: "bg-gray-500 text-white border-gray-500" };
    };

    const statusConfig = getStatusConfig(applicant.status);

    // Journey steps calculation
    const hasPayment = Number(applicant.amountPaid) > 0;
    const hasTicket = !!ticket;
    const hasExam = !!applicant.examDate;
    const examCompleted = applicant.status === 'PASSED' || applicant.status === 'FAILED';
    const isPassed = applicant.status === 'PASSED';

    const steps = [
        { label: "التسجيل", done: true },
        { label: "الدفع", done: hasPayment, active: !hasPayment },
        { label: "التذكرة", done: hasTicket, active: hasPayment && !hasTicket },
        { label: "الاختبار", done: examCompleted, active: hasExam && !examCompleted },
        { label: "الشهادة", done: isPassed },
    ];

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardContent className="p-0">
                {/* Main Content */}
                <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                            <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-4 border-white shadow-lg ring-2 ring-gray-100">
                                <AvatarImage
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.fullName)}&background=1677ff&color=fff&size=128&font-size=0.4&bold=true`}
                                />
                                <AvatarFallback className="text-xl lg:text-2xl bg-primary text-white font-bold">
                                    {applicant.firstName?.[0]}{applicant.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0">
                            {/* Name & Status Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">
                                    {applicant.fullName}
                                </h1>
                                <Badge className={cn("px-3 py-1 text-xs font-semibold", statusConfig.className)}>
                                    {statusConfig.label}
                                </Badge>
                            </div>

                            {/* Meta Info Row */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-4">
                                <span className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    {applicant.profession || "غير محدد"}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {applicant.location?.name || "غير محدد"}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(applicant.applicantCode || "")}
                                    className="flex items-center gap-1.5 font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-md hover:bg-primary/20 transition-colors"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="font-semibold">{applicant.applicantCode || "---"}</span>
                                    <Copy className="h-3 w-3 opacity-60" />
                                </button>
                            </div>

                            {/* Contact Row */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span className="dir-ltr font-medium">{applicant.phone}</span>
                                {applicant.whatsappNumber && applicant.whatsappNumber !== applicant.phone && (
                                    <>
                                        <span className="text-border">•</span>
                                        <span className="dir-ltr text-green-600 font-medium">{applicant.whatsappNumber}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                            <SmartWhatsAppButton
                                applicant={applicant}
                                ticket={ticket}
                                activityLogs={activityLogs}
                                onMessageSent={onUpdate}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`tel:${applicant.phone}`)}
                            >
                                <Phone className="h-4 w-4 ml-2" />
                                اتصال
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Journey Stepper Section */}
                <div className="border-t bg-muted/30 px-6 lg:px-8 py-6">
                    <div className="max-w-3xl mx-auto">
                        <JourneyStepper steps={steps} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
