"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKmkPencabutan } from "@/hooks/use-kmk-pencabutan";

interface DataPencabutanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noKmk?: string;
}

export function DataPencabutanModal({ open, onOpenChange, noKmk }: DataPencabutanModalProps) {
  const { rows, isLoading, error } = useKmkPencabutan(noKmk);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[1200px] h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Data Pencabutan - {noKmk || "-"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3">
          {error ? (
            <div className="p-3 text-sm text-red-600">{String((error as any).message || error)}</div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Memuat data pencabutan...</div>
          ) : rows.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Tidak ada data.</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 border">No</th>
                    <th className="px-2 py-1 border">No KMK</th>
                    <th className="px-2 py-1 border">Tgl KMK</th>
                    <th className="px-2 py-1 border">No KMK Cabut</th>
                    <th className="px-2 py-1 border">Tgl Cabut</th>
                    <th className="px-2 py-1 border">Jenis</th>
                    <th className="px-2 py-1 border">Kriteria</th>
                    <th className="px-2 py-1 border">KPPN</th>
                    <th className="px-2 py-1 border">Pemda</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.no_kmk}-${r.kdkppn}-${r.kdpemda}-${i}`} className="hover:bg-muted/50">
                      <td className="px-2 py-1 border text-center">{i + 1}</td>
                      <td className="px-2 py-1 border">{r.no_kmk}</td>
                      <td className="px-2 py-1 border text-center">{r.tgl_kmk ? new Date(r.tgl_kmk).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-2 py-1 border">{r.no_kmkcabut || "-"}</td>
                      <td className="px-2 py-1 border text-center">{r.tglcabut ? new Date(r.tglcabut).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-2 py-1 border">{r.nmjenis || "-"}</td>
                      <td className="px-2 py-1 border">{r.nm_kriteria || "-"}</td>
                      <td className="px-2 py-1 border">{r.kdkppn} - {r.nmkppn}</td>
                      <td className="px-2 py-1 border">{r.kdpemda} - {r.nmpemda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="destructive" className="w-24" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
