"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
}: {
  field: {
    value: string | number;
    onChange: (v: string) => void;
    onBlur: () => void;
    name: string;
  };
  count: number;
}) {
  return (
    <Select value={String(field.value)} onValueChange={field.onChange}>
      <SelectTrigger>
        <SelectValue placeholder="-- Pilih --" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: count }, (_, i) => (
          <SelectItem key={i} value={String(i)}>
            {i}
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

  const colClass = "grid grid-cols-2 gap-4 mb-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-600 text-base">
            Input Nilai Analisa Laporan Keuangan Jenis {kirim[0].periode} TA.{" "}
            {kirim[0].thang}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-green-600 font-medium">
          KPPN {kirim[0].nmkppn}
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Pengesahan */}
            <div className={colClass}>
              <FormField
                control={form.control}
                name="sahlengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600">
                      &#x27A1; Pengesahan
                    </FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sahsesuai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>&nbsp;</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={11} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Penjelasan */}
            <div className={colClass}>
              <FormField
                control={form.control}
                name="jelaslengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600">
                      &#x27A1; Penjelasan
                    </FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jelassesuai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>&nbsp;</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={11} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabel */}
            <div className={colClass}>
              <FormField
                control={form.control}
                name="tabellengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600">
                      &#x27A1; Tabel
                    </FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tabelsesuai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>&nbsp;</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={11} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CALK */}
            <div className={colClass}>
              <FormField
                control={form.control}
                name="calklengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600">
                      &#x27A1; CALK
                    </FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={11} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calksesuai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>&nbsp;</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={31} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lampiran */}
            <div className={colClass}>
              <FormField
                control={form.control}
                name="lamplengkap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600">
                      &#x27A1; Lampiran
                    </FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lampsesuai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>&nbsp;</FormLabel>
                    <FormControl>
                      <SelectField field={field as any} count={9} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
