"use client";

import { useEffect, useState } from "react";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

interface DateInputProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    className?: string;
}

const MONTHS = [
    { value: "0", label: "يناير" },
    { value: "1", label: "فبراير" },
    { value: "2", label: "مارس" },
    { value: "3", label: "أبريل" },
    { value: "4", label: "مايو" },
    { value: "5", label: "يونيو" },
    { value: "6", label: "يوليو" },
    { value: "7", label: "أغسطس" },
    { value: "8", label: "سبتمبر" },
    { value: "9", label: "أكتوبر" },
    { value: "10", label: "نوفمبر" },
    { value: "11", label: "ديسمبر" },
];

export function CustomDatePicker({ value, onChange, className }: DateInputProps) {
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");

    // Sync from external value
    useEffect(() => {
        if (value) {
            setDay(value.getDate().toString());
            setMonth(value.getMonth().toString());
            setYear(value.getFullYear().toString());
        }
    }, [value]);

    const handleChange = (d: string, m: string, y: string) => {
        setDay(d);
        setMonth(m);
        setYear(y);

        if (d && m && y && y.length === 4) {
            const date = new Date(parseInt(y), parseInt(m), parseInt(d));
            // Basic validation
            if (date && date.getFullYear() === parseInt(year) && date.getDate() === parseInt(day)) {
                onChange(date);
            }
        } else {
            // onChange(undefined); // Optional: only clear if strictly invalid? usually better to keep old value until valid?
            // Actually better to not emit undefined unless explicity cleared
        }
    };

    return (
        <div className={cn("flex gap-2", className)}>
            <Input
                placeholder="اليوم"
                value={day}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    handleChange(val, month, year);
                }}
                className="w-20 text-center"
            />
            <Select
                value={month}
                onValueChange={(val) => handleChange(day, val, year)}
            >
                <SelectTrigger className="flex-1 min-w-[120px]">
                    <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                placeholder="السنة"
                value={year}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    handleChange(day, month, val);
                }}
                className="w-24 text-center"
            />
        </div>
    );
}
