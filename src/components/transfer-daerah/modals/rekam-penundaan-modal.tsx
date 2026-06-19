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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useKppnByNoKmk } from "@/hooks/use-kppn-by-nokmk";
import { useKabKotaByNoKmk } from "@/hooks/use-kabkota-by-nokmk";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { CekAlokasi, MonthValues, MONTH_KEYS, emptyMonthValues } from "./cek-alokasi";

// Daftar pilihan periode/bulan (01-12)
const PERIODE_OPTIONS = [
  { value: "01", label: "01 - Januari" },
  { value: "02", label: "02 - Februari" },
  { value: "03", label: "03 - Maret" },
  { value: "04", label: "04 - April" },
  { value: "05", label: "05 - Mei" },
  { value: "06", label: "06 - Juni" },
  { value: "07", label: "07 - Juli" },
  { value: "08", label: "08 - Agustus" },
  { value: "09", label: "09 - September" },
  { value: "10", label: "10 - Oktober" },
  { value: "11", label: "11 - November" },
  { value: "12", label: "12 - Desember" },
];

interface RekamPenundaanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any; // row dari tabel Data KMK (jenis=2)
  onSaveSuccess?: () => void;
}

export function RekamPenundaanModal({
  open,
  onOpenChange,
  data,
  onSaveSuccess,
}: RekamPenundaanModalProps) {
  // Resolve KMK info dari row data
  const noKmk: string = String(data?.nomorKmk || data?.no_kmk || "");
  const thang: string = String(data?.tahun || data?.thang || new Date().getFullYear());
  const uraian: string = String(data?.uraian || "");
  const jenis: string = String(data?.jenis || "2").trim();
  // rawKriteria = kode asli dari DB ("21", "22") — digunakan untuk logika auto-fill
  // kriteria display = nama human-readable (nm_kriteria)
  const kriteria: string = String(data?.rawKriteria || data?.kriteria || "").trim();
  const kriteriaDisplay: string = String(data?.kriteria || "");

  // Ekstrak bulan dari rawTglKmk (dari DB, format "YYYY-MM-DD") → "03" dst
  // rawTglKmk tersedia di KmkRow (ditambahkan ke hook), tgl_kmk hanya di RawKmkDauItem
  const tglKmk: string = String(data?.rawTglKmk || data?.tgl_kmk || data?.tanggalKmk || "");
  const bulanKmk: string = tglKmk.length >= 7 ? tglKmk.substring(5, 7) : "";

  // Form state
  const [kdkppn, setKdkppn] = useState("");
  const [kdpemda, setKdpemda] = useState("");
  // periode = bulan yang dipilih user di dropdown (digunakan untuk query alokasi ke DB)
  const [periode, setPeriode] = useState("");
  // monthValues diisi via CekAlokasi (auto-fill 25%) atau manual
  const [monthValues, setMonthValues] = useState<MonthValues>(emptyMonthValues());
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // KPPN options berdasarkan KMK terpilih
  const { options: kppnOptions, isLoading: kppnLoading } = useKppnByNoKmk(noKmk || undefined);

  // Kab/Kota options berdasarkan KPPN terpilih
  const { options: kabkotaOptions, isLoading: kabkotaLoading } = useKabKotaByNoKmk(
    noKmk || undefined,
    kdkppn || undefined
  );

  const handleReset = useCallback(() => {
    setKdkppn("");
    setKdpemda("");
    setPeriode("");
    setMonthValues(emptyMonthValues());
    setErrorMsg(null);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    handleReset();
  }, [onOpenChange, handleReset]);

  // Callback dari CekAlokasi setiap kali nilai berubah (auto-fill atau manual)
  const handleReceiveFormData = useCallback(
    (data: MonthValues & { alokasi: number }) => {
      // Ambil hanya nilai bulan (drop key alokasi)
      const { alokasi: _, ...months } = data;
      setMonthValues(months as MonthValues);
    },
    []
  );

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSaving(true);

    try {
      if (!noKmk) throw new Error("Data KMK tidak ditemukan");
      if (!kdkppn) throw new Error("Pilih KPPN terlebih dahulu");
      if (!kdpemda) throw new Error("Pilih Kabupaten/Kota terlebih dahulu");
      if (!periode) throw new Error("Pilih Periode terlebih dahulu");

      // Nilai dari CekAlokasi dalam satuan juta → kalikan 1.000.000 untuk kirim ke backend
      const monthPayload: Record<string, number> = Object.fromEntries(
        MONTH_KEYS.map((k) => [k, Number(monthValues[k] || 0) * 1_000_000])
      );

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
            {/* Info KMK (read-only) */}
            <div className="space-y-1.5">
              <Label>KMK Penundaan</Label>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{noKmk || "—"}</p>
                {uraian && <p className="text-xs text-muted-foreground mt-0.5">{uraian}</p>}
                <div className="flex gap-4 mt-1">
                  {kriteriaDisplay && (
                    <p className="text-xs text-muted-foreground">Kriteria: {kriteriaDisplay}</p>
                  )}
                  {bulanKmk && (
                    <p className="text-xs text-muted-foreground">
                      Bulan KMK: {bulanKmk}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Tahun: {thang}</p>
                </div>
              </div>
            </div>

            {/* KPPN, Kab/Kota, Periode — 3 kolom */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    setMonthValues(emptyMonthValues());
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
                  onValueChange={(v) => {
                    setKdpemda(v);
                    setMonthValues(emptyMonthValues());
                  }}
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

              <div className="space-y-1.5">
                <Label>
                  Periode <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={periode}
                  onValueChange={(v) => {
                    setPeriode(v);
                    setMonthValues(emptyMonthValues());
                  }}
                  disabled={!kdpemda}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={!kdpemda ? "Pilih Kab/Kota dahulu" : "Pilih Periode"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nilai Penundaan per Bulan — via CekAlokasi (auto-fill 25%) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Nilai Penundaan per Bulan{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (dalam juta rupiah)
                </span>
              </Label>
              <CekAlokasi
                kdpemda={kdpemda}
                bulanKmk={bulanKmk}
                periode={periode}
                kriteria={kriteria}
                thang={thang}
                onReceiveFormData={handleReceiveFormData}
              />
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
