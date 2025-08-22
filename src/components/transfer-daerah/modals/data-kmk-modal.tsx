"use client";

import { useState } from "react";
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

interface DataKmkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataKmkModal({ open, onOpenChange }: DataKmkModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    tanggalKmk: undefined as Date | undefined,
    nomorKmk: "",
    uraian: "",
    jenis: "",
    kriteria: "",
    file: null as File | null,
  });

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Data KMK:", formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      tahun: "",
      tanggalKmk: undefined,
      nomorKmk: "",
      uraian: "",
      jenis: "",
      kriteria: "",
      file: null,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setFormData({
      tahun: "",
      tanggalKmk: undefined,
      nomorKmk: "",
      uraian: "",
      jenis: "",
      kriteria: "",
      file: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tambah Data KMK</DialogTitle>
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

            {/* Tanggal KMK */}
            <div className="space-y-2">
              <Label>Tanggal KMK</Label>
              <Popover>
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggalKmk}
                    onSelect={(date) =>
                      setFormData({ ...formData, tanggalKmk: date })
                    }
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

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jenis KMK */}
            <div className="space-y-2">
              <Label htmlFor="jenis">Jenis KMK</Label>
              <Select
                value={formData.jenis}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenis: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis KMK"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" title="Kode 1 - Potongan SPM">
                    <span className="truncate">Kode 1 - Potongan SPM</span>
                  </SelectItem>
                  <SelectItem value="2" title="Kode 2 - Penundaan">
                    <span className="truncate">Kode 2 - Penundaan</span>
                  </SelectItem>
                  <SelectItem value="3" title="Kode 3 - Cabut Penundaan">
                    <span className="truncate">Kode 3 - Cabut Penundaan</span>
                  </SelectItem>
                  <SelectItem value="4" title="Kode 4 - Potongan ADD">
                    <span className="truncate">Kode 4 - Potongan ADD</span>
                  </SelectItem>
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
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih kriteria KMK"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunggakan PHLN" title="Tunggakan PHLN">
                    <span className="truncate">Tunggakan PHLN</span>
                  </SelectItem>
                  <SelectItem value="Pinjaman PEN" title="Pinjaman PEN">
                    <span className="truncate">Pinjaman PEN</span>
                  </SelectItem>
                  <SelectItem
                    value="Intercept Earmarked"
                    title="Intercept Earmarked"
                  >
                    <span className="truncate">Intercept Earmarked</span>
                  </SelectItem>
                  <SelectItem
                    value="Potongan Dana Transfer"
                    title="Potongan Dana Transfer"
                  >
                    <span className="truncate">Potongan Dana Transfer</span>
                  </SelectItem>
                  <SelectItem value="Sisa Hibah" title="Sisa Hibah">
                    <span className="truncate">Sisa Hibah</span>
                  </SelectItem>
                  <SelectItem value="Potongan JKN" title="Potongan JKN">
                    <span className="truncate">Potongan JKN</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Full width fields */}
          <div className="mt-6">
            <div className="space-y-4">
              {/* Uraian */}
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

              {/* File KMK */}
              <div className="space-y-2">
                <Label htmlFor="file">File KMK</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer w-full"
                />
                {formData.file && (
                  <p className="text-sm text-muted-foreground">
                    File terpilih: {formData.file.name}
                  </p>
                )}
              </div>
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
              className="bg-slate-800 hover:bg-slate-900"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
