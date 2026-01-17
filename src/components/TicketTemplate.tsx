"use client";

import { forwardRef } from "react";
import Barcode from "react-barcode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type TicketProps = {
    ticket: {
        ticketNumber: string;
        busNumber?: string | null;
        seatNumber?: string | null;
        departureDate: string;
        departureTime?: string | null;
        arrivalTime?: string | null;
        departureLocation: string;
        arrivalLocation: string;
        transportCompany: string;
        createdAt: string;
    };
    applicant: {
        fullName: string;
        phone: string;
        passportNumber?: string | null;
        applicantCode?: string | null;
    };
    tripType?: "one-way" | "round-trip";
    returnDate?: string | null;
    returnDepartureTime?: string | null;
    returnArrivalTime?: string | null;
};

// Colors
const COLORS = {
    blue: "#3061ab",
    yellow: "#ffad00",
    white: "#ffffff",
    textGray: "#64748b",
    textDark: "#334155"
};

const formatTime = (time: string | null | undefined): string => {
    if (!time) return "07:00";
    return time.replace(":", ".");
};

const getPeriod = (time: string | null | undefined): string => {
    if (!time) return "صباحا";
    const h = parseInt(time.split(":")[0]);
    return h >= 12 ? "مساء" : "صباحا";
};

const formatDate = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), "dd.MM.yyyy");
    } catch {
        return "";
    }
};

const getDay = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), "EEEE", { locale: ar });
    } catch {
        return "";
    }
};

