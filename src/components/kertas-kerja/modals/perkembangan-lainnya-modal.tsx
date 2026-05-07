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
import { useKertasKerjaDistinct } from "@/features/mbg/hooks/use-kertas-kerja";
import kanwilsData from "@/data/kdkanwil.json";

interface PerkembanganLainnyaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
  onSave: () => void;
}

export function PerkembanganLainnyaModal({
  open,
  onOpenChange,
  data,
  onSave,
}: PerkembanganLainnyaModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    kanwil: "",
    triwulan: "",
    indikator: "",
    satuan: "",
    keterangan: "",
  });

  const { data: distinctIndicatorsResponse } = useKertasKerjaDistinct(
    "data_bgn.indikator_triwulanan",
    "kategori",
    formData.tahun || new Date().getFullYear().toString()
  );

  const dynamicIndicators = Array.isArray(distinctIndicatorsResponse?.data)
    ? distinctIndicatorsResponse.data.map((item: any) => item.kategori)
    : [];

  const getValueCaseInsensitive = (item: any, targetKey: string) => {
    if (!item) return null;
    const lowerTarget = targetKey.toLowerCase();
    const actualKey = Object.keys(item).find(
      (key) => key.toLowerCase() === lowerTarget
    );
    return actualKey ? item[actualKey] : null;
  };

  useEffect(() => {
    if (data) {
      const indikatorValue = getValueCaseInsensitive(data, "kategori") || getValueCaseInsensitive(data, "indikator") || "";
      setFormData({
        tahun: getValueCaseInsensitive(data, "tahun") || "",
        kanwil: getValueCaseInsensitive(data, "kode_kanwil") || getValueCaseInsensitive(data, "kodekanwil") || "",
        triwulan: getValueCaseInsensitive(data, "triwulan") || "",
        indikator: indikatorValue,
        satuan: getSatuanByIndikator(indikatorValue),
        keterangan: getValueCaseInsensitive(data, "keterangan") || "",
      });
    } else {
      setFormData({
        tahun: new Date().getFullYear().toString(),
        kanwil: "",
        triwulan: "I",
        indikator: "",
        satuan: "",
        keterangan: "",
      });
    }
  }, [data, open]);

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Perkembangan Lainnya:", formData);
    onSave();
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      tahun: "",
      kanwil: "",
      triwulan: "",
      indikator: "",
      satuan: "",
      keterangan: "",
    });
  };

  const getSatuanByIndikator = (indikator: string) => {
    const mapping: Record<string, string> = {
      "Harapan Lama Sekolah (HLS)": "Poin",
      "Tingkat Kemiskinan": "%",
      "Prevalensi Stunting": "%",
      "Indeks Pembangunan Manusia (IPM)": "Poin",
      "Angka Putus Sekolah (APS/Drop Out Rate)": "%",
      "Biaya Pendidikan Dasar (Primary Education)": "Indeks",
      "Lainnya": "%",
    };
    return mapping[indikator] || "%";
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  const kanwilOptions = kanwilsData;

  const triwulanOptions = ["I", "II", "III", "IV"];

  const staticIndicators = [
    "Harapan Lama Sekolah (HLS)",
    "Tingkat Kemiskinan",
    "Prevalensi Stunting",
    "Indeks Pembangunan Manusia (IPM)",
    "Angka Putus Sekolah (APS/Drop Out Rate)",
    "Biaya Pendidikan Dasar (Primary Education)",
    "Lainnya",
  ];

  const indikatorOptions = dynamicIndicators.length > 0 ? dynamicIndicators : staticIndicators;

  const satuanOptions = ["Poin", "%", "Indeks"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {data
              ? "Edit Data Perkembangan Lainnya"
              : "Tambah Data Perkembangan Lainnya"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6">
          {/* Form Fields */}
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

            {/* Kanwil */}
            <div className="space-y-2">
              <Label htmlFor="kanwil">Kanwil</Label>
              <Select
                value={formData.kanwil}
                onValueChange={(value) =>
                  setFormData({ ...formData, kanwil: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih kanwil"
                  />
                </SelectTrigger>
                <SelectContent>
                  {kanwilOptions.map((kanwil: any) => (
                    <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil} title={kanwil.nmkanwil}>
                      <span className="truncate">{kanwil.nmkanwil}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Triwulan */}
            <div className="space-y-2">
              <Label htmlFor="triwulan">Triwulan</Label>
              <Select
                value={formData.triwulan}
                onValueChange={(value) =>
                  setFormData({ ...formData, triwulan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih triwulan"
                  />
                </SelectTrigger>
                <SelectContent>
                  {triwulanOptions.map((triwulan) => (
                    <SelectItem key={triwulan} value={triwulan}>
                      {triwulan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Indikator */}
            <div className="space-y-2">
              <Label htmlFor="indikator">Indikator</Label>
              <Select
                value={formData.indikator}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    indikator: value,
                    satuan: getSatuanByIndikator(value)
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih indikator"
                  />
                </SelectTrigger>
                <SelectContent>
                  {indikatorOptions.map((indikator: any) => (
                    <SelectItem
                      key={indikator}
                      value={indikator}
                      title={indikator}
                    >
                      <span className="truncate">{indikator}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Satuan */}
            <div className="space-y-2">
              <Label htmlFor="satuan">Satuan</Label>
              <Select
                disabled
                value={formData.satuan}
                onValueChange={(value) =>
                  setFormData({ ...formData, satuan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih satuan"
                  />
                </SelectTrigger>
                <SelectContent>
                  {satuanOptions.map((satuan: any) => (
                    <SelectItem key={satuan} value={satuan}>
                      {satuan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Masukkan keterangan"
              className="w-full min-h-[100px]"
            />
          </div>
        </div>
      </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
          >
            {data ? "Update" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
