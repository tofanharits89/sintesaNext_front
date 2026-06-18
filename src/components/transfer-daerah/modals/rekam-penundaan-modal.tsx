"use client";

import { Save, X } from "lucide-react";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useKppnByNoKmk } from "@/hooks/use-kppn-by-nokmk";
import { useKabKotaByNoKmk } from "@/hooks/use-kabkota-by-nokmk";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

interface RekamPenundaanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any; // row dari tabel Data KMK (jenis=2)
  onSaveSuccess?: () => void;
}

const MONTH_KEYS = ["jan", "peb", "mar", "apr", "mei", "jun", "jul", "ags", "sep", "okt", "nov", "des"] as const;
type MonthKey = typeof MONTH_KEYS[number];

const MONTH_LABELS: Record<MonthKey, string> = {
  jan: "Januari", peb: "Februari", mar: "Maret", apr: "April",
  mei: "Mei", jun: "Juni", jul: "Juli", ags: "Agustus",
  sep: "September", okt: "Oktober", nov: "November", des: "Desember",
};

type MonthValues = Record<MonthKey, string>;

const emptyMonths = (): MonthValues =>
  Object.fromEntries(MONTH_KEYS.map((k) => [k, ""])) as MonthValues;

export function RekamPenundaanModal({
  open,
  onOpenChange,
  data,
  onSaveSuccess,
}: RekamPenundaanModalProps) {
  // Resolve KMK info from row data
  const noKmk: string = String(data?.nomorKmk || data?.no_kmk || "");
  const thang: string = String(data?.tahun || data?.thang || new Date().getFullYear());
  const uraian: string = String(data?.uraian || "");
  const jenis: string = String(data?.jenis || "2");
  const kriteria: string = String(data?.kriteria || "");

  // Form state
  const [kdkppn, setKdkppn] = useState("");
  const [kdpemda, setKdpemda] = useState("");
  const [monthValues, setMonthValues] = useState<MonthValues>(emptyMonths());
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // KPPN options based on selected KMK
  const { options: kppnOptions, isLoading: kppnLoading } = useKppnByNoKmk(noKmk || undefined);

  // Kab/Kota options based on selected KMK + KPPN
  const { options: kabkotaOptions, isLoading: kabkotaLoading } = useKabKotaByNoKmk(
    noKmk || undefined,
    kdkppn || undefined
  );

  const handleReset = useCallback(() => {
    setKdkppn("");
    setKdpemda("");
    setMonthValues(emptyMonths());
    setErrorMsg(null);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    handleReset();
  }, [onOpenChange, handleReset]);

  const handleMonthChange = (key: MonthKey, value: string) => {
    setMonthValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSaving(true);

    try {
      if (!noKmk) throw new Error("Data KMK tidak ditemukan");
      if (!kdkppn) throw new Error("Pilih KPPN terlebih dahulu");
      if (!kdpemda) throw new Error("Pilih Kabupaten/Kota terlebih dahulu");

      const monthPayload: Record<MonthKey, number> = Object.fromEntries(
        MONTH_KEYS.map((k) => [k, Number(monthValues[k] || 0) * 1_000_000])
      ) as Record<MonthKey, number>;

      const totalNilai = Object.values(monthPayload).reduce((a, b) => a + b, 0);
      if (totalNilai === 0) {
        throw new Error("Minimal satu bulan harus memiliki nilai penundaan");
      }

      const payload = {
        thang,
        no_kmk: noKmk,
        jenis,
        kriteria: kriteria || null,
        uraian: uraian || null,
        kdkppn,
        kdpemda,
        ...monthPayload,
      };

      const headers: HeadersInit = addCsrfToHeaders({ "Content-Type": "application/json" });
      const resp = await fetch(apiPath("/transfer-daerah/dau/kmk/rekam-penundaan"), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      if (!resp.ok) {
        let msg = `Gagal menyimpan (HTTP ${resp.status})`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      handleClose();
      onSaveSuccess?.();
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menyimpan data penundaan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
        >
          <DialogHeader className="p-6 pb-3 border-b">
            <DialogTitle>Rekam Data Penundaan Alokasi — Tahun {thang}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 grid gap-5 py-4">
            {/* Info KMK (read-only, dari baris yang diklik) */}
            <div className="space-y-1.5">
              <Label>KMK Penundaan</Label>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{noKmk || "—"}</p>
                {uraian && <p className="text-xs text-muted-foreground mt-0.5">{uraian}</p>}
                {kriteria && <p className="text-xs text-muted-foreground">Kriteria: {kriteria}</p>}
                <p className="text-xs text-muted-foreground">Tahun: {thang}</p>
              </div>
            </div>

            {/* KPPN & Kab/Kota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  KPPN <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  options={kppnOptions}
                  value={kdkppn}
                  onValueChange={(v) => {
                    setKdkppn(v);
                    setKdpemda("");
                  }}
                  placeholder={
                    kppnLoading
                      ? "Memuat KPPN..."
                      : kppnOptions.length === 0
                      ? "Tidak ada KPPN untuk KMK ini"
                      : "Pilih KPPN"
                  }
                  disabled={kppnLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Kabupaten / Kota <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  options={kabkotaOptions}
                  value={kdpemda}
                  onValueChange={setKdpemda}
                  placeholder={
                    !kdkppn
                      ? "Pilih KPPN terlebih dahulu"
                      : kabkotaLoading
                      ? "Memuat..."
                      : "Pilih Kabupaten/Kota"
                  }
                  disabled={!kdkppn || kabkotaLoading}
                />
              </div>
            </div>

            {/* Nilai Penundaan per Bulan */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Nilai Penundaan per Bulan{" "}
                <span className="text-xs font-normal text-muted-foreground">(dalam juta rupiah)</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {MONTH_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{MONTH_LABELS[key]}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={monthValues[key]}
                      onChange={(e) => handleMonthChange(key, e.target.value)}
                      placeholder="0"
                      className="text-right font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2 border-t">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Alert */}
      <AlertDialog open={!!errorMsg} onOpenChange={(o) => { if (!o) setErrorMsg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Gagal Menyimpan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm text-foreground">
              {errorMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
