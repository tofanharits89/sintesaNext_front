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
        <DialogFooter>
          <Button variant="destructive" className="w-24" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
