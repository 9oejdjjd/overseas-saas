import { useState, useEffect, useCallback } from "react";
import { ExtendedApplicant, Transaction, Ticket, ActivityLog } from "@/types/applicant";

export function useApplicantData(applicantOrId: ExtendedApplicant | string | null) {
    const [applicant, setApplicant] = useState<ExtendedApplicant | null>(
        typeof applicantOrId === 'object' ? applicantOrId : null
    );
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [pricingPackages, setPricingPackages] = useState<any[]>([]);
    const [transportRoute, setTransportRoute] = useState<any>(null);
    const [cancellationPolicies, setCancellationPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const applicantId = typeof applicantOrId === 'string' ? applicantOrId : applicantOrId?.id;

    // Sync state immediately when applicant changes or modal closes
    useEffect(() => {
        if (typeof applicantOrId === 'object' && applicantOrId) {
            setApplicant(applicantOrId);
        } else if (!applicantOrId) {
            // Reset all data when modal closes
            setApplicant(null);
            setTransactions([]);
            setTicket(null);
            setActivityLogs([]);
            setTransportRoute(null);
            setCancellationPolicies([]);
            setPricingPackages([]);
        }
    }, [applicantOrId]);

    const fetchAllData = useCallback(async () => {
        if (!applicantId) return;
        setLoading(true);

        // Track completion of all requests to clear the global loading flag
        const pending: Promise<void>[] = [];

        // Fire each request independently — each updates state as soon as it resolves.
        // This means the UI renders each section progressively instead of waiting for ALL to complete.

        // 1. Applicant (fresh data from server)
        pending.push(
            fetch(`/api/applicants/${applicantId}`).then(r => r.json())
                .then(data => { if (data && !data.error) setApplicant(data); })
                .catch(err => console.error("Error fetching applicant:", err))
        );

        // 2. Transactions
        pending.push(
            fetch(`/api/applicants/${applicantId}/transactions`).then(r => r.json())
                .then(data => setTransactions(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error fetching transactions:", err))
        );

        // 3. Ticket
        pending.push(
            fetch(`/api/applicants/${applicantId}/ticket`).then(r => r.json())
                .then(data => setTicket(data && !data.error ? data : null))
                .catch(err => console.error("Error fetching ticket:", err))
        );

        // 4. Activity Logs
        pending.push(
            fetch(`/api/applicants/${applicantId}/activity`).then(r => r.json())
                .then(data => setActivityLogs(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error fetching logs:", err))
        );

        // 5. Pricing Packages
        pending.push(
            fetch("/api/pricing").then(r => r.json())
                .then(data => setPricingPackages(data || []))
                .catch(err => console.error("Error fetching pricing:", err))
        );

        // 6. Cancellation Policies
        pending.push(
            fetch("/api/policies").then(r => r.json())
                .then(data => setCancellationPolicies(data || []))
                .catch(err => console.error("Error fetching policies:", err))
        );

        // Wait for all to settle, then clear loading
        await Promise.allSettled(pending);
        setLoading(false);
    }, [applicantId]);

    // Initial fetch
    useEffect(() => {
        if (applicantId) {
            fetchAllData();
        }
    }, [applicantId]);

    return {
        applicant,
        transactions,
        ticket,
        activityLogs,
        pricingPackages,
        transportRoute,
        cancellationPolicies,
        loading,
        refresh: fetchAllData
    };
}
