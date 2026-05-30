"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/ui/simple-toast";

export interface ManifestTicket {
    id: string;
    ticketNumber: string;
    busNumber: string;
    seatNumber: string;
    departureLocation: string;
    arrivalLocation: string;
    departureDate: string;
    status: string;
    applicant: {
        id: string;
        fullName: string;
        phone: string;
        whatsappNumber: string;
        passportNumber?: string;
        notes?: string;
    };
}

export function usePassengerManifest() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("manifest");

    // --- MANIFEST STATE ---
    const [date, setDate] = useState<string>(
        format(addDays(new Date(), 1), 'yyyy-MM-dd')
    );
    const [tickets, setTickets] = useState<ManifestTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- OPERATIONS STATE (Smart Auditor) ---
    const [opSearchQuery, setOpSearchQuery] = useState("");
    const [opSearchResult, setOpSearchResult] = useState<any>(null);
    const [opSearchLoading, setOpSearchLoading] = useState(false);
    const [opUpdateLoading, setOpUpdateLoading] = useState(false);
    const [opError, setOpError] = useState("");

    // ================== MANIFEST FUNCTIONS ==================

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const fetchManifest = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transport/manifest?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            } else {
                toast("فشل تحميل الكشف من السيرفر", "error");
            }
        } catch (error) {
            console.error(error);
            toast("فشل تحميل الكشف", "error");
        } finally {
            setLoading(false);
        }
    }, [date, toast]);

    useEffect(() => {
        fetchManifest();
    }, [fetchManifest]);

    // Update ticket status from list
    const handleUpdateStatus = useCallback(async (ticketId: string, newStatus: "USED" | "NO_SHOW", applicantName: string) => {
        const actionText = newStatus === "USED" ? "تأكيد الحضور وصعود الحافلة" : "تسجيل الغياب وتطبيق الغرامة";
        if (!confirm(`هل أنت متأكد من ${actionText} للمسافر: ${applicantName}؟`)) return;

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, updateUsage: true })
            });

            if (res.ok) {
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                toast("تم تحديث حالة السفر للمسافر بنجاح", "success");
            } else {
                toast("فشل تحديث الحالة من السيرفر", "error");
            }
        } catch (error) {
            console.error(error);
            toast("خطأ في التحديث والاتصال بالخادم", "error");
        }
    }, [toast]);

    // Derived stats for Manifest
    const stats = useMemo(() => {
        const total = tickets.length;
        const confirmed = tickets.filter(t => t.status === 'USED').length;
        const absent = tickets.filter(t => t.status === 'NO_SHOW').length;
        return { total, confirmed, absent };
    }, [tickets]);

    // Filter tickets in client-side search
    const filteredTickets = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return tickets;
        return tickets.filter(t =>
            t.applicant.fullName.toLowerCase().includes(query) ||
            t.ticketNumber.toLowerCase().includes(query) ||
            (t.busNumber && t.busNumber.toLowerCase().includes(query))
        );
    }, [tickets, searchTerm]);

    // ================== OPERATIONS FUNCTIONS (Smart Auditor) ==================

    const handleOpSearch = useCallback(async () => {
        if (!opSearchQuery.trim()) {
            toast("يرجى إدخال رقم تذكرة أو كود الحجز", "error");
            return;
        }
        setOpSearchLoading(true);
        setOpError("");
        setOpSearchResult(null);
        try {
            const res = await fetch(`/api/tickets/search?q=${encodeURIComponent(opSearchQuery.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setOpSearchResult(data);
            } else {
                setOpError("لم يتم العثور على تذكرة أو كود (PNR) بهذا الرقم");
            }
        } catch (e) {
            console.error(e);
            setOpError("حدث خطأ في النظام أثناء محاولة البحث");
        } finally {
            setOpSearchLoading(false);
        }
    }, [opSearchQuery, toast]);

    const updateOpTicketStatus = useCallback(async (status: string) => {
        if (!opSearchResult) return;
        setOpUpdateLoading(true);
        try {
            const res = await fetch(`/api/tickets/${opSearchResult.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setOpSearchResult((prev: any) => prev ? { ...prev, status } : null);
                toast("تم تحديث حالة التذكرة بنجاح بالمدقق", "success");
                
                // If the updated ticket is in the manifest tab list, refresh it
                fetchManifest();
            } else {
                toast("فشل تحديث التذكرة", "error");
            }
        } catch (e) {
            console.error(e);
            toast("فشل تحديث التذكرة", "error");
        } finally {
            setOpUpdateLoading(false);
        }
    }, [opSearchResult, fetchManifest, toast]);

    return {
        activeTab,
        setActiveTab,
        date,
        setDate,
        tickets,
        loading,
        searchTerm,
        setSearchTerm,
        opSearchQuery,
        setOpSearchQuery,
        opSearchResult,
        opSearchLoading,
        opUpdateLoading,
        opError,
        handlePrint,
        handleUpdateStatus,
        stats,
        filteredTickets,
        handleOpSearch,
        updateOpTicketStatus,
        fetchManifest
    };
}
