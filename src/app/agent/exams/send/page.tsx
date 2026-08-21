"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SendExamWizard } from "@/components/agent/clients/wizard/SendExamWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SendExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [client, setClient] = useState<any>(null);
    const [loadingClient, setLoadingClient] = useState(false);
    const preselectedClientId = searchParams?.get("clientId");

    useEffect(() => {
        const fetchPreselectedClient = async () => {
            if (!preselectedClientId) return;
            setLoadingClient(true);
            try {
                const res = await fetch(`/api/agent/clients/${preselectedClientId}`);
                if (res.ok) {
                    const json = await res.json();
                    setClient(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch preselected client", err);
            } finally {
                setLoadingClient(false);
            }
        };

        fetchPreselectedClient();
    }, [preselectedClientId]);

    const handleClose = () => {
        router.push("/agent/clients");
    };

    if (loadingClient) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#074388]" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            <Card className="border-none shadow-sm dark:bg-slate-800 rounded-2xl bg-white animate-fade-in">
                <CardContent className="p-6">
                    <SendExamWizard preselectedClient={client} onClose={handleClose} />
                </CardContent>
            </Card>
        </div>
    );
}
