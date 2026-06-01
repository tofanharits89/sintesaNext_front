"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save,  X,  Loader2, Building2 } from "lucide-react";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import type { DataKirimKppn } from "./penilaian-kppn";

const schema = z.object({
  sahlengkap: z.coerce
    .number()
    .min(0, "Nilai harus lebih besar atau sama dengan 0")
    .max(10, "Nilai harus kurang dari atau sama dengan 10"),
  sahsesuai: z.coerce
    .number()
    .min(0, "Nilai harus lebih besar atau sama dengan 0")
    .max(10, "Nilai harus kurang dari atau sama dengan 10"),
  jelaslengkap: z.coerce
    .number()
    .min(0, "Nilai harus lebih besar atau sama dengan 0")
    .max(10, "Nilai harus kurang dari atau sama dengan 10"),
  jelassesuai: z.coerce
    .number()
    .min(0, "Nilai harus lebih besar atau sama dengan 0")
    .max(10, "Nilai harus kurang dari atau sama dengan 10"),
  calklengkap: z.coerce
    .number()
    .min(0, "Nilai CAL harus lebih besar atau sama dengan 0")
    .max(10, "Nilai CAL harus kurang dari atau sama dengan 10"),
  calksesuai: z.coerce
    .number()
    .min(0, "Nilai CAL harus lebih besar atau sama dengan 0")
    .max(30, "Nilai CAL harus kurang dari atau sama dengan 30"),
  tabellengkap: z.coerce
    .number()
    .min(0, "Nilai Tabel harus lebih besar atau sama dengan 0")
    .max(5, "Nilai Tabel harus kurang dari atau sama dengan 5"),
  tabelsesuai: z.coerce
    .number()
    .min(0, "Nilai Tabel harus lebih besar atau sama dengan 0")
    .max(10, "Nilai Tabel harus kurang dari atau sama dengan 10"),
  lamplengkap: z.coerce
    .number()
    .min(0, "Nilai Lampiran harus lebih besar atau sama dengan 0")
    .max(7, "Nilai Lampiran harus kurang dari atau sama dengan 7"),
  lampsesuai: z.coerce
    .number()
    .min(0, "Nilai Lampiran harus lebih besar atau sama dengan 0")
    .max(8, "Nilai Lampiran harus kurang dari atau sama dengan 8"),
  username: z.string(),
  kdkppn: z.string(),
  thang: z.string(),
  periode: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface ModalKppnProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  kirim: DataKirimKppn;
}

function SelectField({
  field,
  count,
  placeholder = "-- Pilih --",
}: {
  field: {
    value: string | number;
    onChange: (v: string) => void;
    onBlur: () => void;
    name: string;
  };
  count: number;
  placeholder?: string;
}) {
  const val = field.value != null ? String(field.value) : "";
  return (
    <Select value={val} onValueChange={field.onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>{val !== "" ? val : undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: count }, (_, i) => (
          <SelectItem key={i} value={String(i)}>
            {String(i)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ModalKppn({
  open,
  onOpenChange,
  username,
  kirim,
}: ModalKppnProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      sahlengkap: 0,
      sahsesuai: 0,
      jelaslengkap: 0,
      jelassesuai: 0,
      calklengkap: 0,
      calksesuai: 0,
      tabellengkap: 0,
      tabelsesuai: 0,
      lamplengkap: 0,
      lampsesuai: 0,
      username,
      kdkppn: kirim[0].kdkppn,
      thang: kirim[0].thang,
      periode: kirim[0].periode,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await http.post(apiPath("/transfer-daerah/iku/simpan-lk-kppn"), values);
      toast.success("Data Berhasil Disimpan");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err?.response?.data?.error ??
          "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            Input Nilai Analisa Laporan Keuangan Jenis {kirim[0].periode} TA.{" "}
            {kirim[0].thang}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm font-medium flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {kirim[0].kdkppn} - KPPN {kirim[0].nmkppn}
          </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Pengesahan */}
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="sahlengkap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Pengesahan</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} placeholder="Kelengkapan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sahsesuai"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <SelectField field={field as any} count={11} placeholder="Kesesuaian" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Penjelasan */}
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="jelaslengkap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Penjelasan</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} placeholder="Kelengkapan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jelassesuai"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <SelectField field={field as any} count={11} placeholder="Kesesuaian" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabel */}
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="tabellengkap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tabel</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} placeholder="Kelengkapan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tabelsesuai"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <SelectField field={field as any} count={11} placeholder="Kesesuaian" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CALK */}
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="calklengkap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>CALK</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={11} placeholder="Kelengkapan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calksesuai"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <SelectField field={field as any} count={31} placeholder="Kesesuaian" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lampiran */}
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="lamplengkap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Lampiran</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={8} placeholder="Kelengkapan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lampsesuai"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <SelectField field={field as any} count={9} placeholder="Kesesuaian" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
            </div>
          </form>
        </Form>
        </div>

        <DialogFooter className="p-6 pt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading || form.formState.isSubmitting}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              <Save className="h-4 w-4 mr-2" /> Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
