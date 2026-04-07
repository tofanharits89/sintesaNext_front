"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";

interface KartuKkpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdsatker: string;
  namaSatker?: string;
  tahun: string;
}

interface KartuRow {
  no_kartu: string;
  bank_penerbit: string;
  jns_kkp_belanja: string;
  jns_kkp_prinsipal: string;
  kddept: string;
  nmdept: string;
  kdsatker: string;
  nmsatker: string;
  nilai_limit: number;
}

export function KartuKkpModal({
  open,
  onOpenChange,
  kdsatker,
  namaSatker,
  tahun,
}: KartuKkpModalProps) {
  const [data, setData] = useState<KartuRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !kdsatker) return;
    setData([]);
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          apiPath(
            `/monev-kkp/kartu-kkp?kdsatker=${encodeURIComponent(kdsatker)}&tahun=${tahun}`,
          ),
          { credentials: "include" },
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (e) {
        console.error("Error fetching kartu KKP:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [open, kdsatker, tahun]);

  const formatRupiah = (value: number) =>
    Number(value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const totalLimit = data.reduce((sum, r) => sum + Number(r.nilai_limit), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] md:max-w-[900px] h-[80vh] flex flex-col overflow-hidden w-[95vw] sm:max-w-3xl max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Detail Kartu KKP</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3">
          {/* Info section */}
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
            {data[0] && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">K/L:</span>
                <span className="font-medium">
                  {data[0].kddept} – {data[0].nmdept}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Satker:</span>
              <span className="font-medium">
                {kdsatker}
                {namaSatker ? ` – ${namaSatker}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tahun:</span>
              <span className="font-medium">{tahun}</span>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg flex-1 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex-1 w-full overflow-auto">
                <div className="min-w-full">
                  <table className="w-full min-w-max text-xs border-collapse">
                    <thead className="bg-muted sticky top-0 z-30">
                      <tr>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          No.
                        </th>
                        <th className="p-2 text-left whitespace-nowrap border border-border">
                          Nomor KKP
                        </th>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          Jenis KKP (Belanja)
                        </th>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          Jenis KKP (Prinsipal)
                        </th>
                        <th className="p-2 text-right whitespace-nowrap border border-border">
                          Limit KKP (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Tidak ada data kartu.
                          </td>
                        </tr>
                      ) : (
                        data.map((row, idx) => (
                          <tr
                            key={`${row.no_kartu}-${idx}`}
                            className="border-t hover:bg-muted/40"
                          >
                            <td className="p-2 text-center border border-border">
                              {idx + 1}
                            </td>
                            <td className="p-2 text-left border border-border">
                              <div className="font-mono">{row.no_kartu}</div>
                              <div className="text-muted-foreground text-[11px]">
                                {row.bank_penerbit}
                              </div>
                            </td>
                            <td className="p-2 text-center border border-border">
                              {row.jns_kkp_belanja}
                            </td>
                            <td className="p-2 text-center border border-border">
                              {row.jns_kkp_prinsipal}
                            </td>
                            <td className="p-2 text-right font-mono border border-border pr-2">
                              Rp {formatRupiah(row.nilai_limit)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {data.length > 0 && (
                      <tfoot className="bg-muted font-semibold sticky bottom-0">
                        <tr>
                          <td className="p-2 border border-border" />
                          <td className="p-2 border border-border" />
                          <td className="p-2 border border-border" />
                          <td className="p-2 text-center border border-border">
                            Total
                          </td>
                          <td className="p-2 text-right font-mono border border-border pr-2">
                            Rp {formatRupiah(totalLimit)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
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
