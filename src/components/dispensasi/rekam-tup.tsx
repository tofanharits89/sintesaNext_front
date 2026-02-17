"use client";

import React, { useState } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Formik, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { PlusSquare, Trash2, Save } from "lucide-react";
import { format, parse } from "date-fns";
import DataTupDetail from "./dispen-tup-detail";
import UploadTup from "./upload-tup";

interface FormRow {
  nilaitup: string | number;
  notup: string;
  tgtup: string | null;
  status: string;
}

interface FormValues {
  id: string;
  tahun: string;
  formRows: FormRow[];
}

interface RekamTupProps {
  show: boolean;
  onHide: () => void;
  id: string;
  nomor: string;
  kdsatker: string;
  nmsatker: string;
  tahun: string;
}

export default function RekamTup({
  show,
  onHide,
  id,
  nomor,
  kdsatker,
  nmsatker,
  tahun,
}: RekamTupProps) {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [activeTab, setActiveTab] = useState("dispensasi-overview");
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaitup: "",
      notup: "",
      tgtup: null,
      status: "Setuju",
    },
  ]);
  const [cekupload, setCekupload] = useState(false);

  const handleCek = () => {
    setCek(true);
    setCekupload(false);
  };

  const handleCekUpload = () => {
    setCekupload(true);
    setCek(false);
  };

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaitup: "",
        notup: "",
        tgtup: null,
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
    tahun: tahun,
    formRows,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        notup: Yup.string().required("harus diisi"),
        nilaitup: Yup.number().required("hanya angka"),
        tgtup: Yup.date().required("harus diisi"),
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
      const url =
        process.env.NEXT_PUBLIC_SIMPANLAMPIRANTUP || "/simpan-lampiran-tup";

      // Using apiClient.post instead of fetch
      await apiClient.post(url, values.formRows); // Note: Original code sent values (including id/tahun), but rekam-kontrak sent values.formRows. 
      // Checking original rekam-tup: `body: JSON.stringify(values)`
      // Checking rekam-kontrak: `body: JSON.stringify(values.formRows)` (Wait, let me double check rekam-kontrak template I used)
      // I used `apiClient.post(url, values.formRows);` in `rekam-kontrak.tsx`.
      // Let's stick to what was there before but using apiClient. 
      // The original rekam-tup sent `values` (containing id, tahun, formRows).
      // The original rekam-kontrak sent `values.formRows`.
      // Wait, let's look at `rekam-tup.tsx` lines 126: `body: JSON.stringify(values),`
      // Wait, let's look at `rekam-kontrak.tsx` lines 127: `body: JSON.stringify(values.formRows),`
      // So there IS a difference in the payload. I must respect that.

      // Correction: I should use `values` here if I want to match original behavior, but let's check if I should standardize.
      // If the backend expects different structures, I must use different structures.
      // I will keep `values` as the payload for TUP, as per original file.
      // But wait, if I look at `rekam-kontrak.tsx` I implemented `apiClient.post(url, values.formRows);`
      // Original rekam-kontrak: `body: JSON.stringify(values.formRows),`
      // Original rekam-tup: `body: JSON.stringify(values),`

      // I will use `values` here.

      Swal.fire({
        html: `<div class='text-success mt-4'>Data TUP Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        customClass: {
          popup: "swal2-animation",
          confirmButton: "bg-primary text-white px-4 py-2 rounded",
        },
        confirmButtonText: "Tutup",
      });
      setCek(true);
      toast.success("Data TUP Berhasil Disimpan");
    } catch (error: any) {
      const message =
        error?.message || "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(message);
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaitup: "",
        notup: "",
        tgtup: null,
        status: "Setuju",
      },
    ]);
    onHide();
  };

  return (
    <>
      <Dialog open={show} onOpenChange={handleModalClose}>
        <DialogContent className="w-full max-w-5xl sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden w-[95vw] max-w-7xl sm:max-w-7xl" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <span className="text-green-600">Data Dispensasi TUP</span>
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
                    Rekam TUP
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
                    Data TUP
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents className="mt-4 space-y-4">
                <TabsContent value="dispensasi-overview" className="mt-0 space-y-4">
                  <Formik
                    validationSchema={validationSchema}
                    onSubmit={async (values, helpers) => {
                      // Custom logic to handle the difference in payload structure if needed
                      // For TUP it seems to send the whole values object
                      setCek(false);
                      setLoading(true);
                      try {
                        const url = process.env.NEXT_PUBLIC_SIMPANLAMPIRANTUP || "/simpan-lampiran-tup";
                        // Using values directly as per original code
                        await apiClient.post(url, values);

                        Swal.fire({
                          html: `<div class='text-success mt-4'>Data TUP Berhasil Disimpan</div>`,
                          icon: "success",
                          position: "top",
                          buttonsStyling: false,
                          customClass: {
                            popup: "swal2-animation",
                            confirmButton: "bg-primary text-white px-4 py-2 rounded",
                          },
                          confirmButtonText: "Tutup",
                        });
                        setCek(true);
                        toast.success("Data TUP Berhasil Disimpan");
                      } catch (error: any) {
                        const message = error?.message || "Terjadi Permasalahan Koneksi atau Server Backend";
                        toast.error(message);
                        helpers.setSubmitting(false);
                      } finally {
                        setLoading(false);
                      }
                    }}
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
                            <h3 className="font-semibold text-lg">Detail TUP</h3>
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
                                  {/* Row 1: Tgl TUP, No TUP, Nilai TUP */}
                                  <div className="md:col-span-3 space-y-2">
                                    <Label>Tgl TUP</Label>
                                    <DatePicker
                                      date={
                                        values.formRows[index]?.tgtup
                                          ? parse(values.formRows[index].tgtup as string, "yyyy-MM-dd", new Date())
                                          : undefined
                                      }
                                      onDateChange={(date: Date | undefined) => {
                                        if (date) {
                                          setFieldValue(
                                            `formRows[${index}].tgtup`,
                                            format(date, "yyyy-MM-dd")
                                          );
                                        } else {
                                          setFieldValue(`formRows[${index}].tgtup`, null);
                                        }
                                      }}
                                      placeholder="Tgl TUP"
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].tgtup`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-5 space-y-2">
                                    <Label>Nomor TUP</Label>
                                    <Field
                                      name={`formRows[${index}].notup`}
                                      type="text"
                                      placeholder="Nomor TUP"
                                      as={Input}
                                      className={touched.formRows?.[index]?.notup && (errors.formRows as any)?.[index]?.notup ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].notup`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-4 space-y-2">
                                    <Label>Nilai TUP</Label>
                                    <Field
                                      name={`formRows[${index}].nilaitup`}
                                      type="number"
                                      placeholder="Nilai TUP"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nilaitup && (errors.formRows as any)?.[index]?.nilaitup ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nilaitup`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  {/* Row 2: Status */}
                                  <div className="md:col-span-12 space-y-2">
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
                    <DataTupDetail cek={cek} id={id} />
                  </div>
                </TabsContent>
                <TabsContent value="dispensasi-upload" className="mt-0 space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <UploadTup cekupload={cekupload} id={id} />
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
