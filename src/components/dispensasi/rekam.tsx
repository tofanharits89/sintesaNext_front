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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import DatePicker from "react-datepicker";
import {
  Formik,
  ErrorMessage,
  FormikHelpers,
  FormikProps,
} from "formik";
import * as Yup from "yup";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import moment from "moment";
import { X, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RekamProps {
  show: boolean;
  onHide: () => void;
  tahun?: string;
  id?: string;
  nomor?: string;
  kdsatker?: string;
  nmsatker?: string;
}

interface OptionType {
  kdsatker: string;
  nmsatker: string;
  kdkanwil?: string;
}

interface FormValues {
  tahun: string;
  tanggalPermohonan: string | null;
  nomorPermohonan: string;
  satker: string;
  dispen: string;
  alasan2: string;
  jenis: string;
  tanggalPersetujuan: string | null;
  nomorPersetujuan: string;
  cara_upload: string;
  file: File | null;
  username?: string;
  kdkanwil?: string | number;
}


// Helper for HTTP errors
const handleHttpError = (status: any, msg: string) => console.error(msg);

export default function Rekam({
  show,
  onHide,
  tahun: propTahun,
  id,
  nomor,
  kdsatker,
  nmsatker,
}: RekamProps) {
  // Get auth values
  const { user } = useAuth();
  const kdkanwil = user?.kdkanwil || "";
  const role = user?.role || "";
  const username = user?.username || "";


  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<OptionType | null>(null);
  const [searchResults, setSearchResults] = useState<OptionType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<OptionType[]>([]);
  const [jenisspm, setJenisspm] = useState("");
  const [tahun, setTahun] = useState<string>(
    propTahun || String(new Date().getFullYear())
  );
  const [jenisdispensasi, setjenisdispensasi] = useState(false);
  const [uraian, setUraian] = useState(false);
  const [dispen, setDispen] = useState("");

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTahun = event.target.value;
    setTahun(selectedTahun);
  };

  const handleAlasanChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    setFieldValue?: (
      field: string,
      value: any,
      shouldValidate?: boolean
    ) => void
  ) => {
    const selectedDispen = event.target.value;
    setDispen(selectedDispen);
    if (selectedDispen !== "07" && setFieldValue) {
      setFieldValue("alasan2", "");
    }
  };

  const handleJenisChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    setFieldValue?: (
      field: string,
      value: any,
      shouldValidate?: boolean
    ) => void
  ) => {
    const selectedJenis = event.target.value;
    setjenisdispensasi(selectedJenis === "" ? false : true);
    setJenisspm(selectedJenis);
    if (selectedJenis === "04" && setFieldValue) {
      setFieldValue("dispen", "07");
      setjenisdispensasi(true);
    } else if (setFieldValue) {
      setFieldValue("dispen", "");
    }
  };

  useEffect(() => {
    if (jenisspm === "04") {
      setDispen("07");
      setjenisdispensasi(true);
    } else {
      setDispen("");
    }
  }, [jenisspm]);

  const validationSchema = Yup.object().shape({
    tahun: Yup.string().required("Tahun harus diisi"),
    jenis: Yup.string().required("Jenis harus diisi"),
    tanggalPermohonan: Yup.string().required("Tanggal Permohonan harus diisi"),
    nomorPermohonan: Yup.string().required("Nomor Permohonan harus diisi"),
    satker: Yup.string().required("Satker harus diisi"),
    dispen: Yup.string().required("Jenis harus dipilih"),
    alasan2: Yup.string().when("dispen", {
      is: (d: string) => d === "07",
      then: () => Yup.string().required("Alasan harus diisi"),
    }),
    tanggalPersetujuan: Yup.string().required(
      "Tanggal Persetujuan harus diisi"
    ),
    nomorPersetujuan: Yup.string().required("Nomor Persetujuan harus diisi"),
    file: Yup.mixed()
      .required("File belum dipilih")
      .test(
        "fileSize",
        "Ukuran file terlalu besar (maks 2MB)",
        (value: any) => {
          if (!value) return true;
          return value.size <= 2 * 1024 * 1024;
        }
      )
      .test(
        "fileType",
        "Hanya file berekstensi PDF yang diperbolehkan",
        (value: any) => {
          const allowedTypes = ["application/pdf"];
          const isValid = value && allowedTypes.includes(value.type);
          if (!isValid) {
            console.error("Invalid file type:", value ? value.type : "none");
          }
          return isValid;
        }
      ),
  });

  const initialValues: FormValues = {
    tahun,
    tanggalPermohonan: null,
    nomorPermohonan: "",
    satker: "",
    dispen: dispen,
    alasan2: "",
    jenis: jenisspm,
    tanggalPersetujuan: null,
    nomorPersetujuan: "",
    cara_upload: "normal",
    file: null,
    username: username,
    kdkanwil: kdkanwil,
  };

  const handleSubmitdata = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setLoading(true);
    try {
      const form = new FormData();


      const fieldOrder = [
        "tahun",
        "jenis",
        "tanggalPermohonan",
        "nomorPermohonan",
        "satker",
        "dispen",
        "alasan2",
        "tanggalPersetujuan",
        "nomorPersetujuan",
        "cara_upload",
        "username",
        "kdkanwil",
      ];

      fieldOrder.forEach((k) => {
        const v = (values as any)[k];
        form.append(k, v === null || typeof v === "undefined" ? "" : String(v));
      });

      if (values.file) {
        const fileObj = values.file as File;
        form.append("file", fileObj, fileObj.name);
      }

      let endpoint = "";
      if (values.jenis === "01" || values.jenis === "03") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANDISPENSASI || "";
      } else if (values.jenis === "02") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANKONTRAK || "";
      } else if (values.jenis === "04") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANTUP || "";
      }

      console.log("Sending POST to:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log("Data submitted successfully");
      Swal.fire({
        html: `<div class='text-success mt-4'>Data Berhasil Disimpan</div>`,
        icon: "success",
        position: "top",
        buttonsStyling: false,
        confirmButtonText: "Tutup",
        customClass: {
          confirmButton: "bg-primary text-white px-4 py-2 rounded",
        }
      });
      setLoading(false);
      handleModalClose();
    } catch (error: any) {
      console.error("Submit error details:", error);
      const { status, data: errData } = error.response || {};
      const errorMsg =
        (errData && (errData.error || errData.msg || errData.detail)) ||
        "Terjadi Permasalahan Koneksi atau Server Backend";

      handleHttpError(status, errorMsg);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        confirmButtonText: 'Tutup',
        customClass: {
          confirmButton: "bg-red-600 text-white px-4 py-2 rounded",
        }
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getData();
  }, [tahun]);

  useEffect(() => {
    if (data.length > 0) {
      setSearchResults(data.slice(0, 100));
    }
  }, [data]);

  const getData = async () => {
    let query = `SELECT kdsatker,nmsatker,kdkanwil FROM dbref.t_satker_kppn_${tahun}`;

    if (role === "kanwil_djpb" && kdkanwil) {
      query += ` WHERE kdkanwil='${kdkanwil}'`;
    }

    const encryptedQuery = btoa(query);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    try {
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
    } catch (error: any) {
      console.error("Gagal fetch satker:", error.message);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    const results = data.filter((item) => {
      const kdsatkerLowerCase = item.kdsatker.toLowerCase();
      const nmsatkerLowerCase = item.nmsatker.toLowerCase();

      if (role === "kanwil_djpb") {
        if (item.kdkanwil === kdkanwil) {
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

    setSearchResults(results.slice(0, 100));
    setIsSearching(false);
  };

  const handleModalClose = () => {
    setSelectedSatker(null);
    setSearchResults([]);
    setSearchTerm("");
    setUraian(false);
    setjenisdispensasi(false);
    setJenisspm("");
    setDispen("");
    onHide();
  };

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-zinc-100 dark:bg-black px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Rekam Data Dispensasi TA. {tahun}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Formik
            validationSchema={validationSchema}
            onSubmit={handleSubmitdata}
            initialValues={initialValues}
            enableReinitialize={false}
          >
            {({
              handleSubmit,
              handleChange,
              setFieldValue,
              values,
              touched,
              errors,
            }: FormikProps<FormValues>) => (
              <form onSubmit={handleSubmit as any} className="space-y-4">
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
                      <ErrorMessage
                        name="tahun"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="space-y-2">
                      <Label className="font-bold">Jenis Dispensasi</Label>
                      <Select
                        value={values.jenis}
                        onValueChange={(value) => {
                          setFieldValue("jenis", value);
                          setjenisdispensasi(value === "" ? false : true);
                          setJenisspm(value);
                          if (value === "04") {
                            setFieldValue("dispen", "07");
                            setjenisdispensasi(true);
                          } else {
                            setFieldValue("dispen", "");
                          }
                        }}
                      >
                        <SelectTrigger className={`w-full ${touched.jenis && errors.jenis ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Jenis Dispensasi ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">SPM BIASA</SelectItem>
                          <SelectItem value="03">SPM RPATA</SelectItem>
                          <SelectItem value="02">Kontrak</SelectItem>
                          <SelectItem value="04">TUP Tunai</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="jenis"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Tanggal Permohonan</Label>
                      <div className="relative">
                        <DatePicker
                          name="tanggalPermohonan"
                          selected={
                            values.tanggalPermohonan
                              ? moment(values.tanggalPermohonan).toDate()
                              : null
                          }
                          className={inputClass}
                          wrapperClassName="w-full"
                          onChange={(date: any) =>
                            setFieldValue(
                              "tanggalPermohonan",
                              moment(date).format("YYYY-MM-DD"),
                              true
                            )
                          }
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Permohonan"
                          autoComplete="off"
                        />
                      </div>
                      <ErrorMessage
                        name="tanggalPermohonan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
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
                      />
                      <ErrorMessage
                        name="nomorPermohonan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
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
                  <ErrorMessage
                    name="satker"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Tanggal Persetujuan</Label>
                      <div className="relative">
                        <DatePicker
                          name="tanggalPersetujuan"
                          selected={
                            values.tanggalPersetujuan
                              ? moment(values.tanggalPersetujuan).toDate()
                              : null
                          }
                          className={inputClass}
                          wrapperClassName="w-full"
                          onChange={(date: any) =>
                            setFieldValue(
                              "tanggalPersetujuan",
                              moment(date).format("YYYY-MM-DD"),
                              true
                            )
                          }
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Persetujuan"
                          autoComplete="off"
                        />
                      </div>
                      <ErrorMessage
                        name="tanggalPersetujuan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="space-y-2">
                      <Label className="font-bold">Nomor Persetujuan</Label>
                      <Input
                        name="nomorPersetujuan"
                        value={values.nomorPersetujuan}
                        onChange={handleChange}
                        type="text"
                        placeholder="Nomor Persetujuan Dispensasi"
                      />
                      <ErrorMessage
                        name="nomorPersetujuan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                {jenisdispensasi && (jenisspm === "01" || jenisspm === "03") && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="font-bold">Alasan Dispensasi SPM</Label>
                      <Select
                        value={dispen}
                        onValueChange={(value) => {
                          setDispen(value);
                          setFieldValue("dispen", value);
                          if (value !== "07") {
                            setFieldValue("alasan2", "");
                          }
                        }}
                      >
                        <SelectTrigger className={`w-full ${touched.dispen && errors.dispen ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="--- Pilih Alasan Dispensasi ---" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">01 - Pekerjaan dalam Rangka Penanganan Bencana Alam</SelectItem>
                          <SelectItem value="02">02 - Kondisi Kahar/Force Majeure</SelectItem>
                          <SelectItem value="03">03 - Pemilu/Pilkada Serentak</SelectItem>
                          <SelectItem value="04">04 - Kondisi Lain dibuktikan Surat Pernyatan KPA</SelectItem>
                          <SelectItem value="05">05 - Keterlambatan Pengajuan Tagihan atau Kurang Lengkap Dokumen Tagihan oleh Penyedia</SelectItem>
                          <SelectItem value="06">06 - Permasalahan Pengelolaan Perbendaharaan</SelectItem>
                          <SelectItem value="07">07 - Lainnya</SelectItem>
                          <SelectItem value="08">08 - Proses Revisi Penghematan Belanja Perjalanan Dinas</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="dispen"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                )}

                {jenisdispensasi && jenisspm === "02" && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="font-bold">Alasan Dispensasi Kontrak</Label>
                      <Select
                        value={dispen}
                        onValueChange={(value) => {
                          setDispen(value);
                          setFieldValue("dispen", value);
                          if (value !== "07") {
                            setFieldValue("alasan2", "");
                          }
                        }}
                      >
                        <SelectTrigger className={`w-full ${touched.dispen && errors.dispen ? "border-red-500" : ""}`}>
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
                      <ErrorMessage
                        name="dispen"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                )}

                {jenisdispensasi && jenisspm === "04" && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="font-bold">Alasan Dispensasi TUP</Label>
                      <Select
                        value="07"
                        onValueChange={(value) => {
                          setDispen(value);
                          setFieldValue("dispen", value);
                        }}
                        disabled
                      >
                        <SelectTrigger className={`w-full ${touched.dispen && errors.dispen ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Isikan Alasan Dispensasi TUP" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="07">07 - Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {dispen === "07" && jenisdispensasi && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label>Uraian Alasan (Lainnya)</Label>
                      <Textarea
                        name="alasan2"
                        value={values.alasan2}
                        onChange={(e) => setFieldValue("alasan2", e.target.value)}
                        placeholder="Uraian Alasan"
                        rows={4}
                        className={`w-full ${touched.alasan2 && errors.alasan2 ? "border-red-500" : ""}`}
                      />
                      <ErrorMessage
                        name="alasan2"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bold">
                    Upload File Surat Persetujuan (PDF)
                  </Label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Normal Upload</Label>
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={(event) => {
                            if (
                              event.currentTarget.files &&
                              event.currentTarget.files[0]
                            ) {
                              setFieldValue("file", event.currentTarget.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <ErrorMessage
                    name="file"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

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
}
