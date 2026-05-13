"use client";

import { useMemo, useState } from "react";
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
import { ColumnDef } from "@tanstack/react-table";

interface BreakdownItem {
  category: string;
  value: number;
}

interface QuickStatBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: BreakdownItem[];
}

export function QuickStatBreakdownModal({
  open,
  onOpenChange,
  title,
  data,
}: QuickStatBreakdownModalProps) {
  const columns: ColumnDef<BreakdownItem>[] = useMemo(() => [
    {
      id: "no",
      header: () => <div className="text-center font-bold">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "category",
      header: () => <div className="text-left font-bold">Kategori Kelompok Manfaat</div>,
      cell: ({ row }) => (
        <div className="text-left font-mono uppercase font-medium">
          {row.getValue("category")}
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: () => <div className="text-right font-bold pr-4">Jumlah Aggregate</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono font-bold pr-4 text-blue-600 dark:text-blue-400">
          {Number(row.getValue("value")).toLocaleString("id-ID")}
        </div>
      ),
    },
  ], []);

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
            searchKey="category"
            searchPlaceholder="Cari kategori..."
            initialPageSize={10}
          />
        </div>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/5">
          <DialogClose asChild>
            <Button
              variant="destructive"
              className="px-8"
            >
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
