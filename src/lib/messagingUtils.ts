/**
 * Shared Client-side Utilities for Messaging and Template Variable Interpolation.
 * This file is purely client-safe (no server/database dependencies).
 */

export interface ApplicantSummary {
    id: string;
    fullName: string;
    phone: string;
    applicantCode: string;
    platformEmail?: string;
    platformPassword?: string;
    examDate?: string;
    whatsappNumber?: string;
    [key: string]: any; // Allow indexing dynamically
}

/**
 * Format date in a beautiful Arabic style
 */
export function formatArabicDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return "";
    try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return "";
        return dateObj.toLocaleDateString("ar-SA", {
            weekday: "long",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    } catch (e) {
        return "";
    }
}

/**
 * Format time in Arabic AM/PM style
 */
export function formatArabicTime(timeStr: string | null | undefined): string {
    if (!timeStr) return "";
    try {
        let [hours, minutes] = timeStr.split(":");
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? "م" : "ص";
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

/**
 * Interpolates template variables with applicant summary data
 */
export function interpolateTemplateVariables(text: string, applicant: ApplicantSummary): string {
    if (!text) return "";

    const app = applicant as any;
    
    // Fallbacks and extra fields
    const firstName = applicant.fullName ? applicant.fullName.split(' ')[0] : "";
    const cityName = app.examLocation || app.location?.name || "";
    const centerName = app.examCenter?.name || "";
    const address = app.examCenter?.address || app.location?.address || "";
    const mapUrl = app.examCenter?.locationUrl || app.location?.locationUrl || "";
    
    const balance = app.remainingBalance !== undefined 
        ? Number(app.remainingBalance).toLocaleString() 
        : (app.remaining !== undefined ? Number(app.remaining).toLocaleString() : "0");

    let result = text
        // Name & basic credentials
        .replace(/{name}|{fullName}/g, firstName)
        .replace(/{code}|{applicantCode}/g, applicant.applicantCode || '?')
        .replace(/{email}/g, applicant.platformEmail || '(لا يوجد إيميل)')
        .replace(/{password}/g, applicant.platformPassword || '(غير متوفر)')
        .replace(/{phone}/g, applicant.phone || '')
        .replace(/{profession}/g, app.profession || '')
        .replace(/{remaining}/g, balance)

        // Location & exam centers
        .replace(/{location}|{city}|{examLocation}/g, cityName)
        .replace(/{centerName}|{center_name}/g, centerName)
        .replace(/{locationName}|{location_name}/g, app.location?.name || "")
        .replace(/{locationAddress}|{location_address}/g, address)
        .replace(/{locationUrl}|{location_url}/g, mapUrl)

        // Date & time
        .replace(/{examDate}|{exam_date}/g, applicant.examDate ? formatArabicDate(applicant.examDate) : '(لم يحدد)')
        .replace(/{examTime}|{exam_time}/g, app.examTime ? formatArabicTime(app.examTime) : (app.exam_time ? formatArabicTime(app.exam_time) : ""));

    // Travel Tickets (fallback local mapping)
    if (app.ticket || app.ticketNumber) {
        const ticket = app.ticket || app;
        const departureTimeStr = ticket.departureTime || (ticket.trip?.departureTime ? ticket.trip.departureTime : "");
        
        result = result
            .replace(/{ticketNumber}|{ticket_number}/g, ticket.ticketNumber || "")
            .replace(/{transportCompany}|{transport_company}/g, ticket.transportCompany || "")
            .replace(/{departureLocation}|{departure_location}/g, ticket.departureLocation || "")
            .replace(/{arrivalLocation}|{arrival_location}/g, ticket.arrivalLocation || "")
            .replace(/{busNumber}|{bus_number}/g, ticket.busNumber || (ticket.trip?.busNumber || ""))
            .replace(/{seatNumber}|{seat_number}/g, ticket.seatNumber || "")
            .replace(/{departureDate}|{travelDate}|{new_travel_date}/g, ticket.departureDate ? formatArabicDate(ticket.departureDate) : "")
            .replace(/{departureTime}/g, departureTimeStr ? formatArabicTime(departureTimeStr) : "")
            .replace(/{destination}/g, ticket.arrivalLocation || "");
    }

    return result;
}
