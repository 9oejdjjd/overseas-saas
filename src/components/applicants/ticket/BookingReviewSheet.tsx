"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useApplicantTicket } from "@/hooks/applicants/useApplicantTicket";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

interface BookingReviewSheetProps {
    hook: ReturnType<typeof useApplicantTicket>;
}

export function BookingReviewSheet({ hook }: BookingReviewSheetProps) {
    const {
        loading,
        tripType,
        agentName,
        setAgentName,
        boardingPoint,
        setBoardingPoint,
        companions,
        setCompanions,
        selectedTrip,
        selectedReturnTrip,
        showBookingSheet,
        setShowBookingSheet,
        setStep,
        pricingBreakdown,
        manualPrice,
        setManualPrice,
        isEditingPrice,
        setIsEditingPrice,
        confirmBooking
    } = hook;

    return (
        <Sheet open={showBookingSheet} onOpenChange={(open) => { setShowBookingSheet(open); if (!open) setStep(1); }}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>ملخص وحجز الرحلة</SheetTitle>
                    <SheetDescription>تأكد من بيانات الرحلة قبل الإصدار</SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Outbound Summary */}
                    {selectedTrip && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm text-blue-800 pb-1 border-b border-blue-100">رحلة الذهاب</h4>
                            <div className="text-sm">
                                <div className="font-semibold">{selectedTrip.fromDestination.name} ← {selectedTrip.toDestination.name}</div>
                                <div className="text-gray-500 flex justify-between mt-1">
                                    <span>{format(new Date(selectedTrip.date), 'yyyy-MM-dd')}</span>
                                    <span>{selectedTrip.departureTime}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Return Summary */}
                    {selectedReturnTrip && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm text-green-800 pb-1 border-b border-green-100">رحلة العودة</h4>
                            <div className="text-sm">
                                <div className="font-semibold">{selectedReturnTrip.fromDestination.name} ← {selectedReturnTrip.toDestination.name}</div>
                                <div className="text-gray-500 flex justify-between mt-1">
                                    <span>{format(new Date(selectedReturnTrip.date), 'yyyy-MM-dd')}</span>
                                    <span>{selectedReturnTrip.departureTime}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Breakdown */}
                    <div className="border rounded p-3 border-green-200 bg-green-50">
                        <div className="text-sm font-bold text-green-800 mb-2">تفاصيل السعر ({tripType === "ROUND_TRIP" ? "ذهاب وعودة" : "ذهاب فقط"})</div>

                        <div className="space-y-1 mb-3 text-sm">
                            {pricingBreakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-gray-600">
                                    <span>{item.label}</span>
                                    <span dir="ltr">{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-green-200 pt-2 pb-4">
                            <div className="text-sm font-bold text-green-800">سعر التذكرة (للفرد)</div>
                            <div className="flex items-center gap-2">
                                {isEditingPrice ? (
                                    <Input
                                        type="number"
                                        className="h-8 w-24 bg-white"
                                        value={manualPrice || 0}
                                        onChange={e => setManualPrice(Number(e.target.value))}
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-green-700">
                                        {manualPrice} ريال
                                    </div>
                                )}
                                <Button
                                    size="icon" variant="ghost" className="h-6 w-6"
                                    onClick={() => setIsEditingPrice(!isEditingPrice)}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        
                        {companions.length > 0 && (
                            <div className="flex justify-between items-center border-t border-green-200 pt-3 pb-2">
                                <div className="text-sm font-bold text-green-800">إجمالي السعر (الأصيل + {companions.length} مرافقين)</div>
                                <div className="text-xl font-bold bg-green-100 px-3 py-1 rounded text-green-800 border border-green-300">
                                    {(manualPrice || 0) * (1 + companions.length)} ريال
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Companions Section */}
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                إضافة مرافقين <Badge variant="secondary" className="text-xs">{(manualPrice||0)} ر.ي لكل مرافق</Badge>
                            </h4>
                            <Button size="sm" variant="outline" onClick={() => setCompanions([...companions, {name: ""}])} className="h-8 shadow-sm">
                                + إضافة مرافق
                            </Button>
                        </div>
                        
                        {companions.length > 0 ? (
                            <div className="space-y-3">
                                {companions.map((comp, idx) => (
                                    <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <Input 
                                            placeholder="اسم المرافق الرباعي" 
                                            value={comp.name} 
                                            onChange={e => {
                                                const newComps = [...companions];
                                                newComps[idx].name = e.target.value;
                                                setCompanions(newComps);
                                            }}
                                            className="border-blue-100 focus-visible:ring-blue-400"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                                            onClick={() => {
                                                const newComps = [...companions];
                                                newComps.splice(idx, 1);
                                                setCompanions(newComps);
                                            }}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 p-2 bg-gray-50 rounded border border-dashed border-gray-200 text-center">
                                لا يوجد مرافقين مضافين. سيتم إصدار التذكرة للمتقدم الأصيل فقط.
                            </p>
                        )}
                    </div>

                    {/* Custom Ticket Info */}
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                        <h4 className="font-bold text-sm text-gray-800">تخصيص بيانات التذكرة (اختياري)</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">اسم الوكيل</label>
                                <Input
                                    placeholder="مثال: وكالة السفر الدولية"
                                    value={agentName}
                                    onChange={e => setAgentName(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">موقع الانطلاق (نقطة التجمع)</label>
                                <Input
                                    placeholder="مثال: صنعاء - شارع حده المجمع السينمائي"
                                    value={boardingPoint}
                                    onChange={e => setBoardingPoint(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    <Button onClick={confirmBooking} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                        {loading ? "جاري الإصدار..." : "تأكيد وإصدار التذكرة"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
