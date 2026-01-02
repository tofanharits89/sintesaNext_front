"use client";

import React, { useState, useEffect } from "react";
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
import { Formik, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { toast } from "sonner";
import moment from "moment";
import CekKppn from "./cek-kppn";

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

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const Rekam: React.FC<Props> = ({ show, onHide }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSatker, setSelectedSatker] = useState<Satker | null>(null);
  const [searchResults, setSearchResults] = useState<Satker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Satker[]>([]);
  // sql state removed as it was unused in render
  // const [sql, setSql] = useState(""); 
  const [jeniskontrak, setJenisKontrak] = useState("");
  const [tahun, setTahun] = useState("");
  const [kppn, setCekKppn] = useState("");
  const [isAlasan2Visible, setIsAlasan2Visible] = useState(false);
  const [isAlasan7Visible, setIsAlasan7Visible] = useState(false);

  const handleJenisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJenis = event.target.value;
    setJenisKontrak(selectedJenis);
  };

  const handleAlasanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAlasan = event.target.value;
    setIsAlasan7Visible(selectedAlasan === "07");
  };

  const handleTahunChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTahun(event.target.value);
  };

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
    kppn: Yup.string().required("harus dipilih"),
    tahun: Yup.string().required("harus dipilih"),
    jeniskontrak: Yup.string().required("harus dipilih"),
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

  const handleSubmitdata = async (values: FormValues) => {
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
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data Berhasil Disimpan");
      setSearchResults([]);
      setLoading(false);
      handleModalClose(); // Added auto close on success for better UX
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    let query = "SELECT kdsatker,nmsatker,kdkppn FROM dbref.t_satker_kppn_2025";

    if (kppn !== "000" && kppn !== "") {
      query += ` WHERE kdkppn='${kppn}'`;
    }

    const encryptedQuery = btoa(query);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    try {
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          headers: {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
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
    setIsAlasan7Visible(false);
    onHide();
    setJenisKontrak("");
    setTahun("");
  };

  return (
    <Dialog open={show} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <i className="bi bi-back text-success mx-3"></i>
            <span className="text-green-600 font-bold text-xl">
              Rekam Dispensasi Kontrak KPPN
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
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
                  <div className="md:col-span-3">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Tahun Anggaran
                      </Label>
                      <Field
                        name="tahun"
                        as="select"
                        className={`${inputClass} ${touched.tahun && errors.tahun ? "border-red-500" : ""}`}
                        onChange={(
                          e: React.ChangeEvent<HTMLSelectElement>
                        ) => {
                          handleChange(e);
                          handleTahunChange(e);
                        }}
                      >
                        <option value="">-- Pilih Tahun --</option>
                        <option value="2024">TA 2024</option>
                        <option value="2025">TA 2025</option>
                      </Field>
                      <ErrorMessage name="tahun" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Jenis Dispensasi
                      </Label>
                      <Field
                        name="jeniskontrak"
                        as="select"
                        className={`${inputClass} ${touched.jeniskontrak && errors.jeniskontrak
                          ? "border-red-500"
                          : ""
                          }`}
                        onChange={(
                          e: React.ChangeEvent<HTMLSelectElement>
                        ) => {
                          handleChange(e);
                          handleJenisChange(e);
                        }}
                      >
                        <option value="">-- Pilih Jenis Kontrak --</option>
                        <option value="01">Kontrak</option>
                        <option value="02">Adendum Kontrak</option>
                      </Field>
                      <ErrorMessage name="jeniskontrak" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                  <div className="md:col-span-6">
                    <div className="space-y-2">
                      <Label className="font-bold">KPPN</Label>
                      <CekKppn
                        value={values.kppn}
                        className={`${inputClass} ${touched.kppn && errors.kppn ? "border-red-500" : ""
                          }`}
                        onChange={(e: string) => {
                          handleChange({
                            target: { name: "kppn", value: e },
                          });
                          handleCekKppn(e);
                        }}
                      />
                      <ErrorMessage name="kppn" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Tanggal Permohonan
                      </Label>
                      <div className="relative">
                        <DatePicker
                          name="tanggalPermohonan"
                          selected={
                            values.tanggalPermohonan
                              ? moment(values.tanggalPermohonan).toDate()
                              : null
                          }
                          onChange={(date: Date | null) => {
                            setFieldValue(
                              "tanggalPermohonan",
                              date ? moment(date).format("YYYY-MM-DD") : null,
                              true
                            );
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Permohonan"
                          autoComplete="off"
                          timeZone="UTC"
                          wrapperClassName="w-full"
                          className={`${inputClass} ${touched.tanggalPermohonan &&
                            errors.tanggalPermohonan
                            ? "border-red-500"
                            : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage name="tanggalPermohonan" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                  <div className="md:col-span-9">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Nomor Permohonan
                      </Label>
                      <Field
                        name="nomorPermohonan"
                        type="text"
                        placeholder="Nomor Permohonan"
                        as={Input}
                        className={touched.nomorPermohonan && errors.nomorPermohonan ? "border-red-500" : ""}
                      />
                      <ErrorMessage name="nomorPermohonan" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Satker</Label>
                  <Select
                    name="satker"
                    value={selectedSatker}
                    styles={{
                      control: (base: any) => ({
                        ...base,
                        borderColor: touched.satker && errors.satker ? "red" : base.borderColor,
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    onChange={(selectedOption: Satker | null) => {
                      setFieldValue(
                        "satker",
                        selectedOption ? selectedOption.kdsatker : ""
                      );
                      setSelectedSatker(selectedOption);
                    }}
                    options={isSearching ? [] : searchResults}
                    onInputChange={(value: string) => handleSearch(value)}
                    isSearchable={true}
                    getOptionValue={(option: Satker) => option.kdsatker}
                    getOptionLabel={(option: Satker) =>
                      `${option.kdsatker} - ${option.nmsatker}`
                    }
                    placeholder="Ketik Kode atau Nama Satker..."
                  />
                  <ErrorMessage
                    name="satker"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Tanggal Persetujuan
                      </Label>
                      <div className="relative">
                        <DatePicker
                          name="tanggalPersetujuan"
                          selected={
                            values.tanggalPersetujuan
                              ? moment(values.tanggalPersetujuan).toDate()
                              : null
                          }
                          onChange={(date: Date | null) => {
                            setFieldValue(
                              "tanggalPersetujuan",
                              date ? moment(date).format("YYYY-MM-DD") : null,
                              true
                            );
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Tgl Persetujuan "
                          autoComplete="off"
                          timeZone="UTC"
                          wrapperClassName="w-full"
                          className={`${inputClass} ${touched.tanggalPersetujuan &&
                            errors.tanggalPersetujuan
                            ? "border-red-500"
                            : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage name="tanggalPersetujuan" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>

                  <div className="md:col-span-9">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Nomor Persetujuan
                      </Label>
                      <Field
                        name="nomorPersetujuan"
                        type="text"
                        placeholder="Nomor Persetujuan Dispensasi"
                        as={Input}
                        className={touched.nomorPersetujuan && errors.nomorPersetujuan ? "border-red-500" : ""}
                      />
                      <ErrorMessage name="nomorPersetujuan" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">
                    Alasan Dispensasi
                  </Label>
                  {!isAlasan2Visible && (
                    <div className="space-y-1">
                      <Field
                        name="alasan"
                        as="select"
                        className={`${inputClass} ${touched.alasan && errors.alasan
                          ? "border-red-500"
                          : ""
                          }`}
                        onChange={(
                          e: React.ChangeEvent<HTMLSelectElement>
                        ) => {
                          handleChange(e);
                          handleAlasanChange(e);
                        }}
                      >
                        <option value="">
                          --- Pilih Alasan Dispensasi ---
                        </option>
                        <option value="01">
                          01 - Kendala pada aplikasi
                        </option>
                        <option value="02">
                          02 - Kendala pada pejabat perbendaharaan
                        </option>
                        <option value="03">
                          03 - Kendala pada penyedia barang/jasa
                        </option>
                        <option value="04">
                          04 - Kendala administrasi (dokumen kurang lengkap)
                        </option>
                        <option value="05">
                          05 - Kendala pada revisi DIPA/MP PNBP
                        </option>
                        <option value="06">
                          06 - Kendala jaringan dan listrik
                        </option>
                        <option value="07">07 - Lainnya</option>
                      </Field>
                      <ErrorMessage name="alasan" component="div" className="text-red-500 text-xs" />
                    </div>
                  )}
                </div>

                {isAlasan7Visible && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="font-bold">
                        Keterangan
                      </Label>
                      <Field
                        as="textarea"
                        name="alasanLainnya"
                        placeholder="Harus diisi ketika dipilih alasan dispensasi lainnya"
                        rows="3"
                        className={`${inputClass} min-h-[80px] ${touched.alasanLainnya && errors.alasanLainnya
                          ? "border-red-500"
                          : ""
                          }`}
                      />
                      <ErrorMessage name="alasanLainnya" component="div" className="text-red-500 text-xs" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="submit" variant="destructive" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleModalClose}
                  >
                    Tutup
                  </Button>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Rekam;
