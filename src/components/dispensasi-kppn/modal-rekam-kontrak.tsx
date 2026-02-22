"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { PlusSquare, Save, Trash2 } from "lucide-react";
import DataKontrakDetail from "./data-kontrak-detail";
import { format, parse } from "date-fns";
import moment from "moment";
import { apiPath } from "@/lib/config/base-path";

interface RekamKontrakProps {
  show: boolean;
  onHide: () => void;
  id: string;
  nomor: string;
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
}

interface FormRow {
  nilaikontrak: string;
  nokontrak: string;
  tgkontrak: string | null;
  kdkppn: string;
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function ModalRekamKontrak({
  show,
  onHide,
  id,
  nomor,
  kdsatker,
  nmsatker,
  kdkppn,
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
      kdkppn: kdkppn,
    },
  ]);

  const addRow = () => {
    setFormRows([
      ...formRows,
      {
        nilaikontrak: "",
        nokontrak: "",
        tgkontrak: null,
        kdkppn: kdkppn,
      },
    ]);
  };

  const removeRow = (index: number) => {
    const updatedRows = [...formRows];
    updatedRows.splice(index, 1);
    setFormRows(updatedRows);
  };

  const initialValues = {
    id,
    formRows,
    kdkppn,
  };

  const validationSchema = Yup.object().shape({
    formRows: Yup.array().of(
      Yup.object().shape({
        nokontrak: Yup.string().required("harus diisi"),
        nilaikontrak: Yup.number().required("hanya angka"),
        tgkontrak: Yup.date().required("harus diisi"),
      })
    ),
  });

  const handleSubmitdata = async (
    values: any,
    { setSubmitting }: FormikHelpers<any>
  ) => {
    setCek(false);
    setLoading(true);
    try {
      const response = await fetch(
        apiPath("/dispensasi/simpan-lampiran-kontrak"),
        {
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values.formRows.map((row: any) => ({ ...row, id_dispensasi: id }))),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLoading(false);
      Swal.fire({
        html: `<div class='text-success mt-4'>Data Kontrak Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-green-600 text-white px-4 py-2 rounded",
        },
        confirmButtonText: "Tutup",
      });
      setCek(true);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
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
        kdkppn: kdkppn,
      },
    ]);
    setActiveTab("dispensasi-overview");
    onHide();
  };

  const handleCek = () => {
    setCek(true);
  };

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden w-[95vw] max-w-7xl sm:max-w-7xl" showCloseButton={false}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <span>Data Dispensasi Kontrak</span>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex-1 overflow-hidden space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(value: string) => {
              setActiveTab(value);
              if (value === "dispensasi-edit") {
                handleCek();
              }
            }}
            className="w-full gap-3"
          >
            <div className="border-b border-border/50 pb-3 mb-0">
              <TabsList className="relative w-full h-auto p-2 rounded-xl grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
                <TabsTrigger
                  value="dispensasi-overview"
                  className="h-auto px-4 py-2 text-sm flex items-center justify-center gap-2 whitespace-normal text-center"
                >
                  Rekam Kontrak
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
                {user?.role !== "kanwil_djpb" && (
                  <Formik
                    validationSchema={validationSchema}
                    onSubmit={handleSubmitdata}
                    initialValues={initialValues}
                    enableReinitialize
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
                            {values.formRows && values.formRows.length > 0 && values.formRows.map((row, index) => (
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
                                  <div className="md:col-span-5 space-y-2">
                                    <Label>Nomor Kontrak/ Adendum</Label>
                                    <Field
                                      name={`formRows[${index}].nokontrak`}
                                      placeholder="Nomor Kontrak/ Adendum"
                                      className={inputClass}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nokontrak`}
                                      component="div"
                                      className="text-red-500 text-xs"
                                    />
                                  </div>

                                  <div className="md:col-span-3 space-y-2">
                                    <Label>Tgl Kontrak</Label>
                                    <DatePicker
                                      date={
                                        values.formRows[index]?.tgkontrak
                                          ? moment(values.formRows[index].tgkontrak).toDate()
                                          : undefined
                                      }
                                      onDateChange={(date: Date | undefined) => {
                                        if (date) {
                                          setFieldValue(
                                            `formRows[${index}].tgkontrak`,
                                            moment(date).format("YYYY-MM-DD")
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

                                  <div className="md:col-span-4 space-y-2">
                                    <Label>Nilai Kontrak</Label>
                                    <Field
                                      name={`formRows[${index}].nilaikontrak`}
                                      type="number"
                                      placeholder="Nilai Kontrak"
                                      className={inputClass}
                                    />
                                    <ErrorMessage
                                      name={`formRows[${index}].nilaikontrak`}
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
                )}
              </TabsContent>

              <TabsContent value="dispensasi-edit" className="mt-0 space-y-4">
                <div className="bg-background rounded-lg p-4 shadow-sm">
                  <DataKontrakDetail cek={cek} id={id} />
                </div>
              </TabsContent>
            </TabsContents>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleModalClose}>
            Tutup
          </Button>
          {(activeTab === 'dispensasi-overview' && user?.role !== "kanwil_djpb") && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
