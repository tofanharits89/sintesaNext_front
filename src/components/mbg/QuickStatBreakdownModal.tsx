"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import { ColumnDef } from "@tanstack/react-table";

interface BreakdownItem {
  category: string;
  value: number;
}

interface QuickStatBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  categoryHeader?: string;
  data: BreakdownItem[];
}

export function QuickStatBreakdownModal({
  open,
  onOpenChange,
  title,
  categoryHeader = "Kategori",
  data,
}: QuickStatBreakdownModalProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<BreakdownItem>[] = useMemo(() => [
    {
      id: "no",
      header: () => <div className="text-center font-bold">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "category",
      header: () => <div className="text-left font-bold">{categoryHeader}</div>,
      cell: ({ row }) => (
        <div className="text-left font-mono uppercase font-medium">
          {row.getValue("category")}
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: () => <div className="text-right font-bold pr-4">Jumlah</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono font-bold pr-4 text-blue-600 dark:text-blue-400">
          {Number(row.getValue("value")).toLocaleString("id-ID")}
        </div>
      ),
    },
  ], [categoryHeader]);

  useEffect(() => {
    setPagination((prev) => {
      const maxPageIndex = Math.max(0, Math.ceil(data.length / prev.pageSize) - 1);
      if (prev.pageIndex <= maxPageIndex) {
        return prev;
      }
      return { ...prev, pageIndex: maxPageIndex };
    });
  }, [data.length]);

  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pagination.pageSize));
  const currentPage = Math.min(pagination.pageIndex + 1, totalPages);
  const startEntry = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const endEntry = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

  const pageItems = useMemo(() => {
    const items: Array<number | "left-ellipsis" | "right-ellipsis"> = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        items.push(i);
      }
      return items;
    }

    items.push(1);
    if (currentPage > 3) {
      items.push("left-ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i += 1) {
      items.push(i);
    }

    if (currentPage < totalPages - 2) {
      items.push("right-ellipsis");
    }

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Detail {title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <DataTable
            columns={columns}
            data={data}
            controlledPagination={pagination}
            onPaginationChange={setPagination}
            hidePagination
          />
        </div>

        <DialogFooter className="p-6 pt-4 bg-muted/5">
          <div className="w-full grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-center">
            <div className="flex items-center justify-start gap-2">
                <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                <Select
                  value={`${pagination.pageSize}`}
                  onValueChange={(value) => {
                    setPagination({
                      pageIndex: 0,
                      pageSize: Number(value),
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue placeholder={pagination.pageSize} />
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

            <div className="flex flex-col items-center gap-2">
              <Pagination className="mx-0 justify-center">
                <div className="flex items-center gap-2">
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.pageIndex > 0) {
                        setPagination((prev) => ({
                          ...prev,
                          pageIndex: prev.pageIndex - 1,
                        }));
                      }
                    }}
                    className={`cursor-pointer select-none ${
                      pagination.pageIndex === 0 ? "pointer-events-none opacity-50" : ""
                    }`}
                  />

                  <PaginationContent className="gap-1">
                    {pageItems.map((item) => {
                      if (item === "left-ellipsis" || item === "right-ellipsis") {
                        return <PaginationEllipsis key={item} />;
                      }

                      return (
                        <PaginationItem key={item}>
                          <PaginationLink
                            isActive={currentPage === item}
                            onClick={(e) => {
                              e.preventDefault();
                              setPagination((prev) => ({
                                ...prev,
                                pageIndex: item - 1,
                              }));
                            }}
                            className="cursor-pointer select-none"
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  </PaginationContent>

                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.pageIndex < totalPages - 1) {
                        setPagination((prev) => ({
                          ...prev,
                          pageIndex: prev.pageIndex + 1,
                        }));
                      }
                    }}
                    className={`cursor-pointer select-none ${
                      pagination.pageIndex >= totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  />
                </div>
              </Pagination>
            </div>

            <div className="flex items-center justify-start gap-4 xl:justify-end xl:gap-8">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Showing {startEntry}-{endEntry} of {totalRows} entries
              </div>
              <DialogClose asChild>
                <Button
                  className="px-8"
                >
                  Tutup
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
