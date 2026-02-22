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
import DispenKontrakDetail from "./dispen-kontrak-detail";
import UploadKontrak from "./upload-kontrak";

interface FormRow {
  nilaikontrak: string | number;
  nokontrak: string;
  tgkontrak: string | null;
  status: string;
}

interface FormValues {
  id: string;
  tahun: string;
  formRows: FormRow[];
}

interface RekamKontrakProps {
  show: boolean;
  onHide: () => void;
  id: string;
  nomor: string;
  kdsatker: string;
  nmsatker: string;
  tahun: string;
}

// Helper for HTTP errors
const handleHttpError = (status: any, msg: string) => console.error(msg);

export default function RekamKontrak({
  show,
  onHide,
  id,
  nomor,
  kdsatker,
  nmsatker,
  tahun,
}: RekamKontrakProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cek, setCek] = useState(false);
  const [activeTab, setActiveTab] = useState("dispensasi-overview");
  const [formRows, setFormRows] = useState<FormRow[]>([
    {
      nilaikontrak: "",
      nokontrak: "",
      tgkontrak: null,
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
        nilaikontrak: "",
        nokontrak: "",
        tgkontrak: null,
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
        nokontrak: Yup.string().required("harus diisi"),
        nilaikontrak: Yup.number().required("hanya angka"),
        tgkontrak: Yup.date().required("harus diisi"),
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
      const url = "/dispensasi/simpan-lampiran-kontrak";

      // Using apiClient.post instead of fetch
      await apiClient.post(url, values.formRows);

      Swal.fire({
        html: `<div class='text-success mt-4'>Data Kontrak Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-primary text-white px-4 py-2 rounded",
        },
        confirmButtonText: "Tutup",
      });
      setCek(true);
      toast.success("Data Kontrak Berhasil Disimpan");
    } catch (error: any) {
      console.error("Submit Error:", error);
      const message =
        error?.message || "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(message);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setFormRows([
      {
        nilaikontrak: "",
        nokontrak: "",
        tgkontrak: null,
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
              <span className="text-green-600">Data Dispensasi Kontrak</span>
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
                    Rekam Kontrak
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
                    Data Kontrak
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
                            <h3 className="font-semibold text-lg">Detail Kontrak</h3>
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
                                  {/* Row 1: Tgl Kontrak, No Kontrak, Nilai Kontrak */}
                                  <div className="md:col-span-3 space-y-2">
                                    <Label>Tgl Kontrak</Label>
                                    <DatePicker
                                      date={
                                        values.formRows[index]?.tgkontrak
                                          ? parse(values.formRows[index].tgkontrak as string, "yyyy-MM-dd", new Date())
                                          : undefined
                                      }
                                      onDateChange={(date: Date | undefined) => {
                                        if (date) {
                                          setFieldValue(
                                            `formRows[${index}].tgkontrak`,
                                            format(date, "yyyy-MM-dd")
                                          );
                                        } else {
                                          setFieldValue(`formRows[${index}].tgkontrak`, null);
                                        }
                                      }}
                                      placeholder="Tgl Kontrak"
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].tgkontrak`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-5 space-y-2">
                                    <Label>Nomor Kontrak</Label>
                                    <Field
                                      name={`formRows[${index}].nokontrak`}
                                      type="text"
                                      placeholder="Nomor Kontrak/ Adendum"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nokontrak && (errors.formRows as any)?.[index]?.nokontrak ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nokontrak`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-4 space-y-2">
                                    <Label>Nilai Kontrak</Label>
                                    <Field
                                      name={`formRows[${index}].nilaikontrak`}
                                      type="number"
                                      placeholder="Nilai Kontrak"
                                      as={Input}
                                      className={touched.formRows?.[index]?.nilaikontrak && (errors.formRows as any)?.[index]?.nilaikontrak ? "border-red-500" : ""}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nilaikontrak`}
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
                    <DispenKontrakDetail cek={cek} id={id} />
                  </div>
                </TabsContent>
                <TabsContent value="dispensasi-upload" className="mt-0 space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <UploadKontrak cekupload={cekupload} id={id} />
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
