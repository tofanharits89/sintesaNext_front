"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { useKmkDau } from "@/hooks/use-kmk-dau";
import { useDasarPenundaanOptions } from "@/hooks/use-dasar-penundaan";
import { useKmkPemotongan } from "@/hooks/use-kmk-pemotongan";
import { useJenisKmkOptions } from "@/hooks/use-jenis-kmk-options";
import { useKriteriaOptions } from "@/hooks/use-kriteria-options";
import { useDasarPemotonganOptions } from "@/hooks/use-dasar-pemotongan-options";
import { useKodeAkunOptions } from "@/hooks/use-kode-akun-options";
import { backendPath } from "@/lib/config/config";
import { getAuthTokenFromCookie } from "@/lib/utils/cookieManager";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

interface RekamDataTransaksiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any; // expects row from useDauTransaksi()
}

export function RekamDataTransaksiModal({ open, onOpenChange, data }: RekamDataTransaksiModalProps) {
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
    dasarPenundaan: "", // no_kmk (jenis 2/3)
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const { options: dasarPemotonganOptions } = useDasarPemotonganOptions(formData.kriteria || undefined);
  const { options: kdakunOptions, akunMap } = useKodeAkunOptions(formData.kriteria || undefined);

  // Keep KMK list available if needed elsewhere, but dasar pemotongan now comes from ref hook
  const { rows: kmkRows } = useKmkDau(tahun);

  // Dasar KMK Penundaan options from backend
  const { options: dasarPenundaanOptions } = useDasarPenundaanOptions(true);

  // When selecting dasar pemotongan, fetch pemotongan detail to derive kdsatker/kdlokasi for this Pemda
  const { rows: pemotonganRows } = useKmkPemotongan(formData.dasarPemotongan || undefined, !!formData.dasarPemotongan);
  useEffect(() => {
    if (!formData.dasarPemotongan) {
      // Avoid fighting with kdakun-based auto-fill. Only clear when kdakun is also empty
      if (!formData.kdakun && (formData.kdsatker !== "" || formData.kdlokasi !== "")) {
        setFormData((p) => ({ ...p, kdsatker: "", kdlokasi: "" }));
      }
      return;
    }
    // Only derive from pemotonganRows when kdakun has not been selected
    if (!formData.kdakun) {
      const match = (pemotonganRows || []).find((r: any) => String(r.kdkabkota || "") === kdpemdaCode);
      const nextKdsatker = match ? String(match.kdsatker || "") : "";
      const nextKdlokasi = match ? String(match.kdlokasi || "") : "";
      if (formData.kdsatker !== nextKdsatker || formData.kdlokasi !== nextKdlokasi) {
        setFormData((p) => ({ ...p, kdsatker: nextKdsatker, kdlokasi: nextKdlokasi }));
      }
    }
  }, [formData.dasarPemotongan, formData.kdakun, pemotonganRows, kdpemdaCode, formData.kdsatker, formData.kdlokasi]);

  // Auto-fill KDSatker & KdLokasi based on selected kdakun using fixed mapping rules
  useEffect(() => {
    const selectedAkun = formData.kdakun;
    if (!selectedAkun) {
      // When kdakun cleared, fallback to blank unless dasarPemotongan will set it
      if (!formData.dasarPemotongan && (formData.kdsatker !== "" || formData.kdlokasi !== "")) {
        setFormData((p) => ({ ...p, kdsatker: "", kdlokasi: "" }));
      }
      return;
    }
    const groupA = new Set(["715211", "425713", "425762", "425823"]);
    const groupB = new Set(["717121", "425719"]);
    let nextKdsatker = "000000";
    let nextKdlokasi = "0000";
    if (groupA.has(String(selectedAkun))) {
      nextKdsatker = "977386";
      nextKdlokasi = "0100";
    } else if (groupB.has(String(selectedAkun))) {
      nextKdsatker = "999302";
      nextKdlokasi = "0100";
    }
    if (formData.kdsatker !== nextKdsatker || formData.kdlokasi !== nextKdlokasi) {
      setFormData((p) => ({ ...p, kdsatker: nextKdsatker, kdlokasi: nextKdlokasi }));
    }
  }, [formData.kdakun, formData.kdsatker, formData.kdlokasi, formData.dasarPemotongan]);

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
    });
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      // Map modal state to backend payload
      const [kppnFirstPart] = (kppnText || "").split(" - ");
      const kdkppnCodeOnly = (kppnFirstPart ?? "").trim();
      const bulanTwoDigit = Number.isFinite(bulanNumber) ? String(bulanNumber).padStart(2, "0") : "";
      const nmbulanComputed =
        nmbulanText ||
        (Number.isFinite(bulanNumber) && bulanNumber >= 1 && bulanNumber <= 12
          ? (months[bulanNumber - 1] ?? "")
          : "");
      const payload = {
        kdkppn: kdkppnCodeOnly,
        bulan: bulanTwoDigit,
        thang: Number(tahun || 0),
        kdkabkota: String(kdpemdaCode || "").trim(),
        jenis: String(formData.jenis || "").trim(),
        kriteria: String(formData.kriteria || "").trim(),
        no_kmk: String(formData.dasarPemotongan || "").trim(),
        kdakun: String(formData.kdakun || "").trim(),
        nilai: Number(formData.nilaiPotongan || 0),
        kdsatker: String(formData.kdsatker || "").trim(),
        kdlokasi: String(formData.kdlokasi || "").trim(),
        nmbulan: nmbulanComputed,
      };

      // Basic front-end validation
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
        { key: "kdkabkota", val: payload.kdkabkota },
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
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Rekam Data Transaksi</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid gap-4 py-2">
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
                    .filter((j) => j.value !== "2" && j.value !== "3")
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
                <VirtualizedSelect
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
                <VirtualizedSelect
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
              {/* Dasar KMK Penundaan */}
              <div className="space-y-1.5">
                <Label>Dasar KMK Penundaan</Label>
                <VirtualizedSelect
                  options={dasarPenundaanOptions}
                  value={formData.dasarPenundaan}
                  onValueChange={(value) => setFormData((p) => ({ ...p, dasarPenundaan: value }))}
                  placeholder="Pilih dasar KMK penundaan"
                />
              </div>
            </div>
          ) : null}
        </div>

        {errorMsg ? (
          <div className="text-sm text-red-600">{errorMsg}</div>
        ) : null}
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={saving}>Tutup</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
