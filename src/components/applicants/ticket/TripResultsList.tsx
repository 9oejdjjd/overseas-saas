"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApplicantTicket } from "@/hooks/applicants/useApplicantTicket";

interface TripResultsListProps {
    hook: ReturnType<typeof useApplicantTicket>;
}

export function TripResultsList({ hook }: TripResultsListProps) {
    const {
        loading,
        fromId,
        toId,
        travelDate,
        setTravelDate,
        returnDate,
        setReturnDate,
        availableTrips,
        step,
        setStep,
        handleSearchTrips,
        handleSearchReturnTrips,
        handleSelectTrip
    } = hook;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-lg gap-3">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    {step === 2 ? "نتائج البحث (الذهاب)" : "نتائج البحث (العودة)"}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{availableTrips.length} رحلة</Badge>
                </h3>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 bg-white border-blue-200 hover:bg-blue-100 px-3"
                        disabled={loading}
                        onClick={() => {
                            const curr = step === 2 ? travelDate : returnDate;
                            const d = new Date(curr);
                            d.setDate(d.getDate() - 1);
                            const nextDate = d.toISOString().split('T')[0];
                            if (step === 2) {
                                setTravelDate(nextDate);
                                handleSearchTrips(nextDate);
                            } else {
                                setReturnDate(nextDate);
                                handleSearchReturnTrips(nextDate);
                            }
                        }}
                    >
                        ◀ اليوم السابق
                    </Button>
                    
                    <span className="text-sm font-bold mx-2 hidden sm:block text-blue-900 border-x border-blue-200 px-3">
                        {new Date(step === 2 ? travelDate : returnDate).toLocaleDateString("ar-EG", { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 bg-white border-blue-200 hover:bg-blue-100 px-3"
                        disabled={loading}
                        onClick={() => {
                            const curr = step === 2 ? travelDate : returnDate;
                            const d = new Date(curr);
                            d.setDate(d.getDate() + 1);
                            const nextDate = d.toISOString().split('T')[0];
                            if (step === 2) {
                                setTravelDate(nextDate);
                                handleSearchTrips(nextDate);
                            } else {
                                setReturnDate(nextDate);
                                handleSearchReturnTrips(nextDate);
                            }
                        }}
                    >
                        اليوم التالي ▶
                    </Button>
                    
                    <div className="h-8 w-px bg-blue-200 mx-1 hidden sm:block"></div>
                    
                    {step === 2 && <Button variant="ghost" onClick={() => setStep(1)} size="sm" className="h-8 text-blue-700 hover:bg-blue-100">تغيير بحث</Button>}
                    {step === 3 && <Button variant="ghost" onClick={() => { setStep(2); handleSearchTrips(travelDate); }} size="sm" className="h-8 text-blue-700 hover:bg-blue-100">رجوع للذهاب</Button>}
                </div>
            </div>

            {availableTrips.length === 0 && (
                <div className="text-center py-12 px-4 shadow-sm text-gray-500 bg-white rounded-lg border flex flex-col items-center justify-center gap-3">
                    <Bus className="h-10 w-10 text-gray-300" />
                    <p className="font-semibold text-gray-700">لا توجد رحلات متاحة في هذا اليوم</p>
                    <p className="text-sm">يمكنك التنقل إلى اليوم التالي لمعرفة الرحلات المتاحة</p>
                </div>
            )}

            <div className="grid gap-4">
                {availableTrips.map(tripSegment => {
                    const availableSeats = tripSegment.availableSeats || 0;
                    const isFull = availableSeats <= 0;
                    const departureTime = tripSegment.segmentDetails.departureTime;
                    const arrivalTime = tripSegment.segmentDetails.arrivalTime;
                    const isNextDay = tripSegment.segmentDetails?.nextDayArrival || false;

                    return (
                        <Card 
                            key={tripSegment.tripId} 
                            className={`transition-all border shadow-sm border-r-4 ${
                                isFull 
                                    ? 'bg-gray-50 border-r-gray-300 opacity-80' 
                                    : 'hover:border-blue-400 hover:shadow-md cursor-pointer border-r-blue-500'
                            }`} 
                            onClick={() => {
                                if (isFull) return;
                                handleSelectTrip({
                                    ...tripSegment,
                                    id: tripSegment.tripId, 
                                    date: tripSegment.segmentDetails.departureDate,
                                    departureTime: tripSegment.segmentDetails.departureTime,
                                    fromDestinationId: fromId,
                                    toDestinationId: toId,
                                    fromDestination: { name: tripSegment.segmentDetails.fromDestination },
                                    toDestination: { name: tripSegment.segmentDetails.toDestination }
                                }, {
                                    id: tripSegment.segmentDetails.toStopId,
                                    price: tripSegment.segmentDetails.price
                                });
                            }}
                        >
                            <CardContent className="p-0">
                                <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                                    {/* Flight-style info row */}
                                    <div className="flex-1 w-full flex items-center justify-between">
                                        <div className="text-center md:text-right min-w-[80px]">
                                            <p className="text-2xl font-bold font-mono text-gray-800">{departureTime}</p>
                                            <p className="text-sm font-semibold text-gray-600 mt-1">{tripSegment.segmentDetails.fromDestination}</p>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col items-center px-4 relative">
                                            <div className="w-full h-[2px] bg-gray-200 absolute top-1/2 -translate-y-1/2"></div>
                                            <Bus className={`h-6 w-6 bg-white px-1 relative z-10 ${isFull ? 'text-gray-400' : 'text-blue-500'}`} />
                                            <p className="text-[11px] font-bold text-gray-500 bg-white px-2 mt-1 relative z-10">
                                                {tripSegment.vehicle?.model || tripSegment.busClass || "حافلة اعتيادية"}
                                            </p>
                                        </div>

                                        <div className="text-center md:text-left min-w-[80px] relative">
                                            <p className="text-2xl font-bold font-mono text-gray-800 flex items-start justify-center md:justify-end">
                                                {arrivalTime}
                                                {isNextDay && <span className="text-[10px] text-red-500 font-bold ml-1 absolute leading-tight -left-8 top-1 bg-red-50 px-1 rounded border border-red-100">+1 يوم</span>}
                                            </p>
                                            <p className="text-sm font-semibold text-gray-600 mt-1">{tripSegment.segmentDetails.toDestination}</p>
                                        </div>
                                    </div>

                                    {/* Separator */}
                                    <div className="hidden md:block w-px h-16 bg-gray-200 mx-2"></div>

                                    {/* Action & Status */}
                                    <div className="w-full md:w-auto flex flex-col items-center justify-center gap-2">
                                        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center w-full gap-2">
                                            <div className="text-center">
                                                <p className="text-[11px] text-gray-500">المقاعد المتاحة</p>
                                                <p className={`text-lg leading-none font-bold ${isFull ? 'text-red-500' : (availableSeats < 5 ? 'text-orange-500' : 'text-green-600')}`}>
                                                    {isFull ? "ممتلئة" : availableSeats}
                                                </p>
                                            </div>
                                            <Button size="sm" disabled={isFull} className={`w-32 rounded-full ${isFull ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
                                                {isFull ? "الرحلة ممكتلئة" : (step === 2 ? "اختيار للذهاب" : "اختيار للعودة")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {/* Route Itinerary Banner */}
                                <div className="bg-gray-50/80 px-4 py-2 border-t text-[11px] text-gray-500 flex items-center gap-2 rounded-b-lg">
                                    <MapPin className="h-3 w-3 text-blue-400" />
                                    <span className="font-semibold text-gray-600">مسار الرحلة الكامل:</span> 
                                    {tripSegment.mainRouteTitle}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
