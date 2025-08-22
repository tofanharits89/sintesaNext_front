"use client";

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

const formSchema = z.object({
  tahun: z.string().min(1, "Tahun harus dipilih"),
  kppn: z.string().min(1, "KPPN harus dipilih"),
  jenisLaporan: z.string().min(1, "Jenis Laporan harus dipilih"),
  periodeLaporan: z.string().min(1, "Periode Laporan harus dipilih"),
  subPeriodeLaporan: z.string().optional(),
  uraian: z.string().min(1, "Uraian harus diisi"),
  file: z.any().refine((file) => file, "File harus diupload"),
});

interface LaporanKppnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaporanKppnModal({
  open,
  onOpenChange,
}: LaporanKppnModalProps) {
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [selectedJenisLaporan, setSelectedJenisLaporan] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun: "",
      kppn: "",
      jenisLaporan: "",
      periodeLaporan: "",
      subPeriodeLaporan: "",
      uraian: "",
      file: null,
    },
  });

  // Watch the current values
  const watchedSubPeriode = form.watch("subPeriodeLaporan");
  const watchedJenisLaporan = form.watch("jenisLaporan");
  const watchedPeriode = form.watch("periodeLaporan");

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Periode options based on selected jenis laporan
  const getPeriodeOptions = (jenisLaporan: string) => {
    if (jenisLaporan === "laporan-monev") {
      return [
        { value: "triwulan-1", label: "Triwulan I" },
        { value: "triwulan-2", label: "Triwulan II" },
        { value: "triwulan-3", label: "Triwulan III" },
        { value: "triwulan-4", label: "Triwulan IV" },
      ];
    } else {
      return [
        { value: "Bulanan", label: "Bulanan" },
        { value: "Semesteran", label: "Semesteran" },
        { value: "Tahunan", label: "Tahunan" },
        { value: "Triwulan 3", label: "Triwulan 3" },
      ];
    }
  };

  // Sub-periode options based on selected periode
  const getSubPeriodeOptions = (periode: string) => {
    switch (periode) {
      case "Bulanan":
        return Array.from({ length: 12 }, (_, i) => ({
          value: `bulan-${i + 1}`,
          label: new Date(2023, i).toLocaleString("id-ID", { month: "long" }),
        }));
      case "Semesteran":
        return [
          { value: "semester-1", label: "Semester I" },
          { value: "semester-2", label: "Semester II" },
        ];
      case "Tahunan":
        return [{ value: "tahunan", label: "Tahunan" }];
      case "Triwulan 3":
        return [
          { value: "triwulan-1", label: "Triwulan I" },
          { value: "triwulan-2", label: "Triwulan II" },
          { value: "triwulan-3", label: "Triwulan III" },
        ];
      default:
        return [];
    }
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Submitting KPPN Laporan:", values);
    // Handle form submission here
    onOpenChange(false);
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setSelectedPeriode("");
    setSelectedJenisLaporan("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload Laporan KPPN</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="laporan-kppn-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tahun */}
              <FormField
                control={form.control}
                name="tahun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              {/* KPPN sebagai Satker */}
              <FormField
                control={form.control}
                name="kppn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KPPN sebagai Satker</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Pilih KPPN"
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kppn-001">KPPN Jakarta I</SelectItem>
                        <SelectItem value="kppn-002">
                          KPPN Jakarta II
                        </SelectItem>
                        <SelectItem value="kppn-003">KPPN Bandung</SelectItem>
                        <SelectItem value="kppn-004">KPPN Surabaya</SelectItem>
                        <SelectItem value="kppn-005">KPPN Medan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jenis Laporan */}
              <FormField
                control={form.control}
                name="jenisLaporan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Laporan</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedJenisLaporan(value);
                        // Reset periode and sub-periode when jenis laporan changes
                        form.setValue("periodeLaporan", "");
                        form.setValue("subPeriodeLaporan", "");
                        setSelectedPeriode("");
                      }}
                      value={field.value}
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
                        <SelectItem value="laporan-keuangan">
                          Laporan Keuangan
                        </SelectItem>
                        <SelectItem value="laporan-monev">
                          Laporan Monev
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Periode Laporan */}
              <FormField
                control={form.control}
                name="periodeLaporan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode Laporan</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedPeriode(value);
                        // Reset sub-periode and set default value
                        const subPeriodeOptions = getSubPeriodeOptions(value);
                        const defaultSubPeriode =
                          subPeriodeOptions.length > 0
                            ? subPeriodeOptions[0].value
                            : "";
                        form.setValue("subPeriodeLaporan", defaultSubPeriode);
                      }}
                      value={field.value}
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
                        {getPeriodeOptions(watchedJenisLaporan || "").map(
                          (option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sub-Periode Laporan */}
              <FormField
                control={form.control}
                name="subPeriodeLaporan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Periode Laporan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={
                        !watchedPeriode ||
                        watchedJenisLaporan === "laporan-monev"
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              watchedJenisLaporan === "laporan-monev"
                                ? "Tidak diperlukan"
                                : watchedPeriode
                                ? "Pilih Sub-Periode"
                                : "Pilih Periode dulu"
                            }
                            className="truncate"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubPeriodeOptions(watchedPeriode || "").map(
                          (option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          )
                        )}
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            type="submit"
            form="laporan-kppn-form"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
