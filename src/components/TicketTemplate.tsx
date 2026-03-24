"use client";

import { forwardRef } from "react";
import Barcode from "react-barcode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type TicketProps = {
    ticket: {
        ticketNumber: string; busNumber?: string | null; seatNumber?: string | null;
        departureDate: string; departureTime?: string | null; arrivalTime?: string | null;
        departureLocation: string; arrivalLocation: string; transportCompany: string; createdAt: string;
        agentName?: string | null; boardingPoint?: string | null;
        trip?: { date: string; departureTime?: string | null; arrivalTime?: string | null; busNumber?: string | null; };
        returnTrip?: { date: string; departureTime?: string | null; arrivalTime?: string | null; busNumber?: string | null; };
    };
    applicant: { fullName: string; phone: string; passportNumber?: string | null; applicantCode?: string | null; };
    tripType?: "one-way" | "round-trip";
};

const COLORS = { blue: "#335c98", yellow: "#f9a000", textGray: "#475569", textDark: "#0f172a", white: "#ffffff", dotted: "rgba(255,255,255,0.4)" };

const formatTime = (time: string | null | undefined): string => { if (!time) return "07:00"; return time; };
const getPeriodEn = (time: string | null | undefined): string => { if (!time) return "AM"; const h = parseInt(time.split(":")[0]); return h >= 12 ? "PM" : "AM"; };
const subtractOneHour = (time: string | null | undefined): string => {
    if (!time) return "09.00 AM";
    const [hStr, mStr] = time.split(":");
    let h = parseInt(hStr);
    let m = parseInt(mStr);

    // Subtract 40 minutes
    m -= 40;
    if (m < 0) {
        m += 60;
        h -= 1;
    }
    if (h < 0) h = 23;

    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')} ${ampm}`;
};
const formatDate = (dateStr: string): string => { try { return format(new Date(dateStr), "dd.MM.yyyy"); } catch { return ""; } };
const getDay = (dateStr: string): string => { try { return format(new Date(dateStr), "EEEE", { locale: ar }); } catch { return ""; } };
const formatTicketNumber = (t: string) => { if (!t) return ""; return t.replace(/(.{3})/g, '$1 ').trim(); };

