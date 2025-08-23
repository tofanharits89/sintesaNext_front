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

  useEffect(() => {
    if (data) {
      setFormData({
        tahun: data.tahun || "",
        kanwil: data.kanwil || "",
        triwulan: data.triwulan || "",
        indikator: data.indikator || "",
        satuan: data.satuan || "",
        keterangan: data.keterangan || "",
      });
    } else {
      setFormData({
        tahun: "",
        kanwil: "",
        triwulan: "",
        indikator: "",
        satuan: "",
        keterangan: "",
      });
    }
  }, [data, open]);

  const handleSubmit = () => {
    // Handle form submission
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

  const kanwilOptions = [
    "Kanwil DJPb Sumut",
    "Kanwil DJPb Sumbar",
    "Kanwil DJPb Riau",
    "Kanwil DJPb Jambi",
    "Kanwil DJPb Sumsel",
    "Kanwil DJPb Lampung",
    "Kanwil DJPb Jabar",
    "Kanwil DJPb Jateng",
    "Kanwil DJPb Jatim",
    "Kanwil DJPb DKI Jakarta",
    "Kanwil DJPb Bali Nusra",
    "Kanwil DJPb Kalbar",
    "Kanwil DJPb Kalteng",
    "Kanwil DJPb Kalsel",
    "Kanwil DJPb Kaltara",
    "Kanwil DJPb Sulut",
    "Kanwil DJPb Sulteng",
    "Kanwil DJPb Sulsel",
    "Kanwil DJPb Sultra",
    "Kanwil DJPb Gorontalo",
    "Kanwil DJPb Maluku",
    "Kanwil DJPb Malut",
    "Kanwil DJPb Papua",
    "Kanwil DJPb Papua Barat",
  ];

  const triwulanOptions = ["I", "II", "III", "IV"];

  const komoditasOptions = [
    "Beras Premium",
    "Beras Medium",
    "Daging Sapi",
    "Daging Ayam",
    "Telur Ayam",
    "Minyak Goreng",
    "Gula Pasir",
    "Bawang Merah",
    "Bawang Putih",
    "Cabai Merah",
    "Cabai Rawit",
    "Susu Kental Manis",
    "Tepung Terigu",
    "Ikan Segar",
    "Tomat",
    "Wortel",
  ];

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
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {data ? "Edit Data Harga Komoditas" : "Tambah Data Harga Komoditas"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
                  {kanwilOptions.map((kanwil) => (
                    <SelectItem key={kanwil} value={kanwil} title={kanwil}>
                      <span className="truncate">{kanwil}</span>
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
                  {komoditasOptions.map((komoditas) => (
                    <SelectItem
                      key={komoditas}
                      value={`Harga ${komoditas}`}
                      title={`Harga ${komoditas}`}
                    >
                      <span className="truncate">Harga {komoditas}</span>
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

        <DialogFooter>
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
