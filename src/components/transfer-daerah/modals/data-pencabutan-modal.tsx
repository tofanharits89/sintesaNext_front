"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { useKmkPencabutan } from "@/hooks/use-kmk-pencabutan";
import { useMemo } from "react";
import tkdData from "@/data/kdkppn_tkd.json";

interface DataPencabutanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noKmk?: string;
  kdkanwil?: string | undefined;
  kdkppn?: string | undefined;
}

export function DataPencabutanModal({ open, onOpenChange, noKmk, kdkanwil, kdkppn }: DataPencabutanModalProps) {
  const { rows: rawRows, isLoading, error } = useKmkPencabutan(noKmk, kdkanwil, kdkppn);

  // Client-side filter fallback for Kanwil/KPPN users
  const rows = useMemo(() => {
    if (!rawRows) return [];
    
    // If KPPN user, filter strictly by kdkppn
    if (kdkppn) {
      const targetKppn = String(kdkppn).trim().padStart(3, '0');
      return rawRows.filter(r => String(r.kdkppn || "").trim().padStart(3, '0') === targetKppn);
    }

    // If Kanwil user, filter by KPPNs belonging to that Kanwil
    if (kdkanwil) {
      const targetKanwil = String(kdkanwil).trim().padStart(2, '0');
      const kppnsInKanwil = new Set(
        (tkdData as any[])
          .filter((d) => String(d.kdkanwil || "").trim().padStart(2, '0') === targetKanwil)
          .map((d) => String(d.kdkppn || "").trim().padStart(3, '0'))
      );
      return rawRows.filter(r => kppnsInKanwil.has(String(r.kdkppn || "").trim().padStart(3, '0')));
    }

    return rawRows;
  }, [rawRows, kdkanwil, kdkppn]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Data Pencabutan - {noKmk || "-"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 py-3">
          {error ? (
            <div className="p-3 text-sm text-red-600">{String((error as any).message || error)}</div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Memuat data pencabutan...</div>
          ) : rows.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Tidak ada data.</div>
          ) : (
            <div className="border rounded-lg h-full flex flex-col overflow-hidden">
              <div className="flex-1 w-full overflow-auto">
                <div className="min-w-full">
                  <table className="w-full min-w-max text-xs">
                    <thead className="bg-muted sticky top-0 z-30">
                      <tr>
                        <th className="p-2 text-center whitespace-nowrap text-xs">No</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">No KMK</th>
                        <th className="p-2 text-center whitespace-nowrap text-xs">Tgl KMK</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">No KMK Cabut</th>
                        <th className="p-2 text-center whitespace-nowrap text-xs">Tgl Cabut</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Jenis</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Kriteria</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">KPPN</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Pemda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={`${r.no_kmk}-${r.kdkppn}-${r.kdpemda}-${i}`} className="border-t">
                          <td className="p-2 text-center whitespace-nowrap text-xs">{i + 1}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.no_kmk}</td>
                          <td className="p-2 text-center whitespace-nowrap text-xs">{r.tgl_kmk ? new Date(r.tgl_kmk).toLocaleDateString("id-ID") : "-"}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.no_kmkcabut || "-"}</td>
                          <td className="p-2 text-center whitespace-nowrap text-xs">{r.tglcabut ? new Date(r.tglcabut).toLocaleDateString("id-ID") : "-"}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.nmjenis || "-"}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.nm_kriteria || "-"}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.kdkppn} - {r.nmkppn}</td>
                          <td className="p-2 whitespace-nowrap text-xs">{r.kdpemda} - {r.nmpemda}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="destructive" className="w-24" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
