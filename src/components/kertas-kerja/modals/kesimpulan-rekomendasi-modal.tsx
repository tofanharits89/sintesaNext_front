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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface KesimpulanRekomendasiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
  onSave: () => void;
}

export function KesimpulanRekomendasiModal({
  open,
  onOpenChange,
  data,
  onSave,
}: KesimpulanRekomendasiModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    kanwil: "",
    triwulan: "",
    kesimpulan: "",
    rekomendasi: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        tahun: data.tahun || "",
        kanwil: data.kanwil || "",
        triwulan: data.triwulan || "",
        kesimpulan: data.kesimpulan || "",
        rekomendasi: data.rekomendasi || "",
      });
    } else {
      setFormData({
        tahun: "",
        kanwil: "",
        triwulan: "",
        kesimpulan: "",
        rekomendasi: "",
      });
    }
  }, [data, open]);

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Kesimpulan & Rekomendasi:", formData);
    onSave();
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      tahun: "",
      kanwil: "",
      triwulan: "",
      kesimpulan: "",
      rekomendasi: "",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-4xl sm:max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {data
              ? "Edit Data Kesimpulan & Rekomendasi"
              : "Tambah Data Kesimpulan & Rekomendasi"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Kesimpulan */}
          <div className="space-y-2 mt-6">
            <Label htmlFor="kesimpulan">Kesimpulan</Label>
            <Textarea
              id="kesimpulan"
              value={formData.kesimpulan}
              onChange={(e) =>
                setFormData({ ...formData, kesimpulan: e.target.value })
              }
              placeholder="Masukkan kesimpulan analisis"
              className="w-full min-h-[120px]"
            />
          </div>

          {/* Rekomendasi */}
          <div className="space-y-2">
            <Label htmlFor="rekomendasi">Rekomendasi</Label>
            <Textarea
              id="rekomendasi"
              value={formData.rekomendasi}
              onChange={(e) =>
                setFormData({ ...formData, rekomendasi: e.target.value })
              }
              placeholder="Masukkan rekomendasi tindak lanjut"
              className="w-full min-h-[120px]"
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
