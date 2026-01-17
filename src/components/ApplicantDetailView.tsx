"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { User, CalendarClock, TicketCheck, GraduationCap, Settings2, UserPlus, Wallet, Ticket, History, CheckCircle2, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExtendedApplicant, Transaction, Ticket as TicketType, ActivityLog } from "@/types/applicant";
import { ApplicantInfoTab } from "./applicants/ApplicantInfoTab";
import { ApplicantFinanceTab } from "./applicants/ApplicantFinanceTab";
import { ApplicantTicketTab } from "./applicants/ApplicantTicketTab";
import { ApplicantExamTab } from "./applicants/ApplicantExamTab";
import { ApplicantActivityLog } from "./applicants/ApplicantActivityLog";

interface ApplicantDetailViewProps {
    applicant: ExtendedApplicant;
    transactions: Transaction[];
    ticket: TicketType | null;
    activityLogs: ActivityLog[];
    pricingPackages: any[];
    transportRoute: any;
    onUpdate: () => void;
    viewMode: "setup" | "admin"; // New Prop
}

export function ApplicantDetailView({
    applicant,
    transactions,
    ticket,
    activityLogs,
    pricingPackages,
    transportRoute,
    onUpdate,
    viewMode
}: ApplicantDetailViewProps) {

    // Derived state
    const isPlatformRegistered = !!applicant?.platformEmail;
    const isExamScheduled = !!(applicant?.examDate && applicant?.examTime);

    // Lock Logic: In setup mode, block tabs if platform not registered
    const isTabsLocked = viewMode === "setup" && !isPlatformRegistered;

    // Stepper Logic
    const steps = [
        { id: 1, label: "تسجيل جديد", icon: UserPlus, isCompleted: true, isCurrent: !isPlatformRegistered },
        { id: 2, label: "تجهيز المنصة", icon: Settings2, isCompleted: isPlatformRegistered, isCurrent: isPlatformRegistered && !isExamScheduled },
        { id: 3, label: "حجز الموعد", icon: CalendarClock, isCompleted: isExamScheduled, isCurrent: isExamScheduled && !ticket },
        { id: 4, label: "إصدار التذكرة", icon: TicketCheck, isCompleted: !!ticket, isCurrent: !!ticket && !["PASSED", "FAILED"].includes(applicant.status) },
        { id: 5, label: "النتيجة النهائية", icon: GraduationCap, isCompleted: ["PASSED", "FAILED"].includes(applicant.status), isCurrent: false },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Interactive Status Stepper */}
            <div className="px-6 py-4 bg-gray-50 border-b mb-6 rounded-t-xl">
                <div className="flex items-center justify-between relative pl-8 pr-8">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 mx-10" />

                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.isCurrent;
                        const isDone = step.isCompleted;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50 px-2 z-10 transition-transform hover:scale-105 cursor-default">
                                <div className={`
                                     w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                     ${isActive
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110"
                                        : isDone
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "bg-white border-gray-300 text-gray-400"}
                                 `}>
                                    {isDone && !isActive ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? "text-blue-700 font-bold" : isDone ? "text-green-600" : "text-gray-400"}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Tabs defaultValue="details" className="px-1">
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg mb-6">
                    <TabsTrigger value="details" className="rounded-md transition-all text-xs sm:text-sm py-2">
                        <User className="h-4 w-4 ml-2" />
                        البيانات
                    </TabsTrigger>

                    <TabsTrigger value="exam" disabled={isTabsLocked} className="rounded-md transition-all text-xs sm:text-sm py-2 relative">
                        <CalendarClock className="h-4 w-4 ml-2" />
                        الموعد
                        {isTabsLocked && <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />}
                    </TabsTrigger>

                    <TabsTrigger value="finance" disabled={isTabsLocked} className="rounded-md transition-all text-xs sm:text-sm py-2 relative">
                        <Wallet className="h-4 w-4 ml-2" />
                        المالية
                        {isTabsLocked && <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />}
                    </TabsTrigger>

                    <TabsTrigger value="ticket" disabled={isTabsLocked} className="rounded-md transition-all text-xs sm:text-sm py-2 relative">
                        <Ticket className="h-4 w-4 ml-2" />
                        التذاكر
                        {isTabsLocked && <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />}
                    </TabsTrigger>

                    <TabsTrigger value="activity" className="rounded-md transition-all text-xs sm:text-sm py-2">
                        <History className="h-4 w-4 ml-2" />
                        السجل
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    <ApplicantInfoTab applicant={applicant} isPlatformRegistered={isPlatformRegistered} onUpdate={onUpdate} />
                </TabsContent>

                <TabsContent value="exam" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    <ApplicantExamTab applicant={applicant} onUpdate={onUpdate} viewMode={viewMode} />
                </TabsContent>

                <TabsContent value="finance" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    <ApplicantFinanceTab
                        applicant={applicant}
                        transactions={transactions}
                        pricingPackages={pricingPackages}
                        transportRoute={transportRoute}
                        onUpdate={onUpdate}
                    />
                </TabsContent>

                <TabsContent value="ticket" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    <ApplicantTicketTab
                        applicant={applicant}
                        ticket={ticket}
                        onUpdate={onUpdate}
                        viewMode={viewMode}
                    />
                </TabsContent>

                <TabsContent value="activity" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    <ApplicantActivityLog logs={activityLogs} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
