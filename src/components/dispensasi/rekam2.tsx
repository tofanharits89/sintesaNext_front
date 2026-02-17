"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/httpClient";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsContents } from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Formik,
  Field,
  ErrorMessage,
  FormikHelpers,
  FormikProps,
} from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { X, PlusSquare, Trash2, Save } from "lucide-react";
import { format, parse } from "date-fns";
import UploadSPM from "./upload-spm";
import { toast } from "sonner";

interface FormRow {
  nilaispm: string | number;
  nospm: string;
  nobast: string;
  tgspm: string | null;
  tglbast: string | null;
  status?: string;
}

interface FormValues {
  id?: string;
  tahun: string;
  formRows: FormRow[];
}

interface Rekam2Props {
  show: boolean;
  onHide: () => void;
  id?: string;
  nomor?: string;
  kdsatker?: string;
  nmsatker?: string;
  tahun?: string;
}

// Helper for HTTP errors
const handleHttpError = (status: any, msg: string) => console.error(msg);

const DataSPM = ({ cek, id }: { cek: boolean; id: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cek && id) {
      console.log("DataSPM useEffect triggered, cek:", cek, "id:", id);
      fetchData();
    }
  }, [cek, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = `SELECT nospm, nilspm, status, tgspm, tgbast, nobast FROM laporan_2023.dispensasi_spm_lampiran WHERE id_dispensasi = '${id}' ORDER BY id DESC`;
      console.log("DataSPM query:", query);
      const encryptedQuery = btoa(query);

      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999&page=0`
      );

      console.log("DataSPM response:", result);
      setData(result.result || []);
    } catch (error) {
      console.error("Terjadi Permasalahan Koneksi atau Server Backend");
      toast.error("Gagal memuat data SPM");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">No.</TableHead>
            <TableHead>Tgl SPM</TableHead>
            <TableHead>No SPM</TableHead>
            <TableHead className="text-right">Nilai SPM</TableHead>
            <TableHead>Tgl BAST</TableHead>
            <TableHead>No BAST</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Belum ada data SPM
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell>{item.tgspm}</TableCell>
                <TableCell>{item.nospm}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("id-ID").format(item.nilspm || 0)}
                </TableCell>
                <TableCell>{item.tgbast}</TableCell>
                <TableCell>{item.nobast}</TableCell>
                <TableCell className="text-center">
                  {item.status === "Setuju" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Disetujui
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Ditolak
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default function Rekam2({
  show,
  onHide,
  id = "",
  nomor = "",
  kdsatker = "",
  nmsatker = "",
  tahun = String(new Date().getFullYear()),
}: Rekam2Props) {
  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [cekupload, setCekupload] = useState(false);
  const [activeTab, setActiveTab] = useState("dispensasi-overview");
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaispm: "",
      nospm: "",
      nobast: "",
      tgspm: null,
      tglbast: null,
      status: "Setuju",
    },
  ]);

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaispm: "",
        nospm: "",
        nobast: "",
        tgspm: null,
        tglbast: null,
        status: "Setuju",
      },
    ]);
  };

  const removeRow = (index: number) => {
    const updatedRows = [...formRows];
    updatedRows.splice(index, 1);
    setFormRows(updatedRows);
  };

  const initialValues: FormValues = {
    id,
    tahun,
    formRows,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        nospm: Yup.string().required("harus diisi"),
        nilaispm: Yup.number().required("hanya angka"),
        nobast: Yup.string().required("harus diisi"),
        tgspm: Yup.date().required("harus diisi"),
        tglbast: Yup.date().required("harus diisi"),
        status: Yup.string().required("harus diisi"),
      })
    ),
  });

  const handleSubmitdata = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setCek(false);
    setLoading(true);
    try {
      // NOTE: apiClient forces /api/v1 prefix handling, so check if NEXT_PUBLIC_SIMPANSPM includes it or not.
      // Assuming straightforward path like "/simpan-spm" or full URL.
      // If full URL, apiClient might be tricky, but let's assume relative path works best.
      // If process.env.NEXT_PUBLIC_SIMPANSPM contains a full URL, we might need to handle it.
      // But for now, we pass it as is, and apiClient handles apiPath.
      // If the original was "/api/simpan-spm", apiPath transforms it to "/api/v1/simpan-spm".
      const url = process.env.NEXT_PUBLIC_SIMPANSPM || "/simpan-spm";

      await apiClient.post(url, values);

      Swal.fire({
        html: `<div class='text-success mt-4'>Data SPM Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-primary text-white px-4 py-2 rounded",
        },
        confirmButtonText: "Tutup",
      });
      setCek(true);
      toast.success("Data SPM Berhasil Disimpan");
    } catch (error: any) {
      console.error("Submit Error:", error);
      // Error is likely an AxiosError
      const status = error.response?.status;
      const errData = error.response?.data;

      handleHttpError(
        status,
        (errData && errData.error) ||
        "Terjadi Permasalahan Koneksi atau Server Backend"
      );
      toast.error("Gagal menyimpan data SPM");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaispm: "",
        nospm: "",
        nobast: "",
        tgspm: null,
        tglbast: null,
        status: "Setuju",
      },
    ]);
    onHide();
  };

  const handleCek = () => {
    setCek(true);
    setCekupload(false);
  };

  const handleCekUpload = () => {
    setCekupload(true);
    setCek(false);
  };

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <Dialog open={show} onOpenChange={handleModalClose}>
        <DialogContent className="w-full max-w-5xl sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden w-[95vw] max-w-7xl sm:max-w-7xl" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <span className="text-green-600">Data SPM Dispensasi</span>
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex-1 overflow-hidden space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(value: string) => {
                setActiveTab(value);
                if (value === "dispensasi-edit") {
                  handleCek();
                } else if (value === "dispensasi-upload") {
                  handleCekUpload();
                }
              }}
              className="w-full gap-3"
            >
              <div className="border-b border-border/50 pb-3 mb-0">
                <TabsList className="relative w-full h-auto p-2 rounded-xl grid grid-cols-3 gap-2">
                  <TabsTrigger
                    value="dispensasi-overview"
                    className="h-auto px-4 py-2 text-sm flex items-center justify-center gap-2 whitespace-normal text-center"
                  >
                    Rekam SPM
                  </TabsTrigger>
                  <TabsTrigger
                    value="dispensasi-upload"
                    className="h-auto px-4 py-2 text-sm flex items-center justify-center gap-2 whitespace-normal text-center"
                  >
                    Upload Excel
                  </TabsTrigger>
                  <TabsTrigger
                    value="dispensasi-edit"
                    className="h-auto px-4 py-2 text-sm flex items-center justify-center gap-2 whitespace-normal text-center"
                  >
                    Data SPM
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents className="mt-4 space-y-4">
                <TabsContent value="dispensasi-overview" className="mt-0 space-y-4">
                  <Formik
                    validationSchema={validationSchema}
                    onSubmit={handleSubmitdata}
                    initialValues={initialValues}
                  >
                    {({
                      handleSubmit,
                      setFieldValue,
                      values,
                      touched,
                      errors,
                    }) => (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-4 bg-background border rounded-lg shadow-sm">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">SATKER</p>
                            <p className="font-bold text-lg">{nmsatker} ({kdsatker})</p>
                            <p className="text-sm text-muted-foreground mt-1">Nomor Permohonan : <span className="font-medium text-foreground">{nomor}</span></p>
                          </div>
                        </div>

                        <div className="bg-transparent border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Detail SPM</h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/80 hover:bg-primary/10"
                              onClick={addRow}
                            >
                              <PlusSquare className="mr-2 h-5 w-5" />
                              Tambah Baris
                            </Button>
                          </div>

                          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                            {formRows.map((row, index) => (
                              <div key={index} className="p-4 pr-16 border rounded-md bg-muted/5 space-y-4 relative group">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeRow(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                  {/* Row 1: Tgl SPM, No SPM, Nilai SPM */}
                                  <div className="md:col-span-3 space-y-2">
                                    <Label>Tgl SPM</Label>
                                    <DatePicker
                                      date={
                                        values.formRows[index]?.tgspm
                                          ? parse(values.formRows[index].tgspm, "yyyy-MM-dd", new Date())
                                          : undefined
                                      }
                                      onDateChange={(date: Date | undefined) => {
                                        if (date) {
                                          setFieldValue(
                                            `formRows[${index}].tgspm`,
                                            format(date, "yyyy-MM-dd")
                                          );
                                        } else {
                                          setFieldValue(`formRows[${index}].tgspm`, null);
                                        }
                                      }}
                                      placeholder="Tgl SPM"
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].tgspm`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-5 space-y-2">
                                    <Label>Nomor SPM</Label>
                                    <Field
                                      name={`formRows[${index}].nospm`}
                                      type="text"
                                      placeholder="Nomor SPM"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nospm && (errors.formRows as any)?.[index]?.nospm ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nospm`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-4 space-y-2">
                                    <Label>Nilai SPM</Label>
                                    <Field
                                      name={`formRows[${index}].nilaispm`}
                                      type="number"
                                      placeholder="Nilai SPM"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nilaispm && (errors.formRows as any)?.[index]?.nilaispm ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nilaispm`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  {/* Row 2: Tgl BAST, No BAST, Status */}
                                  <div className="md:col-span-3 space-y-2">
                                    <Label>Tgl BAST</Label>
                                    <DatePicker
                                      date={
                                        values.formRows[index]?.tglbast
                                          ? parse(values.formRows[index].tglbast, "yyyy-MM-dd", new Date())
                                          : undefined
                                      }
                                      onDateChange={(date: Date | undefined) => {
                                        if (date) {
                                          setFieldValue(
                                            `formRows[${index}].tglbast`,
                                            format(date, "yyyy-MM-dd")
                                          );
                                        } else {
                                          setFieldValue(`formRows[${index}].tglbast`, null);
                                        }
                                      }}
                                      placeholder="Tgl BAST"
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].tglbast`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-5 space-y-2">
                                    <Label>Nomor BAST</Label>
                                    <Field
                                      name={`formRows[${index}].nobast`}
                                      type="text"
                                      placeholder="Nomor BAST"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nobast && (errors.formRows as any)?.[index]?.nobast ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nobast`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-4 space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex gap-4 pt-1">
                                      <label className="flex items-center space-x-2 cursor-pointer">
                                        <Field
                                          type="radio"
                                          name={`formRows[${index}].status`}
                                          value="Setuju"
                                          className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
                                        />
                                        <span>Disetujui</span>
                                      </label>
                                      <label className="flex items-center space-x-2 cursor-pointer">
                                        <Field
                                          type="radio"
                                          name={`formRows[${index}].status`}
                                          value="Tolak"
                                          className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
                                        />
                                        <span>Ditolak</span>
                                      </label>
                                    </div>
                                    <ErrorMessage
                                      name={`formRows[${index}].status`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </form>
                    )}
                  </Formik>
                </TabsContent>
                <TabsContent value="dispensasi-edit" className="mt-0 space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <DataSPM cek={cek} id={id} />
                  </div>
                </TabsContent>
                <TabsContent value="dispensasi-upload" className="mt-0 space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <UploadSPM cekupload={cekupload} id={id} />
                  </div>
                </TabsContent>
              </TabsContents>
            </Tabs>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={handleModalClose}>
              Tutup
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={loading}
              onClick={() => {
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
              }}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
