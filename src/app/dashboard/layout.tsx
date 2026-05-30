"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ForcePasswordChange } from "@/components/layout/ForcePasswordChange";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (session?.user?.requirePasswordChange) {
        return <ForcePasswordChange />;
    }

    return (
        <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <DashboardContent>{children}</DashboardContent>
        </SessionProvider>
    );
}

