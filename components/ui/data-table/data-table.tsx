"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnResizeMode,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ArrowDown, ArrowUp } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  searchPlaceholder?: string;
  initialSorting?: { id: string; desc: boolean }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  searchPlaceholder = "Search...",
  initialSorting,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    initialSorting || []
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnResizeMode] = React.useState<ColumnResizeMode>("onChange");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    columnResizeMode,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing: {},
    },
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 40,
      maxSize: 1000,
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {filterColumn && (
        <div className="px-0">
          <DataTableToolbar
            table={table}
            filterColumn={filterColumn}
            searchPlaceholder={searchPlaceholder}
          />
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <Table className="relative w-full">
          <TableHeader className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-none hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "relative font-semibold text-[13px] text-gray-700",
                      header.column.getCanSort() &&
                        "hover:bg-gray-50/70 transition-colors",
                      header.column.getIsResizing() &&
                        "bg-gray-100/80 select-none"
                    )}
                    onClick={
                      header.column.getCanSort()
                        ? () =>
                            header.column.toggleSorting(
                              header.column.getIsSorted() === "asc"
                            )
                        : undefined
                    }
                    style={{
                      ...(header.column.getCanSort()
                        ? { cursor: "pointer" }
                        : {}),
                      width: header.getSize(),
                      maxWidth: header.getSize(),
                      position: "relative",
                    }}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() &&
                          !header.column.columnDef.header
                            ?.toString()
                            .includes("ArrowUpDown") && (
                            <div
                              className="ml-1 inline-flex cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                header.column.toggleSorting(
                                  header.column.getIsSorted() === "asc"
                                );
                              }}
                            >
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : null}
                            </div>
                          )}
                      </div>
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none",
                          header.column.getIsResizing()
                            ? "bg-blue-500"
                            : "bg-gray-300 opacity-0 hover:opacity-100"
                        )}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-sm font-normal text-gray-700"
                      style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-sm text-gray-500"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="py-2 px-0 border-t bg-white">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
