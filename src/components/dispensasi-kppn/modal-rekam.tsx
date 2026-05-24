"use client";

import React, { useState, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import moment from "moment";
import { X, Save } from "lucide-react";
import CekKppn from "./cek-kppn";
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

interface Satker {
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
}

interface FormValues {
  tanggalPermohonan: string | null;
  nomorPermohonan: string;
  satker: string;
  kppn: string;
  alasan: string;
  tanggalPersetujuan: string | null;
  nomorPersetujuan: string;
  jeniskontrak: string;
  alasanLainnya?: string | undefined;
  tahun: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const validationSchema = z.object({
  tanggalPermohonan: z.any().refine(val => val !== null && val !== undefined && val !== "", "Tanggal Permohonan harus diisi"),
  tanggalPersetujuan: z.any().refine(val => val !== null && val !== undefined && val !== "", "Tanggal Persetujuan harus diisi"),
  nomorPermohonan: z.string().min(1, "Nomor Permohonan harus diisi"),
  satker: z.string().min(1, "Satker harus diisi"),
  alasan: z.string().min(1, "Alasan harus dipilih"),
  nomorPersetujuan: z.string().min(1, "Nomor Persetujuan harus diisi"),
  kppn: z.string().min(1, "KPPN harus dipilih"),
  tahun: z.string().min(1, "Tahun harus dipilih"),
  jeniskontrak: z.string().min(1, "Jenis Kontrak harus dipilih"),
  alasanLainnya: z.string().optional().or(z.literal(""))
}).superRefine((data, ctx) => {
  if (data.tanggalPermohonan && data.tanggalPersetujuan) {
    const tglPermohonan = new Date(data.tanggalPermohonan);
    const tglPersetujuan = new Date(data.tanggalPersetujuan);
    if (tglPermohonan > tglPersetujuan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tanggalPermohonan"],
        message: "Tanggal Permohonan tidak boleh lebih besar dari Tanggal Persetujuan"
      });
    }
  }

  if (data.alasan === "07" && (!data.alasanLainnya || data.alasanLainnya.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["alasanLainnya"],
      message: "Keterangan harus diisi"
    });
  }
});

