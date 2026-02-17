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
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
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
  } | undefined;
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
      <DialogContent showCloseButton={false} className="sm:max-w-[600px] w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Rencana Sisa Realisasi</DialogTitle>
            <DialogDescription>
              Pilih filter dan masukkan nilai perkiraan tidak terserap untuk memperbarui rencana_sisa_realisasi
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <FieldGroup>
              {/* Tahun Anggaran */}
              <Field>
                <FieldLabel htmlFor="tahun-anggaran">
                  Tahun Anggaran <span className="text-red-500">*</span>
                </FieldLabel>
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
              </Field>

              {/* Triwulan */}
              <Field>
                <FieldLabel htmlFor="triwulan">
                  Triwulan <span className="text-red-500">*</span>
                </FieldLabel>
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
              </Field>

              {/* Kementerian */}
              <Field>
                <FieldLabel htmlFor="kementerian">
                  Kementerian <span className="text-red-500">*</span>
                </FieldLabel>
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
              </Field>

              {/* Jenis Belanja */}
              <Field>
                <FieldLabel htmlFor="jenis-belanja">
                  Jenis Belanja <span className="text-red-500">*</span>
                </FieldLabel>
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
              </Field>

              {/* Perkiraan Tidak Terserap */}
              <Field>
                <FieldLabel htmlFor="perkiraan-tidak-terserap">
                  Perkiraan Tidak Terserap <span className="text-red-500">*</span>
                </FieldLabel>
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
                <FieldDescription>
                  Masukkan perkiraan dana yang tidak akan terserap
                </FieldDescription>
              </Field>
            </FieldGroup>
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
