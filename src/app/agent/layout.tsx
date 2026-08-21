"use client";

import React from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { AgentSidebar } from "@/components/agent/AgentSidebar";
import { AgentHeader } from "@/components/agent/AgentHeader";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ForcePasswordChange } from "@/components/layout/ForcePasswordChange";

function AgentLayoutContent({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="animate-spin h-8 w-8 text-[#074388]" />
            </div>
        );
    }

    if (!session || session.user.role !== "TRAVEL_AGENT") {
        // Redirect to login if not authorized
        if (typeof window !== "undefined") {
            router.push("/login");
        }
        return null;
    }

    if (session?.user?.requirePasswordChange) {
        return <ForcePasswordChange />;
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans" dir="rtl">
            {/* Collapsible Agent Sidebar */}
            <AgentSidebar />

            {/* Main Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <AgentHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <AgentLayoutContent>{children}</AgentLayoutContent>
        </SessionProvider>
    );
}