export const TicketTemplate = forwardRef<HTMLDivElement, TicketProps>(
    ({ ticket, applicant, tripType = "round-trip", returnDate, returnDepartureTime, returnArrivalTime }, ref) => {
        const depDate = ticket.departureDate;
        const retDate = returnDate || ticket.departureDate;

        return (
            <div
                ref={ref}
                style={{
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    width: "1000px",
                    backgroundColor: "transparent",
                    direction: "ltr",
                }}
            >
                <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", height: "320px", backgroundColor: "white", borderRadius: "10px", overflow: "hidden" }}>

                    {/* 1. LEFT SECTION (Blue Card) */}
                    <div style={{
                        width: "280px",
                        backgroundColor: COLORS.blue,
                        padding: "25px",
                        display: "flex",
                        flexDirection: "column",
                        color: "white",
                        borderRadius: "10px",
                        marginRight: "5px",
                        flexShrink: 0
                    }}>
                        {/* Barcode */}
                        <div style={{ marginBottom: "25px", backgroundColor: "white", padding: "8px 5px", borderRadius: "4px", display: "flex", justifyContent: "center" }}>
                            <Barcode value={ticket.ticketNumber} height={35} displayValue={false} width={1.8} margin={0} />
                        </div>

                        {/* PNR */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.5px" }}>PNR</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>{applicant.applicantCode || "PNR CODE"}</div>
                            <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)", marginTop: "8px" }}></div>
                        </div>

                        {/* Attendance Time */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.5px", textAlign: "right", direction: "rtl" }}>وقت الحضور</div>
                            <div style={{ fontSize: "20px", fontWeight: "bold" }}>09.00 AM</div>
                            <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)", marginTop: "8px" }}></div>
                        </div>

                        {/* Passport */}
                        <div>
                            <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.5px" }}>PASSPORT NUMBER</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>{applicant.passportNumber || "1128485940"}</div>
                        </div>
                    </div>

                    {/* 2. MIDDLE SECTION (Bus & Title) */}
                    <div style={{
                        width: "160px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                        borderRight: `2px dashed ${COLORS.blue}`
                    }}>
                        <div style={{
                            fontSize: "32px",
                            fontWeight: "bold",
                            color: COLORS.blue,
                            marginBottom: "20px",
                            fontFamily: "Arial, sans-serif"
                        }}>
                            تذكره سفر
                        </div>

                        <svg width="100" height="120" viewBox="0 0 100 120">
                            {/* Simplified Bus Shape matching reference */}
                            <path d="M15 30 Q15 10 50 10 Q85 10 85 30 V100 Q85 110 75 110 H25 Q15 110 15 100 Z" fill={COLORS.blue} />
                            {/* Window */}
                            <rect x="25" y="40" width="50" height="25" rx="4" fill="white" />
                            {/* Top Display */}
                            <rect x="35" y="20" width="30" height="6" rx="2" fill="white" />
                            {/* Lights */}
                            <circle cx="28" cy="90" r="5" fill="white" />
                            <circle cx="72" cy="90" r="5" fill="white" />
                        </svg>
                    </div>

                    {/* 3. RIGHT SECTION (Itinerary) */}
                    <div style={{ flex: 1, padding: "20px 0 20px 0", display: "flex", flexDirection: "column" }}>

                        {/* Header */}
                        <div style={{ textAlign: "right", paddingRight: "70px", marginBottom: "20px" }}>
                            <div style={{ fontSize: "12px", color: COLORS.textGray, marginBottom: "2px" }}>أسم المسافر</div>
                            <div style={{ fontSize: "12px", color: COLORS.textGray, textTransform: "uppercase", marginBottom: "2px" }}>NAME PASSENGER</div>
                            <div style={{ fontSize: "20px", fontWeight: "bold", color: COLORS.blue }}>{applicant.fullName}</div>
                            <div style={{ borderBottom: "1px dashed #cbd5e1", marginTop: "10px", marginRight: "-20px" }}></div>
                        </div>

                        {/* Trips */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                            {/* --- Outbound --- */}
                            <div style={{ display: "flex", alignItems: "center", position: "relative", paddingRight: "45px" }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "20px" }}>

                                    {/* Trip ID */}
                                    <div style={{ textAlign: "center", minWidth: "60px" }}>
                                        <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>رقم الرحلة</div>
                                        <div style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "15px" }}>{ticket.busNumber || "A1 234"}</div>
                                    </div>

                                    {/* Date */}
                                    <div style={{ textAlign: "center", minWidth: "90px" }}>
                                        <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>Date</div>
                                        <div style={{ fontWeight: "bold", color: COLORS.textDark, fontSize: "15px" }}>{formatDate(depDate)}</div>
                                        <div style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.textDark }}>{getDay(depDate)}</div>
                                    </div>

                                    {/* To */}
                                    <div style={{ textAlign: "center", minWidth: "60px" }}>
                                        <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>To</div>
                                        <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.yellow }}>{ticket.arrivalLocation}</div>
                                    </div>

                                    {/* Times */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "100px" }}>
                                        <div style={{ display: "flex", gap: "5px", fontSize: "11px", alignItems: "center" }}>
                                            <span>الأنطلاق</span>
                                            <span style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "12px" }}>{formatTime(ticket.departureTime)}</span>
                                            <span>{getPeriod(ticket.departureTime)}</span>
                                        </div>
                                        <div style={{ fontSize: "18px", color: COLORS.yellow, fontWeight: "bold", margin: "-2px 0" }}>
                                            <svg width="40" height="10" viewBox="0 0 40 10">
                                                <path d="M0 5 L35 5 M35 5 L30 0 M35 5 L30 10" stroke={COLORS.yellow} strokeWidth="2" fill="none" />
                                            </svg>
                                        </div>
                                        <div style={{ display: "flex", gap: "5px", fontSize: "11px", alignItems: "center" }}>
                                            <span>الوصول</span>
                                            <span style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "12px" }}>{formatTime(ticket.arrivalTime)}</span>
                                            <span>{getPeriod(ticket.arrivalTime)}</span>
                                        </div>
                                    </div>

                                    {/* From */}
                                    <div style={{ textAlign: "center", minWidth: "60px" }}>
                                        <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>From</div>
                                        <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.yellow }}>{ticket.departureLocation}</div>
                                    </div>

                                </div>

                                {/* Tab: Outbound */}
                                <div style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "26px",
                                    height: "70px",
                                    backgroundColor: COLORS.yellow,
                                    borderRadius: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white"
                                }}>
                                    <div style={{
                                        transform: "rotate(-90deg)",
                                        whiteSpace: "nowrap",
                                        fontWeight: "bold",
                                        fontSize: "12px"
                                    }}>
                                        الذهاب
                                    </div>
                                </div>

                                <div style={{ position: "absolute", bottom: "-8px", left: "20px", right: "50px", borderBottom: "1px dotted #ccc" }}></div>
                            </div>

                            {/* --- Return --- */}
                            {tripType === "round-trip" && (
                                <div style={{ display: "flex", alignItems: "center", position: "relative", paddingRight: "45px" }}>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "20px" }}>

                                        {/* Trip ID */}
                                        <div style={{ textAlign: "center", minWidth: "60px" }}>
                                            <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>رقم الرحلة</div>
                                            <div style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "15px" }}>{ticket.busNumber || "A1 234"}</div>
                                        </div>

                                        {/* Date */}
                                        <div style={{ textAlign: "center", minWidth: "90px" }}>
                                            <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>Date</div>
                                            <div style={{ fontWeight: "bold", color: COLORS.textDark, fontSize: "15px" }}>{formatDate(retDate.toString())}</div>
                                            <div style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.textDark }}>{getDay(retDate.toString())}</div>
                                        </div>

                                        {/* To (Return) */}
                                        <div style={{ textAlign: "center", minWidth: "60px" }}>
                                            <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>To</div>
                                            <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.yellow }}>{ticket.departureLocation}</div>
                                        </div>

                                        {/* Times */}
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "100px" }}>
                                            <div style={{ display: "flex", gap: "5px", fontSize: "11px", alignItems: "center" }}>
                                                <span>الأنطلاق</span>
                                                <span style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "12px" }}>{formatTime(returnDepartureTime || ticket.arrivalTime)}</span>
                                                <span>{getPeriod(returnDepartureTime || ticket.arrivalTime)}</span>
                                            </div>
                                            <div style={{ fontSize: "18px", color: COLORS.yellow, fontWeight: "bold", margin: "-2px 0" }}>
                                                <svg width="40" height="10" viewBox="0 0 40 10">
                                                    <path d="M0 5 L35 5 M35 5 L30 0 M35 5 L30 10" stroke={COLORS.yellow} strokeWidth="2" fill="none" />
                                                </svg>
                                            </div>
                                            <div style={{ display: "flex", gap: "5px", fontSize: "11px", alignItems: "center" }}>
                                                <span>الوصول</span>
                                                <span style={{ fontWeight: "bold", color: COLORS.blue, fontSize: "12px" }}>{formatTime(returnArrivalTime || ticket.departureTime)}</span>
                                                <span>{getPeriod(returnArrivalTime || ticket.departureTime)}</span>
                                            </div>
                                        </div>

                                        {/* From (Return) */}
                                        <div style={{ textAlign: "center", minWidth: "60px" }}>
                                            <div style={{ fontSize: "11px", color: COLORS.textGray, marginBottom: "2px" }}>From</div>
                                            <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.yellow }}>{ticket.arrivalLocation}</div>
                                        </div>

                                    </div>

                                    {/* Tab: Return */}
                                    <div style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "26px",
                                        height: "70px",
                                        backgroundColor: COLORS.yellow,
                                        borderRadius: "13px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white"
                                    }}>
                                        <div style={{
                                            transform: "rotate(-90deg)",
                                            whiteSpace: "nowrap",
                                            fontWeight: "bold",
                                            fontSize: "12px"
                                        }}>
                                            العودة
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* 4. FAR RIGHT STRIP (Blue) */}
                    <div style={{
                        width: "60px",
                        backgroundColor: COLORS.blue,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "10px",
                        marginLeft: "10px",
                        color: "white",
                        flexShrink: 0,
                        position: "relative"
                    }}>
                        <div style={{
                            transform: "rotate(-90deg)",
                            // origin center
                            whiteSpace: "nowrap",
                            fontSize: "20px",
                            marginBottom: "80px", // spacing for the text when rotated
                            fontWeight: "bold"
                        }}>
                            تذكره السفر
                        </div>

                        <div style={{
                            transform: "rotate(-90deg)",
                            whiteSpace: "nowrap",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            letterSpacing: "2px",
                            position: "absolute",
                            bottom: "80px"
                        }}>
                            123 456 789
                        </div>
                    </div>

                </div>

                {/* Print Info */}
                <div style={{ textAlign: "center", fontSize: "10px", color: "#aaa", marginTop: "10px" }}>
                    Generated: {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
                </div>
            </div>
        );
    }
);

TicketTemplate.displayName = "TicketTemplate";
