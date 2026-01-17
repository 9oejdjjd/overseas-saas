"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
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
import { useState } from "react";
import { ApplicantsTableToolbar } from "./ApplicantsTableToolbar";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount: number;
    pagination: { pageIndex: number; pageSize: number };
    onPaginationChange: (pagination: any) => void;
    sorting: SortingState;
    onSortingChange: (sorting: any) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filters: any;
    setFilters: (filters: any) => void;
    locations: { id: string; name: string }[];
    loading: boolean;
}

export function ApplicantsDataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    locations,
    loading
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        pageCount: pageCount,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            pagination,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: onSortingChange,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: onPaginationChange,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        // getFilteredRowModel: getFilteredRowModel(), // We do server side filtering
    });

    return (
        <div className="space-y-4">
            <ApplicantsTableToolbar
                table={table}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
                locations={locations}
            />
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
                                    لا توجد نتائج
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} من{" "}
                    {table.getFilteredRowModel().rows.length} صف محدد.
                </div>
                <div className="flex items-center space-x-2 gap-2">
                    <span className="text-sm text-gray-600">
                        صفحة {pagination.pageIndex + 1} من {pageCount}
                    </span>
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
