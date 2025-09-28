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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";
import { useKppnByNoKmk } from "@/hooks/use-kppn-by-nokmk";
import { useKabKotaByNoKmk } from "@/hooks/use-kabkota-by-nokmk";

interface PencabutanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PencabutanModal({ open, onOpenChange }: PencabutanModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    dasarPenundaan: "",
    tahun: "",
    nomor: "",
    tanggalKmk: undefined as Date | undefined,
    uraianKmk: "",
    kdkppn: "",
    kdpemda: "",
  });
  const [isKmkPenundaanListOpen, setIsKmkPenundaanListOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Fetch Dasar Penundaan options (no_kmk) from backend
  const { data: dasarOptions, isLoading: dasarLoading, isError: dasarError } =
    useQuery<{ no_kmk: string }[]>({
      queryKey: ["dasar-penundaan-options"],
      queryFn: async () => {
        const res = await http.get(apiPath(`/transfer-daerah/dau/kmk/penundaan/dasar`), {
          signal: AbortSignal.timeout(20000),
        });
        const json = res.data;
        if (json?.success === false) throw new Error(json?.message || "Failed to fetch Dasar Penundaan options");
        return (json?.data as { no_kmk: string }[]) ?? [];
      },
      staleTime: 5 * 60 * 1000,
    });

  // Dependent options based on selected Dasar Penundaan (no_kmk)
  const { options: kppnOptions, isLoading: kppnLoading } = useKppnByNoKmk(
    formData.dasarPenundaan || undefined,
  );
  const { options: kabkotaOptions, isLoading: kabkotaLoading } = useKabKotaByNoKmk(
    formData.dasarPenundaan || undefined,
    formData.kdkppn || undefined,
  );

  const handleSubmit = async () => {
    try {
      // Basic validation before submit
      const errors: string[] = [];
      if (!formData.tahun) errors.push("Tahun wajib diisi");
      if (!formData.dasarPenundaan) errors.push("Dasar Penundaan wajib dipilih");
      if (!formData.nomor) errors.push("Nomor KMK Pencabutan wajib diisi");
      if (!formData.tanggalKmk) errors.push("Tanggal KMK Pencabutan wajib dipilih");
      if (errors.length) {
        alert(errors.join("\n"));
        return;
      }

      // Map fields to backend payload
      const payload = {
        no_kmk: formData.dasarPenundaan?.trim(),
        thangcabut: Number(formData.tahun),
        no_kmkcabut: formData.nomor?.trim(),
        tglcabut: formData.tanggalKmk
          ? `${formData.tanggalKmk.getFullYear()}-${String(
              formData.tanggalKmk.getMonth() + 1
            ).padStart(2, "0")}-${String(formData.tanggalKmk.getDate()).padStart(2, "0")}`
          : "",
        uraiancabut: formData.uraianKmk?.trim() || null,
        // kdkppn and kdpemda are optional for pencabutan save
      };
      const res = await http.post(apiPath(`/transfer-daerah/dau/kmk/penundaan`), payload, {
        signal: AbortSignal.timeout(20000),
      });
      const json = res.data;
      if (json?.success === false) {
        throw new Error(json?.message || "Gagal menyimpan data pencabutan");
      }

      // Invalidate list to refresh
      await queryClient.invalidateQueries({ queryKey: ["kmk-penundaan-list"] });

      onOpenChange(false);
      // Reset form
      setFormData({
        dasarPenundaan: "",
        tahun: "",
        nomor: "",
        tanggalKmk: undefined,
        uraianKmk: "",
        kdkppn: "",
        kdpemda: "",
      });
    } catch (e: any) {
      // Minimal UX feedback; replace with toast if available in project
      console.error(e);
      alert(e?.message || "Terjadi kesalahan saat menyimpan");
    }
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
      kdkppn: "",
      kdpemda: "",
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
            {/* Row 1: Tahun & Dasar Penundaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Dasar Penundaan */}
              <div className="space-y-2">
                <Label htmlFor="dasarPenundaan">Dasar Penundaan</Label>
                <Select
                  value={formData.dasarPenundaan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dasarPenundaan: value, kdkppn: "", kdpemda: "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      className="truncate"
                      placeholder={
                        dasarLoading
                          ? "Memuat..."
                          : dasarError
                          ? "Gagal memuat"
                          : "Pilih dasar penundaan"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(dasarOptions ?? []).map((opt) => (
                      <SelectItem key={opt.no_kmk} value={opt.no_kmk}>
                        {opt.no_kmk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Nomor & Tanggal KMK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Tanggal KMK */}
              <div className="space-y-2">
                <Label>Tanggal KMK</Label>
                <Popover
                  modal={false}
                  open={datePopoverOpen}
                  onOpenChange={setDatePopoverOpen}
                >
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
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.tanggalKmk}
                      onSelect={(date) => {
                        setFormData({ ...formData, tanggalKmk: date });
                        // close popover after selecting a date
                        setDatePopoverOpen(false);
                      }}
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
                disabled={!formData.dasarPenundaan}
                title={!formData.dasarPenundaan ? "Pilih Dasar Penundaan terlebih dahulu" : ""}
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
        noKmk={formData.dasarPenundaan}
        year={formData.tahun}
      />
    </>
  );
}
