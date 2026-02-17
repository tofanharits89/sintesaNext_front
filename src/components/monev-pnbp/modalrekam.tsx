import React, { useState, useContext, useEffect, ChangeEvent } from "react";
// import {
//   Modal,
//   Form,
//   Button,
//   Container,
//   Row,
//   Col,
//   Spinner,
// } from "react-bootstrap";
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
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";

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
  kdkanwil: string;
  nd_kanwil: File | null;
}

const Rekam: React.FC<RekamProps> = ({
  show,
  onHide,
  tahun,
  triwulan,
  kdkanwil,
  ndkanwilpilih,
  onSaveSuccess,
}) => {
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

  useEffect(() => {
    if (show) {
      setNdkanwil(ndkanwilpilih || "");
      fetchDataRekaman();
    }
  }, [show, ndkanwilpilih]);

  const fetchDataRekaman = async () => {
    try {
      const response = await http.get(
        `${process.env.NEXT_PUBLIC_LOCAL_GET_REKAMAN}`,
      );
      setRekamanSebelumnya(response.data);
    } catch (error) {
      console.error("Gagal mengambil data rekaman:", error);
    }
  };

  const initialValues: FormValues = {
    tahun: tahun || "",
    triwulan: triwulan || "",
    kdkanwil,
    nd_kanwil: null,
  };

  const validationSchema = Yup.object().shape({
    tahun: Yup.string().required("Tahun wajib dipilih"),
    triwulan: Yup.string().required("Triwulan wajib dipilih"),
    nd_kanwil: Yup.mixed()
      .required("File belum dipilih")
      .test(
        "fileSize",
        "Ukuran file maksimal 2MB",
        (value: any) => !value || value.size <= 2 * 1024 * 1024,
      )
      .test(
        "fileType",
        "Hanya file PDF diperbolehkan",
        (value: any) => !value || value.type === "application/pdf",
      ),
  });

  const handleNdkanwilChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setNdkanwil(file);
      setFieldValue("nd_kanwil", file);
    }
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>,
  ) => {
    if (!user) {
      Swal.fire("Error", "User tidak ditemukan, silakan login ulang", "error");
      return;
    }

    console.log("Submitting values:", values);

    setLoading(true);
    const formData = new FormData();
    formData.append("kdkanwil", values.kdkanwil);
    formData.append("tahun", values.tahun.toString());
    formData.append("triwulan", values.triwulan.toString());
    if (values.nd_kanwil) {
      formData.append("nd_kanwil", values.nd_kanwil);
    }

    try {
      await http.patch(
        `${process.env.NEXT_PUBLIC_LOCAL_UPDATE_LAPPNBP}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      Swal.fire("Sukses", "Data berhasil disimpan", "success").then(() => {
        onSaveSuccess(values.nd_kanwil);
        onHide();
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const isDisabled = (tahun: number | string, triwulan: number | string) => {
    return rekamanSebelumnya.some(
      (rekam) => rekam.tahun == tahun && rekam.triwulan == triwulan,
    );
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Kirim Nota Dinas</DialogTitle>
        </DialogHeader>
        <Formik
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        >
          {({ handleSubmit, setFieldValue, values }) => (
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Tahun</Label>
                  <Select
                    value={values.tahun?.toString()}
                    onValueChange={(val) => setFieldValue("tahun", val)}
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
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Triwulan</Label>
                  <Select
                    value={values.triwulan?.toString()}
                    onValueChange={(val) => setFieldValue("triwulan", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Triwulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {triwulanOptions.map((tri) => (
                        <SelectItem
                          key={tri}
                          value={tri.toString()}
                          disabled={isDisabled(values.tahun, tri)}
                        >
                          Triwulan {tri}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 mt-3 space-y-2">
                <div className="col-span-1 space-y-2">
                  <Label>File Nota Dinas (Maks. 2 MB)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleNdkanwilChange(e, setFieldValue)}
                  />
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="font-bold text-xl">{getGMT7Time()}</p>
                <p className="text-sm">Waktu Server (GMT +7)</p>
              </div>
              <div className="flex justify-end mt-3 gap-2">
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "Simpan"}
                </Button>
                <Button variant="secondary" onClick={onHide}>
                  Tutup
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default Rekam;
