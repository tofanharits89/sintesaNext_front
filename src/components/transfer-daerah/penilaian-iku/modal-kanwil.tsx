"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save,  X,  Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { DataKirimKanwil } from "./penilaian-kanwil";

const schema = z.object({
  ringkasan2: z.coerce.number().max(100, "Nilai maksimal 100"),
  penyusunan2: z.coerce.number().max(100, "Nilai maksimal 100"),
  metode2: z.coerce.number().max(100, "Nilai maksimal 100"),
  kesimpulan2: z.coerce
    .number()
    .min(50, "Nilai Kesimpulan harus lebih besar atau sama dengan 50")
    .max(98, "Nilai Kesimpulan harus kurang dari atau sama dengan 98"),
  kualitasdf2: z.coerce
    .number()
    .min(50, "Nilai DAK Fisik harus lebih besar atau sama dengan 50")
    .max(98, "Nilai DAK Fisik harus kurang dari atau sama dengan 98"),
  kualitasbos2: z.coerce
    .number()
    .min(50, "Nilai Dana BOS harus lebih besar atau sama dengan 50")
    .max(98, "Nilai Dana BOS harus kurang dari atau sama dengan 98"),
  kualitasdd2: z.coerce
    .number()
    .min(50, "Nilai Dana Desa harus lebih besar atau sama dengan 50")
    .max(98, "Nilai Dana Desa harus kurang dari atau sama dengan 98"),
  ket: z.string().optional(),
  periode: z.string(),
  thang: z.string(),
  kdkanwil: z.string(),
  analisa: z.string(),
  username: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface ModalKanwilProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  kirim: DataKirimKanwil;
}

export function ModalKanwil({
  open,
  onOpenChange,
  username,
  kirim,
}: ModalKanwilProps) {
  const [loading, setLoading] = useState(false);

  const nilaiAktif = kirim[0].analisa === "I" ? kirim[1] : kirim[2];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      ringkasan2: nilaiAktif.ringkasan ?? 0,
      penyusunan2: nilaiAktif.penyusunan ?? 0,
      metode2: nilaiAktif.metode ?? 0,
      kualitasdf2: nilaiAktif.kualitasdf ?? 50,
      kualitasbos2: nilaiAktif.kualitasbos ?? 50,
      kualitasdd2: nilaiAktif.kualitasdd ?? 50,
      kesimpulan2: nilaiAktif.kesimpulan ?? 50,
      ket: nilaiAktif.ket ?? "",
      periode: kirim[0].periode,
      thang: kirim[0].thang,
      kdkanwil: kirim[0].kdkanwil,
      analisa: kirim[0].analisa,
      username,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await http.post(
        apiPath("/transfer-daerah/iku/simpan-monev-kanwil"),
        values,
      );
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
            Input Nilai Analisa Laporan Monev Kanwil Semester {kirim[0].periode}{" "}
            TA. {kirim[0].thang} [Analisa {kirim[0].analisa}]
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm font-medium mb-4">
            KANWIL {kirim[0].nmkanwil}
          </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ringkasan2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penyajian Ringkasan Eksekutif</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Nilai Penyajian Ringkasan Eksekutif"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="penyusunan2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kesesuaian Latar Belakang, Tujuan dan Manfaat Pemantauan
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Kesesuaian Latar Belakang..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metode2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Metode Analisis dan Sistematika Penyajian
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Nilai Metode Analisis dan Sistematika Penyajian"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="text-sm font-medium mb-2">
                Kualitas Pemaparan Objek Analisis dan Kendala
              </p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="kualitasdf2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={50}
                          max={98}
                          placeholder="DAK Fisik"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kualitasbos2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={50}
                          max={98}
                          placeholder="Dana BOS"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kualitasdd2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={50}
                          max={98}
                          placeholder="Dana Desa"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="kesimpulan2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kesimpulan dan Rekomendasi</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      max={98}
                      placeholder="Nilai Kesimpulan dan Rekomendasi"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan Penilaian</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Keterangan Penilaian"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
