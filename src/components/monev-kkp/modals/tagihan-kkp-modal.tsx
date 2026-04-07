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

interface TagihanKkpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdsatker: string;
  namaSatker?: string;
  tahun: string;
  triwulan: string;
}

interface TagihanRow {
  tahun: string;
  bulan: string;
  triwulan: string;
  kdsatker: string;
  nmsatker: string;
  kddept: string;
  nmdept: string;
  kdkppn: string;
  nmkppn: string;
  kdkanwil: string;
  nmkanwil: string;
  nmbank: string;
  no_kartu: string;
  nilai_tagihan: number;
}

const periodeLabels: Record<string, string> = {
  "1": "Triwulan 1 (Jan - Mar)",
  "2": "Triwulan 2 (Apr - Jun)",
  "3": "Triwulan 3 (Jul - Sep)",
  "4": "Triwulan 4 (Okt - Des)",
};

const bulanNames: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
};

export function TagihanKkpModal({
  open,
  onOpenChange,
  kdsatker,
  namaSatker,
  tahun,
  triwulan,
}: TagihanKkpModalProps) {
  const [data, setData] = useState<TagihanRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !kdsatker) return;
    setData([]);
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          apiPath(
            `/monev-kkp/tagihan-kkp?kdsatker=${encodeURIComponent(kdsatker)}&tahun=${tahun}&triwulan=${triwulan}`,
          ),
          { credentials: "include" },
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (e) {
        console.error("Error fetching tagihan KKP:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [open, kdsatker, tahun, triwulan]);

  const formatRupiah = (value: number) =>
    Number(value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const formatBulan = (tahunVal: string, bulanVal: string) => {
    const name = bulanNames[String(bulanVal).padStart(2, "0")] ?? bulanVal;
    return `${name} ${tahunVal}`;
  };

  const totalNilaiTagihan = data.reduce(
    (sum, r) => sum + Number(r.nilai_tagihan),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] md:max-w-[900px] h-[80vh] flex flex-col overflow-hidden w-[95vw] sm:max-w-3xl max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Detail Tagihan KKP</DialogTitle>
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
              <span className="text-muted-foreground">Periode:</span>
              <span className="font-medium">
                {periodeLabels[triwulan] ?? `Triwulan ${triwulan}`} {tahun}
              </span>
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
                          Tanggal Cetak Tagihan
                        </th>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          Nilai Tagihan (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Tidak ada data tagihan.
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
                            <td className="p-2 text-left font-mono border border-border">
                              {row.no_kartu}
                            </td>
                            <td className="p-2 text-center border border-border">
                              {formatBulan(row.tahun, row.bulan)}
                            </td>
                            <td className="p-2 text-right font-mono border border-border pr-2">
                              Rp {formatRupiah(row.nilai_tagihan)}
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
                          <td className="p-2 text-center border border-border">
                            Total
                          </td>
                          <td className="p-2 text-right font-mono border border-border pr-2">
                            Rp {formatRupiah(totalNilaiTagihan)}
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
