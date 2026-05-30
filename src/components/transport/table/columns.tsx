
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, ArrowUpDown, Bus, Clock, MapPin, Users, Coins } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export type Trip = {
    id: string;
    tripNumber: string;
    date: string;
    departureTime: string;
    arrivalDate: string | null;
    arrivalTime: string | null;
    fromDestination: { name: string };
    toDestination: { name: string };
    price: number;
    capacity: number;
    bookedSeats: number;
    status: string;
    busNumber: string | null;
    driverName: string | null;
    stops: any[];
    _count?: { tickets: number };
};

export const columns: ColumnDef<Trip>[] = [
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
        accessorKey: "tripNumber",
        header: "رقم الرحلة",
        cell: ({ row }) => <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit">{row.getValue("tripNumber")}</div>,
    },
    {
        id: "route",
        accessorFn: (row) => `${row.fromDestination.name} ${row.toDestination.name}`,
        header: "المسار",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-medium">
                <span className="text-blue-700">{row.original.fromDestination.name}</span>
                <span className="text-gray-400">←</span>
                <span className="text-green-700">{row.original.toDestination.name}</span>
            </div>
        ),
    },
    {
        accessorKey: "date",
        header: ({ column }) => (
            <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                التاريخ والوقت
                <ArrowUpDown className="mr-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue("date"));
            const arrivalDate = row.original.arrivalDate ? new Date(row.original.arrivalDate) : null;
            return (
                <div className="flex flex-col text-xs space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">المغادرة:</span>
                        <span>{format(date, "yyyy-MM-dd")}</span>
                        <span className="text-gray-500 text-[10px]">{row.original.departureTime}</span>
                    </div>
                    {arrivalDate && (
                        <div className="flex items-center gap-2 border-t pt-1 mt-1 border-dashed">
                            <span className="font-bold text-green-700">الوصول:</span>
                            <span>{format(arrivalDate, "yyyy-MM-dd")}</span>
                            {row.original.arrivalTime && <span className="text-gray-500 text-[10px]">{row.original.arrivalTime}</span>}
                        </div>
                    )}
                </div>
            );
        },
    },

    {
        id: "busInfo",
        header: "الباص / السائق",
        cell: ({ row }) => (
            <div className="flex flex-col text-xs gap-1">
                {row.original.busNumber && <span className="flex items-center gap-1"><Bus className="h-3 w-3" /> {row.original.busNumber}</span>}
                {row.original.driverName && <span className="text-gray-500">{row.original.driverName}</span>}
                {!row.original.busNumber && !row.original.driverName && <span className="text-gray-400">-</span>}
            </div>
        ),
    },
    {
        id: "seats",
        header: "المقاعد والحجز",
        cell: ({ row }) => {
            const booked = row.original._count?.tickets || 0;
            const capacity = row.original.capacity;
            const percentage = Math.min(100, Math.max(0, Math.round((booked / capacity) * 100)));
            
            // Premium Dynamic visual indicator colors
            let barColor = "from-emerald-400 to-emerald-500 shadow-emerald-100";
            let textColor = "text-emerald-600 font-bold";
            let containerEffect = "";

            if (percentage >= 95) {
                barColor = "from-rose-500 to-rose-600 shadow-rose-200 animate-pulse";
                textColor = "text-rose-600 font-extrabold animate-pulse";
            } else if (percentage >= 70) {
                barColor = "from-amber-400 to-amber-500 shadow-amber-100";
                textColor = "text-amber-600 font-bold";
            }

            return (
                <div className="w-[100px] text-right space-y-1" dir="rtl">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 font-mono">{booked} من {capacity}</span>
                        <span className={textColor}>{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                        <div 
                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out shadow-sm`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            let color = "bg-gray-100 text-gray-700";
            if (status === 'SCHEDULED') color = "bg-blue-50 text-blue-700 border-blue-200";
            if (status === 'COMPLETED') color = "bg-green-50 text-green-700 border-green-200";
            if (status === 'CANCELLED') color = "bg-red-50 text-red-700 border-red-200";

            return (
                <Badge variant="outline" className={`${color} border`}>
                    {status === 'SCHEDULED' ? 'مجدولة' : status}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                            نسخ المعرف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => document.dispatchEvent(new CustomEvent('edit-trip', { detail: row.original }))}>
                            تعديل الرحلة
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => document.dispatchEvent(new CustomEvent('delete-trip', { detail: row.original.id }))}>
                            حذف الرحلة
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
