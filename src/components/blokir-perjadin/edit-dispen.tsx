"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiPath } from "@/lib/config/base-path";

interface EditDispenProps {
  show: boolean;
  onHide: () => void;
  onUpdate?: () => void;
  setRefresh: (refresh: boolean) => void;
  id: string | number;
  token?: string;
  username?: string;
}

interface DispenData {
  id?: string | number | undefined;
  kddept?: string | undefined;
  kdunit?: string | undefined;
  target?: number | string | undefined;
  dispensasi_blokir: number | string;
  blokir_7?: number | string | undefined;
  blokir_A?: number | string | undefined;
  deviasi?: number | string | undefined;
}

const validationSchema = z.object({
  id: z.any().optional(),
  kddept: z.string().optional(),
  kdunit: z.string().optional(),
  target: z.any().optional(),
  dispensasi_blokir: z.any()
    .refine((val) => val !== "" && val !== null && val !== undefined, "Harus diisi")
    .transform((val) => Number(val))
    .pipe(
      z.number({ message: "Harus berupa angka" })
        .min(0, "Harus berupa angka non-negatif atau nol")
        .int("Harus berupa angka bulat")
    ),
  blokir_7: z.any().optional(),
  blokir_A: z.any().optional(),
  deviasi: z.any().optional(),
});

const EditDispen: React.FC<EditDispenProps> = ({
  show,
  onHide,
  onUpdate,
  setRefresh,
  id,
  token = "",
  username = "",
}) => {
  const [data, setData] = useState<DispenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<DispenData>({
    kddept: "",
    kdunit: "",
    target: "",
    dispensasi_blokir: "",
    blokir_7: "",
    blokir_A: "",
    deviasi: "",
    id: id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DispenData>({
    resolver: zodResolver(validationSchema),
    values: initialValues,
  });

  useEffect(() => {
    if (show && id) {
      getData();
    }
  }, [id, show]);

  useEffect(() => {
    if (data.length > 0) {
      const dispensasiData = data[0];
      if (dispensasiData) {
        setInitialValues({
          kddept: dispensasiData.kddept,
          kdunit: dispensasiData.kdunit,
          target: dispensasiData.target,
          dispensasi_blokir: dispensasiData.dispensasi_blokir,
          blokir_7: dispensasiData.blokir_7,
          blokir_A: dispensasiData.blokir_A,
          deviasi: dispensasiData.deviasi,
          id: id,
        });
      }
    }
  }, [data, id]);

  const getData = async () => {
    setLoading(true);

    const encodedQuery = encodeURIComponent(
      `SELECT a.id, a.kddept, a.kdunit, SUM(a.target) as target_blokir, sum(a.dispensasi_blokir) as dispensasi_blokir, SUM(a.blokir_7 + a.blokir_A) as sudah_blokir, SUM(a.target) - SUM(a.dispensasi_blokir) - SUM(a.blokir_7 + a.blokir_A) AS sisa
    FROM laporan_2023.target_blokir_perjadin a WHERE a.id=${id} GROUP BY a.id, a.kddept, a.kdunit`,
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    try {
      const apiUrl = apiPath(
        `/blokir/monitoring/${encryptedQuery}${username ? `?user=${username}` : ""}`,
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
    } catch (error) {
      console.log(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: DispenData) => {
    setLoading(true);

    try {
      const response = await fetch(apiPath("/blokir/update-dispen"), {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data Berhasil Diubah");
      setRefresh(true);
      if (onUpdate) onUpdate();
      onHide();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (onUpdate) {
      onUpdate();
    }
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <i className="bi bi-back text-primary" />
            Rekam Dispensasi Blokir
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="rounded-lg border bg-card p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="dispensasi_blokir">Nilai Dispensasi</Label>
                <Input
                  id="dispensasi_blokir"
                  type="number"
                  {...register("dispensasi_blokir")}
                  placeholder="Masukkan nilai dispensasi"
                  aria-invalid={errors.dispensasi_blokir ? true : undefined}
                />
                {errors.dispensasi_blokir && (
                  <p className="text-sm text-destructive">{errors.dispensasi_blokir.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleModalClose}
            >
              <X className="h-4 w-4" />
              Tutup
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Loading...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDispen;
