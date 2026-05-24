"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

interface SubOutputItem {
  no: number;
  nmsoutput: string;
  kdsoutput: string;
  vol: number;
  realisasiFisik: number;
}

interface ProgramDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  subOutputs: SubOutputItem[];
}

export function ProgramDetailsModal({
  open,
  onOpenChange,
  programName,
  subOutputs,
}: ProgramDetailsModalProps) {
  console.log(`Modal for ${programName}: received ${subOutputs?.length || 0} sub-outputs`, subOutputs);
  
  const aggregated = useMemo(() => {
    const map = new Map<string, { kdsoutput: string; nmsoutput: string; vol: number; realisasiFisik: number }>();
    for (const item of subOutputs || []) {
      const key = item.kdsoutput || `${item.nmsoutput}`;
      const prev = map.get(key);
      if (prev) {
        prev.vol += Number(item.vol) || 0;
        prev.realisasiFisik += Number(item.realisasiFisik) || 0;
      } else {
        map.set(key, {
          kdsoutput: item.kdsoutput,
          nmsoutput: item.nmsoutput,
          vol: Number(item.vol) || 0,
          realisasiFisik: Number(item.realisasiFisik) || 0,
        });
      }
    }
    return Array.from(map.values());
  }, [subOutputs]);

  const columns = useMemo<ColumnDef<typeof aggregated[number]>[]>(() => [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "kdsoutput",
      header: () => <div className="text-center font-medium">Kode Sub-Output</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdsoutput")}</div>,
    },
    {
      accessorKey: "nmsoutput",
      header: () => <div className="text-left font-medium">Nama Sub-Output</div>,
      cell: ({ row }) => <div className="text-left">{row.getValue("nmsoutput")}</div>,
      footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
    },
    {
      accessorKey: "vol",
      header: () => <div className="text-center font-medium">Volume Output</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {Number(row.getValue("vol")).toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce(
            (sum, row) => sum + (Number(row.getValue("vol")) || 0),
            0
          );
        return (
          <div className="text-right font-mono tabular-nums pr-2 font-bold text-black dark:text-white">
            {total.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "realisasiFisik",
      header: () => <div className="text-center font-medium">Realisasi Fisik</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {Number(row.getValue("realisasiFisik")).toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
      footer: ({ table }) => {
        const total = table
          .getFilteredRowModel()
          .rows.reduce(
            (sum, row) => sum + (Number(row.getValue("realisasiFisik")) || 0),
            0
          );
        return (
          <div className="text-right font-mono tabular-nums pr-2 font-bold text-black dark:text-white">
            {total.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
  ], []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{programName}</DialogTitle>
          <DialogDescription>
            Detail Sub-Output Program
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {aggregated.length === 0 ? (
            <div className="rounded-lg border border-muted bg-muted/10 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada data sub-output untuk program ini.
              </p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={aggregated} 
              initialPageSize={10} 
              showFooter={true}
            />
          )}
        </div>

        <DialogFooter className="p-6 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Tutup</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
