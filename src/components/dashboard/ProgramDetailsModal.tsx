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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh] flex flex-col overflow-hidden [&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle>{programName}</DialogTitle>
          <DialogDescription>
            Detail Sub-Output Program
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {aggregated.length === 0 ? (
            <div className="rounded-lg border border-muted bg-muted/10 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada data sub-output untuk program ini.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="w-40 text-center">Kode Sub-Output</TableHead>
                    <TableHead className="text-center">Nama Sub-Output</TableHead>
                    <TableHead className="text-center w-32">Volume Output</TableHead>
                    <TableHead className="text-center w-32">Realisasi Fisik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregated.map((item, idx) => (
                    <TableRow key={item.kdsoutput ?? `${item.nmsoutput}-${idx}`}>
                      <TableCell className="font-medium text-center">{idx + 1}</TableCell>
                      <TableCell className="text-center">{item.kdsoutput}</TableCell>
                      <TableCell>{item.nmsoutput}</TableCell>
                      <TableCell className="text-right">
                        {item.vol.toLocaleString("id-ID", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.realisasiFisik.toLocaleString("id-ID", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Tutup</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
