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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import DatePicker from "react-datepicker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import moment from "moment";
import { X, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiPath } from "@/lib/config/base-path";
import { apiClient } from "@/lib/api/httpClient";

interface RekamProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  tahun?: string;
  id?: string;
  nomor?: string;
  kdsatker?: string;
  nmsatker?: string;
}

interface OptionType {
  kdsatker: string;
  nmsatker: string;
  kdkanwil?: string;
}

interface FormValues {
  tahun: string;
  tanggalPermohonan: string | null;
  nomorPermohonan: string;
  satker: string;
  dispen: string;
  alasan2?: string | undefined;
  jenis: string;
  tanggalPersetujuan: string | null;
  nomorPersetujuan: string;
  cara_upload?: string | undefined;
  file: File | null;
  username?: string | undefined;
  kdkanwil?: string | number | undefined;
}

const handleHttpError = (status: any, msg: string) => console.error(msg);

const validationSchema = z.object({
  tahun: z.string().min(1, "Tahun harus diisi"),
  jenis: z.string().min(1, "Jenis harus diisi"),
  tanggalPermohonan: z.any().refine(val => val !== null && val !== undefined && val !== "", "Tanggal Permohonan harus diisi"),
  nomorPermohonan: z.string().min(1, "Nomor Permohonan harus diisi"),
  satker: z.string().min(1, "Satker harus diisi"),
  dispen: z.string().min(1, "Jenis harus dipilih"),
  alasan2: z.string().optional().or(z.literal("")),
  tanggalPersetujuan: z.any().refine(val => val !== null && val !== undefined && val !== "", "Tanggal Persetujuan harus diisi"),
  nomorPersetujuan: z.string().min(1, "Nomor Persetujuan harus diisi"),
  file: z.any()
    .refine((val) => val instanceof File, "File belum dipilih")
    .refine((val) => !(val instanceof File) || val.size <= 2 * 1024 * 1024, "Ukuran file terlalu besar (maks 2MB)")
    .refine((val) => !(val instanceof File) || val.type === "application/pdf", "Hanya file berekstensi PDF yang diperbolehkan")
}).superRefine((data, ctx) => {
  if (data.dispen === "07" && (!data.alasan2 || data.alasan2.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["alasan2"],
      message: "Alasan harus diisi"
    });
  }
});

