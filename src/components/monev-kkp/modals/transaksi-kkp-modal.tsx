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

interface TransaksiKkpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdsatker: string;
  namaSatker?: string;
  tahun: string;
  triwulan: string;
}

interface TransaksiRow {
  kddept: string;
  nmdept: string;
  tg_sp2d: string;
  no_sp2d: string;
  nilai_sp2d: number;
  jns_kkp_prinsipal: string;
  jml_transaksi: number;
  kdakun: string;
  nmakun: string;
  nilai_akun: number;
}

interface Sp2dGroup {
  tg_sp2d: string;
  no_sp2d: string;
  nilai_sp2d: number;
  rows: TransaksiRow[];
}

const periodeLabels: Record<string, string> = {
  "1": "Triwulan 1 (Jan - Mar)",
  "2": "Triwulan 2 (Jan - Jun)",
  "3": "Triwulan 3 (Jan - Sep)",
  "4": "Triwulan 4 (Jan - Des)",
  "Q1": "Triwulan 1 (Jan - Mar)",
  "Q2": "Triwulan 2 (Jan - Jun)",
  "Q3": "Triwulan 3 (Jan - Sep)",
  "Q4": "Triwulan 4 (Jan - Des)",
};

export function TransaksiKkpModal({
  open,
  onOpenChange,
  kdsatker,
  namaSatker,
  tahun,
  triwulan,
}: TransaksiKkpModalProps) {
  const [data, setData] = useState<TransaksiRow[]>([]);
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
            `/monev-kkp/transaksi-kkp?kdsatker=${encodeURIComponent(kdsatker)}&tahun=${tahun}&triwulan=${triwulan}`,
          ),
          { credentials: "include" },
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (e) {
        console.error("Error fetching transaksi KKP:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    return () => clearTimeout(timer);
  }, [open, kdsatker, tahun, triwulan]);

  const formatRupiah = (value: number) =>
    Number(value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Group by no_sp2d preserving insertion order
  const groups: Sp2dGroup[] = [];
  const seen = new Map<string, Sp2dGroup>();
  for (const row of data) {
    if (!seen.has(row.no_sp2d)) {
      const group: Sp2dGroup = {
        tg_sp2d: row.tg_sp2d,
        no_sp2d: row.no_sp2d,
        nilai_sp2d: row.nilai_sp2d,
        rows: [],
      };
      groups.push(group);
      seen.set(row.no_sp2d, group);
    }
    seen.get(row.no_sp2d)!.rows.push(row);
  }

  // Footer totals
  const totalNilaiSp2d = groups.reduce(
    (sum, g) => sum + Number(g.nilai_sp2d),
    0,
  );
  const totalJmlTransaksi = data.reduce(
    (sum, r) => sum + Number(r.jml_transaksi),
    0,
  );
  const totalNilaiAkun = data.reduce((sum, r) => sum + Number(r.nilai_akun), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Detail Transaksi KKP</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
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
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Periode</span>
                  <Skeleton className="h-5 w-40 bg-muted-foreground/20 mt-1" />
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
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Periode</span>
                  <div className="font-medium mt-1">
                    {periodeLabels[triwulan] ?? `Triwulan ${triwulan}`} {tahun}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                {groups.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Tidak ada data transaksi.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            No.
                          </th>
                          <th
                            colSpan={3}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Nilai Transaksi (SP2D based)
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Jenis KKP (Prinsipal)
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Jumlah Transaksi (BAST based)
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Kode Akun
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Nama Akun
                          </th>
                          <th
                            rowSpan={2}
                            className="p-3 text-center whitespace-nowrap border-b border-border font-semibold"
                          >
                            Nilai (Rp)
                          </th>
                        </tr>
                        <tr>
                          <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                            Tanggal SP2D
                          </th>
                          <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                            No SP2D
                          </th>
                          <th className="p-3 text-center whitespace-nowrap border-b border-border font-semibold">
                            Nilai (Rp)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map((g, gi) =>
                          g.rows.map((row, ri) => (
                            <tr
                              key={`${g.no_sp2d}-${ri}`}
                              className="border-t hover:bg-muted/40 transition-colors"
                            >
                              {ri === 0 && (
                                <>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-3 text-center border-b border-border align-middle"
                                  >
                                    {gi + 1}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-3 text-center whitespace-nowrap border-b border-border align-middle"
                                  >
                                    {formatDate(g.tg_sp2d)}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-3 text-center whitespace-nowrap border-b border-border align-middle font-mono"
                                  >
                                    {g.no_sp2d}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-3 text-right font-mono border-b border-border align-middle pr-3"
                                  >
                                    Rp {formatRupiah(g.nilai_sp2d)}
                                  </td>
                                </>
                              )}
                              <td className="p-3 text-center whitespace-nowrap border-b border-border">
                                {row.jns_kkp_prinsipal}
                              </td>
                              <td className="p-3 text-center border-b border-border">
                                {row.jml_transaksi}
                              </td>
                              <td className="p-3 text-center border-b border-border font-mono">
                                {row.kdakun}
                              </td>
                              <td
                                className="p-3 text-left border-b border-border max-w-[200px] truncate"
                                title={row.nmakun}
                              >
                                {row.nmakun}
                              </td>
                              <td className="p-3 text-right font-mono border-b border-border pr-3">
                                Rp {formatRupiah(row.nilai_akun)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="bg-muted font-semibold">
                        <tr>
                          <td
                            colSpan={2}
                            className="p-3 border-t border-border"
                          />
                          <td className="p-3 text-center border-t border-border">
                            Total
                          </td>
                          <td className="p-3 text-right font-mono border-t border-border pr-3">
                            Rp {formatRupiah(totalNilaiSp2d)}
                          </td>
                          <td className="p-3 border-t border-border" />
                          <td className="p-3 text-center border-t border-border">
                            {totalJmlTransaksi}
                          </td>
                          <td
                            colSpan={2}
                            className="p-3 border-t border-border"
                          />
                          <td className="p-3 text-right font-mono border-t border-border pr-3">
                            Rp {formatRupiah(totalNilaiAkun)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
