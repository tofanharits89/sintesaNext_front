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

interface HargaKomoditasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
  onSave: () => void;
}

export function HargaKomoditasModal({
  open,
  onOpenChange,
  data,
  onSave,
}: HargaKomoditasModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    kanwil: "",
    triwulan: "",
    indikator: "",
    satuan: "",
    keterangan: "",
  });

  const { data: distinctIndicatorsResponse } = useKertasKerjaDistinct(
    "data_bgn.indikator_bapanas",
    "indikator",
    formData.tahun || new Date().getFullYear().toString()
  );

  const dynamicIndicators = Array.isArray(distinctIndicatorsResponse?.data)
    ? distinctIndicatorsResponse.data.map((item: any) => item.indikator)
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
      setFormData({
        tahun: getValueCaseInsensitive(data, "tahun") || "",
        kanwil: getValueCaseInsensitive(data, "kode_kanwil") || getValueCaseInsensitive(data, "kodekanwil") || "",
        triwulan: getValueCaseInsensitive(data, "triwulan") || "",
        indikator: getValueCaseInsensitive(data, "indikator") || "",
        satuan: getValueCaseInsensitive(data, "satuan") || getValueCaseInsensitive(data, "customsatuan") || "",
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
    console.log("Submitting Harga Komoditas:", formData);
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  const kanwilOptions = kanwilsData;

  const triwulanOptions = ["I", "II", "III", "IV"];

  const staticIndicators = [
    "Beras Medium",
    "Karbohidrat",
    "Protein Hewani",
    "Minyak & Lemak",
    "Sayur & Bumbu",
    "Telur Ayam Ras",
    "Lain-lain",
  ];

  const komoditasOptions = dynamicIndicators.length > 0 ? dynamicIndicators : staticIndicators;

  const satuanOptions = [
    "Rp/Kg",
    "Rp/Liter",
    "Rp/Butir",
    "Rp/Ekor",
    "Rp/Kaleng",
    "Rp/Bungkus",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {data ? "Edit Data Harga Komoditas" : "Tambah Data Harga Komoditas"}
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
                  setFormData({ ...formData, indikator: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih komoditas"
                  />
                </SelectTrigger>
                <SelectContent>
                  {komoditasOptions.map((komoditas: any) => (
                    <SelectItem
                      key={komoditas}
                      value={komoditas}
                      title={komoditas}
                    >
                      <span className="truncate">{komoditas}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Satuan */}
            <div className="space-y-2">
              <Label htmlFor="satuan">Satuan</Label>
              <Select
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
                  {satuanOptions.map((satuan) => (
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