export default function Rekam({
  show,
  onHide,
  onSuccess,
  tahun: propTahun,
  id,
  nomor,
  kdsatker,
  nmsatker,
}: RekamProps) {
  const { user } = useAuth();
  const kdkanwil = user?.kdkanwil || "";
  const role = user?.role || "";
  const username = user?.username || "";

  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<OptionType | null>(null);
  const [searchResults, setSearchResults] = useState<OptionType[]>([]);
  const [data, setData] = useState<OptionType[]>([]);
  const [jenisspm, setJenisspm] = useState("");
  const [tahun, setTahun] = useState<string>(
    propTahun || String(new Date().getFullYear())
  );
  const [jenisdispensasi, setjenisdispensasi] = useState(false);
  const [dispen, setDispen] = useState("");

  const handleAlasanChange = (
    value: string
  ) => {
    setDispen(value);
    if (value !== "07") {
      setValue("alasan2", "");
    }
  };

  useEffect(() => {
    if (jenisspm === "04") {
      setDispen("07");
      setjenisdispensasi(true);
    } else {
      setDispen("");
    }
  }, [jenisspm]);

  const initialValues: FormValues = {
    tahun,
    tanggalPermohonan: null,
    nomorPermohonan: "",
    satker: "",
    dispen: dispen,
    alasan2: "",
    jenis: jenisspm,
    tanggalPersetujuan: null,
    nomorPersetujuan: "",
    cara_upload: "normal",
    file: null,
    username: username,
    kdkanwil: kdkanwil,
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

  const handleSubmitdata = async (values: FormValues) => {
    setLoading(true);
    try {
      const form = new FormData();

      const fieldOrder = [
        "tahun",
        "jenis",
        "tanggalPermohonan",
        "nomorPermohonan",
        "satker",
        "dispen",
        "alasan2",
        "tanggalPersetujuan",
        "nomorPersetujuan",
        "cara_upload",
        "username",
        "kdkanwil",
      ];

      fieldOrder.forEach((k) => {
        const v = (values as any)[k];
        form.append(k, v === null || typeof v === "undefined" ? "" : String(v));
      });

      if (values.file) {
        const fileObj = values.file as File;
        form.append("file", fileObj, fileObj.name);
      }

      let path = "";
      if (values.jenis === "01" || values.jenis === "03") {
        path = "/dispensasi/simpan-dispensasi";
      } else if (values.jenis === "02") {
        path = "/dispensasi/simpan-kontrak";
      } else if (values.jenis === "04") {
        path = "/dispensasi/simpan-tup";
      }

      console.log("Sending POST to:", path);

      await apiClient.post(path, form);

      console.log("Data submitted successfully");
      toast.success("Data Berhasil Disimpan");
      setLoading(false);
      onSuccess?.();
      handleModalClose();
    } catch (error: any) {
      console.error("Submit error details:", error);
      const { status, data: errData } = error.response || {};
      const errorMsg =
        (errData && (errData.error || errData.msg || errData.detail)) ||
        error.message ||
        "Terjadi Permasalahan Koneksi atau Server Backend";

      handleHttpError(status, errorMsg);
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [tahun]);

  useEffect(() => {
    if (data.length > 0) {
      setSearchResults(data.slice(0, 100));
    }
  }, [data]);

  const getData = async () => {
    let query = `SELECT kdsatker,nmsatker,kdkanwil FROM dbref.t_satker_kppn_${tahun}`;

    if (role === "kanwil_djpb" && kdkanwil) {
      query += ` WHERE kdkanwil='${kdkanwil}'`;
    }

    const encryptedQuery = btoa(query);
    try {
      const response = await fetch(
        apiPath(`/dispensasi/${encryptedQuery}?limit=999999&page=0`),
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
    } catch (error: any) {
      console.error("Gagal fetch satker:", error.message);
    }
  };

  const handleModalClose = () => {
    setSelectedSatker(null);
    setSearchResults([]);
    setjenisdispensasi(false);
    setJenisspm("");
    setDispen("");
    onHide();
    reset({
      tahun: propTahun || String(new Date().getFullYear()),
      tanggalPermohonan: null,
      nomorPermohonan: "",
      satker: "",
      dispen: "",
      alasan2: "",
      jenis: "",
      tanggalPersetujuan: null,
      nomorPersetujuan: "",
      cara_upload: "normal",
      file: null,
      username: username,
      kdkanwil: kdkanwil,
    });
  };

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-zinc-100 dark:bg-black px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent showCloseButton={false} className="max-w-4xl sm:max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rekam Data Dispensasi TA. {tahun}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4 overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit(handleSubmitdata)} className="space-y-4">
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

              <div className="md:col-span-8">
                <div className="space-y-2">
                  <Label className="font-bold">Jenis Dispensasi</Label>
                  <Controller
                    control={control}
                    name="jenis"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setjenisdispensasi(val === "" ? false : true);
                          setJenisspm(val);
                          if (val === "04") {
                            setValue("dispen", "07");
                            setjenisdispensasi(true);
                          } else {
                            setValue("dispen", "");
                          }
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors.jenis ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Jenis Dispensasi ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">SPM BIASA</SelectItem>
                          <SelectItem value="03">SPM RPATA</SelectItem>
                          <SelectItem value="02">Kontrak</SelectItem>
                          <SelectItem value="04">TUP Tunai</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.jenis && (
                    <div className="text-red-500 text-sm mt-1">{errors.jenis.message}</div>
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
                          name="tanggalPermohonan"
                          selected={field.value ? moment(field.value).toDate() : null}
                          className={inputClass}
                          wrapperClassName="w-full"
                          onChange={(date: any) => {
                            field.onChange(date ? moment(date).format("YYYY-MM-DD") : null);
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Permohonan"
                          autoComplete="off"
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
                          name="tanggalPersetujuan"
                          selected={field.value ? moment(field.value).toDate() : null}
                          className={inputClass}
                          wrapperClassName="w-full"
                          onChange={(date: any) => {
                            field.onChange(date ? moment(date).format("YYYY-MM-DD") : null);
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Persetujuan"
                          autoComplete="off"
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
                  />
                  {errors.nomorPersetujuan && (
                    <div className="text-red-500 text-sm mt-1">{errors.nomorPersetujuan.message}</div>
                  )}
                </div>
              </div>
            </div>

            {jenisdispensasi && (jenisspm === "01" || jenisspm === "03") && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <Label className="font-bold">Alasan Dispensasi SPM</Label>
                  <Controller
                    control={control}
                    name="dispen"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          handleAlasanChange(val);
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors.dispen ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Alasan Dispensasi ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">01 - Pekerjaan dalam Rangka Penanganan Bencana Alam</SelectItem>
                          <SelectItem value="02">02 - Kondisi Kahar/Force Majeure</SelectItem>
                          <SelectItem value="03">03 - Pemilu/Pilkada Serentak</SelectItem>
                          <SelectItem value="04">04 - Kondisi Lain dibuktikan Surat Pernyatan KPA</SelectItem>
                          <SelectItem value="05">05 - Keterlambatan Pengajuan Tagihan atau Kurang Lengkap Dokumen Tagihan oleh Penyedia</SelectItem>
                          <SelectItem value="06">06 - Permasalahan Pengelolaan Perbendaharaan</SelectItem>
                          <SelectItem value="07">07 - Lainnya</SelectItem>
                          <SelectItem value="08">08 - Proses Revisi Penghematan Belanja Perjalanan Dinas</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.dispen && (
                    <div className="text-red-500 text-sm mt-1">{errors.dispen.message}</div>
                  )}
                </div>
              </div>
            )}

            {jenisdispensasi && jenisspm === "02" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <Label className="font-bold">Alasan Dispensasi Kontrak</Label>
                  <Controller
                    control={control}
                    name="dispen"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          handleAlasanChange(val);
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors.dispen ? "border-red-500" : ""}`}>
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
                  {errors.dispen && (
                    <div className="text-red-500 text-sm mt-1">{errors.dispen.message}</div>
                  )}
                </div>
              </div>
            )}

            {jenisdispensasi && jenisspm === "04" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <Label className="font-bold">Alasan Dispensasi TUP</Label>
                  <Select
                    value="07"
                    disabled
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Isikan Alasan Dispensasi TUP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07">07 - Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {dispen === "07" && jenisdispensasi && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <Label>Uraian Alasan (Lainnya)</Label>
                  <Textarea
                    {...register("alasan2")}
                    placeholder="Uraian Alasan"
                    rows={4}
                    className={`w-full ${errors.alasan2 ? "border-red-500" : ""}`}
                  />
                  {errors.alasan2 && (
                    <div className="text-red-500 text-sm mt-1">{errors.alasan2.message}</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-bold">
                Upload File Surat Persetujuan (PDF)
              </Label>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Normal Upload</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => {
                        if (
                          event.currentTarget.files &&
                          event.currentTarget.files[0]
                        ) {
                          setValue("file", event.currentTarget.files[0], { shouldValidate: true });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              {errors.file && (
                <div className="text-red-500 text-sm mt-1">{errors.file.message}</div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
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
}
