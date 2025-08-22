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

interface PencabutanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PencabutanModal({ open, onOpenChange }: PencabutanModalProps) {
  const [formData, setFormData] = useState({
    nomorKmkAsal: "",
    tanggalPencabutan: undefined as Date | undefined,
    nomorKmkPencabutan: "",
    alasanPencabutan: "",
    nilaiPencabutan: "",
    file: null as File | null,
  });

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Pencabutan:", formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      nomorKmkAsal: "",
      tanggalPencabutan: undefined,
      nomorKmkPencabutan: "",
      alasanPencabutan: "",
      nilaiPencabutan: "",
      file: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pencabutan KMK</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nomorKmkAsal">Nomor KMK Asal</Label>
            <Select
              value={formData.nomorKmkAsal}
              onValueChange={(value) =>
                setFormData({ ...formData, nomorKmkAsal: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih nomor KMK yang akan dicabut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KMK-001/2024">
                  KMK-001/2024 - Alokasi DAU Triwulan I
                </SelectItem>
                <SelectItem value="KMK-002/2024">
                  KMK-002/2024 - Alokasi DAU Triwulan II
                </SelectItem>
                <SelectItem value="KMK-003/2024">
                  KMK-003/2024 - Alokasi DAU Triwulan III
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Pencabutan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.tanggalPencabutan && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggalPencabutan
                      ? format(formData.tanggalPencabutan, "dd/MM/yyyy")
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggalPencabutan}
                    onSelect={(date) =>
                      setFormData({ ...formData, tanggalPencabutan: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomorKmkPencabutan">Nomor KMK Pencabutan</Label>
              <Input
                id="nomorKmkPencabutan"
                value={formData.nomorKmkPencabutan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nomorKmkPencabutan: e.target.value,
                  })
                }
                placeholder="Masukkan nomor KMK pencabutan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nilaiPencabutan">Nilai Pencabutan</Label>
            <Input
              id="nilaiPencabutan"
              type="number"
              value={formData.nilaiPencabutan}
              onChange={(e) =>
                setFormData({ ...formData, nilaiPencabutan: e.target.value })
              }
              placeholder="Masukkan nilai pencabutan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alasanPencabutan">Alasan Pencabutan</Label>
            <Textarea
              id="alasanPencabutan"
              value={formData.alasanPencabutan}
              onChange={(e) =>
                setFormData({ ...formData, alasanPencabutan: e.target.value })
              }
              placeholder="Masukkan alasan pencabutan"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File Pencabutan</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {formData.file && (
              <p className="text-sm text-muted-foreground">
                File terpilih: {formData.file.name}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>Simpan Pencabutan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
