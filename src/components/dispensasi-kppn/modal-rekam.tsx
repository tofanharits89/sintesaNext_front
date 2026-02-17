"use client";

import React, { useState, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Formik, ErrorMessage, FormikProps, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import moment from "moment";
import { X, Save } from "lucide-react";
import CekKppn from "./cek-kppn";
import { apiClient } from "@/lib/api/httpClient";

interface Satker {
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
}

interface FormValues {
  tanggalPermohonan: string | null;
  nomorPermohonan: string;
  satker: string;
  kppn: string;
  alasan: string;
  tanggalPersetujuan: string | null;
  nomorPersetujuan: string;
  jeniskontrak: string;
  alasanLainnya: string;
  tahun: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const Rekam: React.FC<Props> = ({ show, onHide }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<Satker | null>(null);
  const [searchResults, setSearchResults] = useState<Satker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Satker[]>([]);
  const [jeniskontrak, setJenisKontrak] = useState("");
  const [tahun, setTahun] = useState("");
  const [kppn, setCekKppn] = useState("");
  const [dispen, setDispen] = useState("");

  const validationSchema = Yup.object().shape({
    tanggalPermohonan: Yup.date()
      .nullable()
      .required("Tanggal Permohonan harus diisi")
      .max(
        Yup.ref("tanggalPersetujuan"),
        "Tanggal Permohonan tidak boleh lebih besar dari Tanggal Persetujuan"
      ),
    tanggalPersetujuan: Yup.date()
      .nullable()
      .required("Tanggal Persetujuan harus diisi"),
    nomorPermohonan: Yup.string().required("Nomor Permohonan harus diisi"),
    satker: Yup.string().required("Satker harus diisi"),
    alasan: Yup.string().required("Alasan harus dipilih"),
    nomorPersetujuan: Yup.string().required("Nomor Persetujuan harus diisi"),
    kppn: Yup.string().required("KPPN harus dipilih"),
    tahun: Yup.string().required("Tahun harus dipilih"),
    jeniskontrak: Yup.string().required("Jenis Kontrak harus dipilih"),
    alasanLainnya: Yup.string().when("alasan", {
      is: (alasan: string) => alasan === "07",
      then: () => Yup.string().required("Keterangan harus diisi"),
    }),
  });

  const initialValues: FormValues = {
    tanggalPermohonan: null,
    nomorPermohonan: "",
    satker: "",
    kppn: kppn,
    alasan: "",
    tanggalPersetujuan: null,
    nomorPersetujuan: "",
    jeniskontrak: jeniskontrak,
    alasanLainnya: "",
    tahun: tahun,
  };

  const handleCekKppn = (kppn: string) => {
    setCekKppn(kppn);
  };

  const handleSubmitdata = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_SIMPANKONTRAKKPPN || "",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data Berhasil Disimpan");
      setSearchResults([]);
      setLoading(false);
      handleModalClose();
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getData = async () => {
    let query = "SELECT kdsatker,nmsatker,kdkppn FROM dbref.t_satker_kppn_2025";

    if (kppn !== "000" && kppn !== "") {
      query += ` WHERE kdkppn='${kppn}'`;
    }

    const encryptedQuery = btoa(query);
    try {
      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999999&page=0`
      );

      setData(result.result);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    const results = data.filter((item) => {
      const kdsatkerLowerCase = item.kdsatker.toLowerCase();
      const nmsatkerLowerCase = item.nmsatker.toLowerCase();
      if (user?.role === "kppn") {
        if (item.kdkppn === user.kdkppn) {
          return (
            kdsatkerLowerCase.includes(value.toLowerCase()) ||
            nmsatkerLowerCase.includes(value.toLowerCase())
          );
        }
      } else {
        return (
          kdsatkerLowerCase.includes(value.toLowerCase()) ||
          nmsatkerLowerCase.includes(value.toLowerCase())
        );
      }

      return false;
    });

    const limitedResults = results.slice(0, 100);

    setSearchResults(limitedResults);
    setIsSearching(false);
  };

  useEffect(() => {
    getData();
  }, [kppn]);

  useEffect(() => {
    if (data.length > 0) {
      setSearchResults(data.slice(0, 100));
    }
  }, [data]);

  const handleModalClose = () => {
    setSelectedSatker(null);
    setSearchResults([]);
    setSearchTerm("");
    setCekKppn("");
    setDispen("");
    onHide();
    setJenisKontrak("");
    setTahun("");
  };

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-zinc-100 dark:bg-black px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent showCloseButton={false} className="max-w-4xl sm:max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Rekam Dispensasi Kontrak KPPN</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Formik
            validationSchema={validationSchema}
            enableReinitialize={true}
            onSubmit={handleSubmitdata}
            initialValues={initialValues}
          >
            {({
              handleSubmit,
              handleChange,
              setFieldValue,
              values,
              touched,
              errors,
            }: FormikProps<FormValues>) => (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Tahun Anggaran</Label>
                      <Select
                        value={values.tahun}
                        onValueChange={(value) => {
                          setFieldValue("tahun", value);
                          setTahun(value);
                        }}
                      >
                        <SelectTrigger className={`w-full ${touched.tahun && errors.tahun ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Tahun ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">TA 2024</SelectItem>
                          <SelectItem value="2025">TA 2025</SelectItem>
                          <SelectItem value="2026">TA 2026</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage name="tahun" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Jenis Dispensasi</Label>
                      <Select
                        value={values.jeniskontrak}
                        onValueChange={(value) => {
                          setFieldValue("jeniskontrak", value);
                          setJenisKontrak(value);
                        }}
                      >
                        <SelectTrigger className={`w-full ${touched.jeniskontrak && errors.jeniskontrak ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Jenis ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">Kontrak</SelectItem>
                          <SelectItem value="02">Adendum Kontrak</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage name="jeniskontrak" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">KPPN</Label>
                      <CekKppn
                        value={values.kppn}
                        className={`${inputClass} ${touched.kppn && errors.kppn ? "border-red-500" : ""}`}
                        onChange={(e: string) => {
                          handleChange({
                            target: { name: "kppn", value: e },
                          });
                          handleCekKppn(e);
                        }}
                      />
                      <ErrorMessage name="kppn" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Tanggal Permohonan</Label>
                      <div className="relative">
                        <DatePicker
                          date={
                            values.tanggalPermohonan
                              ? moment(values.tanggalPermohonan).toDate()
                              : undefined
                          }
                          onDateChange={(date: Date | undefined) => {
                            setFieldValue(
                              "tanggalPermohonan",
                              date ? moment(date).format("YYYY-MM-DD") : null,
                              true
                            );
                          }}
                          placeholder="Tgl Permohonan"
                          className={inputClass}
                        />
                      </div>
                      <ErrorMessage name="tanggalPermohonan" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="space-y-2">
                      <Label className="font-bold">Nomor Permohonan</Label>
                      <Input
                        name="nomorPermohonan"
                        type="text"
                        value={values.nomorPermohonan}
                        onChange={handleChange}
                        placeholder="Nomor Permohonan"
                        className={touched.nomorPermohonan && errors.nomorPermohonan ? "border-red-500" : ""}
                      />
                      <ErrorMessage name="nomorPermohonan" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Satker</Label>
                  <VirtualizedSelect
                    options={searchResults.map((item) => ({
                      value: item.kdsatker,
                      label: `${item.kdsatker} - ${item.nmsatker}`,
                    }))}
                    value={selectedSatker ? selectedSatker.kdsatker : ""}
                    onValueChange={(value) => {
                      const selected = searchResults.find((item) => item.kdsatker === value);
                      setFieldValue("satker", value);
                      setSelectedSatker(selected || null);
                    }}
                    placeholder="Ketik Kode atau Nama Satker..."
                    className={touched.satker && errors.satker ? "border-red-500" : ""}
                  />
                  <ErrorMessage name="satker" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Tanggal Persetujuan</Label>
                      <div className="relative">
                        <DatePicker
                          date={
                            values.tanggalPersetujuan
                              ? moment(values.tanggalPersetujuan).toDate()
                              : undefined
                          }
                          onDateChange={(date: Date | undefined) => {
                            setFieldValue(
                              "tanggalPersetujuan",
                              date ? moment(date).format("YYYY-MM-DD") : null,
                              true
                            );
                          }}
                          placeholder="Tgl Persetujuan"
                          className={inputClass}
                        />
                      </div>
                      <ErrorMessage name="tanggalPersetujuan" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="space-y-2">
                      <Label className="font-bold">Nomor Persetujuan</Label>
                      <Input
                        name="nomorPersetujuan"
                        type="text"
                        value={values.nomorPersetujuan}
                        onChange={handleChange}
                        placeholder="Nomor Persetujuan Dispensasi"
                        className={touched.nomorPersetujuan && errors.nomorPersetujuan ? "border-red-500" : ""}
                      />
                      <ErrorMessage name="nomorPersetujuan" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Alasan Dispensasi</Label>
                  <Select
                    value={values.alasan}
                    onValueChange={(value) => {
                      setFieldValue("alasan", value);
                      setDispen(value);
                      if (value !== "07") {
                        setFieldValue("alasanLainnya", "");
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${touched.alasan && errors.alasan ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="--- Pilih Alasan Dispensasi ---" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Kendala pada aplikasi</SelectItem>
                      <SelectItem value="02">02 - Kendala pada pejabat perbendaharaan</SelectItem>
                      <SelectItem value="03">03 - Kendala pada penyedia barang/jasa</SelectItem>
                      <SelectItem value="04">04 - Kendala administrasi (dokumen kurang lengkap)</SelectItem>
                      <SelectItem value="05">05 - Kendala pada revisi DIPA/MP PNBP</SelectItem>
                      <SelectItem value="06">06 - Kendala jaringan dan listrik</SelectItem>
                      <SelectItem value="07">07 - Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <ErrorMessage name="alasan" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {dispen === "07" && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="font-bold">Uraian Alasan (Lainnya)</Label>
                      <Textarea
                        name="alasanLainnya"
                        value={values.alasanLainnya}
                        onChange={(e) => setFieldValue("alasanLainnya", e.target.value)}
                        placeholder="Uraian Alasan"
                        rows={4}
                        className={`w-full ${touched.alasanLainnya && errors.alasanLainnya ? "border-red-500" : ""}`}
                      />
                      <ErrorMessage name="alasanLainnya" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                )}
              </form>
            )}
          </Formik>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleModalClose}>
              <X className="mr-2 h-4 w-4" /> Batal
            </Button>
            {loading ? (
              <Button disabled>
                <Spinner className="mr-2 h-4 w-4" /> Simpan
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
              >
                <Save className="mr-2 h-4 w-4" /> Simpan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Rekam;
