"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useApplicantTicket } from "@/hooks/applicants/useApplicantTicket";

interface TripSearchFormProps {
    hook: ReturnType<typeof useApplicantTicket>;
}

export function TripSearchForm({ hook }: TripSearchFormProps) {
    const {
        destinations,
        fromId,
        setFromId,
        toId,
        setToId,
        travelDate,
        setTravelDate,
        tripType,
        setTripType,
        returnDate,
        setReturnDate,
        handleSearchTrips
    } = hook;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    البحث عن رحلات سفر
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Trip Type Toggle */}
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setTripType("ONE_WAY")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            tripType === "ONE_WAY"
                                ? "bg-white shadow text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ذهاب فقط
                    </button>
                    <button
                        type="button"
                        onClick={() => setTripType("ROUND_TRIP")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            tripType === "ROUND_TRIP"
                                ? "bg-white shadow text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ذهاب وعودة
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">من (الانطلاق)</label>
                        <Select value={fromId} onValueChange={setFromId}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر..." />
                            </SelectTrigger>
                            <SelectContent>
                                {destinations.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">إلى (الوصول)</label>
                        <Select value={toId} onValueChange={setToId}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر..." />
                            </SelectTrigger>
                            <SelectContent>
                                {destinations.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">تاريخ الذهاب</label>
                        <Input
                            type="date"
                            value={travelDate}
                            onChange={e => setTravelDate(e.target.value)}
                        />
                    </div>
                    {tripType === "ROUND_TRIP" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs font-bold text-gray-500">تاريخ العودة</label>
                            <Input
                                type="date"
                                value={returnDate}
                                onChange={e => setReturnDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <Button onClick={() => handleSearchTrips()} className="w-full bg-blue-600 hover:bg-blue-700">
                    بحث عن الرحلات المتاحة
                </Button>
            </CardContent>
        </Card>
    );
}
