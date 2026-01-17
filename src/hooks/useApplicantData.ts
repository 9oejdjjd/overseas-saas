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

    const fetchAllData = useCallback(async () => {
        if (!applicantId) return;
        setLoading(true);
        try {
            // 1. Fetch Applicant if not provided or to refresh
            const appRes = await fetch(`/api/applicants/${applicantId}`);
            if (appRes.ok) {
                const appData = await appRes.json();
                setApplicant(appData);

                // Fetch Transport Route based on locations
                if (appData.locationId || appData.location?.id) {
                    const fromId = appData.locationId || appData.location?.id;
                    const toLocation = appData.examLocation || "TAIZ";
                    if (fromId && toLocation) {
                        fetch(`/api/transport-routes?from=${fromId}&to=${toLocation}`)
                            .then(res => res.json())
                            .then(data => {
                                if (!data.error) setTransportRoute(data);
                            })
                            .catch(console.error);
                    }
                }
            }

            // 2. Fetch Transactions
            fetch(`/api/applicants/${applicantId}/transactions`)
                .then(res => res.json())
                .then(data => setTransactions(Array.isArray(data) ? data : []))
                .catch(() => setTransactions([]));

            // 3. Fetch Ticket
            fetch(`/api/applicants/${applicantId}/ticket`)
                .then(res => res.json())
                .then(data => setTicket(data))
                .catch(() => setTicket(null));

            // 4. Fetch Activity Logs
            fetch(`/api/applicants/${applicantId}/activity`)
                .then(res => res.json())
                .then(data => setActivityLogs(Array.isArray(data) ? data : []))
                .catch(() => setActivityLogs([]));

            // 5. Fetch Pricing
            fetch("/api/pricing")
                .then(res => res.json())
                .then(data => setPricingPackages(data))
                .catch(console.error);

            // 6. Fetch Policies
            fetch("/api/policies")
                .then(res => res.json())
                .then(data => setCancellationPolicies(data))
                .catch(console.error);

        } catch (error) {
            console.error("Error fetching applicant data:", error);
        } finally {
            setLoading(false);
        }
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
