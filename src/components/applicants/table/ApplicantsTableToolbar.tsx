"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, Settings2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ApplicantsTableToolbarProps<TData> {
    table: Table<TData>;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filters: any;
    setFilters: (filters: any) => void;
    locations: { id: string, name: string }[];
}

export function ApplicantsTableToolbar<TData>({
    table,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    locations
}: ApplicantsTableToolbarProps<TData>) {
    const isFiltered = searchTerm.length > 0 || Object.keys(filters).some(k => filters[k] !== 'ALL' && filters[k]);

    return (
        <div className="flex items-center justify-between p-4 bg-white border-b gap-4 flex-wrap">
            <div className="flex flex-1 items-center space-x-2 gap-2">
                <Input
                    placeholder="بحث سريع..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-9 w-[150px] lg:w-[250px] bg-gray-50/50"
                />

                {/* Status Filter */}
                <Select
                    value={filters.status || 'ALL'}
                    onValueChange={(val) => setFilters({ ...filters, status: val })}
                >
                    <SelectTrigger className="h-9 w-[140px] border-dashed">
                        <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">جميع الحالات</SelectItem>
                        <SelectItem value="NEW_REGISTRATION">تسجيل جديد</SelectItem>
                        <SelectItem value="TICKET_ISSUED">تم إصدار التذكرة</SelectItem>
                        <SelectItem value="EXAM_SCHEDULED">اختبار مجدول</SelectItem>
                        <SelectItem value="COMPLETED">مكتمل</SelectItem>
                        <SelectItem value="CANCELLED">ملغي</SelectItem>
                    </SelectContent>
                </Select>

                {/* Location Filter */}
                <Select
                    value={filters.locationId || 'ALL'}
                    onValueChange={(val) => setFilters({ ...filters, locationId: val })}
                >
                    <SelectTrigger className="h-9 w-[140px] border-dashed">
                        <SelectValue placeholder="المركز" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">جميع المراكز</SelectItem>
                        {locations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchTerm("");
                            setFilters({ status: 'ALL', locationId: 'ALL' });
                        }}
                        className="h-8 px-2 lg:px-3 text-red-500"
                    >
                        إلغاء الفلاتر
                        <X className="mr-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto h-9 hidden lg:flex">
                            <Settings2 className="mr-2 h-4 w-4" />
                            عرض الأعمدة
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>تبديل الأعمدة</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize text-right"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id === 'applicantCode' ? 'PNR' :
                                            column.id === 'fullName' ? 'الاسم' :
                                                column.id === 'examDate' ? 'الموعد' :
                                                    column.id === 'status' ? 'الحالة' : column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
