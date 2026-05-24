import React, { useState, useEffect, ChangeEvent } from "react";
import { FileText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import moment from "moment";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

interface Rekam2Props {
  show: boolean;
  onHide: () => void;
  id: string | number;
  tahun: number | string;
  triwulan: number | string;
  kdsatker: string;
  nmsatker: string;
  nmmppnbp: string;
  ringkasanpilih?: string;
  nosuratpilih?: string;
  tglsuratpilih?: string | Date;
  laporanpilih?: string | File;
  filesuratpilih?: string | File;
  onSaveSuccess: (
    ringkasan: string,
    no_surat: string,
    tgl_surat: string,
    laporan: File | string | null,
    file_surat: File | string | null,
  ) => void;
}

interface FormValues {
  id?: string | number | undefined;
  tahun?: string | number | undefined;
  triwulan?: string | number | undefined;
  kdsatker?: string | undefined;
  no_surat: string;
  tgl_surat: string | Date;
  ringkasan: string;
  file_surat: File | string | null;
  laporan: File | string | null;
}

const fileValidation = z.any()
  .refine((val) => val !== null && val !== undefined && val !== "", "File belum dipilih")
  .refine((val) => typeof val === "string" || val instanceof File, "File belum dipilih")
  .refine((val) => typeof val === "string" || (val instanceof File && val.size <= 2 * 1024 * 1024), "Ukuran file terlalu besar (maks 2MB)")
  .refine((val) => typeof val === "string" || (val instanceof File && val.type === "application/pdf"), "Hanya file PDF yang diperbolehkan");

const validationSchema = z.object({
  id: z.any().optional(),
  tahun: z.any().optional(),
  triwulan: z.any().optional(),
  kdsatker: z.string().optional(),
  no_surat: z.string().min(1, "harus diisi"),
  tgl_surat: z.any().refine(val => val !== null && val !== undefined && val !== "", "harus diisi"),
  ringkasan: z.string().min(1, "harus diisi"),
  file_surat: fileValidation,
  laporan: fileValidation,
});

export default function Rekam2({
  show,
  onHide,
  id,
  tahun,
  triwulan,
  kdsatker,
  nmsatker,
  nmmppnbp,
  ringkasanpilih,
  nosuratpilih,
  tglsuratpilih,
  laporanpilih,
  filesuratpilih,
  onSaveSuccess,
}: Rekam2Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [ringkasan, setRingkasan] = useState<string>("");
  const [no_surat, setNosurat] = useState<string>("");
  const [tgl_surat, setTglsurat] = useState<string>("");
  const [laporan, setLaporan] = useState<any>("");
  const [file_surat, setFilesurat] = useState<any>("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getGMT7Time = (): string => {
    const utcTime =
      currentDateTime.getTime() + currentDateTime.getTimezoneOffset() * 60000;
    const gmt7Time = new Date(utcTime + 7 * 3600000);
    return gmt7Time.toLocaleTimeString("id-ID");
  };

  useEffect(() => {
    if (show) {
      setRingkasan(ringkasanpilih || "");
      setNosurat(nosuratpilih || "");
      setTglsurat(
        tglsuratpilih ? moment(tglsuratpilih).format("YYYY-MM-DD") : "",
      );
      setLaporan(laporanpilih || "");
      setFilesurat(filesuratpilih || "");
    }
  }, [
    show,
    ringkasanpilih,
    nosuratpilih,
    tglsuratpilih,
    laporanpilih,
    filesuratpilih,
  ]);

  const initialValues: FormValues = {
    id,
    tahun,
    triwulan,
    kdsatker,
    no_surat: nosuratpilih || "",
    tgl_surat: tglsuratpilih ? moment(tglsuratpilih).format("YYYY-MM-DD") : "",
    ringkasan: ringkasanpilih || "",
    file_surat: filesuratpilih || null,
    laporan: laporanpilih || null,
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    values: initialValues,
  });

  useEffect(() => {
    if (show) {
      reset({
        id,
        tahun,
        triwulan,
        kdsatker,
        no_surat: nosuratpilih || "",
        tgl_surat: tglsuratpilih ? moment(tglsuratpilih).format("YYYY-MM-DD") : "",
        ringkasan: ringkasanpilih || "",
        file_surat: filesuratpilih || null,
        laporan: laporanpilih || null,
      });
    }
  }, [
    show,
    ringkasanpilih,
    nosuratpilih,
    tglsuratpilih,
    laporanpilih,
    filesuratpilih,
  ]);

  const handleRingkasanChange = (
    value: string,
  ) => {
    setRingkasan(value);
    setValue("ringkasan", value, { shouldValidate: true });
  };

  const handleNosuratChange = (
    value: string,
  ) => {
    setNosurat(value);
    setValue("no_surat", value, { shouldValidate: true });
  };

  const handleTglSuratChange = (
    dateStr: string,
  ) => {
    setTglsurat(dateStr);
    setValue("tgl_surat", dateStr, { shouldValidate: true });
  };

  const handleLaporanChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setLaporan(file);
      setValue("laporan", file, { shouldValidate: true });
    }
  };

  const handleFilesuratChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setFilesurat(file);
      setValue("file_surat", file, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("User tidak ditemukan, silakan login ulang");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (values.id !== undefined) formData.append("id", values.id.toString());
    formData.append("no_surat", values.no_surat || "");
    formData.append(
      "tgl_surat",
      values.tgl_surat ? moment(values.tgl_surat).format("YYYY-MM-DD") : "",
    );
    formData.append("ringkasan", values.ringkasan || "");
    if (values.file_surat)
      formData.append("file_surat", values.file_surat as any);
    if (values.laporan) formData.append("laporan", values.laporan as any);

    try {
      await http.patch(apiPath("/monev-pnbp/update"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setLoading(false);
      toast.success("Hasil Monev Berhasil Disimpan");
      onSaveSuccess(
        values.ringkasan,
        values.no_surat,
        values.tgl_surat as string,
        values.laporan,
        values.file_surat,
      );
      onHide();
    } catch (error: any) {
      const { status, data } = error.response || {};
      console.error("Error Response:", error.response);
      const errorMessage = data?.error || "Terjadi kesalahan pada server";
      toast.error(`Error ${status || ""}: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl text-center">
            Hasil Koordinasi dengan Satker
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-2">
          <div className="px-3 py-2 rounded-md bg-muted/50 border text-sm text-muted-foreground flex flex-col gap-0.5">
            <span><span className="font-medium text-foreground">Satker:</span> {nmsatker} ({kdsatker})</span>
            <span><span className="font-medium text-foreground">Jenis PNBP:</span> {nmmppnbp}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="mt-2">
            <form id="rekam2-form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="col-span-1">
                  <div className="flex flex-col gap-2 my-1">
                    <Label className="font-bold">Nomor Surat</Label>
                    <Input
                      placeholder="Nomor Surat"
                      className="w-full"
                      value={no_surat}
                      {...register("no_surat")}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleNosuratChange(e.target.value)
                      }
                    />
                    {errors.no_surat && (
                      <div className="text-red-500 text-sm">
                        {errors.no_surat.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex flex-col gap-2 my-1">
                    <Label className="font-bold">
                      File Surat (Maks. 2 MB)
                    </Label>

                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-grow"
                        type="file"
                        accept=".pdf"
                        onChange={handleFilesuratChange}
                      />

                      {file_surat && typeof file_surat === "string" && (
                        <a
                          href={`${(import.meta as any).env.VITE_REACT_APP_LOCAL_BASIC?.replace("http://", "https://") || "https://sintesa.kemenkeu.go.id:88"}/monev_pnbp/${file_surat}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Surat
                        </a>
                      )}
                    </div>
                    {errors.file_surat && (
                      <div className="text-red-500 text-sm">
                        {errors.file_surat.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
                <div className="col-span-1">
                  <div className="flex flex-col gap-2 my-1">
                    <Label className="font-bold">Tanggal Surat</Label>
                    <Input
                      type="date"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        handleTglSuratChange(e.target.value);
                      }}
                      value={tgl_surat}
                    />
                    {errors.tgl_surat && (
                      <div className="text-red-500 text-sm">
                        {errors.tgl_surat.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex flex-col gap-2 my-1">
                    <Label className="font-bold">
                      Upload Laporan (Maks. 2 MB)
                    </Label>

                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-grow"
                        type="file"
                        accept=".pdf"
                        onChange={handleLaporanChange}
                      />

                      {laporan && typeof laporan === "string" && (
                        <a
                          href={`${(import.meta as any).env.VITE_REACT_APP_LOCAL_BASIC?.replace("http://", "https://") || "https://sintesa.kemenkeu.go.id:88"}/monev_pnbp/${laporan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Laporan
                        </a>
                      )}
                    </div>
                    {errors.laporan && (
                      <div className="text-red-500 text-sm">
                        {errors.laporan.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 items-center mt-4">
                <div className="col-span-1">
                  <div className="flex flex-col gap-2 my-1">
                    <Label className="font-bold">
                      Ringkasan Pelaksanaan Koordinasi dengan Satker
                    </Label>
                    <Textarea
                      placeholder="Masukkan Ringkasan"
                      className="min-h-[100px]"
                      rows={4}
                      value={ringkasan}
                      {...register("ringkasan")}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        handleRingkasanChange(e.target.value)
                      }
                    />
                    {errors.ringkasan && (
                      <div className="text-red-500 text-sm">
                        {errors.ringkasan.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="mt-2 text-xl">{getGMT7Time()} </p>
                <p className="text-sm">Waktu Server (GMT +7)</p>
              </div>
            </form>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button size="default" variant="secondary" onClick={onHide}>
            Tutup
          </Button>
          <Button
            size="default"
            type="button"
            variant="default"
            disabled={loading}
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>("#rekam2-form");
              form?.requestSubmit();
            }}
          >
            {loading ? <Spinner size="sm" /> : "Simpan Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