export const TicketTemplate = forwardRef<HTMLDivElement, TicketProps>(
    ({ ticket, applicant, tripType = "round-trip" }, ref) => {
        const trip = ticket.trip || { date: ticket.departureDate, departureTime: ticket.departureTime, arrivalTime: ticket.arrivalTime, busNumber: ticket.busNumber };
        const retTrip = ticket.returnTrip || { date: ticket.departureDate, departureTime: null, arrivalTime: null, busNumber: null };
        const depDate = trip.date;
        const retDate = retTrip.date;
        return (
            <div ref={ref} style={{ fontFamily: "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif", width: "950px", backgroundColor: "white", direction: "ltr", padding: "15px", boxSizing: "border-box", WebkitPrintColorAdjust: "exact" }}>
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');` }} />

                {/* 1. TOP PART */}
                <div style={{ display: "flex", alignItems: "stretch", marginBottom: "20px" }}>

                    {/* Left Section (Blue) */}
                    <div style={{ width: "260px", backgroundColor: COLORS.blue, padding: "20px 25px", display: "flex", flexDirection: "column", color: "white", borderRadius: "10px", flexShrink: 0, boxSizing: "border-box" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px" }}>
                            <Barcode value={ticket.ticketNumber || "0"} height={35} displayValue={false} width={1.5} margin={0} background="transparent" lineColor="#ffffff" />
                        </div>
                        <div style={{ textAlign: "center", fontSize: "14px", fontWeight: "900", letterSpacing: "3px", marginBottom: "20px", fontFamily: "monospace" }}>
                            {formatTicketNumber(ticket.ticketNumber || "123456789101112")}
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <div style={{ fontSize: "11px", margin: "0" }}>PNR</div>
                            <div style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", margin: "0" }}>{applicant.applicantCode || "PNR PASSENGER"}</div>
                            <div style={{ borderBottom: `1px dashed ${COLORS.dotted}`, marginTop: "10px" }}></div>
                        </div>
                        <div style={{ marginBottom: "15px", textAlign: "right", direction: "rtl", paddingRight: "5px" }}>
                            <div style={{ fontSize: "11px", margin: "0" }}>وقت الحضور</div>
                            <div style={{ fontSize: "14px", fontWeight: "900", direction: "ltr", textAlign: "left", letterSpacing: "1px", margin: "0" }}>{subtractOneHour(trip.departureTime)}</div>
                            <div style={{ borderBottom: `1px dashed ${COLORS.dotted}`, marginTop: "10px" }}></div>
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <div style={{ fontSize: "11px", margin: "0", textTransform: "uppercase" }}>PSASPORT NAMER</div>
                            <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "1px", margin: "0" }}>{applicant.passportNumber || "1128485940"}</div>
                            <div style={{ borderBottom: `1px dashed ${COLORS.dotted}`, marginTop: "10px" }}></div>
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <div style={{ fontSize: "11px", margin: "0", textTransform: "uppercase" }}>AGENT</div>
                            <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "1px", margin: "0", textTransform: "uppercase" }}>{ticket.agentName || "NAME AGENT"}</div>
                        </div>
                    </div>

                    {/* Right Section (Itinerary) */}
                    <div style={{ flex: 1, padding: "10px 10px 10px 25px", display: "flex", flexDirection: "column" }}>
                        <div style={{ textAlign: "right", paddingRight: "10px", marginBottom: "10px" }}>
                            <div style={{ fontSize: "14px", color: COLORS.blue, fontWeight: "bold", marginBottom: "2px" }}>أسم المسافر</div>
                            <div style={{ fontSize: "16px", fontWeight: "900", color: COLORS.blue, textTransform: "uppercase" }}>{applicant.fullName || "NAME PASSENGER"}</div>
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "25px" }}>
                            {/* Outbound */}
                            <div style={{ position: "relative", paddingRight: "50px" }}>
                                <div style={{ position: "absolute", right: "0", top: "0", bottom: "0", width: "30px", backgroundColor: COLORS.yellow, borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                    <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "12px", width: "100px", textAlign: "center" }}>الذهاب</div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                    <div style={{ textAlign: "center", width: "60px" }}><div style={{ fontSize: "12px", color: COLORS.blue, fontWeight: "bold" }}>To</div><div style={{ fontSize: "16px", fontWeight: "900", color: COLORS.yellow }}>{ticket.arrivalLocation}</div></div>
                                    <div style={{ flex: 1, position: "relative", margin: "0 20px", display: "flex", alignItems: "center" }}>
                                        <svg width="100%" height="10" style={{ width: "100%", overflow: "visible" }}>
                                            <circle cx="100%" cy="5" r="3" fill={COLORS.yellow} style={{ transform: "translateX(-3px)" }} />
                                            <line x1="calc(100% - 6px)" y1="5" x2="8" y2="5" stroke={COLORS.yellow} strokeWidth="2" />
                                            <polygon points="8,1 0,5 8,9" fill={COLORS.yellow} />
                                        </svg>
                                    </div>
                                    <div style={{ textAlign: "center", width: "60px" }}><div style={{ fontSize: "12px", color: COLORS.blue, fontWeight: "bold" }}>From</div><div style={{ fontSize: "16px", fontWeight: "900", color: COLORS.yellow }}>{ticket.departureLocation}</div></div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", direction: "rtl", textAlign: "center" }}>
                                    <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>Date</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", letterSpacing: "1px" }}>{formatDate(depDate)}</div></div>
                                    <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px", textTransform: "uppercase" }}>DAY</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue }}>{getDay(depDate)}</div></div>
                                    <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>الأنطلاق</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", direction: "ltr" }}>{getPeriodEn(trip.departureTime)} {formatTime(trip.departureTime)}</div></div>
                                    <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>الوصول</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", direction: "ltr" }}>{getPeriodEn(trip.arrivalTime)} {formatTime(trip.arrivalTime)}</div></div>
                                    <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>رقم الرحله</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace" }}>{trip.busNumber || "A1 234"}</div></div>
                                </div>
                            </div>
                            {tripType === "round-trip" && (
                                <>
                                    <div style={{ borderBottom: "1px dotted #cbd5e1", marginRight: "35px", marginLeft: "10px" }}></div>
                                    <div style={{ position: "relative", paddingRight: "50px" }}>
                                        <div style={{ position: "absolute", right: "0", top: "0", bottom: "0", width: "30px", backgroundColor: COLORS.yellow, borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "12px", width: "100px", textAlign: "center" }}>العودة</div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                            <div style={{ textAlign: "center", width: "60px" }}><div style={{ fontSize: "12px", color: COLORS.blue, fontWeight: "bold" }}>To</div><div style={{ fontSize: "16px", fontWeight: "900", color: COLORS.yellow }}>{ticket.departureLocation}</div></div>
                                            <div style={{ flex: 1, position: "relative", margin: "0 20px", display: "flex", alignItems: "center" }}>
                                                <svg width="100%" height="10" style={{ width: "100%", overflow: "visible" }}>
                                                    <circle cx="100%" cy="5" r="3" fill={COLORS.yellow} style={{ transform: "translateX(-3px)" }} />
                                                    <line x1="calc(100% - 6px)" y1="5" x2="8" y2="5" stroke={COLORS.yellow} strokeWidth="2" />
                                                    <polygon points="8,1 0,5 8,9" fill={COLORS.yellow} />
                                                </svg>
                                            </div>
                                            <div style={{ textAlign: "center", width: "60px" }}><div style={{ fontSize: "12px", color: COLORS.blue, fontWeight: "bold" }}>From</div><div style={{ fontSize: "16px", fontWeight: "900", color: COLORS.yellow }}>{ticket.arrivalLocation}</div></div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", direction: "rtl", textAlign: "center" }}>
                                            <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>Date</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", letterSpacing: "1px" }}>{formatDate(retDate)}</div></div>
                                            <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px", textTransform: "uppercase" }}>DAY</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue }}>{getDay(retDate)}</div></div>
                                            <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>الأنطلاق</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", direction: "ltr" }}>{getPeriodEn(retTrip.departureTime)} {formatTime(retTrip.departureTime)}</div></div>
                                            <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>الوصول</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace", direction: "ltr" }}>{getPeriodEn(retTrip.arrivalTime)} {formatTime(retTrip.arrivalTime)}</div></div>
                                            <div><div style={{ fontSize: "11px", color: COLORS.blue, marginBottom: "4px" }}>رقم الرحله</div><div style={{ fontSize: "14px", fontWeight: "900", color: COLORS.blue, fontFamily: "monospace" }}>{retTrip.busNumber || "A1 234"}</div></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Far Right Strip (Blue) */}
                    <div style={{ width: "50px", backgroundColor: COLORS.blue, borderRadius: "10px", marginLeft: "15px", color: "white", flexShrink: 0, position: "relative" }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-90deg)", whiteSpace: "nowrap", fontSize: "20px", fontWeight: "900" }}>تذكره السفر</div>
                    </div>
                </div>

                {/* 2. BOTTOM PART */}
                <div style={{ display: "flex", alignItems: "stretch", minHeight: "260px", backgroundColor: COLORS.blue, borderRadius: "10px", overflow: "hidden" }}>
                    {/* Left Section (Logos Area) */}
                    <div style={{ width: "400px", padding: "30px 40px", display: "flex", flexDirection: "column", color: "white", flexShrink: 0, borderRight: `1px dashed ${COLORS.dotted}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                            <div style={{ width: "80px", height: "80px", border: `1px dashed ${COLORS.dotted}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>أوفرسيز<br />(مساحة)</div>
                            <div style={{ width: "100px", height: "60px", border: `1px dashed ${COLORS.dotted}`, borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>بوابة الاعتماد<br />(مساحة)</div>
                        </div>
                        <div style={{ fontSize: "10px", lineHeight: "1.8", fontWeight: "bold", marginTop: "auto" }}>
                            <div style={{ color: COLORS.yellow }}>P.O : 466-Sanaa-Hadda St-Cinima Complex</div>
                            <div>Tel : +967 1 - 261000 / 261222</div>
                            <div>Fax : +967 1 - 261222</div>
                            <div>Mobile : +967-776221111 / 733223372</div>
                            <div>E-mail : info@overseas-travels.com</div>
                        </div>
                    </div>

                    {/* Right Section (Rules) */}
                    <div style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column", color: "white", direction: "rtl", textAlign: "right" }}>
                        <div style={{ marginBottom: "15px" }}>
                            <div style={{ fontSize: "13px", marginBottom: "4px" }}>رقم التذكره</div>
                            <div style={{ fontSize: "16px", fontWeight: "900", direction: "ltr", textAlign: "right", letterSpacing: "2px", fontFamily: "monospace" }}>{formatTicketNumber(ticket.ticketNumber || "123456789101112")}</div>
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                            <div style={{ fontSize: "13px", marginBottom: "4px" }}>نقطة الانطلاق</div>
                            <div style={{ fontSize: "16px", fontWeight: "900" }}>{ticket.boardingPoint || ticket.departureLocation}</div>
                        </div>
                        <div style={{ borderBottom: `1px dashed ${COLORS.dotted}`, margin: "10px -30px 20px -30px" }}></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: "900", marginBottom: "10px" }}>تعليمات هامه</div>
                            <ul style={{ margin: 0, padding: "0 20px 0 0", fontSize: "12px", lineHeight: "1.9", listStyleType: "disc", fontWeight: "600" }}>
                                <li>يرجى الحضور إلى موقع الانطلاق قبل موعد الرحلة بساعة</li>
                                <li>قد تتغير مواعيد الرحلات بسبب الظروف التشغيلية أو الطارئة</li>
                                <li>التذكرة غير مستردة، ويمكن تعديلها قبل موعد الرحلة بـ 48 ساعة كحد أقصى</li>
                                <li>لا تتحمل الشركة أي مسؤولية عن الأمتعة الشخصية الخاصة بالمسافر</li>
                                <li>يلتزم المسافر بـ اتباع تعليمات السائق طوال مدة الرحلة حفاظاً على السلامة</li>
                            </ul>
                        </div>
                    </div>

                    {/* Far Right Strip (Yellow) */}
                    <div style={{ width: "50px", backgroundColor: COLORS.yellow, position: "relative", color: "white", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-90deg)", whiteSpace: "nowrap", fontSize: "20px", fontWeight: "900" }}>تذكره السفر</div>
                    </div>
                </div>

            </div>
        );
    }
);

TicketTemplate.displayName = "TicketTemplate";
