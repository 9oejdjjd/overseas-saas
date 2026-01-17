"use client";

import { ExtendedApplicant, Transaction, Ticket as TicketType, ActivityLog } from "@/types/applicant";
import { ApplicantInfoTab } from "./applicants/ApplicantInfoTab";
import { ApplicantFinanceTab } from "./applicants/ApplicantFinanceTab";
import { ApplicantTicketTab } from "./applicants/ApplicantTicketTab";
import { ApplicantExamTab } from "./applicants/ApplicantExamTab";
import { ApplicantActivityLog } from "./applicants/ApplicantActivityLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { User, CalendarClock, Ticket, Wallet, History } from "lucide-react";

interface ApplicantAdminDashboardProps {
    applicant: ExtendedApplicant;
    transactions: Transaction[];
    ticket: TicketType | null;
    activityLogs: ActivityLog[];
    pricingPackages: any[];
    transportRoute: any;
    cancellationPolicies: any[];
    onUpdate: () => void;
}

export function ApplicantAdminDashboard({
    applicant,
    transactions,
    ticket,
    activityLogs,
    pricingPackages,
    transportRoute,
    cancellationPolicies,
    onUpdate
}: ApplicantAdminDashboardProps) {

    const isPlatformRegistered = !!applicant.platformEmail;

    const tabs = [
        { value: "details", label: "البيانات الشخصية", icon: User },
        { value: "finance", label: "المالية", icon: Wallet },
        { value: "ticket", label: "التذاكر والنقل", icon: Ticket },
        { value: "exam", label: "الاختبار", icon: CalendarClock },
        { value: "activity", label: "السجل", icon: History },
    ];

    return (
        <Card className="border shadow-sm overflow-hidden">
            <Tabs defaultValue="details" className="w-full">
                {/* Tabs Header */}
                <div className="border-b bg-card">
                    <TabsList className="h-auto p-0 bg-transparent w-full justify-start gap-0">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="relative px-5 py-4 rounded-none border-b-2 border-transparent
                                    text-muted-foreground font-medium
                                    transition-all duration-200
                                    hover:text-foreground hover:bg-muted/50
                                    data-[state=active]:border-primary
                                    data-[state=active]:text-primary
                                    data-[state=active]:bg-primary/5
                                    data-[state=active]:shadow-none"
                            >
                                <tab.icon className="h-4 w-4 ml-2" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Tabs Content */}
                <div className="p-6 bg-background min-h-[450px]">
                    <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                        <ApplicantInfoTab
                            applicant={applicant}
                            isPlatformRegistered={isPlatformRegistered}
                            onUpdate={onUpdate}
                            viewMode="admin"
                        />
                    </TabsContent>

                    <TabsContent value="finance" className="mt-0 focus-visible:outline-none">
                        <ApplicantFinanceTab
                            applicant={applicant}
                            transactions={transactions}
                            pricingPackages={pricingPackages}
                            transportRoute={transportRoute}
                            onUpdate={onUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="ticket" className="mt-0 focus-visible:outline-none">
                        <ApplicantTicketTab
                            applicant={applicant}
                            ticket={ticket}
                            onUpdate={onUpdate}
                            viewMode="admin"
                            cancellationPolicies={cancellationPolicies}
                        />
                    </TabsContent>

                    <TabsContent value="exam" className="mt-0 focus-visible:outline-none">
                        <ApplicantExamTab
                            applicant={applicant}
                            onUpdate={onUpdate}
                            viewMode="admin"
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="mt-0 focus-visible:outline-none">
                        <ApplicantActivityLog logs={activityLogs} />
                    </TabsContent>
                </div>
            </Tabs>
        </Card>
    );
}
