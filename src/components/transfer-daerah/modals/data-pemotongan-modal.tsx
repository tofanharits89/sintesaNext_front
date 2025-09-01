"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKmkPemotongan } from "@/hooks/use-kmk-pemotongan";
import { ConfirmationModals } from "@/components/ui/confirmation-modal";
import { Trash2 } from "lucide-react";

interface DataPemotonganModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
}

export function DataPemotonganModal({
  open,
  onOpenChange,
  data,
}: DataPemotonganModalProps) {
  const no_kmk: string | undefined = (data?.no_kmk ??
    data?.nokmk ??
    data?.noKmk ??
    data?.nomorKmk) as string | undefined;

  const { rows, isLoading, error } = useKmkPemotongan(no_kmk, open);

  const handleDelete = async (item: any) => {
    // TODO: Wire up actual delete API for pemotongan item
    console.log("Deleting pemotongan item:", item);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r: any) =>
        (r?.uraian || "").toLowerCase().includes(q) ||
        (r?.nmpemda || "").toLowerCase().includes(q) ||
        (r?.nmkppn || "").toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[1200px] h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Data Pemotongan - {no_kmk || "-"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3">
          {!no_kmk ? (
            <div className="p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md">
              Data KMK terpilih tidak memiliki parameter lengkap untuk memuat
              data.
              {!no_kmk && <span className="ml-1">Missing: no_kmk.</span>}
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-600">
              {String((error as any)?.message || error)}
            </div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">
              Memuat data pemotongan...
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Input
                  placeholder="Cari uraian/pemda/kppn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="border rounded-lg h-full flex flex-col overflow-hidden">
                <div className="flex-1 w-full overflow-auto">
                  <div className="min-w-full">
                    <table className="w-full min-w-max text-xs">
                      <thead className="bg-muted sticky top-0 z-30">
                        <tr>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            No
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Tahun
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Bulan
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Nomor KMK
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            KPPN
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Kab/Kota
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Akun
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Satker
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Lokasi
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Kriteria
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Nilai
                          </th>
                          <th className="p-2 text-center whitespace-nowrap text-xs">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length ? (
                          filtered.map((r: any, idx: number) => (
                            <tr
                              key={r.id ?? `${r.no_kmk}-${idx}`}
                              className="border-t"
                            >
                              <td className="p-2 text-center text-xs">
                                {idx + 1}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.thang}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.nmbulan ?? r.bulan}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.no_kmk}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.nmkppn}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.nmpemda}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.kdakun}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.kdsatker}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.kdlokasi}
                              </td>
                              <td className="p-2 text-center text-xs">
                                {r.kriteria}
                              </td>
                              <td className="p-2 text-right font-mono text-xs">
                                {Number(r.nilai ?? 0).toLocaleString("id-ID", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="p-2 text-center text-xs">
                                <ConfirmationModals.Delete
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  }
                                  itemName={`pemotongan ${r?.nmpemda || ""}`}
                                  onConfirm={() => handleDelete(r)}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={12}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Tidak ada data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex items-center justify-end">
          <Button
            variant="destructive"
            className="w-24"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
