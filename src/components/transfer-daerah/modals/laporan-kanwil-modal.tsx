"use client";

import { Save,  X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useUploadLaporanKanwilOptions } from "@/hooks/use-upload-laporan-ref-options";

const formSchema = z.object({
  tahun: z.string().min(1, "Tahun harus dipilih"),
  kanwil: z.string().min(1, "Kanwil harus dipilih"),
  jenisLaporan: z.string().min(1, "Jenis Laporan harus dipilih"),
  periodeLaporan: z.string().min(1, "Periode Laporan harus dipilih"),
  uraian: z.string().min(1, "Uraian harus diisi"),
  file: z.any().refine((file) => file, "File harus diupload"),
});

interface LaporanKanwilModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaporanKanwilModal({
  open,
  onOpenChange,
}: LaporanKanwilModalProps) {
  const {
    options: kanwilOptions,
    isLoading: isKanwilLoading,
    error: kanwilError,
  } = useUploadLaporanKanwilOptions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun: "2026",
      kanwil: "",
      jenisLaporan: "laporan-monev", // Fixed to Laporan Monev only
      periodeLaporan: "",
      uraian: "",
      file: null,
    },
  });

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Submitting Kanwil Laporan:", values);
    // Handle form submission here
    onOpenChange(false);
    form.reset();
  };

  const handleTutup = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Upload Laporan Kanwil</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="laporan-kanwil-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {/* Row 1: Tahun + Kanwil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tahun */}
              <FormField
                control={form.control}
                name="tahun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Pilih Tahun"
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kanwil */}
              <FormField
                control={form.control}
                name="kanwil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kanwil</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Pilih Kanwil"
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kanwilOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value} title={item.label}>
                            <span className="truncate">{item.label}</span>
                          </SelectItem>
                        ))}
                        {isKanwilLoading && (
                          <SelectItem value="__loading_kanwil" disabled>
                            Memuat data Kanwil...
                          </SelectItem>
                        )}
                        {!isKanwilLoading && kanwilOptions.length === 0 && !kanwilError && (
                          <SelectItem value="__empty_kanwil" disabled>
                            Data Kanwil tidak tersedia
                          </SelectItem>
                        )}
                        {kanwilError && (
                          <SelectItem value="__error_kanwil" disabled>
                            Gagal memuat data Kanwil
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Jenis Laporan + Periode Laporan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jenis Laporan - Fixed to Laporan Monev */}
              <FormField
                control={form.control}
                name="jenisLaporan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Laporan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Pilih Jenis Laporan"
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="laporan-monev">
                          Laporan Monev
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Periode Laporan - Only Semester I or II */}
              <FormField
                control={form.control}
                name="periodeLaporan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode Laporan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Pilih Periode Laporan"
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="semester-1">Semester I</SelectItem>
                        <SelectItem value="semester-2">Semester II</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Uraian - Full Width */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="uraian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uraian</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan uraian laporan..."
                        className="w-full"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>File Upload</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleTutup}>
            <X className="h-4 w-4 mr-2" /> Batal
          </Button>
          <Button
            type="submit"
            form="laporan-kanwil-form"
            className="bg-slate-800 hover:bg-slate-900 text-white"
          >
            <Save className="h-4 w-4 mr-2" /> Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
