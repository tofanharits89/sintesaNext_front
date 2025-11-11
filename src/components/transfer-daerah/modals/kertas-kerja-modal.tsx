"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useDauRekapBulanan } from "@/hooks/use-dau-rekap-bulanan";
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

function SimpleTable({ rows }: { rows: any[] }) {
  const columns = useMemo(() => {
    if (!rows?.length) return [] as string[];
    const keys = Object.keys(rows[0] || {});
    return keys.slice(0, 8); // cap columns to avoid overflow
  }, [rows]);

  if (!rows?.length) return <div className="text-sm text-muted-foreground">Tidak ada data.</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((c) => (
              <th key={c} className="text-left py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((c) => (
                <td key={c} className="py-2 pr-4 align-top">
                  {String(r?.[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RekapBulananTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-muted-foreground">Tidak ada data.</div>;

  const safe = (v: any) => (v === null || v === undefined ? "" : v);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">THANG</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">KDPEMDA - NMPEMDA</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">PAGU</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">ALOKASI BULAN</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">TUNDA</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">CABUT</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">POTONGAN</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">SALUR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-4 align-top">{safe(r?.thang)}</td>
              <td className="py-2 pr-4 align-top">{`${safe(r?.kdpemda)} - ${safe(r?.nmpemda)}`}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.pagu)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.alokasi_bulan)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.tunda)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.cabut)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.potongan)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.salur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PenundaanCabutTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-muted-foreground">Tidak ada data.</div>;

  const safe = (v: any) => (v === null || v === undefined ? "" : v);

  const months = ["jan", "peb", "mar", "apr", "mei", "jun", "jul", "ags", "sep", "okt", "nov", "des"] as const;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">No</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">no_kmk</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">kmk_cabut</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">nm_kriteria</th>
            {months.map((m) => (
              <th key={m} className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-4 align-top">{i + 1}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.no_kmk)}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.kmk_cabut)}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.nm_kriteria)}</td>
              {months.map((m) => (
                <td key={m} className="py-2 pr-4 align-top text-right">{fmt(r?.[m])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RekapByPemdaTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-muted-foreground">Tidak ada data.</div>;

  const safe = (v: any) => (v === null || v === undefined ? "" : v);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">No</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">thang</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">nmbulan</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">nmkppn</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">nmpemda</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">pagu</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">alokasi_bulan</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">tunda</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">cabut</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">potongan</th>
            <th className="text-center py-2 pr-4 font-medium uppercase text-xs text-muted-foreground">salur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-4 align-top">{i + 1}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.thang)}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.nmbulan)}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.nmkppn)}</td>
              <td className="py-2 pr-4 align-top">{safe(r?.nmpemda)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.pagu)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.alokasi_bulan)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.tunda)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.cabut)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.potongan)}</td>
              <td className="py-2 pr-4 align-top text-right">{fmt(r?.salur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const rekapBulananParams: { kdpemda?: string; bulan?: string | number } = {};
  if (isValidKdpemda) rekapBulananParams.kdpemda = kdpemda;
  if (bulan !== undefined) rekapBulananParams.bulan = bulan;

  const byPemdaParams: { kdpemda?: string } = {};
  if (isValidKdpemda) byPemdaParams.kdpemda = kdpemda;

  const rekapBulanan = useDauRekapBulanan(rekapBulananParams);
  const penundaanCabut = useDauPenundaanCabutByPemda(byPemdaParams);
  const rekapByPemda = useDauRekapByPemda(byPemdaParams);

  // Show error if kdpemda is invalid
  if (!isValidKdpemda) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Error - Data Tidak Valid
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-medium">Tidak dapat menampilkan Kertas Kerja</p>
              <p className="mt-1">Kode Pemda (kdpemda) tidak valid atau tidak ditemukan dalam data yang dipilih.</p>
              <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                Debug info: kdpemda = {String(kdpemda || "undefined")}
              </div>
            </div>
          </div>

          <DialogFooter>
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
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kertas Kerja - {data?.kppn} • {data?.kabkota} • {data?.bulan} {data?.tahun}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                  <RekapBulananTable rows={rekapBulanan.rows} />
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
