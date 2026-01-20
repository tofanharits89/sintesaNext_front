import React, { useState, useContext, useEffect, ChangeEvent } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
// import {
//   Modal,
//   Form,
//   Button,
//   Container,
//   Row,
//   Col,
//   Spinner,
//   ModalFooter,
//   Nav,
//   Tab,
// } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Formik, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import Swal from "sweetalert2";
// import { BsFillPlusSquareFill, BsTrash } from "react-icons/bs"; // Import plus and trash icons
// import moment from "moment"; // original had moment imported
import moment from "moment";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";

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
  id: string | number;
  tahun: string | number;
  triwulan: string | number;
  kdsatker: string;
  no_surat: string;
  tgl_surat: string | Date;
  ringkasan: string;
  file_surat: File | string | null;
  laporan: File | string | null;
}

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

  // Update waktu setiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Konversi waktu ke GMT+7
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

  // Logic from original JSX: duplicate keys overwrite earlier ones.
  // nosuratpilih || "" overwrites ""
  // file_surat: null overwrites filesuratpilih || ""
  const initialValues: FormValues = {
    id,
    tahun,
    triwulan,
    kdsatker,
    no_surat: nosuratpilih || "",
    tgl_surat: tglsuratpilih || "",
    ringkasan: ringkasanpilih || "",
    file_surat: null, // As in original
    laporan: null, // As in original
  };

  const validationSchema = Yup.object().shape({
    no_surat: Yup.string().required("harus diisi"),
    tgl_surat: Yup.date().nullable().required("harus diisi"),
    ringkasan: Yup.string().required("harus diisi"),
    file_surat: Yup.mixed()
      .required("File belum dipilih")
      .test(
        "fileSize",
        "Ukuran file terlalu besar (maks 2MB)",
        (value: any) => {
          return !value || (value && value.size <= 2 * 1024 * 1024);
        },
      )
      .test("fileType", "Hanya file PDF yang diperbolehkan", (value: any) => {
        return !value || (value && value.type === "application/pdf");
      }),
    laporan: Yup.mixed()
      .required("File belum dipilih")
      .test(
        "fileSize",
        "Ukuran file terlalu besar (maks 2MB)",
        (value: any) => {
          return !value || (value && value.size <= 2 * 1024 * 1024);
        },
      )
      .test("fileType", "Hanya file PDF yang diperbolehkan", (value: any) => {
        return !value || (value && value.type === "application/pdf");
      }),
  });

  const handleRingkasanChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const value = event.target.value;
    setRingkasan(value);
    setFieldValue("ringkasan", value);
  };

  const handleNosuratChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const value = event.target.value;
    setNosurat(value);
    setFieldValue("no_surat", value);
  };

  const handleTglSuratChange = (
    date: Date | null,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const formattedDate = date ? moment(date).format("YYYY-MM-DD") : "";
    setTglsurat(formattedDate);
    setFieldValue("tgl_surat", formattedDate);
  };

  // Fungsi untuk menangani perubahan file laporan
  const handleLaporanChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setLaporan(file); // Update state
      setFieldValue("laporan", file); // Update Formik
    }
  };

  // Fungsi untuk menangani perubahan file surat
  const handleFilesuratChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;

    if (file) {
      setFilesurat(file); // Update state
      setFieldValue("file_surat", file); // Update Formik
    }
  };

  const handleSubmitdata = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>,
  ) => {
    if (!user) {
      Swal.fire("Error", "User tidak ditemukan, silakan login ulang", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    formData.append("id", values.id.toString());
    formData.append("no_surat", values.no_surat || ""); // Pastikan tidak undefined
    formData.append(
      "tgl_surat",
      values.tgl_surat ? moment(values.tgl_surat).format("YYYY-MM-DD") : "",
    ); // Format tanggal
    formData.append("ringkasan", values.ringkasan || ""); // Pastikan ringkasan tidak undefined
    // values.file_surat can be File object or string (filename) or null
    // If it's a File object, we append it. If string, do we append it?
    // Original code: if (values.file_surat) formData.append(...)
    if (values.file_surat)
      formData.append("file_surat", values.file_surat as any);
    if (values.laporan) formData.append("laporan", values.laporan as any);

    try {
      await http.patch(
        `${process.env.NEXT_PUBLIC_LOCAL_SIMPANMONEVPNBP}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setLoading(false);
      Swal.fire({
        html: `<div className='text-success mt-4'>Hasil Monev Berhasil Disimpan</div>`,
        icon: "success",
        confirmButtonText: "Tutup",
      })
        // onSaveSuccess(values.ringkasan, values.no_surat, values.tgl_surat, values.laporan, values.file_surat);
        .then(() => {
          onSaveSuccess(
            values.ringkasan,
            values.no_surat,
            values.tgl_surat as string,
            values.laporan,
            values.file_surat,
          );
          onHide(); // **Menutup modal setelah sukses**
        });
    } catch (error: any) {
      const { status, data } = error.response || {};

      // Debugging error
      console.error("Error Response:", error.response);

      // Perbaikan handling error
      const errorMessage = data?.error || "Terjadi kesalahan pada server";
      toast.error(`Error ${status || ""}: ${errorMessage}`);

      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    onHide();
  };
  // console.log("nmkanwil:", nmkanwil);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <i className="bi bi-box-arrow-in-right text-green-600 mx-3"></i>
            Hasil Koordinasi dengan Satker
          </DialogTitle>
        </DialogHeader>
        <div className="h-[600px] overflow-auto">
          <Tabs defaultValue="monev-overview" className="w-full">
            <TabsList>
              <TabsTrigger value="monev-overview">Rekam Koordinasi</TabsTrigger>
            </TabsList>
            <TabsContent value="monev-overview" className="pt-2">
              <Formik
                validationSchema={validationSchema}
                onSubmit={handleSubmitdata}
                initialValues={initialValues}
                enableReinitialize
              >
                {({ handleSubmit, setFieldValue, values }) => {
                  useEffect(() => {
                    setFieldValue("ringkasan", ringkasanpilih || "");
                    setFieldValue("no_surat", nosuratpilih || "");
                    setFieldValue(
                      "tgl_surat",
                      tglsuratpilih
                        ? moment(tglsuratpilih).format("YYYY-MM-DD")
                        : "",
                    );
                    setFieldValue("laporan", laporanpilih || "");
                    setFieldValue("file_surat", filesuratpilih || "");
                  }, [
                    show,
                    ringkasanpilih,
                    nosuratpilih,
                    tglsuratpilih,
                    laporanpilih,
                    filesuratpilih,
                    setFieldValue,
                  ]);
                  return (
                    <div className="mt-2">
                      <form noValidate onSubmit={handleSubmit}>
                        <div className="flex flex-col items-start mb-4">
                          <span className="font-bold text-green-600">
                            SATKER : {nmsatker} ({kdsatker})
                          </span>
                          <span className="font-bold text-green-600">
                            JENIS PNBP : {nmmppnbp}
                          </span>
                        </div>
                        <hr className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="col-span-1">
                            <div className="flex flex-col gap-2 my-1">
                              <Label className="font-bold">Nomor Surat</Label>
                              <Field
                                name="no_surat"
                                type="text"
                                placeholder="Nomor Surat"
                                as={Input}
                                className="w-full"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleNosuratChange(e, setFieldValue)
                                }
                                value={no_surat}
                              />
                              <ErrorMessage
                                name="no_surat"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="flex flex-col gap-2 my-1">
                              <Label className="font-bold">
                                File Surat (Maks. 2 MB)
                              </Label>

                              <div className="flex items-center gap-2">
                                {/* Input File */}
                                <Input
                                  className="flex-grow"
                                  type="file"
                                  name="file_surat"
                                  accept=".pdf"
                                  onChange={(e) =>
                                    handleFilesuratChange(e, setFieldValue)
                                  }
                                />

                                {/* Link jika surat sudah ada */}
                                {file_surat && (
                                  <a
                                    href={`${(import.meta as any).env.VITE_REACT_APP_LOCAL_BASIC?.replace("http://", "https://") || "https://sintesa.kemenkeu.go.id:88"}/monev_pnbp/${file_surat}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                                  >
                                    <i className="bi bi-file-earmark-text"></i>{" "}
                                    Surat
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
                          <div className="col-span-1">
                            <div className="flex flex-col gap-2 my-1">
                              <Label className="font-bold">Tanggal Surat</Label>
                              {/* <DatePicker
                                name="tgl_surat"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                selected={
                                  values.tgl_surat
                                    ? moment(values.tgl_surat).toDate()
                                    : null
                                }
                                onChange={(date: Date | null) =>
                                  handleTglSuratChange(date, setFieldValue)
                                }
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Tanggal Surat"
                                autoComplete="off"
                                timeZone="UTC"
                                value={tgl_surat}
                              /> */}
                              <Field
                                name="tgl_surat"
                                type="date"
                                as={Input}
                                onChange={(
                                  e: ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const date = e.target.value
                                    ? new Date(e.target.value)
                                    : null;
                                  handleTglSuratChange(date, setFieldValue);
                                }}
                                value={tgl_surat}
                              />
                              <ErrorMessage
                                name="tgl_surat"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="flex flex-col gap-2 my-1">
                              <Label className="font-bold">
                                Upload Laporan (Maks. 2 MB)
                              </Label>

                              <div className="flex items-center gap-2">
                                {/* Input File */}
                                <Input
                                  className="flex-grow"
                                  type="file"
                                  name="laporan"
                                  accept=".pdf"
                                  onChange={(e) =>
                                    handleLaporanChange(e, setFieldValue)
                                  }
                                />

                                {/* Link jika laporan sudah ada */}
                                {laporan && (
                                  <a
                                    href={`${(import.meta as any).env.VITE_REACT_APP_LOCAL_BASIC?.replace("http://", "https://") || "https://sintesa.kemenkeu.go.id:88"}/monev_pnbp/${laporan}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                                  >
                                    <i className="bi bi-file-earmark-text"></i>{" "}
                                    Laporan
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 items-center mt-4">
                          <div className="col-span-1">
                            <div className="flex flex-col gap-2 my-1">
                              <Label className="font-bold">
                                Ringkasan Pelaksanaan Koordinasi dengan Satker
                              </Label>
                              <Field
                                name="ringkasan"
                                as={Textarea}
                                placeholder="Masukkan Ringkasan"
                                className="min-h-[100px]"
                                rows={4}
                                onChange={(
                                  e: ChangeEvent<HTMLTextAreaElement>,
                                ) => handleRingkasanChange(e, setFieldValue)}
                                value={ringkasan}
                              />
                              <ErrorMessage
                                name="ringkasan"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>{" "}
                        <div>
                          <p className="mt-2 text-xl">{getGMT7Time()} </p>
                          <p className="text-sm">Waktu Server (GMT +7)</p>
                        </div>
                        <div className="flex justify-end mt-3 gap-2">
                          <Button
                            type="submit"
                            variant="destructive"
                            disabled={loading}
                          >
                            {loading ? <Spinner size="sm" /> : "Simpan Data"}
                          </Button>
                          <Button variant="secondary" onClick={onHide}>
                            Tutup
                          </Button>
                        </div>
                      </form>
                    </div>
                  );
                }}
              </Formik>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
