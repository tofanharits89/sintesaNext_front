"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useDauRekapBulanan } from "@/hooks/use-dau-rekap-bulanan";
import { useDauRekapBulananPerAkun } from "@/hooks/use-dau-rekap-bulanan-per-akun";
import { useDauPenundaanCabutByPemda } from "@/hooks/use-dau-penundaan-cabut-by-pemda";
import { useDauRekapByPemda } from "@/hooks/use-dau-rekap-by-pemda";

interface KertasKerjaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

// Thousand-separator without currency prefix
const fmt = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return v ?? "";
  return n.toLocaleString("id-ID");
};

function RekapBulananTable({ rows, perAkunRows }: { rows: any[]; perAkunRows: any[] }) {
  const safe = (v: any) => (v === null || v === undefined ? "" : v);

  // Build a lookup: kdpemda+bulan+thang → [{ kdakun, nilai }]
  const akunMap = new Map<string, { kdakun: string; nilai: number }[]>();
  for (const a of perAkunRows) {
    const key = `${String(a.kdpemda).trim()}|${String(a.bulan).trim()}|${String(a.thang).trim()}`;
    if (!akunMap.has(key)) akunMap.set(key, []);
    akunMap.get(key)!.push({ kdakun: String(a.kdakun).trim(), nilai: Number(a.nilai) });
  }

  // Expand rekap rows — one sub-row per akun, or one row with "-" when no detail exists
  const expanded: { rekap: any; kdakun: string; nilai: number; isFirst: boolean; rowSpan: number }[] = [];
  for (const r of (rows ?? [])) {
    const key = `${String(r.kdpemda ?? "").trim()}|${String(r.bulan ?? "").trim()}|${String(r.thang ?? "").trim()}`;
    const akunList = akunMap.get(key);
    if (akunList && akunList.length > 0) {
      akunList.forEach((a, idx) => {
        expanded.push({ rekap: r, kdakun: a.kdakun, nilai: a.nilai, isFirst: idx === 0, rowSpan: akunList.length });
      });
    } else {
      expanded.push({ rekap: r, kdakun: "-", nilai: Number(r.potongan ?? 0), isFirst: true, rowSpan: 1 });
    }
  }

  // Grand total of nilai potongan across all expanded rows
  const grandTotal = expanded.reduce((sum, e) => sum + e.nilai, 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Thang</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Kdpemda - Nmpemda</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Pagu</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Alokasi Bulan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Tunda</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Cabut</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Akun Potongan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Nilai Potongan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Salur</th>
            </tr>
          </thead>
          <tbody>
            {expanded.length ? (
              expanded.map((e, i) => (
                <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                  {e.isFirst && (
                    <>
                      <td className="p-2 text-center border-b border-border" rowSpan={e.rowSpan}>{safe(e.rekap?.thang)}</td>
                      <td className="p-2 text-left border-b border-border" rowSpan={e.rowSpan}>{`${safe(e.rekap?.kdpemda)} - ${safe(e.rekap?.nmpemda)}`}</td>
                      <td className="p-2 text-right border-b border-border font-mono" rowSpan={e.rowSpan}>{fmt(e.rekap?.pagu)}</td>
                      <td className="p-2 text-right border-b border-border font-mono" rowSpan={e.rowSpan}>{fmt(e.rekap?.alokasi_bulan)}</td>
                      <td className="p-2 text-right border-b border-border font-mono" rowSpan={e.rowSpan}>{fmt(e.rekap?.tunda)}</td>
                      <td className="p-2 text-right border-b border-border font-mono" rowSpan={e.rowSpan}>{fmt(e.rekap?.cabut)}</td>
                    </>
                  )}
                  <td className="p-2 text-center border-b border-border font-mono">{e.kdakun}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(e.nilai)}</td>
                  {e.isFirst && (
                    <td className="p-2 text-right border-b border-border font-mono" rowSpan={e.rowSpan}>{fmt(e.rekap?.salur)}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted-foreground border-b border-border">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
          {expanded.length > 0 && (
            <tfoot className="bg-muted">
              <tr className="font-semibold">
                <td colSpan={7} className="p-2 text-right border-t-2 border-border">Total Nilai Potongan</td>
                <td className="p-2 text-right border-t-2 border-border font-mono">{fmt(grandTotal)}</td>
                <td className="p-2 border-t-2 border-border" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function PenundaanCabutTable({ rows }: { rows: any[] }) {
  const safe = (v: any) => (v === null || v === undefined ? "" : v);
  const months = ["jan", "peb", "mar", "apr", "mei", "jun", "jul", "ags", "sep", "okt", "nov", "des"] as const;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">No</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">No KMK</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">KMK Cabut</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Nm Kriteria</th>
              {months.map((m) => (
                <th key={m} className="p-2 text-center whitespace-nowrap border-b border-border font-semibold uppercase">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                  <td className="p-2 text-center border-b border-border">{i + 1}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.no_kmk)}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.kmk_cabut)}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.nm_kriteria)}</td>
                  {months.map((m) => (
                    <td key={m} className="p-2 text-right border-b border-border font-mono">{fmt(r?.[m])}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={16} className="text-center py-8 text-muted-foreground border-b border-border">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RekapByPemdaTable({ rows }: { rows: any[] }) {
  const safe = (v: any) => (v === null || v === undefined ? "" : v);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">No</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Thang</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Nmbulan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Nmkppn</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Nmpemda</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Pagu</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Alokasi Bulan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Tunda</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Cabut</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Potongan</th>
              <th className="p-2 text-center whitespace-nowrap border-b border-border font-semibold">Salur</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                  <td className="p-2 text-center border-b border-border">{i + 1}</td>
                  <td className="p-2 text-center border-b border-border">{safe(r?.thang)}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.nmbulan)}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.nmkppn)}</td>
                  <td className="p-2 text-left border-b border-border">{safe(r?.nmpemda)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.pagu)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.alokasi_bulan)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.tunda)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.cabut)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.potongan)}</td>
                  <td className="p-2 text-right border-b border-border font-mono">{fmt(r?.salur)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="text-center py-8 text-muted-foreground border-b border-border">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KertasKerjaModal({ open, onOpenChange, data }: KertasKerjaModalProps) {
  // Derive parameters robustly from the selected row
  const kdpemda: string | undefined = (data?.kdpemdaCode as string | undefined)
    || (typeof data?.kdpemda === "string" ? data.kdpemda.trim() : undefined)
    || (typeof data?.kabkota === "string" ? String(data.kabkota).split(" - ")[0]?.trim() : undefined)
    || (typeof data?.KDPEMDA === "string" ? data.KDPEMDA.trim() : undefined)
    || (typeof data?.ID === "string" ? data.ID.trim() : undefined);

  
  const bulan: number | undefined = (typeof data?.bulanNum === "number" ? data.bulanNum : undefined)
    ?? (typeof data?.BULAN === "number" ? data.BULAN : undefined)
    ?? (typeof data?.bulan === "string"
      ? [
          "Januari","Februari","Maret","April","Mei","Juni",
          "Juli","Agustus","September","Oktober","November","Desember",
        ].indexOf(data.bulan) + 1 || undefined
      : undefined);

  // Only proceed if we have valid kdpemda
  const isValidKdpemda = kdpemda && kdpemda !== "undefined" && kdpemda.trim() !== "";

  // Queries
  // Build params objects conditionally to satisfy exactOptionalPropertyTypes
  const rekapBulananParams: { kdpemda?: string; bulan?: string | number; thang?: string | number } = {};
  if (isValidKdpemda) rekapBulananParams.kdpemda = kdpemda;
  if (bulan !== undefined) rekapBulananParams.bulan = bulan;
  if (data?.tahun) rekapBulananParams.thang = data.tahun;

  const byPemdaParams: { kdpemda?: string; thang?: string | number } = {};
  if (isValidKdpemda) byPemdaParams.kdpemda = kdpemda;
  if (data?.tahun) byPemdaParams.thang = data.tahun;

  const rekapBulanan = useDauRekapBulanan(rekapBulananParams);
  const rekapBulananPerAkun = useDauRekapBulananPerAkun(rekapBulananParams);
  const penundaanCabut = useDauPenundaanCabutByPemda(byPemdaParams);
  const rekapByPemda = useDauRekapByPemda(byPemdaParams);

  // Show error if kdpemda is invalid
  if (!isValidKdpemda) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Error - Data Tidak Valid
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-medium">Tidak dapat menampilkan Kertas Kerja</p>
              <p className="mt-1">Kode Pemda (kdpemda) tidak valid atau tidak ditemukan dalam data yang dipilih.</p>
              <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                Debug info: kdpemda = {String(kdpemda || "undefined")}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kertas Kerja - {data?.kppn} • {data?.kabkota} • {data?.bulan} {data?.tahun}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rekap Bulanan (Pemda & Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              {rekapBulanan.isLoading ? (
                <div className="text-sm text-muted-foreground">Memuat data...</div>
              ) : rekapBulanan.error ? (
                <div className="text-sm text-red-600">{String(rekapBulanan.error.message || rekapBulanan.error)}</div>
              ) : (
                <>
                  <RekapBulananTable rows={rekapBulanan.rows} perAkunRows={rekapBulananPerAkun.rows} />
                  {!rekapBulanan.rows?.length && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Parameter: kdpemda=<span className="font-mono">{String(kdpemda || "-")}</span>, bulan=
                      <span className="font-mono">{String(bulan || "-")}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Penundaan & Pencabutan (Pemda)</CardTitle>
            </CardHeader>
            <CardContent>
              {penundaanCabut.isLoading ? (
                <div className="text-sm text-muted-foreground">Memuat data...</div>
              ) : penundaanCabut.error ? (
                <div className="text-sm text-red-600">{String(penundaanCabut.error.message || penundaanCabut.error)}</div>
              ) : (
                <PenundaanCabutTable rows={penundaanCabut.rows} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rekap Penyaluran (Semua Bulan Pemda)</CardTitle>
            </CardHeader>
            <CardContent>
              {rekapByPemda.isLoading ? (
                <div className="text-sm text-muted-foreground">Memuat data...</div>
              ) : rekapByPemda.error ? (
                <div className="text-sm text-red-600">{String(rekapByPemda.error.message || rekapByPemda.error)}</div>
              ) : (
                <RekapByPemdaTable rows={rekapByPemda.rows} />
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
