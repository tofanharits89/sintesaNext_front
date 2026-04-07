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
  "2": "Triwulan 2 (Apr - Jun)",
  "3": "Triwulan 3 (Jul - Sep)",
  "4": "Triwulan 4 (Okt - Des)",
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

  useEffect(() => {
    if (!open || !kdsatker) return;
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
        className="max-w-[95vw] md:max-w-[1200px] h-[85vh] flex flex-col overflow-hidden w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Detail Transaksi KKP</DialogTitle>
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
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          No.
                        </th>
                        <th
                          colSpan={3}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Nilai Transaksi (SP2D based)
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Jenis KKP (Prinsipal)
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Jumlah Transaksi (BAST based)
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Kode Akun
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Nama Akun
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 text-center whitespace-nowrap border border-border"
                        >
                          Nilai (Rp)
                        </th>
                      </tr>
                      <tr>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          Tanggal SP2D
                        </th>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          No SP2D
                        </th>
                        <th className="p-2 text-center whitespace-nowrap border border-border">
                          Nilai (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Tidak ada data transaksi.
                          </td>
                        </tr>
                      ) : (
                        groups.map((g, gi) =>
                          g.rows.map((row, ri) => (
                            <tr
                              key={`${g.no_sp2d}-${ri}`}
                              className="border-t hover:bg-muted/40"
                            >
                              {ri === 0 && (
                                <>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-2 text-center border border-border align-middle"
                                  >
                                    {gi + 1}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-2 text-center whitespace-nowrap border border-border align-middle"
                                  >
                                    {formatDate(g.tg_sp2d)}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-2 text-center whitespace-nowrap border border-border align-middle font-mono"
                                  >
                                    {g.no_sp2d}
                                  </td>
                                  <td
                                    rowSpan={g.rows.length}
                                    className="p-2 text-right font-mono border border-border align-middle pr-2"
                                  >
                                    Rp {formatRupiah(g.nilai_sp2d)}
                                  </td>
                                </>
                              )}
                              <td className="p-2 text-center whitespace-nowrap border border-border">
                                {row.jns_kkp_prinsipal}
                              </td>
                              <td className="p-2 text-center border border-border">
                                {row.jml_transaksi}
                              </td>
                              <td className="p-2 text-center border border-border font-mono">
                                {row.kdakun}
                              </td>
                              <td
                                className="p-2 text-left border border-border max-w-[200px] truncate"
                                title={row.nmakun}
                              >
                                {row.nmakun}
                              </td>
                              <td className="p-2 text-right font-mono border border-border pr-2">
                                Rp {formatRupiah(row.nilai_akun)}
                              </td>
                            </tr>
                          )),
                        )
                      )}
                    </tbody>
                    {groups.length > 0 && (
                      <tfoot className="bg-muted font-semibold sticky bottom-0">
                        <tr>
                          <td
                            colSpan={2}
                            className="p-2 border border-border"
                          />
                          <td className="p-2 text-center border border-border">
                            Total
                          </td>
                          <td className="p-2 text-right font-mono border border-border pr-2">
                            Rp {formatRupiah(totalNilaiSp2d)}
                          </td>
                          <td className="p-2 border border-border" />
                          <td className="p-2 text-center border border-border">
                            {totalJmlTransaksi}
                          </td>
                          <td
                            colSpan={2}
                            className="p-2 border border-border"
                          />
                          <td className="p-2 text-right font-mono border border-border pr-2">
                            Rp {formatRupiah(totalNilaiAkun)}
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
