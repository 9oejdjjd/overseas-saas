"use client";

import * as React from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

// Helper function to format date without timezone issues
// This converts the Date to local date string (yyyy-MM-dd) without UTC conversion
export function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function DatePicker({ date, setDate, disabled, placeholder = "اختر التاريخ", className }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-right font-normal h-10",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
                    {date ? format(date, "yyyy/MM/dd") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
                align="start"
                sideOffset={4}
            >
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-700 text-center">اختر التاريخ</p>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ar}
                />
            </PopoverContent>
        </Popover>
    )
}