const Rekam: React.FC<Props> = ({ show, onHide }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<Satker | null>(null);
  const [searchResults, setSearchResults] = useState<Satker[]>([]);
  const [data, setData] = useState<Satker[]>([]);
  const [jeniskontrak, setJenisKontrak] = useState("");
  const [tahun, setTahun] = useState("");
  const [kppn, setCekKppn] = useState("");
  const [dispen, setDispen] = useState("");

  const initialValues: FormValues = {
    tanggalPermohonan: null,
    nomorPermohonan: "",
    satker: "",
    kppn: kppn,
    alasan: "",
    tanggalPersetujuan: null,
    nomorPersetujuan: "",
    jeniskontrak: jeniskontrak,
    alasanLainnya: "",
    tahun: tahun,
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    values: initialValues,
  });

  const handleCekKppn = (kppnVal: string) => {
    setCekKppn(kppnVal);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await apiClient.post("/dispensasi/simpan-kontrak", values);

      toast.success("Data Berhasil Disimpan");
      setSearchResults([]);
      setLoading(false);
      handleModalClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    let query = "SELECT kdsatker,nmsatker,kdkppn FROM dbref.t_satker_kppn_2025";

    if (kppn !== "000" && kppn !== "") {
      query += ` WHERE kdkppn='${kppn}'`;
    }

    const encryptedQuery = btoa(query);
    try {
      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999999&page=0`
      );

      setData(result.result);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    }
  };

  useEffect(() => {
    getData();
  }, [kppn]);

  useEffect(() => {
    if (data.length > 0) {
      setSearchResults(data.slice(0, 100));
    }
  }, [data]);

  const handleModalClose = () => {
    setSelectedSatker(null);
    setSearchResults([]);
    setCekKppn("");
    setDispen("");
    onHide();
    setJenisKontrak("");
    setTahun("");
    reset({
      tanggalPermohonan: null,
      nomorPermohonan: "",
      satker: "",
      kppn: "",
      alasan: "",
      tanggalPersetujuan: null,
      nomorPersetujuan: "",
      jeniskontrak: "",
      alasanLainnya: "",
      tahun: "",
    });
  };

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-zinc-100 dark:bg-black px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent showCloseButton={false} className="max-w-4xl sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Dispensasi Kontrak KPPN</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tahun Anggaran</Label>
                  <Controller
                    control={control}
                    name="tahun"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setTahun(val);
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors.tahun ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Tahun ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">TA 2024</SelectItem>
                          <SelectItem value="2025">TA 2025</SelectItem>
                          <SelectItem value="2026">TA 2026</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tahun && (
                    <div className="text-red-500 text-sm mt-1">{errors.tahun.message}</div>
                  )}
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="space-y-2">
                  <Label className="font-bold">Jenis Dispensasi</Label>
                  <Controller
                    control={control}
                    name="jeniskontrak"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setJenisKontrak(val);
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors.jeniskontrak ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Jenis ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">Kontrak</SelectItem>
                          <SelectItem value="02">Adendum Kontrak</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.jeniskontrak && (
                    <div className="text-red-500 text-sm mt-1">{errors.jeniskontrak.message}</div>
                  )}
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="space-y-2">
                  <Label className="font-bold">KPPN</Label>
                  <Controller
                    control={control}
                    name="kppn"
                    render={({ field }) => (
                      <CekKppn
                        value={field.value}
                        className={`${inputClass} ${errors.kppn ? "border-red-500" : ""}`}
                        onChange={(e: string) => {
                          field.onChange(e);
                          handleCekKppn(e);
                        }}
                      />
                    )}
                  />
                  {errors.kppn && (
                    <div className="text-red-500 text-sm mt-1">{errors.kppn.message}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tanggal Permohonan</Label>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="tanggalPermohonan"
                      render={({ field }) => (
                        <DatePicker
                          date={
                            field.value
                              ? moment(field.value).toDate()
                              : undefined
                          }
                          onDateChange={(date: Date | undefined) => {
                            field.onChange(date ? moment(date).format("YYYY-MM-DD") : null);
                          }}
                          placeholder="Tgl Permohonan"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  {errors.tanggalPermohonan && (
                    <div className="text-red-500 text-sm mt-1">{errors.tanggalPermohonan.message}</div>
                  )}
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="space-y-2">
                  <Label className="font-bold">Nomor Permohonan</Label>
                  <Input
                    {...register("nomorPermohonan")}
                    type="text"
                    placeholder="Nomor Permohonan"
                    className={errors.nomorPermohonan ? "border-red-500" : ""}
                  />
                  {errors.nomorPermohonan && (
                    <div className="text-red-500 text-sm mt-1">{errors.nomorPermohonan.message}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Satker</Label>
              <Controller
                control={control}
                name="satker"
                render={({ field }) => (
                  <SearchableSelect
                    options={searchResults.map((item) => ({
                      value: item.kdsatker,
                      label: `${item.kdsatker} - ${item.nmsatker}`,
                    }))}
                    value={field.value}
                    onValueChange={(val) => {
                      const selected = searchResults.find((item) => item.kdsatker === val);
                      field.onChange(val);
                      setSelectedSatker(selected || null);
                    }}
                    placeholder="Ketik Kode atau Nama Satker..."
                    className={errors.satker ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.satker && (
                <div className="text-red-500 text-sm mt-1">{errors.satker.message}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tanggal Persetujuan</Label>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="tanggalPersetujuan"
                      render={({ field }) => (
                        <DatePicker
                          date={
                            field.value
                              ? moment(field.value).toDate()
                              : undefined
                          }
                          onDateChange={(date: Date | undefined) => {
                            field.onChange(date ? moment(date).format("YYYY-MM-DD") : null);
                          }}
                          placeholder="Tgl Persetujuan"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  {errors.tanggalPersetujuan && (
                    <div className="text-red-500 text-sm mt-1">{errors.tanggalPersetujuan.message}</div>
                  )}
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="space-y-2">
                  <Label className="font-bold">Nomor Persetujuan</Label>
                  <Input
                    {...register("nomorPersetujuan")}
                    type="text"
                    placeholder="Nomor Persetujuan Dispensasi"
                    className={errors.nomorPersetujuan ? "border-red-500" : ""}
                  />
                  {errors.nomorPersetujuan && (
                    <div className="text-red-500 text-sm mt-1">{errors.nomorPersetujuan.message}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Alasan Dispensasi</Label>
              <Controller
                control={control}
                name="alasan"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setDispen(val);
                      if (val !== "07") {
                        setValue("alasanLainnya", "");
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${errors.alasan ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="--- Pilih Alasan Dispensasi ---" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Kendala pada aplikasi</SelectItem>
                      <SelectItem value="02">02 - Kendala pada pejabat perbendaharaan</SelectItem>
                      <SelectItem value="03">03 - Kendala pada penyedia barang/jasa</SelectItem>
                      <SelectItem value="04">04 - Kendala administrasi (dokumen kurang lengkap)</SelectItem>
                      <SelectItem value="05">05 - Kendala pada revisi DIPA/MP PNBP</SelectItem>
                      <SelectItem value="06">06 - Kendala jaringan dan listrik</SelectItem>
                      <SelectItem value="07">07 - Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.alasan && (
                <div className="text-red-500 text-sm mt-1">{errors.alasan.message}</div>
              )}
            </div>

            {dispen === "07" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <Label className="font-bold">Uraian Alasan (Lainnya)</Label>
                  <Textarea
                    {...register("alasanLainnya")}
                    placeholder="Uraian Alasan"
                    rows={4}
                    className={`w-full ${errors.alasanLainnya ? "border-red-500" : ""}`}
                  />
                  {errors.alasanLainnya && (
                    <div className="text-red-500 text-sm mt-1">{errors.alasanLainnya.message}</div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleModalClose}>
              <X className="mr-2 h-4 w-4" /> Batal
            </Button>
            {loading ? (
              <Button disabled>
                <Spinner className="mr-2 h-4 w-4" /> Simpan
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
              >
                <Save className="mr-2 h-4 w-4" /> Simpan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Rekam;
