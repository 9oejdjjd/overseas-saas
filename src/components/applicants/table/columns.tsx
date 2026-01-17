"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Applicant } from "@/types/applicant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, ArrowUpDown, Bus, Wallet, CalendarClock, Phone, CheckCircle2, XCircle, AlertCircle, Plane } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateApplicantStatus } from "@/app/actions/applicant";
import { ContextualMessageButton } from "@/components/messaging/ContextualMessageButton";

// Extended type to include ticket from API
export type ApplicantData = Applicant & {
    location?: { name: string; code?: string };
    ticket?: {
        id: string;
        status: string;
        ticketNumber: string;
        departureDate: string;
    } | null;
};

// Helper function to determine Ticket Status
const getTicketStatus = (app: ApplicantData) => {
    if (app.hasTransportation) {
        if (!app.ticket) return { label: "بانتظار الحجز", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle };

        switch (app.ticket.status) {
            case 'ISSUED': return { label: "تم حجز التذكرة", color: "bg-blue-100 text-blue-700", icon: Plane };
            case 'USED': return { label: "تم استخدام التذكرة", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
            case 'CANCELLED': return { label: "تم إلغاء التذكرة", color: "bg-red-100 text-red-700", icon: XCircle };
            case 'MODIFIED': return { label: "تم تعديل الموعد", color: "bg-purple-100 text-purple-700", icon: CalendarClock };
            case 'NO_SHOW': return { label: "لم يحضر", color: "bg-gray-100 text-gray-700", icon: XCircle };
            default: return { label: app.ticket.status, color: "bg-gray-100 text-gray-700", icon: Bus };
        }
    }
    return null; // No transportation needed
};

export const columns: ColumnDef<ApplicantData>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "fullName",
        header: ({ column }) => (
            <Button variant="ghost" className="text-right p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                بيانات المتقدم
                <ArrowUpDown className="mr-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1">
                <div className="font-bold text-gray-900">{row.getValue("fullName")}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                    <span className="bg-gray-100 px-1 rounded">{row.original.applicantCode || "PNR"}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {row.original.phone}</span>
                </div>
            </div>
        ),
    },
    {
        id: "examStatus", // New Exam Status Column
        header: "حالة الاختبار",
        cell: ({ row }) => {
            const status = row.original.status;
            let display = { label: "غير محدد", class: "bg-gray-100 text-gray-500" };

            if (status === 'EXAM_SCHEDULED') display = { label: "تم حجز الموعد", class: "bg-blue-100 text-blue-700" };
            else if (status === 'PASSED') display = { label: "ناجح", class: "bg-green-100 text-green-700" };
            else if (status === 'FAILED') display = { label: "راسب", class: "bg-red-100 text-red-700" };
            else if (status === 'ABSENT') display = { label: "غائب", class: "bg-orange-100 text-orange-700" };
            else if (status === 'NEW_REGISTRATION') display = { label: "جديد", class: "bg-gray-100 text-gray-600" };

            return (
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className={cn("px-2 py-1 rounded-md text-xs font-semibold cursor-pointer select-none transition-colors hover:opacity-80", display.class)}>
                                {display.label}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>تحديث الحالة</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={status} onValueChange={(val) => {
                                updateApplicantStatus(row.original.id, val);
                                // Optional: Trigger toast here via event or props
                            }}>
                                <DropdownMenuRadioItem value="PASSED">ناجح</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="FAILED">راسب</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="ABSENT">غائب</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="EXAM_SCHEDULED">تم حجز الموعد</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Smart WhatsApp for Status */}
                    <ContextualMessageButton
                        applicant={row.original}
                        trigger={status === 'PASSED' ? 'ON_PASS' : status === 'FAILED' ? 'ON_FAIL' : undefined}
                        mini
                    />
                </div>
            );
        }
    },
    {
        id: "ticketStatus",
        header: "حالة التذكرة",
        cell: ({ row }) => {
            const status = getTicketStatus(row.original);
            if (!status) return <span className="text-gray-300 text-xs">-</span>;

            return (
                <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-fit", status.color)}>
                    <status.icon className="h-3.5 w-3.5" />
                    {status.label}
                </div>
            );
        },
    },
    {
        accessorKey: "examDate",
        header: "الموعد",
        cell: ({ row }) => {
            const date = row.getValue("examDate") as string;
            if (!date) return <span className="text-muted-foreground text-xs">-</span>;
            const d = new Date(date);
            const isToday = new Date().toDateString() === d.toDateString();

            return (
                <div className={cn("text-xs font-medium flex flex-col", isToday ? "text-green-600" : "")}>
                    <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {d.toLocaleDateString("en-GB")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{row.original.examTime || ""}</span>
                </div>
            );
        },
    },
    {
        id: "financials",
        header: "المالية",
        cell: ({ row }) => {
            const remaining = Number(row.original.remainingBalance);
            return (
                <div className="flex flex-col items-end">
                    <div className={cn("font-bold text-xs", remaining > 0 ? "text-red-600" : "text-green-600")}>
                        {remaining > 0 ? remaining.toLocaleString() : "مدفوع"}
                    </div>
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const app = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 hover:opacity-100">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(app.id)}>
                            نسخ المعرف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`https://wa.me/${app.whatsappNumber}`} target="_blank">
                            <DropdownMenuItem>مراسلة واتساب</DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => {
                            document.dispatchEvent(new CustomEvent('open-applicant-modal', { detail: app }));
                        }}>
                            تفاصيل المتقدم
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
