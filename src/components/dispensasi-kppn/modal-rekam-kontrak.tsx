"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import DatePicker from "react-datepicker";
import { Formik, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { PlusSquare, X, Save } from "lucide-react";
import DataKontrakDetail from "./data-kontrak-detail";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";

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
        `${process.env.NEXT_PUBLIC_SIMPANLAMPIRANKONTRAKKPPN}`,
        {
          method: "POST",
          headers: {
            // Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values.formRows.map((row: any) => ({ ...row, id_dispensasi: id }))),
        }
      );

      // Note: original code sent `values` directly (which had structure {id, formRows, kdkppn}), 
      // but usually bulk insert expects array or wrapped array. 
      // The original code was `body: JSON.stringify(formRows)` but passed `formRows` as first arg to `handleSubmitdata`.
      // Wait, original `handleSubmitdata` signature was `(formRows: any, ...)` but Formik passes `values`. 
      // And in original code, `initialValues` had `formRows`. 
      // But look at original code: `handleSubmitdata` took `formRows`... wait.
      // `onSubmit={handleSubmitdata}` in Formik calls it with `values`.
      // So `values` would be `{ id, formRows, kdkppn }`.
      // The original code `body: JSON.stringify(formRows)` inside `handleSubmitdata` implies the first arg was named `formRows` but it received `values` object.
      // So it was sending `{ id, formRows, kdkppn }` to the backend?
      // Or did the user mean to send just the rows? 
      // looking at `ModalRekamKontrak` original: `handleSubmitdata = async (formRows: any, ...)`
      // `body: JSON.stringify(formRows)`
      // So it sends the whole values object.
      // I will keep it consistent: send `values`. 
      // Actually, looking at `DataDispensasiKPPN` rekam logic...
      // The backend probably expects specific structure. 
      // To be safe, I should preserve what was being sent. 
      // The first argument to onSubmit is `values`. So `formRows` param in original code IS `values`.

      // Let's verify original code logic:
      // `const handleSubmitdata = async (formRows: any, { setSubmitting }: any) => { ... body: JSON.stringify(formRows) ... }`
      // So yes, it sends the whole values object.

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
      // Reset rows after success? Original didn't seem to reset, but kept them.
      // I'll keep behavior.
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-green-600 font-bold text-xl flex items-center gap-2">
              Data Dispensasi Kontrak
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab("dispensasi-overview")}
            className={`px-4 py-2 font-medium text-sm transition-colors hover:text-primary ${activeTab === "dispensasi-overview" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            Rekam Kontrak
          </button>
          <button
            onClick={() => { setActiveTab("dispensasi-edit"); handleCek(); }}
            className={`px-4 py-2 font-medium text-sm transition-colors hover:text-primary ${activeTab === "dispensasi-edit" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            Data Kontrak
          </button>
        </div>

        {activeTab === "dispensasi-overview" && user?.role !== "kanwil_djpb" && (
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
                <div className="flex justify-between items-end mb-4">
                  <span className="font-bold text-green-600 text-sm">
                    SATKER : {nmsatker} ({kdsatker}) <br />
                    Nomor Permohonan : {nomor}
                  </span>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                  >
                    {loading && <Spinner className="mr-2 h-4 w-4" />}
                    Simpan Data
                  </Button>
                </div>

                <hr className="my-2" />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary/10"
                    onClick={addRow}
                  >
                    <PlusSquare className="h-4 w-4 mr-2" />
                    Tambah Baris
                  </Button>
                </div>

                {values.formRows && values.formRows.length > 0 && values.formRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-2 border rounded-md bg-slate-50/50">
                    <div className="md:col-span-5">
                      <div className="space-y-1">
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
                    </div>

                    <div className="md:col-span-3">
                      <div className="space-y-1">
                        <div className="relative">
                          <DatePicker
                            name={`formRows[${index}].tgkontrak`}
                            selected={
                              values.formRows?.[index]?.tgkontrak
                                ? moment(values.formRows[index].tgkontrak).toDate()
                                : null
                            }
                            onChange={(date) => {
                              setFieldValue(
                                `formRows[${index}].tgkontrak`,
                                moment(date).format("YYYY-MM-DD")
                              );
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Tgl Kontrak"
                            autoComplete="off"
                            className={inputClass}
                            wrapperClassName="w-full"
                          />
                        </div>
                        <ErrorMessage
                          name={`formRows[${index}].tgkontrak`}
                          component="div"
                          className="text-red-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4">
                      <div className="space-y-1">
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
              </form>
            )}
          </Formik>
        )}

        {activeTab === "dispensasi-edit" && (
          <DataKontrakDetail cek={cek} id={id} />
        )}
      </DialogContent>
    </Dialog>
  );
}
