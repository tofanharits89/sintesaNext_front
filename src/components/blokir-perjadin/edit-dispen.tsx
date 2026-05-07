"use client";

import React, { useState, useEffect } from "react";
import { Formik, ErrorMessage } from "formik";
import * as Yup from "yup";
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
  id?: string | number;
  kddept: string;
  kdunit: string;
  target: number | string;
  dispensasi_blokir: number | string;
  blokir_7: number | string;
  blokir_A: number | string;
  deviasi: number | string;
}

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

  const handleSubmitdata = async (
    values: DispenData,
    { setSubmitting }: any,
  ) => {
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
      setSubmitting(false);
    }
  };

  const validationSchema = Yup.object().shape({
    dispensasi_blokir: Yup.number()
      .nullable()
      .typeError("Harus berupa angka")
      .min(0, "Harus berupa angka non-negatif atau nol")
      .integer("Harus berupa angka bulat")
      .required("Harus diisi"),
  });

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

        <Formik
          validationSchema={validationSchema}
          onSubmit={handleSubmitdata}
          enableReinitialize={true}
          initialValues={initialValues}
        >
          {({ handleSubmit, handleChange, values, touched, errors }) => (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="dispensasi_blokir">Nilai Dispensasi</Label>
                  <Input
                    id="dispensasi_blokir"
                    type="number"
                    name="dispensasi_blokir"
                    value={values.dispensasi_blokir}
                    onChange={handleChange}
                    placeholder="Masukkan nilai dispensasi"
                    aria-invalid={
                      touched.dispensasi_blokir && errors.dispensasi_blokir
                        ? true
                        : undefined
                    }
                  />
                  <ErrorMessage name="dispensasi_blokir">
                    {(msg) => <p className="text-sm text-destructive">{msg}</p>}
                  </ErrorMessage>
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
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditDispen;
