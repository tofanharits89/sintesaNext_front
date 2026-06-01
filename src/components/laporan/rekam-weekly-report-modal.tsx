"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X,  Save,  Loader2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import type { LaporanPeriode } from "@/hooks/use-weekly-report";

const months = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const formSchema = z
  .object({
    periodeLaporan: z.enum(["mingguan", "bulanan"]),
    tahun: z.string().min(1, "Tahun harus dipilih"),
    tanggalAwal: z.date().optional(),
    tanggalAkhir: z.date().optional(),
    bulan: z.string().optional(),
    keterangan: z.string().min(1, "Keterangan harus diisi"),
    file: z.any().refine((file) => file instanceof File, "File harus diupload"),
  })
  .superRefine((values, ctx) => {
    if (values.periodeLaporan === "mingguan") {
      if (!values.tanggalAwal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal awal harus diisi",
          path: ["tanggalAwal"],
        });
      }
      if (!values.tanggalAkhir) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal akhir harus diisi",
          path: ["tanggalAkhir"],
        });
      }
      if (
        values.tanggalAwal &&
        values.tanggalAkhir &&
        values.tanggalAkhir < values.tanggalAwal
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal akhir tidak boleh lebih kecil dari tanggal awal",
          path: ["tanggalAkhir"],
        });
      }
    }

    if (values.periodeLaporan === "bulanan" && !values.bulan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bulan harus dipilih",
        path: ["bulan"],
      });
    }
  });

interface RekamWeeklyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultPeriode?: LaporanPeriode;
}

export function RekamWeeklyReportModal({
  open,
  onOpenChange,
  onSuccess,
  defaultPeriode = "mingguan",
}: RekamWeeklyReportModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodeLaporan: defaultPeriode,
      tahun: "",
      tanggalAwal: undefined,
      tanggalAkhir: undefined,
      bulan: "",
      keterangan: "",
      file: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const headers: HeadersInit = addCsrfToHeaders({});
      const response = await fetch(apiPath("/laporan/weekly-report"), {
        method: "POST",
        headers,
        credentials: "include",
        body: payload,
      });

      const text = await response.text();
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(text);
          message = parsed?.message || parsed?.error || message;
        } catch {
          // Keep fallback message.
        }
        throw new Error(message);
      }

      return text.trim() ? JSON.parse(text) : {};
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["laporan-report-data"],
        refetchType: "active",
      });
      toast.success("Laporan berhasil disimpan.");
      onOpenChange(false);
      form.reset({
        periodeLaporan: defaultPeriode,
        tahun: "",
        tanggalAwal: undefined,
        tanggalAkhir: undefined,
        bulan: "",
        keterangan: "",
        file: null,
      });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan laporan.";
      toast.error(message);
    },
  });

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () =>
      Array.from({ length: currentYear - 2019 }, (_, i) =>
        (currentYear - i).toString(),
      ),
    [currentYear],
  );

  const selectedPeriode = form.watch("periodeLaporan");

  const formatDateForApi = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit: SubmitHandler<z.infer<typeof formSchema>> = (values) => {
    const payload = new FormData();
    payload.append("tahun", values.tahun);
    payload.append("periode", values.periodeLaporan);
    payload.append("keterangan", values.keterangan);
    payload.append("file", values.file);

    if (values.periodeLaporan === "mingguan") {
      payload.append("tglawal", formatDateForApi(values.tanggalAwal!));
      payload.append("tglakhir", formatDateForApi(values.tanggalAkhir!));
    } else {
      payload.append("bulan", values.bulan || "");
    }

    mutation.mutate(payload);
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    onOpenChange(false);
    form.reset({
      periodeLaporan: defaultPeriode,
      tahun: "",
      tanggalAwal: undefined,
      tanggalAkhir: undefined,
      bulan: "",
      keterangan: "",
      file: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Data Laporan</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form
              id="rekam-weekly-report-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="periodeLaporan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periode Laporan</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "mingguan") {
                            form.setValue("bulan", "");
                          } else {
                            form.setValue("tanggalAwal", undefined);
                            form.setValue("tanggalAkhir", undefined);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Periode Laporan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mingguan">Mingguan</SelectItem>
                          <SelectItem value="bulanan">Bulanan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tahun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Tahun" />
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
              </div>

              {selectedPeriode === "mingguan" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tanggalAwal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Awal</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            placeholder="Pilih tanggal awal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tanggalAkhir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Akhir</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            placeholder="Pilih tanggal akhir"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="bulan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bulan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Bulan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan keterangan..."
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>File Upload</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            <X className="h-4 w-4 mr-2" /> Batal
          </Button>
          <Button
            type="submit"
            form="rekam-weekly-report-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Simpan</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
