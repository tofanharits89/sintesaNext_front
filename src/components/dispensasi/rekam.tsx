"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  FloatingLabel,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import {
  Formik,
  Field,
  ErrorMessage,
  FormikHelpers,
  FormikProps,
} from "formik";
import * as Yup from "yup";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import Swal from "sweetalert2";
import moment from "moment";
import { AiOutlineClose } from "react-icons/ai";

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

// Mock dependencies for standalone component (replace with real implementations)
const MyContext = React.createContext<any>(null);
const Encrypt = (str: string) => str;
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
  // Get context values - replace with actual context usage
  const contextValue = React.useContext(MyContext);
  const axiosJWT = contextValue?.axiosJWT || {};
  const token = contextValue?.token || "";
  const kdkanwil = contextValue?.kdkanwil || "";
  const role = contextValue?.role || "";
  const username = contextValue?.username || "";

  const [loading, setLoading] = useState(false);
  const [animationClass, setAnimationClass] = useState("");
  const [selectedSatker, setSelectedSatker] = useState<OptionType | null>(null);
  const [searchResults, setSearchResults] = useState<OptionType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<OptionType[]>([]);
  const [sql, setSql] = useState("");
  const [jenisspm, setJenisspm] = useState("");
  const [tahun, setTahun] = useState<string>(
    propTahun || String(new Date().getFullYear())
  );
  const [jenisdispensasi, setjenisdispensasi] = useState(false);
  const [uraian, setUraian] = useState(false);
  const [dispen, setDispen] = useState("");

  useEffect(() => {
    setAnimationClass(
      show ? "modal-body-animation-enter" : "modal-body-animation-exit"
    );
  }, [show]);

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
    console.log(
      "NEXT_PUBLIC_SIMPANDISPENSASI:",
      process.env.NEXT_PUBLIC_SIMPANDISPENSASI
    );
    console.log(
      "NEXT_PUBLIC_SIMPANKONTRAK:",
      process.env.NEXT_PUBLIC_SIMPANKONTRAK
    );
    console.log("NEXT_PUBLIC_SIMPANTUP:", process.env.NEXT_PUBLIC_SIMPANTUP);
    try {
      const form = new FormData();

      // Append textual fields first (ensure 'jenis' exists before file upload)
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

      // Append file last
      if (values.file) {
        form.append("file", values.file as File);
      }

      // Log FormData contents in order (for debugging)
      console.log("=== FormData Contents (ordered) ===");
      let bodyData = {};
      form.forEach((value, key) => {
        bodyData = { ...bodyData, [key]: value };
        if (key === "file") {
          console.log(
            `${key}:`,
            value instanceof File
              ? `File(${(value as File).name}, ${(value as File).size} bytes)`
              : value
          );
        } else {
          console.log(`${key}:`, value);
        }
      });

      let endpoint = "";
      if (values.jenis === "01" || values.jenis === "03") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANDISPENSASI || "";
      } else if (values.jenis === "02") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANKONTRAK || "";
      } else if (values.jenis === "04") {
        endpoint = process.env.NEXT_PUBLIC_SIMPANTUP || "";
      }

      console.log("Sending POST to:", endpoint);
      console.log("Jenis value:", values.jenis);
      console.log(bodyData);

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);
      console.log("Response error details:", result.error || result.details);

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
      });
      setLoading(false);
    } catch (error: any) {
      console.error("Submit error details:", error);
      const { status, data: errData } = error.response || {};
      handleHttpError(
        status,
        (errData && errData.error) ||
          "Terjadi Permasalahan Koneksi atau Server Backend"
      );
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

    if (role === "2" && kdkanwil) {
      query += ` WHERE kdkanwil='${kdkanwil}'`;
    }

    const encryptedQuery = btoa(query);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    try {
      console.log(
        "Fetching satker from:",
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`
      );
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("Satker response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Satker data received:", result);
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

      if (role === "2") {
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

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      backdrop="static"
      keyboard={false}
      size="xl"
      animation={false}
    >
      <Modal.Header style={{ position: "relative" }}>
        <Modal.Title style={{ fontSize: 20, flex: 1 }}>
          <i className="bi bi-back text-success mx-3"></i>
          Rekam Data Dispensasi TA. {tahun}
        </Modal.Title>

        <button
          type="button"
          className="bg-transparent border-0 p-0 text-muted"
          aria-label="Tutup"
          title="Tutup"
          onClick={handleModalClose}
          style={{
            position: "absolute",
            fontSize: 24,
            top: "50%",
            right: 12,
            transform: "translateY(-50%)",
            cursor: "pointer",
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          <AiOutlineClose />
        </button>
      </Modal.Header>
      <Modal.Body
        style={{ overflow: "auto", height: "auto" }}
        className={`text-dark ${animationClass}`}
      >
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
            <Container fluid>
              <Form noValidate onSubmit={handleSubmit as any}>
                <Row>
                  <Col sm={6} md={6} lg={4} xl={4}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Tahun Anggaran
                      </Form.Label>
                      <Field
                        name="tahun"
                        as="select"
                        className={`form-select form-select-md text-select ${
                          touched.tahun && (errors.tahun as any)
                            ? "is-invalid"
                            : ""
                        }`}
                        onChange={(e: any) => {
                          handleChange(e);
                          handleTahunChange(e);
                        }}
                      >
                        <option value="">--- Pilih Tahun ---</option>
                        <option value="2024">TA 2024</option>
                        <option value="2025">TA 2025</option>
                      </Field>
                    </Form.Group>
                  </Col>

                  <Col sm={6} md={6} lg={8} xl={8}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Jenis Dispensasi
                      </Form.Label>
                      <Field
                        name="jenis"
                        as="select"
                        onChange={(e: any) => {
                          handleChange(e);
                          handleJenisChange(e, setFieldValue);
                        }}
                        className={`form-control  ${
                          touched.jenis && (errors.jenis as any)
                            ? "is-invalid"
                            : ""
                        }`}
                      >
                        <option value="">--- Pilih Jenis Dispensasi ---</option>
                        <option value="01">SPM BIASA</option>
                        <option value="03">SPM RPATA</option>
                        <option value="02">Kontrak</option>
                        <option value="04">TUP Tunai</option>
                      </Field>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} md={6} lg={4} xl={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold">
                        Tanggal Permohonan
                      </Form.Label>
                      <br />
                      <DatePicker
                        name="tanggalPermohonan"
                        selected={
                          values.tanggalPermohonan
                            ? moment(values.tanggalPermohonan).toDate()
                            : null
                        }
                        className="form-control"
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
                      <ErrorMessage
                        name="tanggalPermohonan"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6} md={6} lg={8} xl={8}>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold">
                        Nomor Permohonan
                      </Form.Label>
                      <Field
                        name="nomorPermohonan"
                        type="text"
                        placeholder="Nomor Permohonan"
                        as={Form.Control}
                        onChange={handleChange as any}
                      />
                      <ErrorMessage
                        name="nomorPermohonan"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} md={6} lg={12} xl={12}>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold">Satker </Form.Label>
                      <Select
                        name="satker"
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            cursor: "pointer",
                          }),
                        }}
                        value={selectedSatker as any}
                        onChange={(selectedOption: any) => {
                          setFieldValue(
                            "satker",
                            selectedOption ? selectedOption.kdsatker : ""
                          );
                          setSelectedSatker(selectedOption);
                        }}
                        options={isSearching ? [] : (searchResults as any)}
                        onInputChange={(value: string) => handleSearch(value)}
                        isSearchable
                        getOptionValue={(option: any) => option.kdsatker}
                        getOptionLabel={(option: any) =>
                          `${option.kdsatker} - ${option.nmsatker}`
                        }
                        placeholder="Ketik Kode atau Nama Satker..."
                      />
                      <ErrorMessage
                        name="satker"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} md={6} lg={4} xl={4}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Tanggal Persetujuan
                      </Form.Label>
                      <br />
                      <DatePicker
                        name="tanggalPersetujuan"
                        selected={
                          values.tanggalPersetujuan
                            ? moment(values.tanggalPersetujuan).toDate()
                            : null
                        }
                        className="form-control"
                        onChange={(date: any) =>
                          setFieldValue(
                            "tanggalPersetujuan",
                            moment(date).format("YYYY-MM-DD"),
                            true
                          )
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Tgl Persetujuan "
                        autoComplete="off"
                      />
                      <ErrorMessage
                        name="tanggalPersetujuan"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6} md={6} lg={8} xl={8}>
                    <Form.Group className="mb-1 mt-1">
                      <Form.Label className="fw-bold">
                        Nomor Persetujuan
                      </Form.Label>
                      <Field
                        name="nomorPersetujuan"
                        onChange={handleChange as any}
                        type="text"
                        placeholder="Nomor Persetujuan Dispensasi"
                        as={Form.Control}
                      />
                      <ErrorMessage
                        name="nomorPersetujuan"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {jenisdispensasi &&
                  (jenisspm === "01" || jenisspm === "03") && (
                    <Row className="modal-body-animation-enter mt-3">
                      <Col sm={6} md={6} lg={12} xl={12}>
                        <Form.Group className="mb-1">
                          <Form.Label className="fw-bold">
                            Alasan Dispensasi SPM
                          </Form.Label>

                          <Field
                            name="dispen"
                            value={dispen}
                            as="select"
                            className={`form-select form-select-md text-select ${
                              touched.dispen && (errors.dispen as any)
                                ? "is-invalid"
                                : ""
                            }`}
                            onChange={(e: any) => {
                              handleChange(e);
                              handleAlasanChange(e, setFieldValue);
                            }}
                          >
                            <option value="">
                              --- Pilih Alasan Dispensasi ---
                            </option>
                            <option value="01">
                              01 - Pekerjaan dalam Rangka Penanganan Bencana
                              Alam
                            </option>
                            <option value="02">
                              02 - Kondisi Kahar/Force Majeure
                            </option>
                            <option value="03">
                              03 - Pemilu/Pilkada Serentak
                            </option>
                            <option value="04">
                              04 - Kondisi Lain dibuktikan Surat Pernyatan KPA
                            </option>
                            <option value="05">
                              05 - Keterlambatan Pengajuan Tagihan atau Kurang
                              Lengkap Dokumen Tagihan oleh Penyedia
                            </option>
                            <option value="06">
                              06 - Permasalahan Pengelolaan Perbendaharaan
                            </option>
                            <option value="07">07 - Lainnya</option>
                            <option value="08">
                              08 - Proses Revisi Penghematan Belanja Perjalanan
                              Dinas
                            </option>
                          </Field>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                {jenisdispensasi && jenisspm === "02" && (
                  <Row className="modal-body-animation-enter mt-3">
                    <Col sm={6} md={6} lg={12} xl={12}>
                      <Form.Group className="mb-1">
                        <Form.Label className="fw-bold">
                          Alasan Dispensasi Kontrak
                        </Form.Label>
                        <Field
                          name="dispen"
                          value={dispen}
                          as="select"
                          className={`form-select form-select-md text-select ${
                            touched.dispen && (errors.dispen as any)
                              ? "is-invalid"
                              : ""
                          }`}
                          onChange={(e: any) => {
                            handleChange(e);
                            handleAlasanChange(e, setFieldValue);
                          }}
                        >
                          <option value="">
                            --- Pilih Alasan Dispensasi ---
                          </option>
                          <option value="01">01 - Kendala pada aplikasi</option>
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
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {jenisdispensasi && jenisspm === "04" && (
                  <Row className="modal-body-animation-enter mt-3">
                    <Col sm={6} md={6} lg={12} xl={12}>
                      <Form.Group className="mb-1">
                        <Field
                          name="dispen"
                          value={values.jenis === "04" ? "07" : values.dispen}
                          as="select"
                          className={`form-select form-select-md text-select ${
                            touched.dispen && (errors.dispen as any)
                              ? "is-invalid"
                              : ""
                          }`}
                          onChange={(e: any) => {
                            handleChange(e);
                            handleAlasanChange(e, setFieldValue);
                          }}
                        >
                          <option value="07">
                            Isikan Alasan Dispensasi TUP
                          </option>
                        </Field>
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {dispen === "07" && jenisdispensasi && (
                  <Row className="modal-body-animation-enter mt-3">
                    <Col sm={6} md={6} lg={12} xl={12}>
                      <FloatingLabel
                        controlId="alasan2"
                        label="Isikan alasan di sini "
                        className="mt-0 "
                      >
                        <Form.Control
                          name="alasan2"
                          as="textarea"
                          placeholder="Isikan alasan di sini "
                          style={{ height: 100 }}
                          onChange={(e: any) => {
                            setFieldValue("alasan2", e.target.value);
                          }}
                          className={`form-control  ${
                            touched.alasan2 && (errors.alasan2 as any)
                              ? "is-invalid"
                              : ""
                          }`}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                )}

                <Row className="modal-body-animation-enter mt-3">
                  <Col sm={12} md={12} lg={12} xl={12}>
                    <Form.Group controlId="file">
                      <Form.Label className="fw-bold">
                        File Surat Persetujuan (File PDF Maks. 2MB)
                      </Form.Label>
                      <input
                        className={`form-control ${
                          touched.file && (errors.file as any)
                            ? "is-invalid"
                            : ""
                        }`}
                        type="file"
                        name="file"
                        accept=".pdf"
                        onChange={(e: any) =>
                          setFieldValue("file", e.target.files[0])
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="danger"
                  className="mt-3 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      Loading...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </Form>
            </Container>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );
}
