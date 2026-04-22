"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  // When true, hides the built-in pagination controls so that the parent can render them externally
  hidePagination?: boolean;
  // Callback to expose the internal table instance to the parent for external pagination control
  onTableInstance?: (table: ReturnType<typeof useReactTable<TData>>) => void;
  // Notify parent when pagination changes (pageIndex/pageSize)
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  // If provided, use this as controlled pagination state
  controlledPagination?: { pageIndex: number; pageSize: number };
  // Control react-table's auto reset behavior for page index
  autoResetPageIndex?: boolean;
  // Optional className applied to the underlying Table element (to control font-size, spacing, etc.)
  tableClassName?: string;
  // Initial page size for uncontrolled pagination (default 10)
  initialPageSize?: number;
  // Custom footer info text. If provided, overrides the default "Showing X of Y entries" text.
  footerInfoText?: string;
  // Whether to show the table footer (grand totals)
  showFooter?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  hidePagination = false,
  onTableInstance,
  onPaginationChange,
  controlledPagination,
  autoResetPageIndex = false,
  tableClassName,
  initialPageSize,
  footerInfoText,
  showFooter = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [uncontrolledPagination, setUncontrolledPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize ?? 10,
  });
  const effectivePagination = controlledPagination ?? uncontrolledPagination;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater: any) => {
      const next =
        typeof updater === "function"
          ? updater(effectivePagination)
          : updater;
      
      if (!controlledPagination) {
        setUncontrolledPagination(next);
      }
      
      onPaginationChange?.(next);
    },
    manualPagination: false, // We want client-side pagination since we pass the full dataset
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: effectivePagination,
    },

  });

  // Expose table instance to parent for external pagination controls
  useEffect(() => {
    onTableInstance?.(table as any);
    // We intentionally do not add onTableInstance to deps to avoid re-calling unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, sorting, columnFilters, columnVisibility, data]);

  // Keep react-table internal page size in sync with the requested initialPageSize
  useEffect(() => {
    if (
      initialPageSize &&
      table.getState().pagination.pageSize !== initialPageSize
    ) {
      table.setPageSize(initialPageSize);
    }
  }, [initialPageSize, table]);

  // Notify parent when uncontrolled pagination changes so external UIs can re-render
  useEffect(() => {
    if (!controlledPagination) {
      onPaginationChange?.(uncontrolledPagination);
    }
  }, [uncontrolledPagination, onPaginationChange, controlledPagination]);

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table
          className={cn(
            "relative border-separate border-spacing-0",
            tableClassName,
          )}
        >
          <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-background">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {showFooter && (
            <TableFooter className="bg-background sticky bottom-0 z-10">
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((footer) => (
                    <TableCell
                      key={footer.id}
                      className="font-bold py-3 text-black border-t border-zinc-200"
                    >
                      {footer.isPlaceholder
                        ? null
                        : flexRender(
                            footer.column.columnDef.footer,
                            footer.getContext(),
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </div>
      {hidePagination ? null : (
        <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4">
          {/* Left: Rows per page */}
          <div className="flex items-center space-x-2 order-2 md:order-1">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                const newSize = Number(value);
                table.setPageSize(newSize);
                // Force triggering onPaginationChange with the new value immediately 
                // in case table.setPageSize internal update is batched
                onPaginationChange?.({
                  ...effectivePagination,
                  pageSize: newSize,
                });
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Center: Pagination */}
          <div className="flex items-center justify-center order-1 md:order-2 w-full md:w-auto">
            <Pagination className="mx-auto overflow-x-auto no-scrollbar justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      table.previousPage();
                    }}
                    className={cn(
                      "cursor-pointer select-none",
                      !table.getCanPreviousPage() &&
                        "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>

                {/* Page numbers logic */}
                {(() => {
                  const totalPage = table.getPageCount();
                  const currentPage = table.getState().pagination.pageIndex + 1;
                  const items = [];

                  if (totalPage <= 7) {
                    for (let i = 1; i <= totalPage; i++) {
                      items.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i}
                            onClick={(e) => {
                              e.preventDefault();
                              table.setPageIndex(i - 1);
                            }}
                            className="cursor-pointer select-none"
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>,
                      );
                    }
                  } else {
                    // Always show first
                    items.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          isActive={currentPage === 1}
                          onClick={(e) => {
                            e.preventDefault();
                            table.setPageIndex(0);
                          }}
                          className="cursor-pointer select-none"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>,
                    );

                    if (currentPage > 3) {
                      items.push(<PaginationEllipsis key="left-ellipsis" />);
                    }

                    // Middle pages
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPage - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      items.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i}
                            onClick={(e) => {
                              e.preventDefault();
                              table.setPageIndex(i - 1);
                            }}
                            className="cursor-pointer select-none"
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>,
                      );
                    }

                    if (currentPage < totalPage - 2) {
                      items.push(<PaginationEllipsis key="right-ellipsis" />);
                    }

                    // Always show last
                    items.push(
                      <PaginationItem key={totalPage}>
                        <PaginationLink
                          isActive={currentPage === totalPage}
                          onClick={(e) => {
                            e.preventDefault();
                            table.setPageIndex(totalPage - 1);
                          }}
                          className="cursor-pointer select-none"
                        >
                          {totalPage}
                        </PaginationLink>
                      </PaginationItem>,
                    );
                  }
                  return items;
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      table.nextPage();
                    }}
                    className={cn(
                      "cursor-pointer select-none",
                      !table.getCanNextPage() &&
                        "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Right: Showing entries text */}
          <div className="text-sm text-muted-foreground whitespace-nowrap order-3 md:text-right">
            {footerInfoText ?? (
              <>
                Showing{" "}
                {(() => {
                  const { pageIndex, pageSize } = table.getState().pagination;
                  const total = table.getFilteredRowModel().rows.length;
                  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
                  const end = Math.min((pageIndex + 1) * pageSize, total);
                  return `${start}-${end} of ${total}`;
                })()}{" "}
                entries
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
