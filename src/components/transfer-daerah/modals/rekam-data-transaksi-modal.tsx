"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useKmkDau } from "@/hooks/use-kmk-dau";
import { useDasarPenundaanOptions } from "@/hooks/use-dasar-penundaan";
import { useKmkPemotongan } from "@/hooks/use-kmk-pemotongan";
import { useJenisKmkOptions } from "@/hooks/use-jenis-kmk-options";
import { useKriteriaOptions } from "@/hooks/use-kriteria-options";
import { useDasarPemotonganOptions } from "@/hooks/use-dasar-pemotongan-options";
import { useKodeAkunOptions } from "@/hooks/use-kode-akun-options";
import { usePencabutanPenundaanOptions } from "@/hooks/use-pencabutan-penundaan-options";
import { backendPath } from "@/lib/config/config";
import { getAuthTokenFromCookie } from "@/lib/utils/cookieManager";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

interface RekamDataTransaksiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any; // expects row from useDauTransaksi()
  onSaveSuccess?: () => void;
}

export function RekamDataTransaksiModal({ open, onOpenChange, data, onSaveSuccess }: RekamDataTransaksiModalProps) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const [formData, setFormData] = useState({
    jenis: "",
    kriteria: "",
    dasarPemotongan: "", // no_kmk (jenis 1/4)
    kdakun: "",
    nilaiPotongan: "",
    kdsatker: "",
    kdlokasi: "",
    dasarPenundaan: "", // no_kmk (jenis 3) — selected penundaan KMK
    bulanCabut: 0,      // locked to selectedPencabutan.bulancabut
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Preload disabled header values
  const tahun = data?.tahun ? String(data.tahun) : "";
  const kppnText = data?.kppn ? String(data.kppn) : "";
  const kabkotaText = data?.kabkota ? String(data.kabkota) : "";
  const kdpemdaCode = data?.kdpemdaCode ? String(data.kdpemdaCode) : "";
  const nmbulanText = data?.nmbulan ? String(data.nmbulan) : "";
  // Derive numeric bulan from either numeric field or month name
  const bulanNumber = useMemo(() => {
    const raw = data?.bulan;
    if (raw !== undefined && raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
      const name = String(raw).toLowerCase();
      const idx = months.findIndex((m) => m.toLowerCase() === name);
      if (idx >= 0) return idx + 1;
    }
    if (data?.nmbulan) {
      const idx = months.findIndex((m) => m.toLowerCase() === String(data.nmbulan).toLowerCase());
      if (idx >= 0) return idx + 1;
    }
    return NaN;
  }, [data]);
  const bulanDisplay = nmbulanText || (data?.bulan ? String(data.bulan) : "");

  // Dynamic options from backend
  const { options: jenisOptions } = useJenisKmkOptions();
  const { options: kriteriaOptions } = useKriteriaOptions(formData.jenis || undefined);
  const { options: dasarPemotonganOptionsRaw } = useDasarPemotonganOptions(formData.kriteria || undefined);
  const { options: kdakunOptionsRaw, akunMap } = useKodeAkunOptions(formData.kriteria || undefined);

  const dasarPemotonganOptions = useMemo(() => {
    const seen = new Set();
    return (dasarPemotonganOptionsRaw || []).filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [dasarPemotonganOptionsRaw]);

  const kdakunOptions = useMemo(() => {
    const seen = new Set();
    return (kdakunOptionsRaw || []).filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [kdakunOptionsRaw]);

  // Keep KMK list available if needed elsewhere, but dasar pemotongan now comes from ref hook
  const { rows: kmkRows } = useKmkDau(tahun);

  // Dasar KMK Penundaan options from backend
  const { options: dasarPenundaanOptionsRaw } = useDasarPenundaanOptions(true);

  const dasarPenundaanOptions = useMemo(() => {
    const seen = new Set();
    return (dasarPenundaanOptionsRaw || []).filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [dasarPenundaanOptionsRaw]);

  // ── Jenis 3: Pencabutan Penundaan dropdown ──────────────────────────────────
  const kdkppnCode = useMemo(() => (kppnText || "").split(" - ")[0].trim(), [kppnText]);

  const { items: pencabutanItems, options: pencabutanOptions, isLoading: pencabutanLoading } =
    usePencabutanPenundaanOptions({
      kdkppn: kdkppnCode,
      kdpemda: kdpemdaCode,
      kriteria: formData.kriteria || undefined,
      thang: tahun || undefined,
      enabled: formData.jenis === "3" && !!kdkppnCode && !!kdpemdaCode,
    });

  const selectedPencabutan = useMemo(
    () => pencabutanItems.find((p) => p.no_kmk === formData.dasarPenundaan) ?? null,
    [pencabutanItems, formData.dasarPenundaan]
  );

  const monthLabels = ["Jan","Peb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"] as const;
  const monthKeys   = ["jan","peb","mar","apr","mei","jun","jul","ags","sep","okt","nov","des"] as const;
  // ────────────────────────────────────────────────────────────────────────────

  const { rows: pemotonganRows } = useKmkPemotongan(formData.dasarPemotongan || undefined, !!formData.dasarPemotongan);
  // Consolidated auto-fill effect for KDSatker and KdLokasi to prioritize KMK row values
  useEffect(() => {
    let nextKdsatker = "";
    let nextKdlokasi = "";

    // 1. Try to get values from selected Dasar KMK Pemotongan (pemotonganRows) matching this Pemda
    if (formData.dasarPemotongan) {
      const match = (pemotonganRows || []).find((r: any) => String(r.kdkabkota || "").trim() === String(kdpemdaCode || "").trim());
      if (match) {
        nextKdsatker = String(match.kdsatker || "").trim();
        nextKdlokasi = String(match.kdlokasi || "").trim();
      }
    }

    // 2. If no valid values derived from KMK, fallback to Kode Akun mapping rules
    const hasKmkValue = nextKdsatker && nextKdsatker !== "000000" && nextKdlokasi && nextKdlokasi !== "0000";
    
    if (!hasKmkValue && formData.kdakun) {
      const selectedAkun = String(formData.kdakun).trim();
      const groupA = new Set(["715211", "425713", "425762", "425823"]);
      const groupB = new Set(["717121", "425719"]);
      
      let fallbackSatker = "000000";
      let fallbackLokasi = "0000";
      
      if (groupA.has(String(selectedAkun))) {
        fallbackSatker = "977386";
        fallbackLokasi = "0100";
      } else if (groupB.has(String(selectedAkun))) {
        fallbackSatker = "999302";
        fallbackLokasi = "0100";
      }
      
      nextKdsatker = fallbackSatker;
      nextKdlokasi = fallbackLokasi;
    }

    // 3. Update form state only if values actually changed to avoid infinite render loops
    if (formData.kdsatker !== nextKdsatker || formData.kdlokasi !== nextKdlokasi) {
      setFormData((p) => ({ ...p, kdsatker: nextKdsatker, kdlokasi: nextKdlokasi }));
    }
  }, [
    formData.dasarPemotongan,
    formData.kdakun,
    pemotonganRows,
    kdpemdaCode,
    formData.kdsatker,
    formData.kdlokasi
  ]);

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      jenis: "",
      kriteria: "",
      dasarPemotongan: "",
      kdakun: "",
      nilaiPotongan: "",
      kdsatker: "",
      kdlokasi: "",
      dasarPenundaan: "",
      bulanCabut: 0,
    });
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      const [kppnFirstPart] = (kppnText || "").split(" - ");
      const kdkppnCodeOnly = (kppnFirstPart ?? "").trim();
      const bulanTwoDigit = Number.isFinite(bulanNumber) ? String(bulanNumber).padStart(2, "0") : "";
      const nmbulanComputed =
        nmbulanText ||
        (Number.isFinite(bulanNumber) && bulanNumber >= 1 && bulanNumber <= 12
          ? (months[bulanNumber - 1] ?? "")
          : "");

      // ── Jenis 3 payload ──────────────────────────────────────────────────────
      if (formData.jenis === "3") {
        if (!formData.dasarPenundaan) throw new Error("Pilih Dasar KMK Penundaan");
        if (!selectedPencabutan) throw new Error("Data penundaan tidak ditemukan");
        const bulanCabutVal = formData.bulanCabut || Number(selectedPencabutan.bulancabut || 0);
        if (!bulanCabutVal) throw new Error("Bulan cabut tidak valid");

        const payload: Record<string, any> = {
          kdkppn:    kdkppnCodeOnly,
          kdpemda:   String(kdpemdaCode || "").trim(),
          thang:     Number(tahun || 0),
          jenis:     "3",
          kriteria:  String(formData.kriteria || "").trim(),
          no_kmk:    selectedPencabutan.no_kmk,
          kmk_cabut: selectedPencabutan.no_kmkcabut ?? "",
          bulancabut: bulanCabutVal,
          bulan:     bulanTwoDigit,
          nmbulan:   nmbulanComputed,
        };
        for (const m of monthKeys) {
          payload[m] = Number((selectedPencabutan as any)[m] || 0);
        }

        const headers: HeadersInit = addCsrfToHeaders({ "Content-Type": "application/json" });
        const resp = await fetch(backendPath(`/transfer-daerah/dau/transaksi`), {
          method: "POST", headers, credentials: "include",
          body: JSON.stringify(payload),
        });
        const text = await resp.text();
        if (!resp.ok) {
          let msg = `Gagal menyimpan (HTTP ${resp.status})`;
          try { const j = JSON.parse(text); msg = j?.message || j?.error || msg; } catch {}
          throw new Error(msg);
        }
        onOpenChange(false);
        handleClose();
        queryClient.invalidateQueries({ queryKey: ["dau-transaksi"] });
        onSaveSuccess?.();
        return;
      }
      // ── END Jenis 3 ──────────────────────────────────────────────────────────

      // Map single month value to jan, peb, mar... des fields based on bulanNumber
      const monthsKeys = [
        "jan", "peb", "mar", "apr", "mei", "jun",
        "jul", "ags", "sep", "okt", "nov", "des"
      ];
      const monthlyFields: Record<string, number> = {};
      monthsKeys.forEach((key, idx) => {
        if (idx + 1 === bulanNumber) {
          monthlyFields[key] = Number(formData.nilaiPotongan || 0) / 1000000;
        } else {
          monthlyFields[key] = 0;
        }
      });

      const payload = {
        kdkppn: kdkppnCodeOnly,
        bulan: bulanTwoDigit,
        thang: Number(tahun || 0),
        kdpemda: String(kdpemdaCode || "").trim(),
        jenis: String(formData.jenis || "").trim(),
        kriteria: String(formData.kriteria || "").trim(),
        no_kmk: String(formData.dasarPemotongan || "").trim(),
        kdakun: String(formData.kdakun || "").trim(),
        nilai: Number(formData.nilaiPotongan || 0),
        kdsatker: String(formData.kdsatker || "").trim(),
        kdlokasi: String(formData.kdlokasi || "").trim(),
        nmbulan: nmbulanComputed,
        ...monthlyFields,
      };

      if (!Number.isFinite(bulanNumber) || bulanNumber < 1 || bulanNumber > 12) {
        throw new Error("Data belum lengkap: bulan");
      }
      if (!Number.isFinite(payload.thang)) {
        throw new Error("Data belum lengkap: thang");
      }
      if (!payload.nmbulan || payload.nmbulan.trim() === "") {
        throw new Error("Data belum lengkap: nmbulan");
      }
      const requiredFields = [
        { key: "kdkppn", val: payload.kdkppn },
        { key: "kdpemda", val: payload.kdpemda },
        { key: "jenis", val: payload.jenis },
        { key: "kriteria", val: payload.kriteria },
        { key: "no_kmk", val: payload.no_kmk },
        { key: "kdakun", val: payload.kdakun },
      ];
      const missing = requiredFields
        .filter((f) => typeof f.val === "string" ? f.val.trim() === "" : f.val === undefined || f.val === null)
        .map((f) => f.key);
      if (missing.length) {
        throw new Error(`Data belum lengkap: ${missing.join(", ")}`);
      }

      const headers: HeadersInit = addCsrfToHeaders({ "Content-Type": "application/json" });
      const resp = await fetch(backendPath(`/transfer-daerah/dau/transaksi`), {
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
        } catch { }
        throw new Error(msg);
      }

      onOpenChange(false);
      handleClose();
      queryClient.invalidateQueries({ queryKey: ["dau-transaksi"] });
      onSaveSuccess?.();
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Data Transaksi</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 grid gap-4 py-2">
          {/* Top disabled trio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>KPPN</Label>
              <Input value={kppnText} disabled placeholder="KPPN" />
            </div>
            <div className="space-y-1.5">
              <Label>Kab/Kota</Label>
              <Input value={kabkotaText} disabled placeholder="Kab/Kota" />
            </div>
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Input value={bulanDisplay} disabled placeholder="Bulan" />
            </div>
          </div>

          {/* Jenis & Kriteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jenis KMK</Label>
              <Select
                value={formData.jenis}
                onValueChange={(value) => {
                  setFormData({
                    jenis: value,
                    kriteria: "",
                    dasarPemotongan: "",
                    kdakun: "",
                    nilaiPotongan: "",
                    kdsatker: "",
                    kdlokasi: "",
                    dasarPenundaan: "",
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis KMK" />
                </SelectTrigger>
                <SelectContent>
                  {(jenisOptions || [])
                    .filter((j) => j.value !== "2")
                    .map((j) => (
                      <SelectItem key={j.value} value={j.value} title={j.label}>
                        <span className="truncate">{j.label}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kriteria</Label>
              <Select
                value={formData.kriteria}
                onValueChange={(value) =>
                  setFormData((p) => ({
                    ...p,
                    kriteria: value,
                    dasarPemotongan: "",
                    kdakun: "",
                    kdsatker: "",
                    kdlokasi: "",
                  }))
                }
              >
                <SelectTrigger className="w-full" disabled={!formData.jenis}>
                  <SelectValue placeholder={formData.jenis ? "Pilih kriteria" : "Pilih jenis KMK terlebih dahulu"} />
                </SelectTrigger>
                <SelectContent>
                  {(kriteriaOptions || []).map((k) => (
                    <SelectItem key={k.value} value={k.value} title={k.label}>
                      <span className="truncate">{k.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional sections */}
          {formData.jenis === "1" || formData.jenis === "4" ? (
            <div className="grid gap-4">
              {/* Dasar KMK Pemotongan */}
              <div className="space-y-1.5">
                <Label>Dasar KMK Pemotongan</Label>
                <SearchableSelect
                  options={dasarPemotonganOptions}
                  value={formData.dasarPemotongan}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      dasarPemotongan: value,
                      kdakun: "",
                      kdsatker: "",
                      kdlokasi: "",
                    }))
                  }
                  placeholder="Pilih dasar KMK pemotongan"
                  disabled={!formData.kriteria}
                />
              </div>

              {/* Kode Akun */}
              <div className="space-y-1.5">
                <Label>Kode Akun</Label>
                <SearchableSelect
                  options={kdakunOptions}
                  value={formData.kdakun}
                  onValueChange={(value) => setFormData((p) => ({ ...p, kdakun: value }))}
                  placeholder="Pilih kode akun"
                  disabled={!formData.kriteria}
                />
              </div>

              {/* Nilai Potongan */}
              <div className="space-y-1.5">
                <Label>Nilai Potongan</Label>
                <Input
                  type="number"
                  value={formData.nilaiPotongan}
                  onChange={(e) => setFormData((p) => ({ ...p, nilaiPotongan: e.target.value }))}
                  placeholder="Masukkan nilai potongan"
                />
              </div>

              {/* Disabled Kode Satker & Kode Lokasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kode Satker</Label>
                  <Input value={formData.kdsatker} disabled placeholder="Kode Satker" />
                </div>
                <div className="space-y-1.5">
                  <Label>Kode Lokasi</Label>
                  <Input value={formData.kdlokasi} disabled placeholder="Kode Lokasi" />
                </div>
              </div>
            </div>
          ) : null}

          {formData.jenis === "2" || formData.jenis === "3" ? (
            <div className="grid gap-4">
              {/* Dasar KMK Penundaan dropdown */}
              <div className="space-y-1.5">
                <Label>Dasar KMK Penundaan</Label>
                <SearchableSelect
                  options={pencabutanOptions}
                  value={formData.dasarPenundaan}
                  onValueChange={(value) => {
                    const item = pencabutanItems.find((p) => p.no_kmk === value) ?? null;
                    setFormData((p) => ({
                      ...p,
                      dasarPenundaan: value,
                      bulanCabut: Number(item?.bulancabut || 0),
                    }));
                  }}
                  placeholder={
                    pencabutanLoading
                      ? "Memuat..."
                      : pencabutanOptions.length === 0
                      ? "Tidak ada data penundaan untuk KPPN/Pemda ini"
                      : "Pilih dasar KMK penundaan"
                  }
                  disabled={pencabutanLoading}
                />
              </div>

              {selectedPencabutan && (() => {
                const fmtNum = (v: number) =>
                  v === 0 ? "0" : v.toLocaleString("id-ID");
                // Non-zero months for the "Cabut Penundaan" section
                const nonZeroMonths = monthKeys
                  .map((m, idx) => ({ m, idx, val: Number((selectedPencabutan as any)[m] || 0) }))
                  .filter((x) => x.val !== 0);

                return (
                  <>
                    {/* Full 12-month read-only grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {monthKeys.map((m, idx) => (
                        <div key={m} className="space-y-1.5">
                          <Label className="text-sm text-muted-foreground">
                            {["Januari","Februari","Maret","April","Mei","Juni",
                              "Juli","Agustus","September","Oktober","November","Desember"][idx]}
                          </Label>
                          <Input
                            value={fmtNum(Number((selectedPencabutan as any)[m] || 0))}
                            disabled
                            className="text-right font-mono"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Cabut Penundaan section — non-zero months + Dicairkan bulan */}
                    {nonZeroMonths.length > 0 && (
                      <div className="grid gap-3">
                        <Label className="font-semibold text-sm">Cabut Penundaan</Label>
                        <div className="flex flex-wrap gap-4 items-end">
                          {nonZeroMonths.map(({ m, idx, val }) => (
                            <div key={m} className="space-y-1.5 flex-1 min-w-[160px]">
                              <Label className="text-sm text-muted-foreground">{monthLabels[idx]}</Label>
                              <Input
                                value={fmtNum(val)}
                                disabled
                                className="text-right font-mono"
                              />
                            </div>
                          ))}

                          {/* Dicairkan bulan — locked to bulancabut */}
                          <div className="space-y-1.5 flex-1 min-w-[160px]">
                            <Label className="text-sm text-muted-foreground">Dicairkan bulan</Label>
                            <Select
                              value={String(formData.bulanCabut || selectedPencabutan.bulancabut || "")}
                              onValueChange={() => {/* locked */}}
                              disabled
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((nm, idx) => (
                                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                                    {nm}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>Tutup</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Error alert dialog */}
    <AlertDialog open={!!errorMsg} onOpenChange={(open) => { if (!open) setErrorMsg(null); }}>
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
          <AlertDialogAction onClick={() => setErrorMsg(null)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
