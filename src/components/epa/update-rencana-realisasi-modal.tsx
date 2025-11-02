"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UpdateRencanaRealisasiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions?: {
    tahunList: string[];
    triwulanList: string[];
    kementerianList: Array<{ kddept: string; nmdept: string }>;
    jenisBelanjList: Array<{ kdgbkpk: string; nmgbkpk: string }>;
  };
  onSubmit: (data: {
    thang: string;
    triwulan: string;
    kddept: string;
    kdgbkpk: string;
    rencanaSisaRealisasi: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function UpdateRencanaRealisasiModal({
  open,
  onOpenChange,
  filterOptions,
  onSubmit,
  isSubmitting = false,
}: UpdateRencanaRealisasiModalProps) {
  const [thang, setThang] = useState<string>("");
  const [triwulan, setTriwulan] = useState<string>("");
  const [kddept, setKddept] = useState<string>("");
  const [kdgbkpk, setKdgbkpk] = useState<string>("");
  const [rencanaSisaRealisasi, setRencanaSisaRealisasi] = useState<string>("");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setThang("");
      setTriwulan("");
      setKddept("");
      setKdgbkpk("");
      setRencanaSisaRealisasi("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!thang || !triwulan || !kddept || !kdgbkpk) {
      alert("Harap lengkapi semua field yang wajib diisi");
      return;
    }

    const rencanaValue = parseFloat(rencanaSisaRealisasi);
    if (isNaN(rencanaValue)) {
      alert("Perkiraan Tidak Terserap harus berupa angka");
      return;
    }

    try {
      await onSubmit({
        thang,
        triwulan,
        kddept,
        kdgbkpk,
        rencanaSisaRealisasi: rencanaValue,
      });
      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled in onSubmit, keep modal open on error
      console.error("Submit error:", error);
    }
  };

  const isFormValid = thang && triwulan && kddept && kdgbkpk && rencanaSisaRealisasi;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Rencana Sisa Realisasi</DialogTitle>
            <DialogDescription>
              Pilih filter dan masukkan nilai perkiraan tidak terserap untuk memperbarui rencana_sisa_realisasi
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Tahun Anggaran */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tahun-anggaran" className="text-right">
                Tahun Anggaran <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={thang} onValueChange={setThang} disabled={isSubmitting}>
                  <SelectTrigger id="tahun-anggaran">
                    <SelectValue placeholder="Pilih Tahun Anggaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.tahunList.map((tahun) => (
                      <SelectItem key={tahun} value={tahun}>
                        {tahun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Triwulan */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="triwulan" className="text-right">
                Triwulan <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={triwulan} onValueChange={setTriwulan} disabled={isSubmitting}>
                  <SelectTrigger id="triwulan">
                    <SelectValue placeholder="Pilih Triwulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.triwulanList.map((tw) => (
                      <SelectItem key={tw} value={tw}>
                        {tw}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kementerian */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kementerian" className="text-right">
                Kementerian <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={kddept} onValueChange={setKddept} disabled={isSubmitting}>
                  <SelectTrigger id="kementerian">
                    <SelectValue placeholder="Pilih Kementerian" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.kementerianList.map((kementerian) => (
                      <SelectItem key={kementerian.kddept} value={kementerian.kddept}>
                        {kementerian.kddept} - {kementerian.nmdept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Jenis Belanja */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jenis-belanja" className="text-right">
                Jenis Belanja <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select value={kdgbkpk} onValueChange={setKdgbkpk} disabled={isSubmitting}>
                  <SelectTrigger id="jenis-belanja">
                    <SelectValue placeholder="Pilih Jenis Belanja" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.jenisBelanjList.map((jb) => (
                      <SelectItem key={jb.kdgbkpk} value={jb.kdgbkpk}>
                        {jb.kdgbkpk} - {jb.nmgbkpk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Perkiraan Tidak Terserap */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="perkiraan-tidak-terserap" className="text-right">
                Perkiraan Tidak Terserap <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="perkiraan-tidak-terserap"
                  type="number"
                  step="0.01"
                  placeholder="Masukkan nilai"
                  value={rencanaSisaRealisasi}
                  onChange={(e) => setRencanaSisaRealisasi(e.target.value)}
                  disabled={isSubmitting}
                  className="text-right"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
