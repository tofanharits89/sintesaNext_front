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
import { KmkPenundaanListModal } from "./kmk-penundaan-list-modal";

interface PencabutanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PencabutanModal({ open, onOpenChange }: PencabutanModalProps) {
  const [formData, setFormData] = useState({
    dasarPenundaan: "",
    tahun: "",
    nomor: "",
    tanggalKmk: undefined as Date | undefined,
    uraianKmk: "",
  });
  const [isKmkPenundaanListOpen, setIsKmkPenundaanListOpen] = useState(false);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Mock data for Dasar Penundaan options
  const dasarPenundaanOptions = [
    { value: "1", label: "PP No. 55 Tahun 2005" },
    { value: "2", label: "PP No. 69 Tahun 2010" },
    { value: "3", label: "Permendagri No. 37 Tahun 2007" },
    { value: "4", label: "SE Mendagri No. 973.3/1659/SJ" },
    { value: "5", label: "Lainnya" },
  ];

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Pencabutan KMK:", formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      dasarPenundaan: "",
      tahun: "",
      nomor: "",
      tanggalKmk: undefined,
      uraianKmk: "",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setFormData({
      dasarPenundaan: "",
      tahun: "",
      nomor: "",
      tanggalKmk: undefined,
      uraianKmk: "",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pencabutan KMK</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dasar Penundaan */}
              <div className="space-y-2">
                <Label htmlFor="dasarPenundaan">Dasar Penundaan</Label>
                <Select
                  value={formData.dasarPenundaan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dasarPenundaan: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      className="truncate"
                      placeholder="Pilih dasar penundaan"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {dasarPenundaanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectValue
                      className="truncate"
                      placeholder="Pilih tahun"
                    />
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

              {/* Nomor */}
              <div className="space-y-2">
                <Label htmlFor="nomor">Nomor</Label>
                <Input
                  id="nomor"
                  value={formData.nomor}
                  onChange={(e) =>
                    setFormData({ ...formData, nomor: e.target.value })
                  }
                  placeholder="Masukkan nomor"
                  className="w-full"
                />
              </div>
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Full width fields */}
            <div className="mt-6">
              <div className="space-y-2">
                <Label htmlFor="uraianKmk">Uraian KMK</Label>
                <Textarea
                  id="uraianKmk"
                  value={formData.uraianKmk}
                  onChange={(e) =>
                    setFormData({ ...formData, uraianKmk: e.target.value })
                  }
                  placeholder="Masukkan uraian KMK"
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setIsKmkPenundaanListOpen(true)}
                className="bg-slate-800 text-white hover:bg-slate-900"
              >
                List KMK Penundaan
              </Button>
            </div>
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

      {/* KMK Penundaan List Modal */}
      <KmkPenundaanListModal
        open={isKmkPenundaanListOpen}
        onOpenChange={setIsKmkPenundaanListOpen}
      />
    </>
  );
}
