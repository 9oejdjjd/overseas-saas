
"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    loading: boolean;
    onFiltersChange: (filters: any) => void;
}

export function TripsDataTable<TData, TValue>({
    columns,
    data,
    loading,
    onFiltersChange
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    // Local Filters State
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [routeFilter, setRouteFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    });

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        table.getColumn("status")?.setFilterValue(value === "ALL" ? "" : value);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        table.getColumn("tripNumber")?.setFilterValue(value);
    };

    const handleRouteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setRouteFilter(value);
        table.getColumn("route")?.setFilterValue(value);
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDateFilter(value);
        table.getColumn("date")?.setFilterValue(value);
    };

    const clearFilters = () => {
        setStatusFilter("ALL");
        setSearchTerm("");
        setRouteFilter("");
        setDateFilter("");
        table.resetColumnFilters();
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-lg border shadow-sm">
                <Input
                    placeholder="بحث برقم الرحلة..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="max-w-[150px] h-9"
                />
                <Input
                    placeholder="بحث بالمسار (مثال: صنعاء)..."
                    value={routeFilter}
                    onChange={handleRouteChange}
                    className="max-w-[180px] h-9"
                />
                <Input
                    type="date"
                    value={dateFilter}
                    onChange={handleDateChange}
                    className="max-w-[150px] h-9 text-gray-500"
                />
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">الكل</SelectItem>
                        <SelectItem value="SCHEDULED">مجدولة</SelectItem>
                        <SelectItem value="COMPLETED">مكتملة</SelectItem>
                        <SelectItem value="CANCELLED">ملغية</SelectItem>
                    </SelectContent>
                </Select>
                {(statusFilter !== "ALL" || searchTerm || routeFilter || dateFilter) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-red-500">
                        <X className="h-4 w-4 mr-1" /> مسح الفلاتر
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-right font-bold text-gray-700">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    جاري التحميل...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-blue-50/30 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    لا توجد رحلات
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} من{" "}
                    {table.getFilteredRowModel().rows.length} صف محدد.
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        التالي
                    </Button>
                </div>
            </div>
        </div>
    );
}
