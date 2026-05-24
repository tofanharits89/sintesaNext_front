import { Save,  X } from "lucide-react";
import React, { useState, useEffect, ChangeEvent } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

interface RekamProps {
  show: boolean;
  onHide: () => void;
  tahun: number | string;
  triwulan: number | string;
  kdkanwil: string;
  ndkanwilpilih?: File | string | null;
  onSaveSuccess: (file: File | null) => void;
}

interface Rekaman {
  tahun: number | string;
  triwulan: number | string;
}

interface FormValues {
  tahun: number | string;
  triwulan: number | string;
  kdkanwil?: string | undefined;
  nd_kanwil: File | null;
}

const validationSchema = z.object({
  tahun: z.any().refine(val => val !== "" && val !== null && val !== undefined, "Tahun wajib dipilih"),
  triwulan: z.any().refine(val => val !== "" && val !== null && val !== undefined, "Triwulan wajib dipilih"),
  kdkanwil: z.string().optional(),
  nd_kanwil: z.any()
    .refine((val) => val instanceof File, "File belum dipilih")
    .refine((file) => !(file instanceof File) || file.size <= 2 * 1024 * 1024, "Ukuran file maksimal 2MB")
    .refine((file) => !(file instanceof File) || file.type === "application/pdf", "Hanya file PDF diperbolehkan")
});

const Rekam: React.FC<RekamProps> = ({
  show,
  onHide,
  tahun,
  triwulan,
  kdkanwil,
  ndkanwilpilih,
  onSaveSuccess,
}) => {
  const formId = "monev-pnbp-rekam-nd-form";
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [nd_kanwil, setNdkanwil] = useState<File | string | null>("");
  const [rekamanSebelumnya, setRekamanSebelumnya] = useState<Rekaman[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  const tahunOptions = Array.from({ length: 3 }, (_, i) => 2025 + i);
  const triwulanOptions = [1, 2, 3, 4];

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

  const initialValues: FormValues = {
    tahun: tahun || "",
    triwulan: triwulan || "",
    kdkanwil,
    nd_kanwil: null,
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

  useEffect(() => {
    if (show) {
      setNdkanwil(ndkanwilpilih || "");
      fetchDataRekaman();
      reset({
        tahun: tahun || "",
        triwulan: triwulan || "",
        kdkanwil,
        nd_kanwil: null,
      });
    }
  }, [show, ndkanwilpilih]);

  const fetchDataRekaman = async () => {
    try {
      const response = await http.get(apiPath("/monev-pnbp/rekaman"));
      setRekamanSebelumnya(response.data);
    } catch (error) {
      console.error("Gagal mengambil data rekaman:", error);
    }
  };

  const handleNdkanwilChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setNdkanwil(file);
      setValue("nd_kanwil", file, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("User tidak ditemukan, silakan login ulang");
      return;
    }

    console.log("Submitting values:", values);

    setLoading(true);
    const formData = new FormData();
    formData.append("kdkanwil", values.kdkanwil || "");
    formData.append("tahun", values.tahun.toString());
    formData.append("triwulan", values.triwulan.toString());
    if (values.nd_kanwil) {
      formData.append("nd_kanwil", values.nd_kanwil);
    }

    try {
      await http.patch(apiPath("/monev-pnbp/update-laporan"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Data berhasil disimpan");
      onSaveSuccess(values.nd_kanwil);
      onHide();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = (tahunVal: number | string, triwulanVal: number | string) => {
    return rekamanSebelumnya.some(
      (rekam) => rekam.tahun == tahunVal && rekam.triwulan == triwulanVal,
    );
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Kirim Nota Dinas</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-6 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 space-y-2">
                <Label>Tahun</Label>
                <Controller
                  control={control}
                  name="tahun"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {tahunOptions.map((year) => (
                          <SelectItem
                            key={year}
                            value={year.toString()}
                            disabled={triwulanOptions.some((tri) =>
                              isDisabled(year, tri),
                            )}
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tahun && (
                  <p className="text-sm text-destructive">{errors.tahun.message}</p>
                )}
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Triwulan</Label>
                <Controller
                  control={control}
                  name="triwulan"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Triwulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {triwulanOptions.map((tri) => {
                          const currentTahun = control._formValues.tahun;
                          return (
                            <SelectItem
                              key={tri}
                              value={tri.toString()}
                              disabled={isDisabled(currentTahun, tri)}
                            >
                              Triwulan {tri}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.triwulan && (
                  <p className="text-sm text-destructive">{errors.triwulan.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 mt-3 space-y-2">
              <div className="col-span-1 space-y-2">
                <Label>File Nota Dinas (Maks. 2 MB)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleNdkanwilChange}
                />
                {errors.nd_kanwil && (
                  <p className="text-sm text-destructive">{errors.nd_kanwil.message}</p>
                )}
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="font-bold text-xl">{getGMT7Time()}</p>
              <p className="text-sm">Waktu Server (GMT +7)</p>
            </div>
          </div>
        </form>
        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="secondary" type="button" onClick={onHide}>
            <X className="h-4 w-4 mr-2" /> Batal
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="destructive"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Rekam;
