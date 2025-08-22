"use client";

import { useState, useEffect } from "react";
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

interface ProyeksiTkdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export function ProyeksiTkdModal({
  open,
  onOpenChange,
  editData,
}: ProyeksiTkdModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    kppn: "",
    kppnSebagaiSatker: "",
    periodeBulan: "",
    jenisKeperluan: "",
    jenisLaporan: "",
    keterangan: "",
    monthlyValues: {
      januari: "",
      februari: "",
      maret: "",
      april: "",
      mei: "",
      juni: "",
      juli: "",
      agustus: "",
      september: "",
      oktober: "",
      november: "",
      desember: "",
    },
  });

  // Pre-fill form data when editing
  useEffect(() => {
    if (editData && open) {
      // Map the editData to the form structure
      const mappedData = {
        tahun: editData.tahun || "",
        kppn: editData.kppn || "",
        kppnSebagaiSatker: editData.kppnSebagaiSatker || "",
        periodeBulan: editData.periode || "",
        jenisKeperluan: editData.jenisKeperluan || "",
        jenisLaporan: editData.jenisTkd || "",
        keterangan: editData.keterangan || "",
        monthlyValues: editData.monthlyValues || {
          januari: "",
          februari: "",
          maret: "",
          april: "",
          mei: "",
          juni: "",
          juli: "",
          agustus: "",
          september: "",
          oktober: "",
          november: "",
          desember: "",
        },
      };
      setFormData(mappedData);
    }
  }, [editData, open]);

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Proyeksi TKD:", formData);
    onOpenChange(false);
    // Reset form
    resetForm();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tahun: "",
      kppn: "",
      kppnSebagaiSatker: "",
      periodeBulan: "",
      jenisKeperluan: "",
      jenisLaporan: "",
      keterangan: "",
      monthlyValues: {
        januari: "",
        februari: "",
        maret: "",
        april: "",
        mei: "",
        juni: "",
        juli: "",
        agustus: "",
        september: "",
        oktober: "",
        november: "",
        desember: "",
      },
    });
  };

  const handleMonthlyValueChange = (month: string, value: string) => {
    setFormData({
      ...formData,
      monthlyValues: {
        ...formData.monthlyValues,
        [month]: value,
      },
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear + 5 - i).toString()
  );

  const months = [
    { key: "januari", label: "Januari" },
    { key: "februari", label: "Februari" },
    { key: "maret", label: "Maret" },
    { key: "april", label: "April" },
    { key: "mei", label: "Mei" },
    { key: "juni", label: "Juni" },
    { key: "juli", label: "Juli" },
    { key: "agustus", label: "Agustus" },
    { key: "september", label: "September" },
    { key: "oktober", label: "Oktober" },
    { key: "november", label: "November" },
    { key: "desember", label: "Desember" },
  ];

  const currentMonth = new Date()
    .toLocaleString("id-ID", { month: "long" })
    .toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Proyeksi TKD" : "Rekam Proyeksi TKD"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Selection Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* KPPN */}
            <div className="space-y-2">
              <Label htmlFor="kppn">KPPN</Label>
              <Select
                value={formData.kppn}
                onValueChange={(value) =>
                  setFormData({ ...formData, kppn: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KPPN Jakarta I" title="KPPN Jakarta I">
                    <span className="truncate">KPPN Jakarta I</span>
                  </SelectItem>
                  <SelectItem value="KPPN Jakarta II" title="KPPN Jakarta II">
                    <span className="truncate">KPPN Jakarta II</span>
                  </SelectItem>
                  <SelectItem value="KPPN Jakarta III" title="KPPN Jakarta III">
                    <span className="truncate">KPPN Jakarta III</span>
                  </SelectItem>
                  <SelectItem value="KPPN Bandung" title="KPPN Bandung">
                    <span className="truncate">KPPN Bandung</span>
                  </SelectItem>
                  <SelectItem value="KPPN Surabaya" title="KPPN Surabaya">
                    <span className="truncate">KPPN Surabaya</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* KPPN Sebagai Satker */}
            <div className="space-y-2">
              <Label htmlFor="kppnSebagaiSatker">KPPN Sebagai Satker</Label>
              <Select
                value={formData.kppnSebagaiSatker}
                onValueChange={(value) =>
                  setFormData({ ...formData, kppnSebagaiSatker: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih kode satker"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001" title="001">
                    <span className="truncate">001</span>
                  </SelectItem>
                  <SelectItem value="002" title="002">
                    <span className="truncate">002</span>
                  </SelectItem>
                  <SelectItem value="003" title="003">
                    <span className="truncate">003</span>
                  </SelectItem>
                  <SelectItem value="004" title="004">
                    <span className="truncate">004</span>
                  </SelectItem>
                  <SelectItem value="005" title="005">
                    <span className="truncate">005</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Periode Bulan */}
            <div className="space-y-2">
              <Label htmlFor="periodeBulan">Periode Bulan</Label>
              <Select
                value={formData.periodeBulan}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodeBulan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih periode bulan"
                  />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.key} value={month.key}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second row of selections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jenis Keperluan */}
            <div className="space-y-2">
              <Label htmlFor="jenisKeperluan">Jenis Keperluan</Label>
              <Select
                value={formData.jenisKeperluan}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisKeperluan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis keperluan"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alco" title="ALCo">
                    <span className="truncate">ALCo</span>
                  </SelectItem>
                  <SelectItem value="iku" title="IKU">
                    <span className="truncate">IKU</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Laporan */}
            <div className="space-y-2">
              <Label htmlFor="jenisLaporan">Jenis Laporan</Label>
              <Select
                value={formData.jenisLaporan}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisLaporan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis laporan"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01" title="01 - DAU">
                    <span className="truncate">01 - DAU</span>
                  </SelectItem>
                  <SelectItem value="02" title="02 - DBH">
                    <span className="truncate">02 - DBH</span>
                  </SelectItem>
                  <SelectItem value="03" title="03 - DAK Fisik">
                    <span className="truncate">03 - DAK Fisik</span>
                  </SelectItem>
                  <SelectItem value="04" title="04 - Dana Desa">
                    <span className="truncate">04 - Dana Desa</span>
                  </SelectItem>
                  <SelectItem value="05" title="05 - DAK Non Fisik">
                    <span className="truncate">05 - DAK Non Fisik</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monthly Input Fields */}
          <div className="mt-6">
            <Label className="text-base font-medium">
              Proyeksi Bulanan (dalam juta rupiah)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {months.map((month) => (
                <div key={month.key} className="space-y-2">
                  <Label htmlFor={month.key}>{month.label}</Label>
                  <Input
                    id={month.key}
                    type="number"
                    value={
                      formData.monthlyValues[
                        month.key as keyof typeof formData.monthlyValues
                      ]
                    }
                    onChange={(e) =>
                      handleMonthlyValueChange(month.key, e.target.value)
                    }
                    placeholder="0"
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div className="mt-6">
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Masukkan keterangan tambahan"
                rows={4}
                className="w-full"
              />
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
              className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
