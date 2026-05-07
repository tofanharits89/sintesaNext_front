"use client";

import { useEffect, useState, useMemo } from "react";
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
import { cn } from "@/lib/utils/utils";

import { SearchableSelect } from "@/components/ui/searchable-select";

import jenisKMK from "@/data/jeniskmk_tkd.json";
import kriteriaKMK from "@/data/jeniskriteria_tkd.json";
import kppnList from "@/data/kdkppn_tkd.json";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { useDasarPenundaanOptions } from "@/hooks/use-dasar-penundaan";
import { useDasarPencabutanOptions } from "@/hooks/use-dasar-pencabutan";
import { useKppnByNoKmk } from "@/hooks/use-kppn-by-nokmk";
import { useKabKotaByNoKmk } from "@/hooks/use-kabkota-by-nokmk";

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
      let data: any;
      
      // All jenis types (including 3) go to the same endpoint and insert into ref_kmk_dau
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
      
      // For jenis 3, use data from Dasar Penundaan, otherwise use form inputs
      if (formData.jenis === "3") {
        // Find the selected Dasar Penundaan item to get its data
        const selectedPenundaan = (dasarPenundaanItems || []).find(
          (it: any) => String(it.no_kmk) === String(formData.dasarPenundaan)
        );
        
        console.log("Selected Dasar Penundaan:", selectedPenundaan);
        console.log("Dasar Penundaan Items:", dasarPenundaanItems);
        
        // Override tgl_kmk with the date from selected Dasar Penundaan
        if (selectedPenundaan?.tgl_kmk) {
          fd.set("tgl_kmk", String(selectedPenundaan.tgl_kmk));
        }
        
        // Main KMK fields come from Dasar Penundaan (the KMK being cancelled from ref_kmk_dau jenis='2')
        fd.append("no_kmk", formData.dasarPenundaan); // The penundaan KMK number
        const uraianValue = selectedPenundaan?.uraian ? String(selectedPenundaan.uraian).trim() : "";
        console.log("Uraian value:", uraianValue);
        fd.append("uraian", uraianValue); // Description from penundaan
        
        // Jenis 3 specific fields for ref_kmk_dau
        fd.append("thangcabut", formData.tahun); // Year of cancellation
        fd.append("no_kmkcabut", formData.dasarPencabutan); // The cancellation KMK number
        fd.append("tglcabut", formData.tanggalKmk
          ? `${formData.tanggalKmk.getFullYear()}-${String(formData.tanggalKmk.getMonth() + 1).padStart(2, "0")}-${String(formData.tanggalKmk.getDate()).padStart(2, "0")}`
          : "");
        fd.append("uraiancabut", formData.uraian || ""); // User-entered cancellation description
        fd.append("status_cabut", "1"); // Always 1 for new cancellations
        
        if (formData.kppn) {
          fd.append("kdkppn", formData.kppn);
        }
        if (formData.kabkota) {
          fd.append("kdpemda", formData.kabkota);
        }
      } else {
        fd.append("no_kmk", formData.nomorKmk);
        fd.append("uraian", formData.uraian);
      }
      
      if (formData.file) {
        fd.append("file", formData.file);
      }
      
      const resp = await http.post(apiPath(`/transfer-daerah/dau/kmk`), fd);
      data = resp.data;
      if (data?.success === false) {
        const msg = data?.message || data?.error || "Gagal menyimpan data KMK";
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

  const handleTutup = () => {
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

  // Dasar Penundaan options from backend (tkd25.ref_kmk_penundaan where jenis='2')
  const { items: dasarPenundaanItems, options: dasarPenundaanOptionsRaw, isLoading: dasarPenundaanLoading, error: dasarPenundaanError } =
    useDasarPenundaanOptions(formData.jenis === "3");

  const dasarPenundaanOptions = useMemo(() => {
    const seen = new Set();
    return dasarPenundaanOptionsRaw.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [dasarPenundaanOptionsRaw]);
  const {
    items: dasarPencabutanItems,
    options: dasarPencabutanOptionsRaw,
    isLoading: dasarPencabutanLoading,
    error: dasarPencabutanError,
  } = useDasarPencabutanOptions(formData.jenis === "3");

  const dasarPencabutanOptions = useMemo(() => {
    const seen = new Set();
    return dasarPencabutanOptionsRaw.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [dasarPencabutanOptionsRaw]);

  // Dynamic KPPN & Kab/Kota options based on selected Dasar Penundaan (no_kmk)
  const {
    options: kppnOptions,
    isLoading: kppnLoading,
    error: kppnError,
  } = useKppnByNoKmk(formData.jenis === "3" ? formData.dasarPenundaan : undefined);

  const {
    options: kabKotaOptions,
    isLoading: kabKotaLoading,
    error: kabKotaError,
  } = useKabKotaByNoKmk(
    formData.jenis === "3" ? formData.dasarPenundaan : undefined,
    formData.jenis === "3" ? formData.kppn : undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Tambah Data KMK</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 grid gap-3 py-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="grid gap-3">
              {/* Dasar Penundaan - full row */}
              <div className="space-y-2">
                <Label htmlFor="dasarPenundaan">Dasar Penundaan</Label>
                {dasarPenundaanLoading ? (
                  <div className="text-sm text-muted-foreground">Memuat opsi dasar penundaan...</div>
                ) : dasarPenundaanError ? (
                  <div className="text-sm text-red-600">Gagal memuat opsi dasar penundaan</div>
                ) : dasarPenundaanOptions.length > 0 ? (
                  <SearchableSelect
                    options={dasarPenundaanOptions}
                    value={formData.dasarPenundaan}
                    onValueChange={(value) => {
                      // Find the selected item to populate form fields
                      const selected = (dasarPenundaanItems || []).find(
                        (it: any) => String(it.no_kmk) === String(value)
                      );
                      setFormData({ 
                        ...formData, 
                        dasarPenundaan: value, 
                        kppn: "", 
                        kabkota: "",
                        // Keep jenis as "3", only update kriteria from the selected penundaan
                        kriteria: selected?.kriteria ? String(selected.kriteria).trim() : formData.kriteria,
                      });
                    }}
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
                {dasarPencabutanLoading ? (
                  <div className="text-sm text-muted-foreground">Memuat opsi dasar pencabutan...</div>
                ) : dasarPencabutanError ? (
                  <div className="text-sm text-red-600">Gagal memuat opsi dasar pencabutan</div>
                ) : dasarPencabutanOptions.length > 0 ? (
                  <SearchableSelect
                    options={dasarPencabutanOptions}
                    value={formData.dasarPencabutan}
                    onValueChange={(value) => {
                      const selected = (dasarPencabutanItems || []).find(
                        (it: any) => String(it.no_kmkcabut) === String(value)
                      );
                      setFormData({
                        ...formData,
                        dasarPencabutan: value,
                        tahun: selected?.thangcabut ? String(selected.thangcabut) : formData.tahun,
                        tanggalKmk: selected?.tglcabut ? new Date(selected.tglcabut) : formData.tanggalKmk,
                        uraian: selected?.uraiancabut ?? formData.uraian,
                      });
                    }}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="kppn">Pilih KPPN</Label>
                  {kppnLoading ? (
                    <div className="text-sm text-muted-foreground">Memuat KPPN...</div>
                  ) : kppnError ? (
                    <div className="text-sm text-red-600">Gagal memuat KPPN</div>
                  ) : (
                    <SearchableSelect
                      options={kppnOptions}
                      value={formData.kppn}
                      onValueChange={(value) =>
                        setFormData({ ...formData, kppn: value, kabkota: "" })
                      }
                      placeholder={formData.dasarPenundaan ? "Pilih KPPN" : "Pilih Dasar Penundaan terlebih dahulu"}
                      disabled={!formData.dasarPenundaan}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kabkota">Pilih Kab/Kota</Label>
                  {kabKotaLoading ? (
                    <div className="text-sm text-muted-foreground">Memuat Kab/Kota...</div>
                  ) : kabKotaError ? (
                    <div className="text-sm text-red-600">Gagal memuat Kab/Kota</div>
                  ) : (
                    <SearchableSelect
                      options={kabKotaOptions}
                      value={formData.kabkota}
                      onValueChange={(value) => setFormData({ ...formData, kabkota: value })}
                      placeholder={formData.kppn ? "Pilih Kab/Kota" : "Pilih KPPN terlebih dahulu"}
                      disabled={!formData.kppn}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        "w-full justify-start text-left font-normal bg-zinc-100 dark:bg-black",
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

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTutup}>
              Tutup
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-slate-800 hover:bg-slate-900"
            >
              {submitting ? "Saving..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
