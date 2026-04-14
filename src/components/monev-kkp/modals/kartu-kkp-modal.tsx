"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [isMountedReady, setIsMountedReady] = useState(false);

  useEffect(() => {
    if (!open || !kdsatker) return;
    
    // Delay to allow dialog animation to complete
    const timer = setTimeout(() => {
      setIsMountedReady(true);
    }, 300);

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

    return () => clearTimeout(timer);
  }, [open, kdsatker, tahun]);

  const formatRupiah = (value: number) =>
    Number(value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const totalLimit = data.reduce((sum, r) => sum + Number(r.nilai_limit), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Detail Kartu KKP</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-2">
            {/* Skeleton for Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-primary/5 p-4 rounded-lg">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold">Kementerian/Lembaga</span>
                <Skeleton className="h-5 w-48 bg-muted-foreground/20 mt-1" />
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold">Satuan Kerja</span>
                <Skeleton className="h-5 w-64 bg-muted-foreground/20 mt-1" />
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold">Tahun</span>
                <Skeleton className="h-5 w-24 bg-muted-foreground/20 mt-1" />
              </div>
            </div>

            {/* Skeleton for Table */}
            <div className="border rounded-lg p-8">
              <div className="space-y-3">
                <Skeleton className="h-8 w-full bg-muted-foreground/10" />
                <Skeleton className="h-8 w-full bg-muted-foreground/10" />
                <Skeleton className="h-8 w-full bg-muted-foreground/10" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Info section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-primary/5 p-4 rounded-lg">
              {data[0] && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Kementerian/Lembaga</span>
                  <div className="font-medium mt-1">
                    {data[0].kddept} – {data[0].nmdept}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold">Satuan Kerja</span>
                <div className="font-medium mt-1">
                  {kdsatker}
                  {namaSatker ? ` – ${namaSatker}` : ""}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold">Tahun</span>
                <div className="font-medium mt-1">{tahun}</div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              {data.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  Tidak ada data kartu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                          No.
                        </th>
                        <th className="p-3 text-left whitespace-nowrap border-b border-border font-semibold">
                          Nomor KKP
                        </th>
                        <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                          Jenis KKP (Belanja)
                        </th>
                        <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                          Jenis KKP (Prinsipal)
                        </th>
                        <th className="p-3 text-right whitespace-nowrap border-b border-border font-semibold">
                          Limit KKP (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr
                          key={`${row.no_kartu}-${idx}`}
                          className="border-t hover:bg-muted/40 transition-colors"
                        >
                          <td className="p-3 text-center border-b border-border">
                            {idx + 1}
                          </td>
                          <td className="p-3 text-left border-b border-border">
                            <div className="font-mono font-medium">{row.no_kartu}</div>
                            <div className="text-muted-foreground text-[11px] mt-0.5">
                              {row.bank_penerbit}
                            </div>
                          </td>
                          <td className="p-3 text-center border-b border-border">
                            {row.jns_kkp_belanja}
                          </td>
                          <td className="p-3 text-center border-b border-border">
                            {row.jns_kkp_prinsipal}
                          </td>
                          <td className="p-3 text-right font-mono border-b border-border pr-3">
                            Rp {formatRupiah(row.nilai_limit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-semibold">
                      <tr>
                        <td className="p-3 border-t border-border" />
                        <td className="p-3 border-t border-border" />
                        <td className="p-3 border-t border-border" />
                        <td className="p-3 text-center border-t border-border">
                          Total
                        </td>
                        <td className="p-3 text-right font-mono border-t border-border pr-3">
                          Rp {formatRupiah(totalLimit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
