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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { VirtualizedSelect } from "@/components/ui/virtualized-select";

import jenisKMK from "@/data/jeniskmk_tkd.json";
import kriteriaKMK from "@/data/jeniskriteria_tkd.json";
import kppnList from "@/data/kdkppn_tkd.json";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

interface DataKmkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYear?: string | number;
  onCreated?: () => void;
}

export function DataKmkModal({ open, onOpenChange, initialYear, onCreated }: DataKmkModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    tanggalKmk: undefined as Date | undefined,
    nomorKmk: "",
    uraian: "",
    jenis: "",
    kriteria: "",
    file: null as File | null,
    dasarPenundaan: "",
    dasarPencabutan: "",
    kppn: "",
    kabkota: "",
  });
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      tahun: "",
      tanggalKmk: undefined,
      nomorKmk: "",
      uraian: "",
      jenis: "",
      kriteria: "",
      file: null,
      dasarPenundaan: "",
      dasarPencabutan: "",
      kppn: "",
      kabkota: "",
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      // Build multipart form data for upload
      const fd = new FormData();
      fd.append("jenis", formData.jenis);
      fd.append("kriteria", formData.kriteria);
      fd.append("thang", formData.tahun);
      fd.append(
        "tgl_kmk",
        formData.tanggalKmk
          ? `${formData.tanggalKmk.getFullYear()}-${String(formData.tanggalKmk.getMonth() + 1).padStart(2, "0")}-${String(formData.tanggalKmk.getDate()).padStart(2, "0")}`
          : ""
      );
      fd.append("no_kmk", formData.nomorKmk);
      fd.append("uraian", formData.uraian);
      if (formData.file) {
        fd.append("file", formData.file);
      }

      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await fetch(backendPath("/transfer-daerah/dau/kmk"), {
        method: "POST",
        headers,
        credentials: "include",
        body: fd,
      });
      const text = await resp.text();
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      // Success
      onOpenChange(false);
      resetForm();
      onCreated?.();
    } catch (e) {
      console.error("Failed to create KMK DAU:", e);
      alert(`Gagal menyimpan data KMK: ${String((e as any)?.message || e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Apply initial year when modal opens
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        tahun: prev.tahun || (initialYear ? String(initialYear) : ""),
      }));
    }
  }, [open, initialYear]);

  const jenisOptions = (jenisKMK as { jenis: string; nmjenis: string }[]);
  const kriteriaOptions = (kriteriaKMK as {
    id: string; // jenis id
    id_kriteria: string;
    nm_kriteria: string;
    kunci?: string | null;
  }[]);

  const filteredKriteriaOptions = formData.jenis
    ? kriteriaOptions.filter((k) => k.id === formData.jenis)
    : [];

  // Mock dropdown sources (replace with real data fetching later)
  const dasarPenundaanOptions: { value: string; label: string }[] = [
    { value: "DP-001", label: "DP-001 - Penundaan karena kriteria A" },
    { value: "DP-002", label: "DP-002 - Penundaan karena kriteria B" },
    { value: "DP-003", label: "DP-003 - Penundaan karena kriteria C" },
  ];
  const dasarPencabutanOptions: { value: string; label: string }[] = [
    { value: "DC-001", label: "DC-001 - Pencabutan memenuhi syarat X" },
    { value: "DC-002", label: "DC-002 - Pencabutan memenuhi syarat Y" },
    { value: "DC-003", label: "DC-003 - Pencabutan memenuhi syarat Z" },
  ];

  // Build options from a single source of truth: kdkppn_tkd.json
  type KppnRow = {
    kdkabkota: string;
    nmkabkota: string;
    kdkppn: string;
    nmkppn: string;
    kdkanwil?: string;
  };
  const kppnRows = kppnList as KppnRow[];

  // Deduplicate KPPN by kdkppn
  const kppnOptions = Array.from(
    new Map(
      kppnRows.map((r) => [r.kdkppn, { value: r.kdkppn, label: `${r.kdkppn} - ${r.nmkppn}` }])
    ).values()
  ).sort((a, b) => a.value.localeCompare(b.value));

  // Deduplicate Kab/Kota by kdkabkota
  const kabKotaOptionsAll = Array.from(
    new Map(
      kppnRows.map((r) => [r.kdkabkota, { value: r.kdkabkota, label: `${r.kdkabkota} - ${r.nmkabkota}` }])
    ).values()
  ).sort((a, b) => a.value.localeCompare(b.value));

  // Filter Kab/Kota by selected KPPN (hierarchical)
  const kabKotaOptions = formData.kppn
    ? Array.from(
        new Map(
          kppnRows
            .filter((r) => r.kdkppn === formData.kppn)
            .map((r) => [
              r.kdkabkota,
              { value: r.kdkabkota, label: `${r.kdkabkota} - ${r.nmkabkota}` },
            ])
        ).values()
      ).sort((a, b) => a.value.localeCompare(b.value))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tambah Data KMK</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jenis KMK */}
            <div className="space-y-2">
              <Label htmlFor="jenis">Jenis KMK</Label>
              <Select
                value={formData.jenis}
                onValueChange={(value) => {
                  const currentKriteria = kriteriaOptions.find(
                    (k) => k.id_kriteria === formData.kriteria
                  );
                  const stillValid = currentKriteria?.id === value;
                  setFormData({
                    ...formData,
                    jenis: value,
                    kriteria: stillValid ? formData.kriteria : "",
                    // reset special fields when switching jenis
                    dasarPenundaan: "",
                    dasarPencabutan: "",
                    kppn: "",
                    kabkota: "",
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis KMK"
                  />
                </SelectTrigger>
                <SelectContent>
                  {jenisOptions.map((j) => {
                    const label = `${j.jenis} - ${j.nmjenis}`;
                    return (
                      <SelectItem key={j.jenis} value={j.jenis} title={label}>
                        <span className="truncate">{label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Kriteria KMK */}
            <div className="space-y-2">
              <Label htmlFor="kriteria">Kriteria KMK</Label>
              <Select
                value={formData.kriteria}
                onValueChange={(value) =>
                  setFormData({ ...formData, kriteria: value })
                }
              >
                <SelectTrigger className="w-full" disabled={!formData.jenis}>
                  <SelectValue
                    className="truncate"
                    placeholder={
                      formData.jenis
                        ? "Pilih kriteria KMK"
                        : "Pilih jenis KMK terlebih dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredKriteriaOptions.length === 0 ? (
                    <SelectItem value="__none__" disabled title="Tidak ada kriteria">
                      <span className="truncate">Tidak ada kriteria</span>
                    </SelectItem>
                  ) : null}
                  {filteredKriteriaOptions.map((k) => {
                    const label = `${k.id_kriteria} - ${k.nm_kriteria}`;
                    return (
                      <SelectItem key={`${k.id_kriteria}-${k.nm_kriteria}`} value={k.id_kriteria} title={label}>
                        <span className="truncate">{label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional second row based on jenis */}
          {formData.jenis === "3" ? (
            <div className="grid gap-6">
              {/* Dasar Penundaan - full row */}
              <div className="space-y-2">
                <Label htmlFor="dasarPenundaan">Dasar Penundaan</Label>
                {dasarPenundaanOptions.length > 0 ? (
                  <VirtualizedSelect
                    options={dasarPenundaanOptions}
                    value={formData.dasarPenundaan}
                    onValueChange={(value) => setFormData({ ...formData, dasarPenundaan: value })}
                    placeholder="Pilih dasar penundaan"
                  />
                ) : (
                  <Input
                    id="dasarPenundaan"
                    value={formData.dasarPenundaan}
                    onChange={(e) => setFormData({ ...formData, dasarPenundaan: e.target.value })}
                    placeholder="Masukkan dasar penundaan"
                    className="w-full"
                  />
                )}
              </div>

              {/* Dasar Pencabutan - full row */}
              <div className="space-y-2">
                <Label htmlFor="dasarPencabutan">Dasar Pencabutan</Label>
                {dasarPencabutanOptions.length > 0 ? (
                  <VirtualizedSelect
                    options={dasarPencabutanOptions}
                    value={formData.dasarPencabutan}
                    onValueChange={(value) => setFormData({ ...formData, dasarPencabutan: value })}
                    placeholder="Pilih dasar pencabutan"
                  />
                ) : (
                  <Input
                    id="dasarPencabutan"
                    value={formData.dasarPencabutan}
                    onChange={(e) => setFormData({ ...formData, dasarPencabutan: e.target.value })}
                    placeholder="Masukkan dasar pencabutan"
                    className="w-full"
                  />
                )}
              </div>

              {/* Disabled trio under dasar pencabutan */}
              {formData.dasarPencabutan ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Input value={formData.tahun || ""} disabled placeholder="Tahun" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      value={formData.tanggalKmk ? format(formData.tanggalKmk, "dd/MM/yyyy") : ""}
                      disabled
                      placeholder="Tanggal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uraian</Label>
                    <Input value={formData.uraian} disabled placeholder="Uraian" />
                  </div>
                </div>
              ) : null}

              {/* KPPN & Kab/Kota at the bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kppn">Pilih KPPN</Label>
                  <VirtualizedSelect
                    options={kppnOptions}
                    value={formData.kppn}
                    onValueChange={(value) =>
                      setFormData({ ...formData, kppn: value, kabkota: "" })
                    }
                    placeholder="Pilih KPPN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kabkota">Pilih Kab/Kota</Label>
                  <VirtualizedSelect
                    options={kabKotaOptions}
                    value={formData.kabkota}
                    onValueChange={(value) => setFormData({ ...formData, kabkota: value })}
                    placeholder={formData.kppn ? "Pilih Kab/Kota" : "Pilih KPPN terlebih dahulu"}
                    disabled={!formData.kppn}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tahun */}
              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun</Label>
                <Select
                  value={formData.tahun}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tahun: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue className="truncate" placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tanggal KMK */}
              <div className="space-y-2">
                <Label>Tanggal KMK</Label>
                <Popover modal={false} open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.tanggalKmk && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.tanggalKmk
                        ? format(formData.tanggalKmk, "dd/MM/yyyy")
                        : "Pilih tanggal KMK"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={formData.tanggalKmk}
                      onSelect={(date) => {
                        setFormData({ ...formData, tanggalKmk: date });
                        // close popover after selecting a date
                        setDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Nomor KMK */}
              <div className="space-y-2">
                <Label htmlFor="nomorKmk">Nomor KMK</Label>
                <Input
                  id="nomorKmk"
                  value={formData.nomorKmk}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorKmk: e.target.value })
                  }
                  placeholder="Masukkan nomor KMK"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Full width fields */}
          <div className="mt-6">
            <div className="space-y-4">
              {/* Uraian */}
              {formData.jenis !== "3" && (
                <div className="space-y-2">
                  <Label htmlFor="uraian">Uraian</Label>
                  <Textarea
                    id="uraian"
                    value={formData.uraian}
                    onChange={(e) =>
                      setFormData({ ...formData, uraian: e.target.value })
                    }
                    placeholder="Masukkan uraian"
                    rows={4}
                    className="w-full"
                  />
                </div>
              )}

              {/* File KMK Upload (PDF). Hidden when jenis=3 */}
              {formData.jenis === "3" ? null : (
                <div className="space-y-2">
                  <Label htmlFor="file">File KMK (PDF)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer w-full"
                  />
                  {formData.file && (
                    <p className="text-sm text-muted-foreground">File terpilih: {formData.file.name}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-slate-800 hover:bg-slate-900"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
